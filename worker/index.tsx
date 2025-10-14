import { invariant } from '@epic-web/invariant'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { renderToString } from '@remix-run/dom/server'
import { McpAgent } from 'agents/mcp'
import { registerTools } from './tools.ts'
import { withCors } from './utils.ts'
import { registerWidgets } from './widgets.tsx'

export type State = {}
export type Props = {
	baseUrl: string
}

export class MathMCP extends McpAgent<Env, State, Props> {
	server = new McpServer(
		{
			name: 'MathMCP',
			version: '1.0.0',
		},
		{
			instructions: `Use this server to solve math problems reliably and accurately.`,
		},
	)
	async init() {
		await registerTools(this)
		await registerWidgets(this)
	}
	requireDomain() {
		const baseUrl = this.props?.baseUrl
		invariant(
			baseUrl,
			'This should never happen, but somehow we did not get the baseUrl from the request handler',
		)
		return baseUrl
	}
}

export default {
	fetch: withCors({
		getCorsHeaders: () => ({
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'content-type',
		}),
		handler: async (
			request: Request,
			env: Env,
			ctx: ExecutionContext<Props>,
		) => {
			const url = new URL(request.url)

			if (url.pathname === '/mcp') {
				ctx.props.baseUrl = url.origin

				return MathMCP.serve('/mcp', {
					binding: 'MATH_MCP_OBJECT',
				}).fetch(request, env, ctx)
			}

			// Try to serve static assets
			if (env.ASSETS) {
				const response = await env.ASSETS.fetch(request)
				if (response.ok) {
					return response
				}
			}

			if (url.pathname.startsWith('/__dev/widgets')) {
				const getResourceUrl = (resourcePath: string) =>
					new URL(resourcePath, url.origin).toString()
				return new Response(
					await renderToString(
						<html>
							<head>
								<meta charSet="utf-8" />
								<meta name="color-scheme" content="light dark" />
								<script
									src={getResourceUrl('/widgets/calculator.js')}
									type="module"
								/>
							</head>
							<body css={{ margin: 0 }}>
								<div id="💿" />
							</body>
						</html>,
					),
					{
						headers: {
							'Content-Type': 'text/html',
						},
					},
				)
			}

			return new Response(null, { status: 404 })
		},
	}),
}
