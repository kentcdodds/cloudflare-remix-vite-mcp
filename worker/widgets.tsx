import { createUIResource, type CreateUIResourceOptions } from '@mcp-ui/server'
import { registerAppResource, registerAppTool } from '@modelcontextprotocol/ext-apps/server'
import { renderToString } from '@remix-run/dom/server'
import { type ZodRawShape, z } from 'zod'
import { BUILD_TIMESTAMP } from './build-timestamp.ts'
import { type MathMCP } from './index.tsx'

const version = BUILD_TIMESTAMP

type WidgetOutput<Input extends ZodRawShape, Output extends ZodRawShape> = {
	inputSchema: Input
	outputSchema: Output
	getStructuredContent: (args: {
		[Key in keyof Input]: z.infer<Input[Key]>
	}) => Promise<{
		[Key in keyof Output]: z.infer<Output[Key]>
	}>
}

type Widget<Input extends ZodRawShape, Output extends ZodRawShape> = {
	name: string
	title: string
	resultMessage: string
	description?: string
	widgetPrefersBorder?: boolean
	getHtml: () => Promise<string>
} & WidgetOutput<Input, Output>

function createWidget<Input extends ZodRawShape, Output extends ZodRawShape>(
	widget: Widget<Input, Output>,
): Widget<Input, Output> {
	return widget
}

export async function registerWidgets(agent: MathMCP) {
	const baseUrl = agent.requireDomain()
	const getResourceUrl = (resourcePath: string) =>
		new URL(resourcePath, baseUrl).toString()
	const widgets = [
		createWidget({
			name: 'calculator',
			title: 'Calculator',
			description: 'A simple calculator',
			resultMessage: 'The calculator has been rendered',
			getHtml: () =>
				renderToString(
					<html>
						<head>
							<meta charSet="utf-8" />
							<meta name="color-scheme" content="light dark" />
							<script
								src={getResourceUrl('/widgets/calculator.js')}
								type="module"
							></script>
						</head>
						<body css={{ margin: 0 }}>
							<div id="💿" />
						</body>
					</html>,
				),
			inputSchema: {
				display: z
					.string()
					.optional()
					.describe('The initial current display value on the calculator'),
				previousValue: z
					.number()
					.optional()
					.describe(
						'The initial previous value on the calculator. For example, if the user says "I want to add 5 to a number" set this to 5',
					),
				operation: z
					.enum(['+', '-', '*', '/'])
					.optional()
					.describe(
						'The initial operation on the calculator. For example, if the user says "I want to add 5 to a number" set this to "+"',
					),
				waitingForNewValue: z
					.boolean()
					.optional()
					.describe(
						'Whether the calculator is waiting for a new value. For example, if the user says "I want to add 5 to a number" set this to true. If they say "subtract 3 from 4" set this to false.',
					),
				errorState: z
					.boolean()
					.optional()
					.describe('Whether the calculator is in an error state'),
			},
			outputSchema: {
				display: z.string().optional(),
				previousValue: z.number().optional(),
				operation: z.enum(['+', '-', '*', '/']).optional(),
				waitingForNewValue: z.boolean().optional(),
				errorState: z.boolean().optional(),
			},
			getStructuredContent: async (args) => args,
		}),
	]

	for (const widget of widgets) {
		const name = `${widget.name}-${version}`
		const uri = `ui://widget/${name}.html` as `ui://${string}`
		const resourceUiMeta = {
			csp: {
				connectDomains: [],
				resourceDomains: [baseUrl],
			},
			...(widget.widgetPrefersBorder ? { prefersBorder: true } : {}),
		}

		const resourceInfo: CreateUIResourceOptions = {
			uri,
			encoding: 'text',
			content: {
				type: 'rawHtml',
				htmlString: await widget.getHtml(),
			},
			metadata: {
				ui: resourceUiMeta,
			},
		}

		registerAppResource(
			agent.server,
			name,
			uri,
			{
				description: widget.description,
				_meta: {
					ui: resourceUiMeta,
				},
			},
			async () => ({
				contents: [createUIResource(resourceInfo).resource],
			}),
		)

		registerAppTool(
			agent.server,
			name,
			{
				title: widget.title,
				description: widget.description,
				_meta: {
					ui: {
						resourceUri: uri,
					},
				},
				inputSchema: widget.inputSchema,
				outputSchema: widget.outputSchema,
				annotations: { readOnlyHint: true, openWorldHint: false },
			},
			async (args) => {
				const structuredContent = widget.getStructuredContent
					? // @ts-expect-error - TODO: fix this
						await widget.getStructuredContent(args)
					: {}
				return {
					content: [
						{ type: 'text', text: widget.resultMessage },
					],
					structuredContent,
				}
			},
		)
	}
}
