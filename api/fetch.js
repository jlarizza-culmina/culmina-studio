// api/fetch.js
// Vercel serverless function — fetches arbitrary URLs server-side
// Avoids CORS issues when scraping book pages from the browser

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'Missing url' })

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CulminaBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Fetch failed: ${response.status} ${response.statusText}` })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return res.status(400).json({ error: `Unsupported content type: ${contentType}` })
    }

    let html = await response.text()

    // Strip scripts, styles, nav, footer to reduce token count
    html = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{3,}/g, '\n\n')
      .trim()
      .slice(0, 8000) // cap at ~8k chars to stay within token budget

    return res.status(200).json({ text: html, url, contentType })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
