import { invariant } from '@epic-web/invariant'
import { createRoot } from '@remix-run/dom'
import { Calculator } from './calculator/index.tsx'

const rootEl = document.getElementById('💿')
invariant(rootEl, 'Root element not found')

createRoot(rootEl).render(<Calculator />)
