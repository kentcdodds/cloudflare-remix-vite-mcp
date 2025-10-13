import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

// Automatically detect all .tsx files and directories with index.tsx in worker/widgets as build entries
const entriesDir = path.resolve(__dirname, 'worker/widgets')
const entries = Object.fromEntries(
	fs.readdirSync(entriesDir).flatMap((item) => {
		const itemPath = path.join(entriesDir, item)
		const stat = fs.statSync(itemPath)

		// If it's a .tsx file, use it directly
		if (stat.isFile() && item.endsWith('.tsx')) {
			return [[path.basename(item, '.tsx'), itemPath]]
		}

		// If it's a directory with an index.tsx, use that
		if (stat.isDirectory()) {
			const indexPath = path.join(itemPath, 'index.tsx')
			if (fs.existsSync(indexPath)) {
				return [[item, indexPath]]
			}
		}

		return []
	}),
)

// https://vite.dev/config/
export default defineConfig({
	build: {
		outDir: 'dist/public',
		rollupOptions: {
			input: entries,
			output: {
				entryFileNames: 'widgets/[name].js',
				format: 'es',
			},
			preserveEntrySignatures: 'exports-only', // Preserve exports even if they appear unused
		},
	},
})
