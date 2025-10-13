import { invariant } from '@epic-web/invariant'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { McpAgent } from 'agents/mcp'
import { registerTools } from './tools.ts'
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
	fetch: async (request: Request, env: Env, ctx: ExecutionContext<Props>) => {
		const url = new URL(request.url)

		if (url.pathname === '/mcp') {
			ctx.props.baseUrl = url.origin

			return MathMCP.serve('/mcp', {
				binding: 'MATH_MCP_OBJECT',
			}).fetch(request, env, ctx)
		}

		// Try to serve static assets
		if (env.ASSETS) {
			return env.ASSETS.fetch(request)
		}

		return new Response(null, { status: 404 })
	},
}
