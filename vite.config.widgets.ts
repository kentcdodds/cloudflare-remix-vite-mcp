import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

// Automatically detect all .tsx files in worker/widgets as build entries
const entriesDir = path.resolve(__dirname, 'worker/widgets')
const entries = Object.fromEntries(
	fs
		.readdirSync(entriesDir)
		.filter((file) => file.endsWith('.tsx'))
		.map((file) => [path.basename(file, '.tsx'), path.join(entriesDir, file)]),
)

// https://vite.dev/config/
export default defineConfig({
	build: {
		rollupOptions: {
			input: entries,
			output: {
				entryFileNames: 'public/widgets/[name].js',
				format: 'es',
			},
			preserveEntrySignatures: 'exports-only', // Preserve exports even if they appear unused
		},
	},
})
