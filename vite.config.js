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

      // /api/veo — submit Veo generation job
      server.middlewares.use('/api/veo', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
        if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'POST only' })); return }
        const env    = loadEnv('development', process.cwd(), '')
        const apiKey = env.GOOGLE_IMAGEN_KEY
        if (!apiKey) { res.writeHead(500); res.end(JSON.stringify({ error: 'GOOGLE_IMAGEN_KEY not set' })); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { prompt, model, aspectRatio, durationSeconds, negativePrompt } = JSON.parse(body)
            if (!prompt) { res.writeHead(400); res.end(JSON.stringify({ error: 'prompt required' })); return }
            const veoModel = model || 'veo-3.0-generate-preview'
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${veoModel}:predictLongRunning?key=${apiKey}`
            const payload  = {
              instances:  [{ prompt: prompt.trim(), ...(negativePrompt ? { negativePrompt } : {}) }],
              parameters: { aspectRatio: aspectRatio || '9:16', sampleCount: 1, durationSeconds: durationSeconds || 8, personGeneration: 'allow_adult', safetyFilterLevel: 'block_only_high' },
            }
            const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const data     = await response.text()
            res.writeHead(response.status, { 'Content-Type': 'application/json' })
            res.end(data)
          } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })) }
        })
      })

      // /api/veo-poll — poll Veo operation status
      server.middlewares.use('/api/veo-poll', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
        const env    = loadEnv('development', process.cwd(), '')
        const apiKey = env.GOOGLE_IMAGEN_KEY
        if (!apiKey) { res.writeHead(500); res.end(JSON.stringify({ error: 'GOOGLE_IMAGEN_KEY not set' })); return }
        const url    = new URL(req.url, 'http://localhost')
        const op     = url.searchParams.get('op')
        if (!op) { res.writeHead(400); res.end(JSON.stringify({ error: 'op required' })); return }
        const opPath = op.startsWith('operations/') ? op : `operations/${op}`
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opPath}?key=${apiKey}`)
          const data     = await response.text()
          res.writeHead(response.status, { 'Content-Type': 'application/json' })
          res.end(data)
        } catch (err) { res.writeHead(500); res.end(JSON.stringify({ done: false, error: err.message })) }
      })

      // /api/veo-proxy — stream video from googleapis (keeps API key server-side)
      server.middlewares.use('/api/veo-proxy', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
        const env    = loadEnv('development', process.cwd(), '')
        const apiKey = env.GOOGLE_IMAGEN_KEY
        if (!apiKey) { res.writeHead(500); res.end(JSON.stringify({ error: 'GOOGLE_IMAGEN_KEY not set' })); return }
        const url = new URL(req.url, 'http://localhost')
        const uri = url.searchParams.get('uri')
        if (!uri) { res.writeHead(400); res.end(JSON.stringify({ error: 'uri required' })); return }
        try {
          const decoded  = decodeURIComponent(uri)
          const response = await fetch(`${decoded}?key=${apiKey}&alt=media`)
          const buffer   = await response.arrayBuffer()
          res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'video/mp4', 'Cache-Control': 'public, max-age=3600' })
          res.end(Buffer.from(buffer))
        } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })) }
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
