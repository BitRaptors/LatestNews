import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyInitialTheme } from './design/theme'
// Side-effect import — pulls @fontsource @font-face declarations into the bundle
// so Inter / JetBrains Mono are self-hosted (NFR-S2). Must sit above ./index.css
// so font-face rules are defined before any element consumes `font-family`.
import './design/typography'
import './index.css'
import App from './App.tsx'

// Apply theme synchronously before React mounts so the first paint already
// has the correct surface / text colours (no FOUC).
applyInitialTheme()

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Missing #root element in index.html')
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
