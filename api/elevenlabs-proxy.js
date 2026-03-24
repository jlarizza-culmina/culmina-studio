// api/elevenlabs-proxy.js — Vercel serverless function
// POST /api/elevenlabs-proxy
// Body: { text, voice_id, model_id? }
// Returns: audio/mpeg stream saved to R2, responds with { url }

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey   = process.env.ELEVENLABS_API_KEY
  const r2Url    = process.env.R2_PUBLIC_URL        // e.g. https://pub-xxx.r2.dev
  const r2Token  = process.env.R2_API_TOKEN
  const r2Bucket = process.env.R2_BUCKET_NAME

  if (!apiKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' })

  const { text, voice_id, model_id = 'eleven_multilingual_v2', shot_id, stability = 0.5 } = req.body || {}
  if (!text)     return res.status(400).json({ error: 'text is required' })
  if (!voice_id) return res.status(400).json({ error: 'voice_id is required' })

  try {
    // 1. Call ElevenLabs TTS
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings: { stability, similarity_boost: 0.75 },
      }),
    })

    if (!elRes.ok) {
      const err = await elRes.text()
      return res.status(elRes.status).json({ error: `ElevenLabs error: ${err}` })
    }

    const audioBuffer = Buffer.from(await elRes.arrayBuffer())

    // 2. Upload to R2 if configured, otherwise return audio directly
    if (r2Url && r2Token && r2Bucket) {
      const filename  = `voiceover/shot_${shot_id || Date.now()}_${Date.now()}.mp3`
      const uploadUrl = `${r2Url}/${filename}`

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${r2Token}`,
          'Content-Type': 'audio/mpeg',
        },
        body: audioBuffer,
      })

      if (!uploadRes.ok) {
        // R2 upload failed — fall back to returning audio directly
        res.setHeader('Content-Type', 'audio/mpeg')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        return res.send(audioBuffer)
      }

      return res.status(200).json({ url: uploadUrl })
    }

    // No R2 configured — stream audio directly back to client
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.send(audioBuffer)

  } catch (err) {
    console.error('ElevenLabs proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
