import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { McpAgent } from 'agents/mcp'
import { z } from 'zod'

type OperationFn = (left: number, right: number) => number

let operations = {
	'+': (left, right) => left + right,
	'-': (left, right) => left - right,
	'*': (left, right) => left * right,
	'/': (left, right) => left / right,
} satisfies Record<string, OperationFn>

export class MathMCP extends McpAgent {
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
		this.server.registerTool(
			'do_math',
			{
				description: 'Solve a math problem',
				inputSchema: {
					left: z.number(),
					right: z.number(),
					operator: z.enum(
						Object.keys(operations) as [
							keyof typeof operations,
							...Array<keyof typeof operations>,
						],
					),
				},
			},
			async ({ left, right, operator }) => {
				let operation = operations[operator]
				let result = operation(left, right)
				return {
					content: [
						{
							type: 'text',
							text: `The result of ${left} ${operator} ${right} is ${result}`,
						},
					],
				}
			},
		)
	}
}
