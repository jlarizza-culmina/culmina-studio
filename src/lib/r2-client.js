// ──────────────────────────────────────────────────
// Culmina R2 Client
// ──────────────────────────────────────────────────
// Communicates with the Cloudflare Worker at culmina-r2-api.culmina.workers.dev
// Auth: reuses Supabase JWT from the current session

import { supabase } from './supabase'

const WORKER_URL = import.meta.env.VITE_R2_WORKER_URL || 'https://culmina-r2-api.culmina.workers.dev'

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token
}

async function authHeaders() {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${token}` }
}

async function fetchJson(path, options = {}) {
  const headers = await authHeaders()
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `R2 API error: ${res.status}`)
  }
  return res.json()
}

// ── Document Repository ──

export async function listTitles(userId) {
  return fetchJson(`/api/docs/users/${userId}/titles`)
}

export async function listFolders(userId, titleSlug) {
  return fetchJson(`/api/docs/users/${userId}/titles/${titleSlug}/folders`)
}

export async function listFiles(userId, titleSlug, folder) {
  return fetchJson(`/api/docs/users/${userId}/titles/${titleSlug}/${folder}`)
}

export async function uploadFile(userId, titleSlug, folder, file, metadata = {}, onProgress) {
  const headers = await authHeaders()
  const path = `/api/docs/users/${userId}/titles/${titleSlug}/${folder}/${file.name}`

  const metaHeaders = {}
  for (const [key, value] of Object.entries(metadata)) {
    metaHeaders[`X-Culmina-Meta-${key}`] = value
  }

  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', `${WORKER_URL}${path}`)
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      Object.entries(metaHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v))

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total)
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText))
        else reject(new Error(`Upload failed: ${xhr.status}`))
      }
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.send(file)
    })
  }

  const res = await fetch(`${WORKER_URL}${path}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': file.type || 'application/octet-stream', ...metaHeaders },
    body: file,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}

export async function downloadFile(userId, titleSlug, folder, filename) {
  const headers = await authHeaders()
  const path = `/api/docs/users/${userId}/titles/${titleSlug}/${folder}/${filename}`
  const res = await fetch(`${WORKER_URL}${path}`, { headers })
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return {
    blob: await res.blob(),
    contentType: res.headers.get('Content-Type') || 'application/octet-stream',
    filename,
  }
}

export async function deleteFile(userId, titleSlug, folder, filename) {
  return fetchJson(
    `/api/docs/users/${userId}/titles/${titleSlug}/${folder}/${filename}`,
    { method: 'DELETE' }
  )
}

// ── Distribution ──

export async function uploadDistContent(titleSlug, episodeSlug, file) {
  const headers = await authHeaders()
  const path = `/api/dist/${titleSlug}/${episodeSlug}/${file.name}`
  const res = await fetch(`${WORKER_URL}${path}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  if (!res.ok) throw new Error(`Dist upload failed: ${res.status}`)
  return res.json()
}

export async function getSignedUrl(key, expiresIn = 3600) {
  return fetchJson('/api/dist/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, expiresIn }),
  })
}
