import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyInitialTheme } from './design/theme'
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
