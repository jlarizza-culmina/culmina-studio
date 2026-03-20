// api/veo.js — Vercel serverless function
// Submits a Veo generation job to Google AI Studio (predictLongRunning)
// Returns { operationName } — client polls /api/veo-poll for completion
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const apiKey = process.env.GOOGLE_IMAGEN_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_IMAGEN_KEY not configured' })

  const { prompt, model, aspectRatio, durationSeconds, negativePrompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'prompt is required' })

  const veoModel  = model || 'veo-3.0-generate-preview'
  const endpoint  = `https://generativelanguage.googleapis.com/v1beta/models/${veoModel}:predictLongRunning`

  const payload = {
    instances: [{ prompt: prompt.trim() }],
    parameters: {
      aspectRatio:  aspectRatio || '9:16',
      sampleCount:  1,
    },
  }
  if (negativePrompt) payload.instances[0].negativePrompt = negativePrompt

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Veo API error', details: data,
      })
    }
    if (!data.name) {
      return res.status(500).json({ error: 'No operation name returned', details: data })
    }
    return res.status(200).json({ operationName: data.name })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
