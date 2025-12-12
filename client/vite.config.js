import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('stream-chat')) return 'stream-chat-vendor'
            if (id.includes('react-query') || id.includes('@tanstack/react-query')) return 'react-query-vendor'
            if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor'
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1500
  }
})