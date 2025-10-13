import { z } from 'zod'
import { type MathMCP } from './index.tsx'

type OperationFn = (left: number, right: number) => number

let operations = {
	'+': (left, right) => left + right,
	'-': (left, right) => left - right,
	'*': (left, right) => left * right,
	'/': (left, right) => left / right,
} satisfies Record<string, OperationFn>

export async function registerTools(agent: MathMCP) {
	agent.server.registerTool(
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
