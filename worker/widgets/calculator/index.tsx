import { invariant } from '@epic-web/invariant'
import { createRoot, type Remix } from '@remix-run/dom'
import { events, type EventDescriptor } from '@remix-run/events'
import { createKeyInteraction } from '@remix-run/events/key'
import { press } from '@remix-run/events/press'
import { z } from 'zod'
import { sendPromptMessage, waitForToolInput } from '../utils.ts'
import { Calculator as CalcEngine, type CalculatorState } from './calculator'
import { MCP_PROMPT } from './mcp-prompt.ts'

export function Calculator(
	this: Remix.Handle,
	{ initialState }: { initialState?: CalculatorState },
) {
	const calc = new CalcEngine(initialState)

	// Subscribe to calculator changes
	events(calc, [
		CalcEngine.change(() => {
			this.update()
			// if the result is 1982, send a message to the user that the result is 1982
			if (calc.getDisplay() === '1982') {
				void sendPromptMessage(MCP_PROMPT)
			}
		}),
	])

	const shortcutMap: Record<string, () => unknown> = {
		Escape: () => calc.clear(),
		Delete: () => calc.clearEntry(),
		Backspace: () => calc.backspace(),
		Enter: () => calc.calculate(),
		'+': () => calc.setOperation('+'),
		'-': () => calc.setOperation('-'),
		'*': () => calc.setOperation('*'),
		'/': () => calc.setOperation('/'),
		'=': () => calc.calculate(),
		'.': () => calc.inputDecimal(),
		'0': () => calc.inputDigit(0),
		'1': () => calc.inputDigit(1),
		'2': () => calc.inputDigit(2),
		'3': () => calc.inputDigit(3),
		'4': () => calc.inputDigit(4),
		'5': () => calc.inputDigit(5),
		'6': () => calc.inputDigit(6),
		'7': () => calc.inputDigit(7),
		'8': () => calc.inputDigit(8),
		'9': () => calc.inputDigit(9),
	}
	events(
		window,
		Object.entries(shortcutMap).map(([key, handler]) =>
			createKeyInteraction(key)(handler, { signal: this.signal }),
		),
	)

	return () => (
		<div
			css={{
				margin: '24px',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				padding: '20px',
				fontFamily: "'Courier New', monospace",
			}}
		>
			<div
				css={{
					width: '360px',
					background: 'light-dark(#1a1a1a, #030504)',
					borderRadius: '24px',
					padding: '32px',
					boxShadow:
						'0 0 20px light-dark(rgba(255,69,0,0.2), rgba(255,69,0,0.3)), 0 0 40px light-dark(rgba(255,69,0,0.3), rgba(255,69,0,0.4)), 0 8px 32px light-dark(rgba(0,0,0,0.8), rgba(0,0,0,0.8))',
					border: '2px solid light-dark(#ff4500, #ff6347)',
					position: 'relative',
					'&::before': {
						content: '""',
						position: 'absolute',
						inset: '-2px',
						borderRadius: '24px',
						padding: '2px',
						background:
							'light-dark(linear-gradient(135deg, #ff4500, #ff8c00), linear-gradient(135deg, #ff6347, #ffa500))',
						WebkitMask:
							'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
						WebkitMaskComposite: 'xor',
						maskComposite: 'exclude',
						opacity: 0.6,
						pointerEvents: 'none',
					},
				}}
			>
				<div
					css={{
						background: 'light-dark(#0c0c0c, #000000)',
						borderRadius: '12px',
						padding: '20px',
						marginBottom: '24px',
						minHeight: '120px',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						border: 'light-dark(2px solid #ff4500, 2px solid #ff6347)',
						boxShadow:
							'0 0 30px light-dark(rgba(255,69,0,0.4), rgba(255,69,0,0.5)), 0 0 15px light-dark(rgba(255,69,0,0.3), rgba(255,69,0,0.4)), inset 0 0 25px light-dark(rgba(255,69,0,0.2), rgba(255,69,0,0.3))',
						position: 'relative',
						'&::before': {
							content: '""',
							position: 'absolute',
							inset: 0,
							borderRadius: '12px',
							background:
								'light-dark(radial-gradient(ellipse at top, rgba(255,69,0,0.15), transparent), radial-gradient(ellipse at top, rgba(255,99,71,0.2), transparent))',
							pointerEvents: 'none',
						},
					}}
				>
					{/* Expression history display */}
					<div
						css={{
							color: 'light-dark(#ff8c00, #ffa500)',
							fontSize: '20px',
							fontWeight: 'normal',
							textShadow:
								'0 0 10px light-dark(#ff8c00, #ffa500), 0 0 20px light-dark(#ff8c00, #ffa500)',
							letterSpacing: '1px',
							fontFamily: "'Courier New', monospace",
							wordBreak: 'break-all',
							textAlign: 'right',
							minHeight: '30px',
							opacity: calc.getExpression() ? 1 : 0.5,
							filter:
								'brightness(light-dark(1.1, 1.2)) drop-shadow(0 0 light-dark(5px, 8px) light-dark(#ff8c00, #ffa500))',
						}}
					>
						{calc.getExpression() || '0'}
					</div>

					{/* Current value display */}
					<div
						css={{
							color: 'light-dark(#ff4500, #ff6347)',
							fontSize: calc.isError() ? '32px' : '48px',
							fontWeight: 'bold',
							textShadow:
								'0 0 15px light-dark(#ff4500, #ff6347), 0 0 30px light-dark(#ff4500, #ff6347)',
							letterSpacing: '2px',
							fontFamily: "'Courier New', monospace",
							wordBreak: 'break-all',
							textAlign: 'right',
							filter:
								'brightness(light-dark(1.2, 1.3)) drop-shadow(0 0 light-dark(10px, 15px) light-dark(#ff4500, #ff6347))',
						}}
					>
						{calc.getDisplay()}
					</div>
				</div>

				<div
					css={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: '12px',
					}}
				>
					<CalcButton
						text="C"
						variant="function"
						on={press(() => calc.clear())}
					/>
					<CalcButton
						text="CE"
						variant="function"
						on={press(() => calc.clearEntry())}
					/>
					<CalcButton
						text="←"
						variant="function"
						on={press(() => calc.backspace())}
					/>
					<CalcButton
						text="÷"
						variant="operator"
						on={press(() => calc.setOperation('/'))}
					/>

					<CalcButton
						text="7"
						variant="number"
						on={press(() => calc.inputDigit(7))}
					/>
					<CalcButton
						text="8"
						variant="number"
						on={press(() => calc.inputDigit(8))}
					/>
					<CalcButton
						text="9"
						variant="number"
						on={press(() => calc.inputDigit(9))}
					/>
					<CalcButton
						text="×"
						variant="operator"
						on={press(() => calc.setOperation('*'))}
					/>

					<CalcButton
						text="4"
						variant="number"
						on={press(() => calc.inputDigit(4))}
					/>
					<CalcButton
						text="5"
						variant="number"
						on={press(() => calc.inputDigit(5))}
					/>
					<CalcButton
						text="6"
						variant="number"
						on={press(() => calc.inputDigit(6))}
					/>
					<CalcButton
						text="-"
						variant="operator"
						on={press(() => calc.setOperation('-'))}
					/>

					<CalcButton
						text="1"
						variant="number"
						on={press(() => calc.inputDigit(1))}
					/>
					<CalcButton
						text="2"
						variant="number"
						on={press(() => calc.inputDigit(2))}
					/>
					<CalcButton
						text="3"
						variant="number"
						on={press(() => calc.inputDigit(3))}
					/>
					<CalcButton
						text="+"
						variant="operator"
						on={press(() => calc.setOperation('+'))}
					/>

					<CalcButton
						text="±"
						variant="function"
						on={press(() => calc.toggleSign())}
					/>
					<CalcButton
						text="0"
						variant="number"
						on={press(() => calc.inputDigit(0))}
					/>
					<CalcButton
						text="."
						variant="number"
						on={press(() => calc.inputDecimal())}
					/>
					<CalcButton
						text="="
						variant="equals"
						on={press(() => calc.calculate())}
					/>
				</div>
			</div>
		</div>
	)
}

function CalcButton({
	text,
	variant,
	...props
}: {
	text: string
	variant: 'number' | 'operator' | 'function' | 'equals'
	on?: EventDescriptor | EventDescriptor[]
}) {
	const getButtonStyle = () => {
		const baseStyle = {
			padding: '20px',
			fontSize: '24px',
			fontWeight: 'bold',
			border: '1px solid light-dark(rgba(255,69,0,0.3), rgba(255,99,71,0.5))',
			borderRadius: '12px',
			cursor: 'pointer',
			fontFamily: "'Courier New', monospace",
			transition: 'all 0.15s ease',
			position: 'relative' as const,
			'&:active': {
				transform: 'translateY(2px)',
			},
			'[rmx-active="true"]': {
				transform: 'translateY(2px)',
			},
		}

		switch (variant) {
			case 'number':
				return {
					...baseStyle,
					background: 'light-dark(#2a2a2a, #0c0c0c)',
					color: 'light-dark(#ff8c00, #ffa500)',
					boxShadow:
						'0 0 10px light-dark(rgba(255,140,0,0.4), rgba(255,165,0,0.5)), 0 0 20px light-dark(rgba(255,140,0,0.3), rgba(255,165,0,0.4)), 0 4px 0 light-dark(rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
					'&:hover': {
						background: 'light-dark(#3a3a3a, #1a1a1a)',
						boxShadow:
							'0 0 15px light-dark(rgba(255,140,0,0.5), rgba(255,165,0,0.6)), 0 0 30px light-dark(rgba(255,140,0,0.4), rgba(255,165,0,0.5)), 0 4px 0 light-dark(rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
					},
					'&:active': {
						transform: 'translateY(2px)',
						boxShadow:
							'0 0 10px light-dark(rgba(255,140,0,0.4), rgba(255,165,0,0.5)), 0 0 20px light-dark(rgba(255,140,0,0.3), rgba(255,165,0,0.4)), 0 2px 0 light-dark(rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
					},
					'[rmx-active="true"]': {
						transform: 'translateY(2px)',
						boxShadow:
							'0 0 10px light-dark(rgba(255,140,0,0.4), rgba(255,165,0,0.5)), 0 0 20px light-dark(rgba(255,140,0,0.3), rgba(255,165,0,0.4)), 0 2px 0 light-dark(rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
					},
				}
			case 'operator':
				return {
					...baseStyle,
					background: 'light-dark(#ff4500, #c63000)',
					color: '#ffffff',
					boxShadow:
						'0 0 15px light-dark(rgba(255,69,0,0.6), rgba(255,69,0,0.7)), 0 0 25px light-dark(rgba(255,69,0,0.5), rgba(255,69,0,0.6)), 0 4px 0 light-dark(#aa2e00, #8a1f00)',
					'&:hover': {
						background: 'light-dark(#ff5722, #d84315)',
						boxShadow:
							'0 0 20px light-dark(rgba(255,69,0,0.7), rgba(255,69,0,0.8)), 0 0 35px light-dark(rgba(255,99,71,0.6), rgba(255,99,71,0.7)), 0 4px 0 light-dark(#aa2e00, #8a1f00)',
					},
					'&:active': {
						transform: 'translateY(2px)',
						boxShadow:
							'0 0 15px light-dark(rgba(255,69,0,0.6), rgba(255,69,0,0.7)), 0 0 25px light-dark(rgba(255,69,0,0.5), rgba(255,69,0,0.6)), 0 2px 0 light-dark(#aa2e00, #8a1f00)',
					},
					'[rmx-active="true"]': {
						transform: 'translateY(2px)',
						boxShadow:
							'0 0 15px light-dark(rgba(255,69,0,0.6), rgba(255,69,0,0.7)), 0 0 25px light-dark(rgba(255,69,0,0.5), rgba(255,69,0,0.6)), 0 2px 0 light-dark(#aa2e00, #8a1f00)',
					},
				}
			case 'function':
				return {
					...baseStyle,
					background: 'light-dark(#3a3a3a, #1a1a1a)',
					color: 'light-dark(#ff8c00, #ff6347)',
					boxShadow:
						'0 0 8px light-dark(rgba(255,140,0,0.4), rgba(255,99,71,0.5)), 0 0 15px light-dark(rgba(255,140,0,0.2), rgba(255,99,71,0.3)), 0 4px 0 light-dark(rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
					'&:hover': {
						background: 'light-dark(#4a4a4a, #2a2a2a)',
						boxShadow:
							'0 0 12px light-dark(rgba(255,140,0,0.5), rgba(255,99,71,0.6)), 0 0 20px light-dark(rgba(255,140,0,0.3), rgba(255,99,71,0.4)), 0 4px 0 light-dark(rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
					},
					'&:active': {
						transform: 'translateY(2px)',
						boxShadow:
							'0 0 8px light-dark(rgba(255,140,0,0.4), rgba(255,99,71,0.5)), 0 0 15px light-dark(rgba(255,140,0,0.2), rgba(255,99,71,0.3)), 0 2px 0 light-dark(rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
					},
					'[rmx-active="true"]': {
						transform: 'translateY(2px)',
						boxShadow:
							'0 0 8px light-dark(rgba(255,140,0,0.4), rgba(255,99,71,0.5)), 0 0 15px light-dark(rgba(255,140,0,0.2), rgba(255,99,71,0.3)), 0 2px 0 light-dark(rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
					},
				}
			case 'equals':
				return {
					...baseStyle,
					background: 'light-dark(#ff6347, #ff4500)',
					color: '#ffffff',
					boxShadow:
						'0 0 20px light-dark(rgba(255,99,71,0.7), rgba(255,99,71,0.8)), 0 0 35px light-dark(rgba(255,99,71,0.6), rgba(255,99,71,0.7)), 0 4px 0 light-dark(#c63000, #a02800)',
					'&:hover': {
						background: 'light-dark(#ff7f50, #ff5722)',
						boxShadow:
							'0 0 25px light-dark(rgba(255,99,71,0.8), rgba(255,99,71,0.9)), 0 0 45px light-dark(rgba(255,140,0,0.7), rgba(255,140,0,0.8)), 0 4px 0 light-dark(#c63000, #a02800)',
					},
					'&:active': {
						transform: 'translateY(2px)',
						boxShadow:
							'0 0 20px light-dark(rgba(255,99,71,0.7), rgba(255,99,71,0.8)), 0 0 35px light-dark(rgba(255,99,71,0.6), rgba(255,99,71,0.7)), 0 2px 0 light-dark(#c63000, #a02800)',
					},
					'[rmx-active="true"]': {
						transform: 'translateY(2px)',
						boxShadow:
							'0 0 20px light-dark(rgba(255,99,71,0.7), rgba(255,99,71,0.8)), 0 0 35px light-dark(rgba(255,99,71,0.6), rgba(255,99,71,0.7)), 0 2px 0 light-dark(#c63000, #a02800)',
					},
				}
		}
	}

	return () => (
		<button css={getButtonStyle()} {...props}>
			{text}
		</button>
	)
}

const toolInputSchema = z
	.object({
		display: z.string().optional(),
		previousValue: z.number().optional(),
		operation: z.enum(['+', '-', '*', '/']).optional(),
		waitingForNewValue: z.boolean().optional(),
		errorState: z.boolean().optional(),
	})
	.passthrough()

function App(this: Remix.Handle) {
	let toolInput: z.infer<typeof toolInputSchema> | null = null
	void waitForToolInput(toolInputSchema)
		.then((data) => {
			toolInput = data
			if (data) {
				console.log('toolInput', data)
			}
			if (state === 'pending-data') {
				state = 'resolved'
				this.update()
			}
		})
		.catch((error) => {
			console.warn('[MCP Apps] Failed to parse tool input', error)
		})
	let state: 'pending-messages' | 'pending-data' | 'resolved' =
		'pending-messages'
	let step = 0
	let steps = [
		'> INITIALIZING MASTER CONTROL PROGRAM',
		'> ACCESSING GRID',
		'> AUTHORIZATION OVERRIDE ACCEPTED',
		'> GREETINGS, PROGRAM',
	]
	let timeout: ReturnType<typeof setTimeout> | null = null
	let interval = setInterval(() => {
		if (step >= steps.length) {
			timeout = setTimeout(() => {
				const forceResolve = true
				if (toolInput || forceResolve) {
					state = 'resolved'
					this.update()
				} else {
					state = 'pending-data'
				}
			}, 3000)
			clearInterval(interval)
		} else {
			step++
			this.update()
		}
	}, 1250)
	this.signal.addEventListener('abort', () => {
		clearInterval(interval)
		if (timeout) {
			clearTimeout(timeout)
		}
	})

	return () =>
		state === 'resolved' ? (
			<Calculator initialState={toolInput ?? undefined} />
		) : (
			<div
				css={{
					display: 'flex',
					flexDirection: 'column',
					minWidth: '640px',
					minHeight: '200px',
					gap: '12px',
					margin: '24px',
				}}
			>
				{steps.slice(0, step).map((step, index, sliced) => (
					<div
						key={index}
						css={{
							fontSize: '24px',
							fontWeight: 'bold',
							color: 'light-dark(#ff4500, #ff6347)',
							textShadow: '0 0 10px light-dark(#ff4500, #ff6347)',
						}}
					>
						{step}
						{index === sliced.length - 1 ? <Dots /> : null}
					</div>
				))}
			</div>
		)
}

function Dots(this: Remix.Handle) {
	let dots = 0
	let interval = setInterval(() => {
		dots = (dots + 1) % 4
		this.update()
	}, 250)
	this.signal.addEventListener('abort', () => {
		clearInterval(interval)
	})
	return () => <span>{'.'.repeat(dots)}</span>
}

const rootEl = document.getElementById('💿')
invariant(rootEl, 'Root element not found')

createRoot(rootEl).render(
	<div
		css={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
		}}
	>
		<App />
	</div>,
)
