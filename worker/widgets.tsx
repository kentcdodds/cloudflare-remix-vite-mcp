import { renderToString } from '@remix-run/dom/server'
import { type ZodRawShape, type z } from 'zod'
import { BUILD_TIMESTAMP } from './build-timestamp.ts'
import { type MathMCP } from './index.ts'
import { Calculator } from './widgets/calculator.tsx'
import { createUIResource } from '@mcp-ui/server'

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
	invokingMessage?: string
	invokedMessage?: string
	widgetAccessible?: boolean
	widgetPrefersBorder?: boolean
	resultCanProduceWidget?: boolean
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
			invokingMessage: `Getting your calculator ready`,
			invokedMessage: `Here's your calculator`,
			resultMessage: 'The calculator has been rendered',
			widgetAccessible: true,
			resultCanProduceWidget: true,
			getHtml: () =>
				renderToString(
					<html>
						<head>
							<link
								rel="modulepreload"
								href={getResourceUrl(Calculator.$moduleUrl)}
							/>
							<script
								src={getResourceUrl('/widgets/entry.js')}
								type="module"
							></script>
						</head>
						<body>
							<Calculator />
						</body>
					</html>,
				),
			// TODO: have input schema for initial state
			inputSchema: {},
			outputSchema: {},
			getStructuredContent: async () => ({}),
		}),
	]

	for (const widget of widgets) {
		const name = `${widget.name}-${version}`
		const uri = `ui://widget/${name}.html` as `ui://${string}`

		agent.server.registerResource(name, uri, {}, async () => ({
			contents: [
				createUIResource({
					uri,
					encoding: 'text',
					content: {
						type: 'rawHtml',
						htmlString: await widget.getHtml(),
					},
					metadata: {
						'openai/widgetDescription': widget.description,
						'openai/widgetCSP': {
							connect_domains: [],
							resource_domains: [baseUrl],
						},
						...(widget.widgetPrefersBorder
							? { 'openai/widgetPrefersBorder': true }
							: {}),
					},
					adapters: {
						appsSdk: {
							enabled: true,
						},
					},
				}).resource,
			],
		}))

		agent.server.registerTool(
			name,
			{
				title: widget.title,
				description: widget.description,
				_meta: {
					'openai/widgetDomain': baseUrl,
					'openai/outputTemplate': uri,
					'openai/toolInvocation/invoking': widget.invokingMessage,
					'openai/toolInvocation/invoked': widget.invokedMessage,
					...(widget.resultCanProduceWidget
						? { 'openai/resultCanProduceWidget': true }
						: {}),
					...(widget.widgetAccessible
						? { 'openai/widgetAccessible': true }
						: {}),
				},
				inputSchema: widget.inputSchema,
				outputSchema: widget.outputSchema,
			},
			async (args) => {
				return {
					content: [
						{ type: 'text', text: widget.resultMessage },
						createUIResource({
							uri,
							encoding: 'text',
							content: {
								type: 'rawHtml',
								htmlString: await widget.getHtml(),
							},
						}),
					],
					structuredContent: widget.getStructuredContent
						? await widget.getStructuredContent(args)
						: {},
				}
			},
		)
	}
}
