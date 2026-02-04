import { App } from '@modelcontextprotocol/ext-apps'
import { type z } from 'zod'

type AppInfo = {
	name: string
	version: string
}

type ConnectOptions = {
	appInfo?: AppInfo
	onToolInput?: (params: { arguments?: Record<string, unknown> }) => void
}

const DEFAULT_APP_INFO: AppInfo = {
	name: 'calculator-widget',
	version: '1.0.0',
}

let appInstance: App | null = null
let appPromise: Promise<App | null> | null = null

function hasHost() {
	return typeof window !== 'undefined' && window.parent && window.parent !== window
}

export function connectMcpApp(options: ConnectOptions = {}) {
	if (!hasHost()) {
		return Promise.resolve(null)
	}

	if (!appInstance) {
		appInstance = new App(options.appInfo ?? DEFAULT_APP_INFO)
	}

	if (options.onToolInput) {
		appInstance.ontoolinput = options.onToolInput
	}

	if (!appPromise) {
		appPromise = appInstance
			.connect()
			.then(() => appInstance)
			.catch((error) => {
				console.warn('[MCP Apps] Failed to connect to host', error)
				return null
			})
	}

	return appPromise
}

export function waitForToolInput<RenderData>(
	schema?: z.ZodSchema<RenderData>,
): Promise<RenderData | null> {
	if (!hasHost()) {
		return Promise.resolve(null)
	}

	return new Promise((resolve, reject) => {
		let resolved = false
		void connectMcpApp({
			onToolInput: (params) => {
				if (resolved) return
				resolved = true
				const toolInput = (params?.arguments ?? {}) as RenderData
				if (!schema) {
					resolve(toolInput)
					return
				}

				const parseResult = schema.safeParse(toolInput)
				if (!parseResult.success) {
					reject(parseResult.error)
					return
				}

				resolve(parseResult.data)
			},
		})
	})
}

export async function sendPromptMessage(prompt: string) {
	const app = await connectMcpApp()
	if (!app) {
		console.warn('[MCP Apps] Host not available; prompt not sent.')
		return null
	}

	try {
		return await app.sendMessage({
			role: 'user',
			content: [{ type: 'text', text: prompt }],
		})
	} catch (error) {
		console.warn('[MCP Apps] Failed to send message', error)
		return null
	}
}
