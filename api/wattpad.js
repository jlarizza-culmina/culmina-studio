// api/wattpad.js
// Wattpad story fetcher - uses Wattpad's unofficial public API
// Endpoints used:
//   Story metadata: https://www.wattpad.com/api/v3/stories/{id}
//   Chapter text:   https://www.wattpad.com/apiv2/storytext?id={partId}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { action, url, storyId, partId } = req.query;

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.wattpad.com/',
  };

  try {
    // ── ACTION: info ─────────────────────────────────────────────────────────
    // Fetch story metadata + chapter list from a URL or storyId
    if (action === 'info') {
      const id = storyId || extractStoryId(url);
      if (!id) return res.status(400).json({ error: 'Could not extract story ID from URL' });

      const fields = [
        'id', 'title', 'description', 'cover', 'url',
        'mainCategory', 'categories', 'tags', 'language',
        'numParts', 'completed', 'views', 'votes', 'user(name)',
        'parts(id,title,length,createDate,url)'
      ].join(',');

      const apiUrl = `https://www.wattpad.com/api/v3/stories/${id}?fields=${fields}`;
      const response = await fetch(apiUrl, { headers: HEADERS });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          error: `Wattpad API error: ${response.status}`,
          detail: errText.slice(0, 200)
        });
      }

      const data = await response.json();
      return res.status(200).json({ story: data });
    }

    // ── ACTION: chapter ───────────────────────────────────────────────────────
    // Fetch raw HTML text for a single chapter part
    if (action === 'chapter') {
      if (!partId) return res.status(400).json({ error: 'partId required' });

      const apiUrl = `https://www.wattpad.com/apiv2/storytext?id=${partId}`;
      const response = await fetch(apiUrl, { headers: HEADERS });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Chapter fetch failed: ${response.status}`
        });
      }

      const html = await response.text();
      const text = stripHtml(html);
      return res.status(200).json({ partId, text, charCount: text.length });
    }

    // ── ACTION: chapters (bulk) ───────────────────────────────────────────────
    // Fetch multiple chapters by comma-separated partIds
    if (action === 'chapters') {
      const ids = (partId || '').split(',').filter(Boolean).slice(0, 50); // cap at 50 chapters
      if (!ids.length) return res.status(400).json({ error: 'partId list required' });

      const results = [];
      for (const id of ids) {
        try {
          const apiUrl = `https://www.wattpad.com/apiv2/storytext?id=${id.trim()}`;
          const response = await fetch(apiUrl, { headers: HEADERS });
          if (response.ok) {
            const html = await response.text();
            results.push({ partId: id.trim(), text: stripHtml(html), ok: true });
          } else {
            results.push({ partId: id.trim(), text: '', ok: false, status: response.status });
          }
          // Small delay to be polite
          await sleep(150);
        } catch (err) {
          results.push({ partId: id.trim(), text: '', ok: false, error: err.message });
        }
      }

      return res.status(200).json({ chapters: results });
    }

    return res.status(400).json({ error: 'action must be one of: info, chapter, chapters' });

  } catch (err) {
    console.error('[wattpad]', err);
    return res.status(500).json({ error: err.message });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractStoryId(url) {
  if (!url) return null;
  // Handles:
  //   https://www.wattpad.com/story/123456789-some-title
  //   https://www.wattpad.com/story/123456789
  const match = url.match(/wattpad\.com\/story\/(\d+)/);
  if (match) return match[1];
  // Bare numeric ID
  if (/^\d+$/.test(url)) return url;
  return null;
}

function stripHtml(html) {
  // Remove script/style blocks
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Paragraph breaks → newlines
  text = text
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n');

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));

  // Normalize whitespace
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
