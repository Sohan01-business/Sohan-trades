import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TradeVault — fully offline, no backend, no env vars.
// base: '/trades-journal/' so the built app works from a relative file path too
// (Capacitor serves it from a local scheme, not a domain root).
export default defineConfig({
  plugins: [react()],
  base: '/trades-journal/',
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 5173
  }
})
