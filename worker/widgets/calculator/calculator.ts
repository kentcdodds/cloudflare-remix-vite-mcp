import { createEventType } from '@remix-run/events'

type Operation = '+' | '-' | '*' | '/' | null

export interface CalculatorState {
	display?: string
	previousValue?: number | null
	operation?: Operation
	waitingForNewValue?: boolean
	errorState?: boolean
	lastCalculation?: string
}

const [change, createChange] = createEventType('calculator:change')

export class Calculator extends EventTarget {
	static change = change
	#display: string
	#previousValue: number | null
	#operation: Operation
	#waitingForNewValue: boolean
	#errorState: boolean
	#lastCalculation: string

	constructor(initialState?: CalculatorState) {
		super()
		this.#display = initialState?.display ?? '0'
		this.#previousValue = initialState?.previousValue ?? null
		this.#operation = initialState?.operation ?? null
		this.#waitingForNewValue = initialState?.waitingForNewValue ?? false
		this.#errorState = initialState?.errorState ?? false
		this.#lastCalculation = initialState?.lastCalculation ?? ''
	}

	/**
	 * Get the current display value
	 */
	getDisplay(): string {
		return this.#display
	}

	/**
	 * Get the full expression - derived from current state
	 */
	getExpression(): string {
		// If we have a completed calculation, show it
		if (this.#lastCalculation) {
			return this.#lastCalculation
		}

		// If we're in an error state
		if (this.#errorState) {
			return 'Error: Division by zero'
		}

		// If we have an operation in progress
		if (this.#operation && this.#previousValue !== null) {
			// If waiting for new value, just show: previousValue operation
			if (this.#waitingForNewValue) {
				return `${this.#previousValue} ${this.#getOperatorSymbol(this.#operation)}`
			}
			// Otherwise show: previousValue operation display
			return `${this.#previousValue} ${this.#getOperatorSymbol(this.#operation)} ${this.#display}`
		}

		// Otherwise just show the current display
		return this.#display
	}

	/**
	 * Input a digit (0-9)
	 */
	inputDigit(digit: number): void {
		if (this.#errorState) {
			this.clear()
			return
		}

		if (this.#waitingForNewValue) {
			this.#display = String(digit)
			this.#waitingForNewValue = false
			this.#lastCalculation = '' // Clear last calculation when starting new input
		} else {
			this.#display =
				this.#display === '0' ? String(digit) : this.#display + digit
		}
		this.#notifyChange()
	}

	/**
	 * Input a decimal point
	 */
	inputDecimal(): void {
		if (this.#errorState) {
			this.clear()
			return
		}

		if (this.#waitingForNewValue) {
			this.#display = '0.'
			this.#waitingForNewValue = false
			this.#lastCalculation = '' // Clear last calculation when starting new input
		} else if (!this.#display.includes('.')) {
			this.#display += '.'
		}
		this.#notifyChange()
	}

	/**
	 * Set an operation (+, -, *, /)
	 */
	setOperation(op: '+' | '-' | '*' | '/'): void {
		if (this.#errorState) {
			this.clear()
			return
		}

		const inputValue = parseFloat(this.#display)

		if (this.#previousValue === null) {
			this.#previousValue = inputValue
		} else if (this.#operation) {
			const result = this.#performOperation(
				this.#previousValue,
				inputValue,
				this.#operation,
			)
			this.#display = String(result)
			this.#previousValue = result
		}

		this.#waitingForNewValue = true
		this.#operation = op
		this.#lastCalculation = '' // Clear last calculation when setting new operation
		this.#notifyChange()
	}

	/**
	 * Calculate the result
	 */
	calculate(): void {
		if (this.#errorState) {
			return
		}

		const inputValue = parseFloat(this.#display)

		if (this.#operation && this.#previousValue !== null) {
			// Store the full calculation before clearing state
			this.#lastCalculation = `${this.#previousValue} ${this.#getOperatorSymbol(this.#operation)} ${inputValue} = `

			const result = this.#performOperation(
				this.#previousValue,
				inputValue,
				this.#operation,
			)
			this.#display = String(result)
			this.#lastCalculation += this.#display

			this.#previousValue = null
			this.#operation = null
			this.#waitingForNewValue = true
			this.#notifyChange()
		}
	}

	/**
	 * Clear the calculator (reset to initial state)
	 */
	clear(): void {
		this.#display = '0'
		this.#previousValue = null
		this.#operation = null
		this.#waitingForNewValue = false
		this.#errorState = false
		this.#lastCalculation = ''
		this.#notifyChange()
	}

	/**
	 * Clear the current entry only
	 */
	clearEntry(): void {
		this.#display = '0'
		this.#waitingForNewValue = false
		this.#notifyChange()
	}

	/**
	 * Toggle the sign of the current display value
	 */
	toggleSign(): void {
		if (this.#errorState) {
			return
		}

		const value = parseFloat(this.#display)
		this.#display = String(-value)
		this.#notifyChange()
	}

	/**
	 * Calculate percentage
	 */
	percentage(): void {
		if (this.#errorState) {
			return
		}

		const value = parseFloat(this.#display)
		this.#display = String(value / 100)
		this.#notifyChange()
	}

	/**
	 * Backspace - remove the last digit
	 */
	backspace(): void {
		if (this.#errorState || this.#waitingForNewValue) {
			return
		}

		if (this.#display.length > 1) {
			this.#display = this.#display.slice(0, -1)
		} else {
			this.#display = '0'
		}
		this.#notifyChange()
	}

	/**
	 * Check if calculator is in error state
	 */
	isError(): boolean {
		return this.#errorState
	}

	/**
	 * Perform the arithmetic operation
	 */
	#performOperation(
		firstValue: number,
		secondValue: number,
		operation: Operation,
	): number {
		switch (operation) {
			case '+':
				return firstValue + secondValue
			case '-':
				return firstValue - secondValue
			case '*':
				return firstValue * secondValue
			case '/':
				if (secondValue === 0) {
					this.#errorState = true
					this.#display = 'Error'
					return 0
				}
				return firstValue / secondValue
			default:
				return secondValue
		}
	}

	/**
	 * Get the display symbol for an operation
	 */
	#getOperatorSymbol(op: Operation): string {
		switch (op) {
			case '+':
				return '+'
			case '-':
				return '-'
			case '*':
				return '×'
			case '/':
				return '÷'
			default:
				return ''
		}
	}

	/**
	 * Notify listeners that the calculator state has changed
	 */
	#notifyChange(): void {
		this.dispatchEvent(createChange())
	}
}
