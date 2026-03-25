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
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${veoModel}:predictLongRunning`
            const payload  = {
              instances:  [{ prompt: prompt.trim(), ...(negativePrompt ? { negativePrompt } : {}) }],
              parameters: { aspectRatio: aspectRatio || '9:16', sampleCount: 1 },
            }
            const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(payload) })
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
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opPath}`, { headers: { 'x-goog-api-key': apiKey } })
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

      // /api/elevenlabs-proxy — Voice Design + TTS (keeps API key server-side)
      server.middlewares.use('/api/elevenlabs-proxy', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }
        if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'POST only' })); return }
        const env    = loadEnv('development', process.cwd(), '')
        const apiKey = env.ELEVENLABS_API_KEY
        if (!apiKey) { res.writeHead(500); res.end(JSON.stringify({ error: 'ELEVENLABS_API_KEY not set in .env.local' })); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body)
            const { action = 'tts' } = parsed
            const r2Url   = env.R2_PUBLIC_URL
            const r2Token = env.R2_API_TOKEN
            async function uploadToR2(buffer, filename) {
              if (!r2Url || !r2Token) return null
              const up = await fetch(`${r2Url}/${filename}`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${r2Token}`, 'Content-Type': 'audio/mpeg' }, body: buffer,
              })
              return up.ok ? `${r2Url}/${filename}` : null
            }
            if (action === 'design') {
              const { voice_description, text, gender, age, loudness = 0, quality = 'high' } = parsed
              if (!voice_description) { res.writeHead(400); res.end(JSON.stringify({ error: 'voice_description required' })); return }
              const payload = { voice_description, text: text || 'Hello. I am a character in a Culmina Studios micro-drama.', loudness, quality }
              if (gender) payload.gender = gender
              if (age)    payload.age    = age
              const r = await fetch('https://api.elevenlabs.io/v1/text-to-voice/design', {
                method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
              })
              if (!r.ok) { const e = await r.text(); res.writeHead(r.status); res.end(JSON.stringify({ error: `Voice Design error: ${e}` })); return }
              const json    = await r.json()
              const preview = json.previews?.[0] || {}
              const gvid    = preview.generated_voice_id
              const b64     = preview.audio_base64 || null
              let audioUrl  = null
              if (b64 && r2Url && r2Token) audioUrl = await uploadToR2(Buffer.from(b64, 'base64'), `voice_design/preview_${gvid || Date.now()}.mp3`)
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ generated_voice_id: gvid, audio_url: audioUrl, audio_base64: audioUrl ? null : b64, content_type: preview.media_type || 'audio/mpeg' }))
              return
            }
            if (action === 'save_voice') {
              const { generated_voice_id, name, description = '' } = parsed
              if (!generated_voice_id) { res.writeHead(400); res.end(JSON.stringify({ error: 'generated_voice_id required' })); return }
              if (!name)               { res.writeHead(400); res.end(JSON.stringify({ error: 'name required' })); return }
              const r = await fetch('https://api.elevenlabs.io/v1/text-to-voice', {
                method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ voice_name: name, generated_voice_id, voice_description: description }),
              })
              if (!r.ok) { const e = await r.text(); res.writeHead(r.status); res.end(JSON.stringify({ error: `Save Voice error: ${e}` })); return }
              const data = await r.json()
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ voice_id: data.voice_id }))
              return
            }
            const { text, voice_id, model_id = 'eleven_multilingual_v2', shot_id, stability = 0.5 } = parsed
            if (!text)     { res.writeHead(400); res.end(JSON.stringify({ error: 'text required' })); return }
            if (!voice_id) { res.writeHead(400); res.end(JSON.stringify({ error: 'voice_id required' })); return }
            const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
              method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
              body: JSON.stringify({ text, model_id, voice_settings: { stability, similarity_boost: 0.75 } }),
            })
            if (!r.ok) { const e = await r.text(); res.writeHead(r.status); res.end(JSON.stringify({ error: `TTS error: ${e}` })); return }
            const buf = Buffer.from(await r.arrayBuffer())
            const url = await uploadToR2(buf, `voiceover/shot_${shot_id || Date.now()}.mp3`)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(url ? { url } : { audio_base64: buf.toString('base64'), content_type: 'audio/mpeg' }))
          } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })) }
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
