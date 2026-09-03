import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register the offline-first service worker. Safe to skip silently on
// platforms/browsers without support (e.g. some older WebViews) — the
// app still works, it just won't have the extra offline-cache layer.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Non-fatal: the app itself still runs from the local bundle.
    })
  })
}
