import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin requests in development: the browser talks to Vite, which forwards /api to the
    // backend. This avoids CORS entirely while developing.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
