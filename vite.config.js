import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function apiProxy() {
  return {
    name: 'api-proxy',
    configureServer(server) {
      // /api/fetch — proxies arbitrary URL fetches server-side (avoids CORS)
      server.middlewares.use('/api/fetch', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
        if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'POST only' })); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { url } = JSON.parse(body)
            if (!url) { res.writeHead(400); res.end(JSON.stringify({ error: 'Missing url' })); return }
            const response = await fetch(url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CulminaBot/1.0)', 'Accept': 'text/html,*/*' },
              redirect: 'follow',
            })
            let html = await response.text()
            html = html
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s{3,}/g, '\n\n')
              .trim()
              .slice(0, 8000)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ text: html, url }))
          } catch (err) {
            res.writeHead(500)
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })

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
            // Pass the full request body through — don't destructure or override
            const parsed = JSON.parse(body)
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model:      parsed.model      || 'claude-sonnet-4-20250514',
                max_tokens: parsed.max_tokens || 2000,
                messages:   parsed.messages   || [{ role: 'user', content: parsed.prompt || '' }],
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
