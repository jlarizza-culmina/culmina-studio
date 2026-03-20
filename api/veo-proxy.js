// api/veo-proxy.js — Vercel serverless function
// Streams a Veo-generated video from googleapis to the client (keeps API key server-side)
// GET /api/veo-proxy?uri={encodeURIComponent(googleapisFileUri)}
export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  const apiKey = process.env.GOOGLE_IMAGEN_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_IMAGEN_KEY not configured' })

  const { uri } = req.query
  if (!uri) return res.status(400).json({ error: 'uri required' })

  try {
    const decoded     = decodeURIComponent(uri)
    const downloadUrl = `${decoded}?key=${apiKey}&alt=media`
    const response    = await fetch(downloadUrl)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch video from Google' })
    }
    const contentType = response.headers.get('content-type') || 'video/mp4'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
