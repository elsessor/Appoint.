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
          // Keep React and React-DOM together in main bundle
          if (id.includes('node_modules')) {
            // Don't split react and react-dom
            if (id.includes('react-dom')) return undefined
            if (id.includes('react') && !id.includes('react-')) return undefined
            
            if (id.includes('stream-chat')) return 'stream-chat-vendor'
            if (id.includes('react-query') || id.includes('@tanstack/react-query')) return 'react-query-vendor'
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1500
  }
})