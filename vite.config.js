import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anthropic/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.setHeader('anthropic-version', '2023-06-01')
            proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true')
            const key = req.headers['x-api-key']
            if (key) proxyReq.setHeader('x-api-key', key)
          })
        }
      }
    }
  }
})
