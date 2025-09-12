import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/socket.io': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        ws: true
      }
    },
    watch: {
      ignored: ['**/backend/**', '**/node_modules/**', '**/logs/**', '**/uploads/**']
    }
  }
})
