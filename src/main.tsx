import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* Self-hosted faces, so the look does not depend on a third-party
 * render-blocking round trip. Latin subsets only — the unscoped entry points
 * pull Cyrillic and Devanagari too, which this page never renders. */
import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/kalam/latin-400.css'
import '@fontsource/kalam/latin-700.css'
import '@fontsource/space-mono/latin-400.css'
import '@fontsource/space-mono/latin-700.css'

import './styles/index.css'
import App from './App'

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
