import { createFrame } from '@remix-run/dom'

// @ts-expect-error this module should only be used on the client
const reconciler = createFrame(document, {
	async loadModule(moduleUrl, name) {
		console.log('Loading module `%s` with name "%s"', moduleUrl, name)
		let mod = await import(moduleUrl)
		if (!mod) throw new Error(`Unknown module: ${moduleUrl}#${name}`)
		let Component = mod[name]
		if (!Component) throw new Error(`Unknown component: ${moduleUrl}#${name}`)
		return Component
	},

	async resolveFrame(frameUrl) {
		console.log('Resolving frame', frameUrl)
		let res = await fetch(frameUrl)
		if (res.ok) return res.text()
		throw new Error(`Failed to fetch ${frameUrl}`)
	},
})

await reconciler.ready()
