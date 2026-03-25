// api/elevenlabs-proxy.js — Vercel serverless function
// Supports three modes via `action` field in POST body:
//
//   action: 'tts'           — Text-to-speech using a saved voice_id
//   action: 'design'        — Generate voice preview from description (Voice Design API)
//   action: 'save_voice'    — Save a designed voice preview to ElevenLabs account
//
// TTS:         { action:'tts', text, voice_id, model_id?, shot_id?, stability? }
// Design:      { action:'design', voice_description, text?, loudness?, quality?, gender?, age? }
// Save Voice:  { action:'save_voice', generated_voice_id, name, description? }

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' })

  const {
    action = 'tts',
    text, voice_id, model_id = 'eleven_multilingual_v2', shot_id, stability = 0.5,
    voice_description, loudness = 0, quality = 1.0, gender, age,
    generated_voice_id, name, description,
  } = req.body || {}

  const r2Url   = process.env.R2_PUBLIC_URL
  const r2Token = process.env.R2_API_TOKEN

  async function uploadToR2(buffer, filename) {
    if (!r2Url || !r2Token) return null
    const url = `${r2Url}/${filename}`
    const up = await fetch(url, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${r2Token}`, 'Content-Type': 'audio/mpeg' },
      body: buffer,
    })
    return up.ok ? url : null
  }

  async function respondAudio(buffer, filename) {
    const url = await uploadToR2(buffer, filename)
    if (url) return res.status(200).json({ url })
    return res.status(200).json({ audio_base64: buffer.toString('base64'), content_type: 'audio/mpeg' })
  }

  try {

    // ── TTS ───────────────────────────────────────────────────────────────────
    if (action === 'tts') {
      if (!text)     return res.status(400).json({ error: 'text is required' })
      if (!voice_id) return res.status(400).json({ error: 'voice_id is required' })

      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({ text, model_id, voice_settings: { stability, similarity_boost: 0.75 } }),
      })
      if (!r.ok) return res.status(r.status).json({ error: `TTS error: ${await r.text()}` })
      return await respondAudio(Buffer.from(await r.arrayBuffer()), `voiceover/shot_${shot_id || Date.now()}.mp3`)
    }

    // ── VOICE DESIGN — generate preview ───────────────────────────────────────
    if (action === 'design') {
      if (!voice_description) return res.status(400).json({ error: 'voice_description is required' })

      const body = {
        voice_description,
        text: (text && text.length >= 100) ? text : 'My name is unknown. I am a character in a micro-drama series produced by Culmina Studios. Every story has a beginning, and this is where mine starts.',
        loudness,
        quality: typeof quality === 'number' ? quality : 1.0,
      }
      if (gender) body.gender = gender
      if (age)    body.age    = age

      const r = await fetch('https://api.elevenlabs.io/v1/text-to-voice/design', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) return res.status(r.status).json({ error: `Voice Design error: ${await r.text()}` })

      const json = await r.json()
      const preview = json.previews?.[0] || {}
      const generatedVoiceId = preview.generated_voice_id
      const audioBase64 = preview.audio_base64 || null

      // Optionally upload to R2 if configured
      let audioUrl = null
      if (audioBase64 && r2Url && r2Token) {
        const buffer = Buffer.from(audioBase64, 'base64')
        audioUrl = await uploadToR2(buffer, `voice_design/preview_${generatedVoiceId || Date.now()}.mp3`)
      }

      return res.status(200).json({
        generated_voice_id: generatedVoiceId,
        audio_url:    audioUrl,
        audio_base64: audioUrl ? null : audioBase64,
        content_type: preview.media_type || 'audio/mpeg',
      })
    }

    // ── SAVE VOICE — persist to ElevenLabs account ────────────────────────────
    if (action === 'save_voice') {
      if (!generated_voice_id) return res.status(400).json({ error: 'generated_voice_id is required' })
      if (!name)               return res.status(400).json({ error: 'name is required' })

      const r = await fetch('https://api.elevenlabs.io/v1/text-to-voice', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_name: name, generated_voice_id, voice_description: description || '' }),
      })
      if (!r.ok) return res.status(r.status).json({ error: `Save Voice error: ${await r.text()}` })

      const data = await r.json()
      return res.status(200).json({ voice_id: data.voice_id })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })

  } catch (err) {
    console.error('ElevenLabs proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
