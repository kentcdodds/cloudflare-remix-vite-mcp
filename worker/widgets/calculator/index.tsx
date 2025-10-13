import { type Remix } from '@remix-run/dom'
import { events, type EventDescriptor } from '@remix-run/events'
import { createKeyInteraction } from '@remix-run/events/key'
import { press } from '@remix-run/events/press'
import { Calculator as CalcEngine } from './calculator'

export function Calculator(this: Remix.Handle) {
	const calc = new CalcEngine()

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
			createKeyInteraction(key)(
				() => {
					handler()
					this.update()
				},
				{ signal: this.signal },
			),
		),
	)

	return () => (
		<div
			css={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				padding: '20px',
				background: 'light-dark(#f0f0f0, #1a1a1a)',
				fontFamily: "'Courier New', monospace",
			}}
		>
			<div
				css={{
					width: '360px',
					background: 'light-dark(#2c2c2c, #2d2d2d)',
					borderRadius: '24px',
					padding: '32px',
					boxShadow:
						'light-dark(0 8px 32px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.6))',
					border: 'light-dark(4px solid #1a1a1a, 4px solid #3f3f3f)',
				}}
			>
				<div
					css={{
						background: 'light-dark(#1a3a1a, #0d250d)',
						borderRadius: '12px',
						padding: '20px',
						marginBottom: '24px',
						minHeight: '120px',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						border: 'light-dark(3px solid #0d290d, 3px solid #1a4a1a)',
						boxShadow:
							'light-dark(inset 0 4px 8px rgba(0,0,0,0.5), inset 0 4px 8px rgba(0,0,0,0.8))',
					}}
				>
					{/* Expression history display */}
					<div
						css={{
							color: 'light-dark(#00cc00, #00cc66)',
							fontSize: '20px',
							fontWeight: 'normal',
							textShadow: 'light-dark(0 0 5px #00cc00, 0 0 10px #00cc66)',
							letterSpacing: '1px',
							fontFamily: "'Courier New', monospace",
							wordBreak: 'break-all',
							textAlign: 'right',
							minHeight: '30px',
							opacity: calc.getExpression() ? 1 : 0.5,
						}}
					>
						{calc.getExpression() || '0'}
					</div>

					{/* Current value display */}
					<div
						css={{
							color: 'light-dark(#00ff00, #00ff88)',
							fontSize: calc.isError() ? '32px' : '48px',
							fontWeight: 'bold',
							textShadow: 'light-dark(0 0 10px #00ff00, 0 0 15px #00ff88)',
							letterSpacing: '2px',
							fontFamily: "'Courier New', monospace",
							wordBreak: 'break-all',
							textAlign: 'right',
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
						on={press(() => {
							calc.clear()
							this.update()
						})}
					/>
					<CalcButton
						text="CE"
						variant="function"
						on={press(() => {
							calc.clearEntry()
							this.update()
						})}
					/>
					<CalcButton
						text="←"
						variant="function"
						on={press(() => {
							calc.backspace()
							this.update()
						})}
					/>
					<CalcButton
						text="÷"
						variant="operator"
						on={press(() => {
							calc.setOperation('/')
							this.update()
						})}
					/>

					<CalcButton
						text="7"
						variant="number"
						on={press(() => {
							calc.inputDigit(7)
							this.update()
						})}
					/>
					<CalcButton
						text="8"
						variant="number"
						on={press(() => {
							calc.inputDigit(8)
							this.update()
						})}
					/>
					<CalcButton
						text="9"
						variant="number"
						on={press(() => {
							calc.inputDigit(9)
							this.update()
						})}
					/>
					<CalcButton
						text="×"
						variant="operator"
						on={press(() => {
							calc.setOperation('*')
							this.update()
						})}
					/>

					<CalcButton
						text="4"
						variant="number"
						on={press(() => {
							calc.inputDigit(4)
							this.update()
						})}
					/>
					<CalcButton
						text="5"
						variant="number"
						on={press(() => {
							calc.inputDigit(5)
							this.update()
						})}
					/>
					<CalcButton
						text="6"
						variant="number"
						on={press(() => {
							calc.inputDigit(6)
							this.update()
						})}
					/>
					<CalcButton
						text="-"
						variant="operator"
						on={press(() => {
							calc.setOperation('-')
							this.update()
						})}
					/>

					<CalcButton
						text="1"
						variant="number"
						on={press(() => {
							calc.inputDigit(1)
							this.update()
						})}
					/>
					<CalcButton
						text="2"
						variant="number"
						on={press(() => {
							calc.inputDigit(2)
							this.update()
						})}
					/>
					<CalcButton
						text="3"
						variant="number"
						on={press(() => {
							calc.inputDigit(3)
							this.update()
						})}
					/>
					<CalcButton
						text="+"
						variant="operator"
						on={press(() => {
							calc.setOperation('+')
							this.update()
						})}
					/>

					<CalcButton
						text="±"
						variant="function"
						on={press(() => {
							calc.toggleSign()
							this.update()
						})}
					/>
					<CalcButton
						text="0"
						variant="number"
						on={press(() => {
							calc.inputDigit(0)
							this.update()
						})}
					/>
					<CalcButton
						text="."
						variant="number"
						on={press(() => {
							calc.inputDecimal()
							this.update()
						})}
					/>
					<CalcButton
						text="="
						variant="equals"
						on={press(() => {
							calc.calculate()
							this.update()
						})}
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
			border: 'none',
			borderRadius: '12px',
			cursor: 'pointer',
			fontFamily: "'Courier New', monospace",
			transition: 'all 0.15s ease',
			boxShadow: 'light-dark(0 4px 0 rgba(0,0,0,0.3), 0 4px 0 rgba(0,0,0,0.6))',
			'&:active': {
				transform: 'translateY(2px)',
				boxShadow:
					'light-dark(0 2px 0 rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.6))',
			},
			'[rmx-active="true"]': {
				transform: 'translateY(2px)',
				boxShadow:
					'light-dark(0 2px 0 rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.6))',
			},
		}

		switch (variant) {
			case 'number':
				return {
					...baseStyle,
					background: 'light-dark(#4a4a4a, #1a1a1a)',
					color: 'light-dark(#ffffff, #e0e0e0)',
					'&:hover': {
						background: 'light-dark(#5a5a5a, #252525)',
					},
				}
			case 'operator':
				return {
					...baseStyle,
					background: 'light-dark(#ff9500, #ff8800)',
					color: '#ffffff',
					'&:hover': {
						background: 'light-dark(#ffaa00, #ff9900)',
					},
				}
			case 'function':
				return {
					...baseStyle,
					background: 'light-dark(#a5a5a5, #4a4a4a)',
					color: 'light-dark(#000000, #ffffff)',
					'&:hover': {
						background: 'light-dark(#b5b5b5, #555555)',
					},
				}
			case 'equals':
				return {
					...baseStyle,
					background: 'light-dark(#00cc00, #00ff00)',
					color: 'light-dark(#ffffff, #000000)',
					boxShadow: 'light-dark(0 4px 0 #009900, 0 4px 0 #00cc00)',
					'&:hover': {
						background: 'light-dark(#00dd00, #00ff33)',
					},
					'&:active': {
						transform: 'translateY(2px)',
						boxShadow: 'light-dark(0 2px 0 #009900, 0 2px 0 #00cc00)',
					},
					'[rmx-active="true"]': {
						transform: 'translateY(2px)',
						boxShadow: 'light-dark(0 2px 0 #009900, 0 2px 0 #00cc00)',
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
