import { hydrated } from '@remix-run/dom'
import { dom } from '@remix-run/events'

export const Calculator = hydrated(
	'/widgets/calculator.js#Calculator',
	function Calculator() {
		let count = 0
		return () => (
			<button
				on={[
					dom.click(() => {
						count++
						this.update()
					}),
				]}
			>
				Click me: {count}
			</button>
		)
	},
)
