// api/veo-poll.js — Vercel serverless function
// Polls a Veo long-running operation
// GET /api/veo-poll?op={operationName}
// Returns { done, videoUri? } or { done: false } or { done: true, error }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')  return res.status(405).json({ error: 'GET only' })

  const apiKey = process.env.GOOGLE_IMAGEN_KEY || process.env.VITE_GOOGLE_IMAGEN_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_IMAGEN_KEY not configured' })

  const { op } = req.query
  if (!op) return res.status(400).json({ error: 'op parameter required' })

  // Normalize — op may be "operations/abc" or just "abc"
  // Use full operation name as returned by Veo — e.g. models/veo-3.1.../operations/abc
  const opPath = op

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${opPath}`,
      { headers: { 'x-goog-api-key': apiKey } }
    )
    const rawText = await response.text()
    console.log('[veo-poll] status:', response.status, 'op:', op)
    console.log('[veo-poll] raw response:', rawText.slice(0, 500))
    const data = JSON.parse(rawText)

    if (!response.ok) {
      return res.status(response.status).json({
        done: false, error: data.error?.message || 'Poll error',
      })
    }
    if (data.error) {
      return res.status(200).json({ done: true, error: data.error.message })
    }
    if (!data.done) {
      return res.status(200).json({ done: false })
    }

    // Operation complete — extract video URI (handle multiple response shapes)
    const samples =
      data.response?.generateVideoResponse?.generatedSamples ||
      data.response?.generatedSamples ||
      []
    const videoUri = samples[0]?.video?.uri || null

    if (!videoUri) {
      return res.status(200).json({
        done: true, error: 'No video URI in response', details: data.response,
      })
    }
    return res.status(200).json({ done: true, videoUri })
  } catch (err) {
    return res.status(500).json({ done: false, error: err.message })
  }
}
