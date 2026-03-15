import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function apiProxy() {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/score', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
        if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'POST only' })); return }

        const env = loadEnv('development', process.cwd(), '')
        const apiKey = env.ANTHROPIC_API_KEY
        if (!apiKey) { res.writeHead(500); res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env.local' })); return }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { prompt, max_tokens = 2000 } = JSON.parse(body)
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens,
                messages: [{ role: 'user', content: prompt }],
              }),
            })
            const data = await response.text()
            res.writeHead(response.status, { 'Content-Type': 'application/json' })
            res.end(data)
          } catch (err) {
            res.writeHead(500)
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiProxy(),
  ],
})
