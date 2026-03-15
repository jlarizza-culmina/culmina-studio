import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import * as r2 from '../lib/r2-client'
import ScoringRunner from '../components/ScoringRunner'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const GOLD    = '#C9924A'
const CHARCOAL= '#5C574E'
const CREAM   = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2= '#111009'
const BORDER  = 'rgba(201,146,74,0.12)'
const MUTED   = '#6A6560'
const GREEN   = '#4A9C7A'
const RED     = '#C84B31'
const BLUE    = '#7A9EC8'
const LOC_ACCENT = '#6ee7b7'

// ─── NVPair defaults ─────────────────────────────────────────────────────────
const DEFAULT_ROYALTY_TYPES = ['Royalty-Free', 'Free Proprietary', 'One-Time Payment', 'Residuals', 'Custom', 'Other']
const DEFAULT_AUTHOR_ROLES = ['Author', 'Co-Author', 'Editor', 'Ghostwriter', 'Translator', 'Estate']
const DEFAULT_FICTION_OPTS  = ['Fiction', 'Non-Fiction']
const DEFAULT_LANGUAGES    = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Russian']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
function getVerdict(score) {
  if (score >= 80) return { label: 'Greenlight', color: GREEN, bg: 'rgba(74,156,122,0.15)' }
  if (score >= 60) return { label: 'Develop',    color: GOLD,  bg: 'rgba(201,146,74,0.15)' }
  if (score >= 40) return { label: 'Conditional',color: BLUE,  bg: 'rgba(122,158,200,0.15)' }
  return                   { label: 'Reject',     color: RED,   bg: 'rgba(200,75,49,0.15)' }
}
function ScoreBadge({ score }) {
  const v = getVerdict(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${v.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', fontWeight: 700, color: v.color }}>{score}</div>
      <span style={{ background: v.bg, color: v.color, padding: '2px 8px', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2 }}>{v.label}</span>
    </div>
  )
}

const STATUS_CONFIG = {
  complete:   { color: GREEN, label: 'Scored' },
  processing: { color: GOLD,  label: 'Processing' },
  uploaded:   { color: BLUE,  label: 'Uploaded' },
  error:      { color: RED,   label: 'Error' },
  development:{ color: BLUE,  label: 'Development' },
  'In Production': { color: GOLD, label: 'In Production' },
}

const lbl = { display: 'block', fontSize: '0.62rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }
const inpStyle = (extra) => ({ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', borderRadius: 2, ...extra })

// ═══════════════════════════════════════════════════════════════════════════════
// TITLES DATA GRID
// ═══════════════════════════════════════════════════════════════════════════════
function TitlesDataGrid({ titles, loading, onNewManuscript, onOpenTitle, onImportDiscovery }) {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('title')
  const [sortDir, setSortDir] = useState('asc')

  const filtered = titles.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.genre || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.authors || '').toLowerCase().includes(search.toLowerCase())
  )
  const sorted = [...filtered].sort((a, b) => {
    let av, bv
    switch (sortCol) {
      case 'title':   av = a.title.toLowerCase(); bv = b.title.toLowerCase(); break
      case 'authors': av = (a.authors || '').toLowerCase(); bv = (b.authors || '').toLowerCase(); break
      case 'genre':   av = (a.genre || '').toLowerCase(); bv = (b.genre || '').toLowerCase(); break
      case 'status':  av = a.status; bv = b.status; break
      case 'score':   av = a.score ?? -1; bv = b.score ?? -1; break
      case 'created': av = a.created || ''; bv = b.created || ''; break
      default: av = ''; bv = ''
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const scoredCount = titles.filter(t => t.score != null).length
  const arrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  const thStyle = (col) => ({ padding: '10px 12px', textAlign: 'left', fontSize: '0.65rem', color: sortCol === col ? CREAM : MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap', fontWeight: 600, background: sortCol === col ? 'rgba(201,146,74,0.06)' : 'transparent' })

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: CREAM, fontWeight: 300, margin: 0, letterSpacing: 1 }}>Manuscripts</h1>
          <p style={{ color: MUTED, fontSize: '0.78rem', margin: '6px 0 0' }}>{titles.length} titles · {scoredCount} scored</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onImportDiscovery} style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '9px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', cursor: 'pointer', borderRadius: 2, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = LOC_ACCENT; e.currentTarget.style.color = LOC_ACCENT }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL }}>
            ↓ Import Discovery JSON
          </button>
          <button onClick={onNewManuscript} style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '9px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600, borderRadius: 2 }}>
            + New Manuscript
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search titles, genres, authors…"
          style={inpStyle({ width: 320 })} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>Loading titles…</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ color: MUTED, fontSize: '0.85rem', marginBottom: 16 }}>{search ? 'No matching titles' : 'No manuscripts yet'}</div>
          <button onClick={onNewManuscript} style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '10px 24px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', borderRadius: 2 }}>+ Import First Manuscript</button>
        </div>
      ) : (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
            <thead>
              <tr style={{ background: '#16140E' }}>
                <th style={thStyle('title')} onClick={() => handleSort('title')}>Title{arrow('title')}</th>
                <th style={thStyle('authors')} onClick={() => handleSort('authors')}>Author(s){arrow('authors')}</th>
                <th style={thStyle('genre')} onClick={() => handleSort('genre')}>Genre{arrow('genre')}</th>
                <th style={thStyle('status')} onClick={() => handleSort('status')}>Status{arrow('status')}</th>
                <th style={{ ...thStyle('score'), textAlign: 'center' }} onClick={() => handleSort('score')}>Score{arrow('score')}</th>
                <th style={thStyle('created')} onClick={() => handleSort('created')}>Created{arrow('created')}</th>
                <th style={{ ...thStyle(''), cursor: 'default' }}>R2</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, i) => {
                const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.uploaded
                return (
                  <tr key={t.id} onClick={() => onOpenTitle(t)}
                    style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,146,74,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}>
                    <td style={{ padding: '11px 12px', borderBottom: `1px solid ${BORDER}` }}>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', color: CREAM, fontWeight: 400 }}>{t.title}</div>
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: `1px solid ${BORDER}`, color: CHARCOAL, fontSize: '0.78rem' }}>{t.authors || '—'}</td>
                    <td style={{ padding: '11px 12px', borderBottom: `1px solid ${BORDER}`, color: CHARCOAL, fontSize: '0.78rem' }}>{t.genre || '—'}</td>
                    <td style={{ padding: '11px 12px', borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ background: `${sc.color}22`, border: `1px solid ${sc.color}44`, color: sc.color, padding: '2px 8px', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 2 }}>{sc.label}</span>
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'center' }}>
                      {t.score != null ? <ScoreBadge score={t.score} /> : <span style={{ color: MUTED, fontSize: '0.72rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: `1px solid ${BORDER}`, color: MUTED, fontSize: '0.72rem' }}>{t.created ? new Date(t.created).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '11px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'center' }}>{t.hasManuscript && <span style={{ color: BLUE, fontSize: '0.62rem' }}>📄</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVERY JSON IMPORT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function DiscoveryImportModal({ onClose, onImport }) {
  const [json, setJson] = useState(''); const [error, setError] = useState(''); const [preview, setPreview] = useState(null); const fileRef = useRef()
  function parse(raw) {
    try {
      const data = JSON.parse(raw); const mapped = {}
      if (data.title) mapped.name = data.title; if (data.royalty_type) mapped.royaltyType = data.royalty_type
      if (data.rights_type) mapped.royaltyType = data.rights_type; if (data.publisher) mapped.publisher = data.publisher
      if (data.publisher_city) mapped.publisherCity = data.publisher_city; if (data.copyright_year) mapped.copyrightYear = String(data.copyright_year || '')
      if (data.lccn_print) mapped.lccnPrint = data.lccn_print; if (data.lccn_ebook) mapped.lccnEbook = data.lccn_ebook
      if (data.bisac) mapped.bisac = data.bisac; if (data.genre) mapped.genre = data.genre
      if (data.summary) mapped.summary = data.summary; if (data.language) mapped.language = data.language
      if (data.fiction_nonfiction) mapped.fictionNonfiction = data.fiction_nonfiction
      if (data.authors) mapped.authors = Array.isArray(data.authors) ? data.authors : [{ name: data.authors, role: 'Author' }]
      if (data.author) mapped.authors = [{ name: data.author, role: 'Author' }]
      setPreview(mapped); setError('')
    } catch (e) { setError('Invalid JSON: ' + e.message); setPreview(null) }
  }
  function handleFile(e) { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = (ev) => { const raw = ev.target.result; setJson(raw); parse(raw) }; reader.readAsText(f) }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', borderRadius: 4 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: CREAM, fontWeight: 300, margin: 0 }}>Import from IP Discovery Tool</h3></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={() => fileRef.current?.click()} style={{ background: `${LOC_ACCENT}12`, border: `1px solid ${LOC_ACCENT}44`, color: LOC_ACCENT, padding: '8px 16px', fontSize: '0.72rem', cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif', alignSelf: 'flex-start' }}>Upload .json File</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
          <textarea value={json} onChange={e => { setJson(e.target.value); if (e.target.value.trim()) parse(e.target.value) }} placeholder='Paste JSON here…' rows={6}
            style={{ background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: 12, fontFamily: 'monospace', fontSize: '0.75rem', outline: 'none', resize: 'vertical', borderRadius: 2 }} />
          {error && <div style={{ color: RED, fontSize: '0.72rem' }}>⚠ {error}</div>}
          {preview && (
            <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: 14 }}>
              <div style={{ fontSize: '0.62rem', color: LOC_ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Preview</div>
              {Object.entries(preview).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 10, padding: '4px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ width: 110, color: MUTED, fontSize: '0.7rem', flexShrink: 0 }}>{k}</span>
                  <span style={{ color: CREAM, fontSize: '0.75rem', wordBreak: 'break-all' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { if (preview) { onImport(preview); onClose() } }} disabled={!preview}
            style={{ background: preview ? GOLD : 'rgba(201,146,74,0.3)', border: 'none', color: preview ? '#1A1810' : MUTED, padding: '11px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: preview ? 'pointer' : 'not-allowed', borderRadius: 2 }}>
            Apply to New Manuscript →
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED EDITABLE FORM — used by both Detail View and Import Wizard
// ═══════════════════════════════════════════════════════════════════════════════
function ManuscriptForm({ form, setForm, nvData, mode, userId, titleSlug, onFileUploaded }) {
  const royaltyTypes = nvData?.royalty_type || DEFAULT_ROYALTY_TYPES
  const authorRoles  = nvData?.author_role  || DEFAULT_AUTHOR_ROLES
  const fictionOpts  = nvData?.fiction_nonfiction || DEFAULT_FICTION_OPTS
  const languages    = nvData?.language || DEFAULT_LANGUAGES
  const [lccnStatus, setLccnStatus] = useState(null)
  const [showLoc, setShowLoc] = useState(!!(form.lccnPrint))
  const [r2Files, setR2Files] = useState([])
  const [r2Loading, setR2Loading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [extracting, setExtracting] = useState(false)

  // Load R2 files on mount (only in edit mode with a slug)
  useEffect(() => {
    if (mode === 'edit' && userId && titleSlug) loadR2Files()
  }, [userId, titleSlug, mode])

  async function loadR2Files() {
    setR2Loading(true)
    try {
      const result = await r2.listFiles(userId, titleSlug, 'manuscripts')
      setR2Files(result.objects || [])
    } catch { setR2Files([]) }
    setR2Loading(false)
  }

  async function handleFileUpload(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer?.files[0] || e.target.files[0]
    if (!f || !userId || !titleSlug) return
    setUploading(true); setUploadProgress(0)
    try {
      await r2.uploadFile(userId, titleSlug, 'manuscripts', f, {
        version: form.version || '1', language: form.language || 'English',
      }, p => setUploadProgress(p))
      await loadR2Files()
      if (onFileUploaded) onFileUploaded()
    } catch (err) { console.error('Upload failed:', err) }
    setUploading(false)
  }

  async function handleExtractText(filename) {
    if (!userId || !titleSlug) return
    setExtracting(true)
    try {
      const { blob, contentType } = await r2.downloadFile(userId, titleSlug, 'manuscripts', filename)
      if (contentType?.includes('text') || filename.endsWith('.txt')) {
        const text = await blob.text()
        // Auto-populate excerpt with first ~3000 words if empty
        if (!form.excerpt) {
          const words = text.split(/\s+/)
          const excerptText = words.slice(0, 3000).join(' ')
          setForm(f => ({ ...f, excerpt: excerptText, _fullText: text }))
        } else {
          setForm(f => ({ ...f, _fullText: text }))
        }
      } else {
        // For PDF/DOCX — can't extract in browser, prompt user
        setForm(f => ({ ...f, _fullText: null }))
        alert('Text extraction from PDF/DOCX files requires manual paste. Download the file and copy the relevant text into the Excerpt or Summary fields.')
      }
    } catch (err) { console.error('Extract failed:', err) }
    setExtracting(false)
  }

  async function handleDownload(filename) {
    if (!userId || !titleSlug) return
    try {
      const { blob, contentType } = await r2.downloadFile(userId, titleSlug, 'manuscripts', filename)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { console.error('Download failed:', err) }
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function addAuthor() { setForm(f => ({ ...f, authors: [...f.authors, { name: '', role: 'Author' }] })) }
  function removeAuthor(idx) { setForm(f => ({ ...f, authors: f.authors.filter((_, i) => i !== idx) })) }
  function updateAuthor(idx, key, val) { setForm(f => ({ ...f, authors: f.authors.map((a, i) => i === idx ? { ...a, [key]: val } : a) })) }

  async function lookupLCCN() {
    if (!form.lccnPrint?.trim()) return
    setLccnStatus('loading')
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=lccn:${form.lccnPrint.trim()}&limit=1`)
      const data = await res.json()
      if (data.docs?.length > 0) {
        const doc = data.docs[0]
        setForm(f => ({
          ...f,
          name: f.name || doc.title || f.name,
          authors: doc.author_name?.length > 0 ? doc.author_name.map(n => ({ name: n, role: 'Author' })) : f.authors,
          publisher: doc.publisher?.[0] || f.publisher,
          publisherCity: doc.publish_place?.[0] || f.publisherCity,
          copyrightYear: doc.first_publish_year ? String(doc.first_publish_year) : f.copyrightYear,
          genre: doc.subject?.[0] || f.genre,
          language: doc.language?.[0] === 'eng' ? 'English' : doc.language?.[0] || f.language,
        }))
        setLccnStatus('ok')
      } else setLccnStatus('fail')
    } catch { setLccnStatus('fail') }
  }

  const hasTitle = form.name?.trim().length > 0
  const hasAuthor = form.authors?.some(a => a.name.trim().length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Manuscript File (R2) ── */}
      <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '16px 18px' }}>
        <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Manuscript File</div>

        {/* R2 files list */}
        {r2Files.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {r2Files.map((f, i) => {
              const name = f.key?.split('/').pop() || `File ${i + 1}`
              return (
                <div key={f.key || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 3, marginBottom: 6 }}>
                  <span style={{ color: BLUE, fontSize: '0.85rem' }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: CREAM, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    {f.size && <div style={{ color: MUTED, fontSize: '0.62rem', marginTop: 1 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</div>}
                  </div>
                  <button onClick={() => handleExtractText(name)} disabled={extracting}
                    style={{ background: `${LOC_ACCENT}12`, border: `1px solid ${LOC_ACCENT}44`, color: LOC_ACCENT, padding: '4px 10px', fontSize: '0.62rem', cursor: extracting ? 'wait' : 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                    {extracting ? 'Extracting…' : 'Extract Text'}
                  </button>
                  <button onClick={() => handleDownload(name)}
                    style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '4px 10px', fontSize: '0.62rem', cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif' }}>
                    Download
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Upload zone */}
        {(userId && titleSlug) ? (
          <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleFileUpload}
            style={{ border: `1px dashed ${dragOver ? GOLD : BORDER}`, borderRadius: 4, padding: '18px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(201,146,74,0.05)' : 'transparent', transition: 'all 0.2s' }}
            onClick={() => document.getElementById('ms-detail-file').click()}>
            <input id="ms-detail-file" type="file" accept=".pdf,.doc,.docx,.txt,.epub" style={{ display: 'none' }} onChange={handleFileUpload} />
            {uploading ? (
              <div>
                <div style={{ color: GOLD, fontSize: '0.82rem', marginBottom: 6 }}>Uploading… {Math.round(uploadProgress * 100)}%</div>
                <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}><div style={{ width: `${uploadProgress * 100}%`, height: '100%', background: GOLD, borderRadius: 2, transition: 'width 0.3s' }} /></div>
              </div>
            ) : (
              <div>
                <div style={{ color: CHARCOAL, fontSize: '1.2rem', marginBottom: 4 }}>↑</div>
                <div style={{ color: CREAM, fontSize: '0.78rem', marginBottom: 3 }}>{r2Files.length > 0 ? 'Upload new version' : 'Drop manuscript file or click to browse'}</div>
                <div style={{ color: MUTED, fontSize: '0.65rem' }}>PDF · DOCX · TXT · EPUB</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: MUTED, fontSize: '0.72rem', padding: '12px', textAlign: 'center', border: `1px dashed ${BORDER}`, borderRadius: 4 }}>
            {mode === 'new' ? 'File upload available after saving' : 'Save the title first to enable file upload'}
          </div>
        )}

        {r2Loading && <div style={{ color: MUTED, fontSize: '0.72rem', marginTop: 8 }}>Loading files…</div>}
      </div>

      {/* ── Title ── */}
      <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '16px 18px' }}>
        <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Required Fields</div>
        <div>
          <div style={lbl}>Title *</div>
          <input style={inpStyle({ borderColor: !hasTitle ? `${RED}44` : BORDER })} value={form.name || ''} placeholder="Title of the work"
            onChange={e => set('name', e.target.value)} />
        </div>
      </div>

      {/* ── Authors ── */}
      <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Authors *</div>
          <button onClick={addAuthor} style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}44`, color: GOLD, padding: '4px 12px', fontSize: '0.65rem', cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif' }}>+ Add</button>
        </div>
        {(form.authors || []).map((author, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              {idx === 0 && <div style={lbl}>Name</div>}
              <input style={inpStyle({ borderColor: idx === 0 && !hasAuthor ? `${RED}44` : BORDER })} value={author.name} placeholder="Author name"
                onChange={e => updateAuthor(idx, 'name', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              {idx === 0 && <div style={lbl}>Role</div>}
              <select style={inpStyle({ cursor: 'pointer' })} value={author.role} onChange={e => updateAuthor(idx, 'role', e.target.value)}>
                {authorRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {(form.authors || []).length > 1 && (
              <button onClick={() => removeAuthor(idx)} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: '1rem', padding: '8px 4px', flexShrink: 0 }}>✕</button>
            )}
          </div>
        ))}
      </div>

      {/* ── Publication ── */}
      <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '16px 18px' }}>
        <div style={{ fontSize: '0.62rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Publication</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 2 }}><div style={lbl}>Publisher</div><input style={inpStyle()} value={form.publisher || ''} placeholder="Publisher name" onChange={e => set('publisher', e.target.value)} /></div>
          <div style={{ flex: 1 }}><div style={lbl}>Publisher City</div><input style={inpStyle()} value={form.publisherCity || ''} placeholder="City" onChange={e => set('publisherCity', e.target.value)} /></div>
          <div style={{ flex: 1 }}><div style={lbl}>Copyright Year</div><input style={inpStyle()} value={form.copyrightYear || ''} placeholder="YYYY" maxLength={4} onChange={e => set('copyrightYear', e.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={lbl}>Fiction / Non-Fiction</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {fictionOpts.map(o => (
                <button key={o} onClick={() => set('fictionNonfiction', o)}
                  style={{ flex: 1, background: form.fictionNonfiction === o ? `${GOLD}22` : SURFACE2, border: `1px solid ${form.fictionNonfiction === o ? GOLD : BORDER}`, color: form.fictionNonfiction === o ? GOLD : MUTED, padding: '8px', fontSize: '0.72rem', cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif' }}>{o}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}><div style={lbl}>Genre</div><input style={inpStyle()} value={form.genre || ''} placeholder="e.g. Romance — Historical" onChange={e => set('genre', e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><div style={lbl}>Language</div><select style={inpStyle({ cursor: 'pointer' })} value={form.language || 'English'} onChange={e => set('language', e.target.value)}>{languages.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
          <div style={{ flex: 1 }}><div style={lbl}>Version</div><input style={inpStyle()} value={form.version || '1'} type="number" min="1" onChange={e => set('version', e.target.value)} /></div>
        </div>
      </div>

      {/* ── Content: Summary, Excerpt, Extract ── */}
      <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '16px 18px' }}>
        <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Content (for scoring)</div>
        <div style={{ marginBottom: 12 }}>
          <div style={lbl}>Summary</div>
          <textarea style={{ ...inpStyle(), resize: 'vertical', minHeight: 60 }} value={form.summary || ''} placeholder="Paste or type a summary of the work…" rows={3}
            onChange={e => set('summary', e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={lbl}>Excerpt</div>
          <textarea style={{ ...inpStyle(), resize: 'vertical', minHeight: 80 }} value={form.excerpt || ''} placeholder="Paste an excerpt (opening chapters, key scenes)…" rows={4}
            onChange={e => set('excerpt', e.target.value)} />
          {form.excerpt && <div style={{ fontSize: '0.62rem', color: MUTED, marginTop: 4 }}>{form.excerpt.split(/\s+/).length.toLocaleString()} words</div>}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={lbl}>Generated Extract</div>
            {form.excerpt && !form.generatedExtract && (
              <span style={{ fontSize: '0.6rem', color: MUTED }}>Will be auto-generated during scoring if empty</span>
            )}
          </div>
          <textarea style={{ ...inpStyle(), resize: 'vertical', minHeight: 60, opacity: form.generatedExtract ? 1 : 0.5 }} value={form.generatedExtract || ''} placeholder="Auto-generated from manuscript during scoring…" rows={3}
            onChange={e => set('generatedExtract', e.target.value)} readOnly={!form.generatedExtract && mode === 'view'} />
        </div>
      </div>

      {/* ── Source URL ── */}
      <div>
        <div style={lbl}>Source URL (optional)</div>
        <input style={inpStyle()} value={form.sourceUrl || ''} placeholder="e.g. https://gutenberg.org/files/1342/1342-0.txt"
          onChange={e => set('sourceUrl', e.target.value)} />
      </div>

      {/* ── LOC (collapsible) ── */}
      <div style={{ background: '#16140E', border: `1px solid ${showLoc ? LOC_ACCENT + '44' : BORDER}`, borderRadius: 4, overflow: 'hidden', transition: 'border-color 0.2s' }}>
        <button onClick={() => setShowLoc(s => !s)}
          style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.62rem', color: LOC_ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>Library of Congress — LCCN Lookup</span>
          <span style={{ color: LOC_ACCENT, fontSize: '0.8rem', transition: 'transform 0.2s', transform: showLoc ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
        </button>
        {showLoc && (
          <div style={{ padding: '0 18px 16px' }}>
            <div style={{ background: SURFACE2, borderRadius: 4, padding: '12px 14px', marginBottom: 14, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '0.65rem', color: CHARCOAL, marginBottom: 8, lineHeight: 1.5 }}>Enter a print LCCN to auto-populate fields. Example: <span style={{ color: CREAM, fontFamily: 'monospace' }}>2018046290</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={form.lccnPrint || ''} onChange={e => { set('lccnPrint', e.target.value); setLccnStatus(null) }} placeholder="e.g. 2018046290" style={inpStyle({ flex: 1 })} />
                <button onClick={lookupLCCN} disabled={!form.lccnPrint?.trim() || lccnStatus === 'loading'}
                  style={{ background: form.lccnPrint?.trim() ? `${LOC_ACCENT}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${form.lccnPrint?.trim() ? LOC_ACCENT + '55' : BORDER}`, color: form.lccnPrint?.trim() ? LOC_ACCENT : MUTED, borderRadius: 2, padding: '8px 16px', cursor: form.lccnPrint?.trim() ? 'pointer' : 'not-allowed', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}>
                  {lccnStatus === 'loading' ? 'Looking up…' : 'Lookup LOC'}
                </button>
                {form.lccnPrint && <a href={`https://lccn.loc.gov/${form.lccnPrint}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.62rem', color: CHARCOAL, textDecoration: 'none', whiteSpace: 'nowrap' }}>↗ LOC</a>}
              </div>
              {lccnStatus === 'ok' && <div style={{ fontSize: '0.68rem', color: GREEN, marginTop: 8 }}>✓ Fields populated from Open Library</div>}
              {lccnStatus === 'fail' && <div style={{ fontSize: '0.68rem', color: GOLD, marginTop: 8 }}>Record not found — enter fields manually</div>}
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1 }}><div style={lbl}>LCCN (Print)</div><input style={inpStyle()} value={form.lccnPrint || ''} placeholder="e.g. 2018046290" onChange={e => set('lccnPrint', e.target.value)} /></div>
              <div style={{ flex: 1 }}><div style={lbl}>LCCN (eBook)</div><input style={inpStyle()} value={form.lccnEbook || ''} placeholder="e.g. 2018046291" onChange={e => set('lccnEbook', e.target.value)} /></div>
            </div>
            <div><div style={lbl}>BISAC Code</div><input style={inpStyle()} value={form.bisac || ''} placeholder="e.g. FIC027110" onChange={e => set('bisac', e.target.value)} /></div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TITLE DETAIL VIEW — inline, replaces grid. Editable Manuscript & Rights tabs.
// ═══════════════════════════════════════════════════════════════════════════════
const DETAIL_STEPS = [
  { key: 'overview',   label: 'Overview',      icon: '◉' },
  { key: 'manuscript', label: 'Manuscript',     icon: '📄' },
  { key: 'rights',     label: 'Rights',         icon: '⚖' },
  { key: 'scoring',    label: 'Score Report',   icon: '◈' },
]

function TitleDetailView({ title, onBack, onDelete, onRefresh, userId, nvData }) {
  const { endUser } = useAuth()
  const [activeStep, setActiveStep] = useState('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // Editable form state — initialized from title
  const [form, setForm] = useState({
    name: title.title, version: String(title.version || 1), language: title.language || 'English',
    sourceUrl: title.source_url || '', royaltyType: title.royalty_type || '',
    authors: title._authors?.length > 0 ? title._authors : [{ name: '', role: 'Author' }],
    publisher: title.publisher || '', publisherCity: title.publisher_city || '',
    copyrightYear: title.copyright_year || '', genre: title.genre || '',
    fictionNonfiction: title.fiction_nonfiction || '', bisac: title.bisac || '',
    lccnPrint: title.lccn_print || '', lccnEbook: title.lccn_ebook || '',
    summary: title.summary || '', excerpt: title.excerpt || '',
    generatedExtract: title.generated_extract || '',
    // Rights
    fee: '', royaltyRate: '', signDate: '', publicDomain: title.royalty_type === 'Royalty-Free',
  })

  const hasScore = title.score != null
  const isComplete = title.status === 'complete' && hasScore
  const sc = STATUS_CONFIG[title.status] || STATUS_CONFIG.uploaded
  const royaltyTypes = nvData?.royalty_type || DEFAULT_ROYALTY_TYPES

  function stepStatus(key) {
    switch (key) {
      case 'overview': return 'complete'
      case 'manuscript': return 'complete'
      case 'rights': return 'complete'
      case 'scoring': return hasScore ? 'complete' : 'available'
      default: return 'pending'
    }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleSave() {
    if (!form.name?.trim()) { showToast('Title is required'); return }
    setSaving(true)
    try {
      // Update productions record
      await supabase.from('productions').update({
        productiontitle: form.name, language: form.language,
        publisher: form.publisher || null, publisher_city: form.publisherCity || null,
        copyright_year: form.copyrightYear || null, genre: form.genre || null,
        fiction_nonfiction: form.fictionNonfiction || null, bisac: form.bisac || null,
        lccn_print: form.lccnPrint || null, lccn_ebook: form.lccnEbook || null,
        royalty_type: form.royaltyType || null, source_url: form.sourceUrl || null,
        excerpt: form.excerpt || null, summary: form.summary || null,
        generated_extract: form.generatedExtract || null,
        updatedate: new Date().toISOString(),
      }).eq('productionid', title.id)

      // Upsert authors — delete existing, insert new
      await supabase.from('manuscript_authors').delete().eq('productionid', title.id)
      const validAuthors = (form.authors || []).filter(a => a.name.trim())
      if (validAuthors.length > 0) {
        await supabase.from('manuscript_authors').insert(
          validAuthors.map((a, i) => ({
            productionid: title.id, author_name: a.name, author_role: a.role || 'Author', sortorder: i + 1,
          }))
        )
      }

      showToast('Saved ✓')
      if (onRefresh) onRefresh()
    } catch (e) { showToast('Error: ' + e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await supabase.from('manuscript_user_scores').delete().match({ productionid: title.id })
      await supabase.from('manuscript_scores').delete().eq('productionid', title.id)
      await supabase.from('manuscript_authors').delete().eq('productionid', title.id)
      await supabase.from('productions').delete().eq('productionid', title.id)
      if (userId && title.slug) { try { await r2.deleteFolder(userId, title.slug) } catch {} }
      onDelete()
    } catch (e) { console.error('Delete failed:', e); setDeleting(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: SURFACE2, fontFamily: 'DM Sans, sans-serif', color: CREAM, display: 'flex' }}>

      {/* ── Toast ── */}
      {toast && <div style={{ position: 'fixed', top: 16, right: 24, zIndex: 999, background: toast.includes('Error') ? 'rgba(200,75,49,0.9)' : 'rgba(74,156,122,0.9)', color: '#fff', padding: '10px 20px', fontSize: '0.8rem', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>{toast}</div>}

      {/* ── Left Nav ── */}
      <div style={{ width: 220, flexShrink: 0, background: SURFACE, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', margin: '0 12px 20px', background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = CREAM }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL }}>
          ← Back to List
        </button>

        <div style={{ padding: '0 20px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: CREAM, fontWeight: 400, lineHeight: 1.3, marginBottom: 6 }}>{form.name || title.title}</div>
          <span style={{ background: `${sc.color}22`, border: `1px solid ${sc.color}44`, color: sc.color, padding: '2px 8px', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 2 }}>{sc.label}</span>
          {hasScore && <div style={{ marginTop: 10 }}><ScoreBadge score={title.score} /></div>}
        </div>

        <div style={{ padding: '16px 0', flex: 1 }}>
          {DETAIL_STEPS.map(step => {
            const status = stepStatus(step.key)
            const isActive = activeStep === step.key
            return (
              <button key={step.key} onClick={() => setActiveStep(step.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 20px', background: isActive ? 'rgba(201,146,74,0.08)' : 'transparent', border: 'none', borderLeft: `3px solid ${isActive ? GOLD : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{step.icon}</span>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.04em', color: isActive ? CREAM : CHARCOAL, fontWeight: isActive ? 600 : 400 }}>{step.label}</span>
                {status === 'complete' && !isActive && <span style={{ marginLeft: 'auto', color: GREEN, fontSize: '0.65rem' }}>✓</span>}
              </button>
            )
          })}
        </div>

        {/* Save button */}
        {(activeStep === 'manuscript' || activeStep === 'rights') && (
          <div style={{ padding: '12px 12px 0', borderTop: `1px solid ${BORDER}` }}>
            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', padding: '9px', background: GOLD, border: 'none', color: '#1A1810', cursor: saving ? 'wait' : 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Delete */}
        {!isComplete && (
          <div style={{ padding: '12px 12px', borderTop: `1px solid ${BORDER}`, marginTop: activeStep === 'manuscript' || activeStep === 'rights' ? 0 : 'auto' }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '9px', background: 'none', border: `1px solid ${RED}44`, color: RED, cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif', fontSize: '0.68rem', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${RED}12`}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>Delete Title</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: '0.65rem', color: RED, textAlign: 'center', lineHeight: 1.4 }}>Delete this title and all data?</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '7px', background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem' }}>Cancel</button>
                  <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '7px', background: RED, border: 'none', color: CREAM, cursor: deleting ? 'wait' : 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', fontWeight: 600 }}>{deleting ? 'Deleting…' : 'Confirm'}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '100vh' }}>

        {/* Overview */}
        {activeStep === 'overview' && (
          <div style={{ padding: '32px 40px', maxWidth: 800 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: CREAM, fontWeight: 300, margin: '0 0 6px' }}>{form.name || title.title}</h2>
            <p style={{ color: MUTED, fontSize: '0.78rem', margin: '0 0 24px' }}>
              {form.authors?.filter(a => a.name).map(a => a.name).join(', ') || 'Unknown author'} · {form.genre || 'Unclassified'} · v{form.version || 1}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Status', value: sc.label, color: sc.color },
                { label: 'Score', value: hasScore ? `${title.score}/100` : '—', color: hasScore ? getVerdict(title.score).color : MUTED },
                { label: 'Platform', value: title.platform || '—', color: CHARCOAL },
                { label: 'Episodes', value: title.episodes || '—', color: CHARCOAL },
                { label: 'R2 Storage', value: title.hasManuscript ? 'Uploaded' : 'None', color: title.hasManuscript ? GREEN : MUTED },
                { label: 'Created', value: title.created ? new Date(title.created).toLocaleDateString() : '—', color: CHARCOAL },
              ].map(item => (
                <div key={item.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: item.color, fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manuscript — editable form */}
        {activeStep === 'manuscript' && (
          <div style={{ padding: '32px 40px', maxWidth: 800 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: CREAM, fontWeight: 300, margin: '0 0 20px' }}>Manuscript Details</h2>
            <ManuscriptForm form={form} setForm={setForm} nvData={nvData} mode="edit" userId={userId} titleSlug={title.slug} onFileUploaded={() => {}} />
          </div>
        )}

        {/* Rights — editable, royalty type moved here */}
        {activeStep === 'rights' && (
          <div style={{ padding: '32px 40px', maxWidth: 800 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: CREAM, fontWeight: 300, margin: '0 0 20px' }}>Rights & Licensing</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Royalty Type */}
              <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '16px 18px' }}>
                <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Royalty Type</div>
                <select style={inpStyle({ cursor: 'pointer' })} value={form.royaltyType || ''}
                  onChange={e => setForm(f => ({ ...f, royaltyType: e.target.value }))}>
                  <option value="">Select…</option>
                  {royaltyTypes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Public domain toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 14px', border: `1px solid ${form.publicDomain ? GREEN : BORDER}`, borderRadius: 4, background: form.publicDomain ? 'rgba(74,156,122,0.08)' : 'transparent' }}>
                <input type="checkbox" checked={form.publicDomain} onChange={e => setForm(f => ({ ...f, publicDomain: e.target.checked }))} style={{ accentColor: GREEN }} />
                <div>
                  <div style={{ color: CREAM, fontSize: '0.83rem' }}>Public domain / royalty-free</div>
                  <div style={{ color: MUTED, fontSize: '0.7rem', marginTop: 2 }}>Skip rights fields — auto-scores IP Clarity: max</div>
                </div>
              </label>

              {!form.publicDomain && (
                <>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ flex: 1 }}><div style={lbl}>One-time Licensing Fee ($)</div><input style={inpStyle()} value={form.fee} type="number" placeholder="0.00" onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
                    <div style={{ flex: 1 }}><div style={lbl}>Royalty Rate (%)</div><input style={inpStyle()} value={form.royaltyRate} type="number" placeholder="0–100" onChange={e => setForm(f => ({ ...f, royaltyRate: e.target.value }))} /></div>
                  </div>
                  <div><div style={lbl}>Agreement Sign Date</div><input style={inpStyle()} value={form.signDate} type="date" onChange={e => setForm(f => ({ ...f, signDate: e.target.value }))} /></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Score Report — ScoringRunner */}
        {activeStep === 'scoring' && (
          <ScoringRunner title={{ ...title, excerpt: form.excerpt, summary: form.summary, generated_extract: form.generatedExtract, _fullText: form._fullText }} onScored={() => { if (onRefresh) onRefresh() }} />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT WIZARD — for new manuscripts. Uses shared ManuscriptForm.
// ═══════════════════════════════════════════════════════════════════════════════
const WIZARD_STEPS = ['Manuscript', 'Rights', 'Confirm & Save']

function ImportWizard({ onClose, onComplete, userId, nvData, prefill }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: prefill?.name || '', version: '1', language: prefill?.language || 'English',
    sourceUrl: '', royaltyType: prefill?.royaltyType || '',
    authors: prefill?.authors || [{ name: '', role: 'Author' }],
    publisher: prefill?.publisher || '', publisherCity: prefill?.publisherCity || '',
    copyrightYear: prefill?.copyrightYear || '', genre: prefill?.genre || '',
    fictionNonfiction: prefill?.fictionNonfiction || '', bisac: prefill?.bisac || '',
    lccnPrint: prefill?.lccnPrint || '', lccnEbook: prefill?.lccnEbook || '',
    summary: prefill?.summary || '', excerpt: '', generatedExtract: '',
    fee: '', royaltyRate: '', signDate: '', publicDomain: false,
  })
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const royaltyTypes = nvData?.royalty_type || DEFAULT_ROYALTY_TYPES
  const hasTitle = form.name?.trim().length > 0
  const hasAuthor = (form.authors || []).some(a => a.name.trim().length > 0)
  const canProceed = hasTitle && hasAuthor

  function handleFileDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer?.files[0] || e.target.files[0]
    if (f) { setFile(f); if (!form.name) setForm(fm => ({ ...fm, name: f.name.replace(/\.[^.]+$/, '') })) }
  }

  async function handleSaveAndCreate() {
    setSaving(true); setError('')
    const titleSlug = slugify(form.name)
    try {
      // Upload file to R2
      if (file && userId) {
        await r2.uploadFile(userId, titleSlug, 'manuscripts', file, {
          version: form.version, language: form.language, source: form.sourceUrl || '',
        })
      }

      // Create production record with all metadata
      const { data: production, error: prodErr } = await supabase.from('productions').insert({
        productiontitle: form.name, productionstatus: 'uploaded', productiongroup: 'TITLE', activestatus: 'A',
        language: form.language, publisher: form.publisher || null, publisher_city: form.publisherCity || null,
        copyright_year: form.copyrightYear || null, genre: form.genre || null,
        fiction_nonfiction: form.fictionNonfiction || null, bisac: form.bisac || null,
        lccn_print: form.lccnPrint || null, lccn_ebook: form.lccnEbook || null,
        royalty_type: form.royaltyType || null, source_url: form.sourceUrl || null,
        excerpt: form.excerpt || null, summary: form.summary || null,
        generated_extract: form.generatedExtract || null,
        createdate: new Date().toISOString(), updatedate: new Date().toISOString(),
      }).select().single()
      if (prodErr) throw prodErr

      // Save authors
      const validAuthors = (form.authors || []).filter(a => a.name.trim())
      if (validAuthors.length > 0) {
        await supabase.from('manuscript_authors').insert(
          validAuthors.map((a, i) => ({
            productionid: production.productionid, author_name: a.name, author_role: a.role || 'Author', sortorder: i + 1,
          }))
        )
      }

      onComplete()
    } catch (e) { setError(e.message); setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, width: 720, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', borderRadius: 4 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.55rem', color: CREAM, fontWeight: 300, margin: 0 }}>Import Manuscript</h2>
            <p style={{ color: MUTED, fontSize: '0.7rem', margin: '4px 0 0' }}>Add a new title to your library</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '1.2rem', padding: 4 }}>✕</button>
        </div>

        {/* Step Indicators */}
        <div style={{ padding: '14px 28px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center' }}>
          {WIZARD_STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < WIZARD_STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: i < step ? GREEN : i === step ? GOLD : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: i <= step ? '#1A1810' : CHARCOAL, fontWeight: 700 }}>{i < step ? '✓' : i + 1}</div>
                <span style={{ fontSize: '0.72rem', color: i === step ? CREAM : MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < WIZARD_STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? GREEN : BORDER, margin: '0 12px' }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: '24px 28px' }}>

          {/* Step 1 — Manuscript details */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* File Upload */}
              <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop}
                style={{ border: `1px dashed ${dragOver ? GOLD : BORDER}`, borderRadius: 4, padding: '20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(201,146,74,0.05)' : 'transparent' }}
                onClick={() => document.getElementById('ms-file-input').click()}>
                <input id="ms-file-input" type="file" accept=".pdf,.doc,.docx,.txt,.epub" style={{ display: 'none' }} onChange={handleFileDrop} />
                {file ? (
                  <div><div style={{ color: GREEN, fontSize: '1.1rem', marginBottom: 4 }}>✓</div><div style={{ color: CREAM, fontSize: '0.82rem' }}>{file.name}</div><div style={{ color: MUTED, fontSize: '0.68rem', marginTop: 2 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div></div>
                ) : (
                  <div><div style={{ color: CHARCOAL, fontSize: '1.5rem', marginBottom: 6 }}>↑</div><div style={{ color: CREAM, fontSize: '0.82rem', marginBottom: 3 }}>Drop manuscript file or click to browse</div><div style={{ color: MUTED, fontSize: '0.68rem' }}>PDF · DOCX · TXT · EPUB</div></div>
                )}
              </div>

              <ManuscriptForm form={form} setForm={setForm} nvData={nvData} mode="new" />

              {!canProceed && <div style={{ fontSize: '0.68rem', color: RED }}>{!hasTitle ? 'Title is required' : 'At least one author is required'}</div>}
              <button onClick={() => setStep(1)} disabled={!canProceed}
                style={{ background: canProceed ? GOLD : 'rgba(201,146,74,0.3)', border: 'none', color: canProceed ? '#1A1810' : MUTED, padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: canProceed ? 'pointer' : 'not-allowed', borderRadius: 2 }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Rights */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '16px 18px' }}>
                <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Royalty Type</div>
                <select style={inpStyle({ cursor: 'pointer' })} value={form.royaltyType || ''}
                  onChange={e => setForm(f => ({ ...f, royaltyType: e.target.value }))}>
                  <option value="">Select…</option>
                  {(nvData?.royalty_type || DEFAULT_ROYALTY_TYPES).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 14px', border: `1px solid ${form.publicDomain ? GREEN : BORDER}`, borderRadius: 4, background: form.publicDomain ? 'rgba(74,156,122,0.08)' : 'transparent' }}>
                <input type="checkbox" checked={form.publicDomain} onChange={e => setForm(f => ({ ...f, publicDomain: e.target.checked }))} style={{ accentColor: GREEN }} />
                <div><div style={{ color: CREAM, fontSize: '0.83rem' }}>Public domain / royalty-free</div></div>
              </label>
              {!form.publicDomain && (
                <>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ flex: 1 }}><div style={lbl}>Licensing Fee ($)</div><input style={inpStyle()} value={form.fee} type="number" placeholder="0.00" onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
                    <div style={{ flex: 1 }}><div style={lbl}>Royalty Rate (%)</div><input style={inpStyle()} value={form.royaltyRate} type="number" placeholder="0–100" onChange={e => setForm(f => ({ ...f, royaltyRate: e.target.value }))} /></div>
                  </div>
                  <div><div style={lbl}>Agreement Sign Date</div><input style={inpStyle()} value={form.signDate} type="date" onChange={e => setForm(f => ({ ...f, signDate: e.target.value }))} /></div>
                </>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '11px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', cursor: 'pointer', borderRadius: 2 }}>← Back</button>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: GOLD, border: 'none', color: '#1A1810', padding: '11px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', borderRadius: 2 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Confirm & Save */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ background: '#1A1810', border: `1px solid ${BORDER}`, borderRadius: 4, padding: 16 }}>
                <div style={{ fontSize: '0.65rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Confirm Details</div>
                {[
                  ['Title', form.name],
                  ['Author(s)', (form.authors || []).filter(a => a.name.trim()).map(a => `${a.name} (${a.role})`).join(', ') || '—'],
                  ['Royalty Type', form.royaltyType || '—'],
                  ['Genre', `${form.fictionNonfiction ? form.fictionNonfiction + ' · ' : ''}${form.genre || '—'}`],
                  ['Publisher', form.publisher ? `${form.publisher}${form.publisherCity ? ', ' + form.publisherCity : ''}` : '—'],
                  ['Copyright', form.copyrightYear || '—'],
                  ['Language', form.language],
                  ['File', file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : 'No file'],
                  ['Excerpt', form.excerpt ? `${form.excerpt.split(/\s+/).length} words` : '—'],
                  ['Summary', form.summary ? `${form.summary.split(/\s+/).length} words` : '—'],
                  ['Rights', form.publicDomain ? 'Public Domain' : form.signDate ? `Agreement ${form.signDate}` : 'Pending'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ width: 100, color: MUTED, fontSize: '0.72rem', flexShrink: 0 }}>{k}</span>
                    <span style={{ color: CREAM, fontSize: '0.78rem', wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
              {error && <div style={{ padding: '10px 14px', background: 'rgba(200,75,49,0.1)', border: '1px solid rgba(200,75,49,0.2)', color: RED, fontSize: '0.78rem', borderRadius: 4 }}>⚠ {error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '11px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', cursor: 'pointer', borderRadius: 2 }}>← Back</button>
                <button onClick={handleSaveAndCreate} disabled={saving}
                  style={{ flex: 1, background: saving ? 'rgba(201,146,74,0.5)' : GOLD, border: 'none', color: '#1A1810', padding: '11px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', borderRadius: 2 }}>
                  {saving ? 'Creating…' : 'Create Manuscript'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Manuscript() {
  const { user } = useAuth()
  const userId = user?.id

  const [view, setView] = useState('list')
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [nvData, setNvData] = useState(null)
  const [prefill, setPrefill] = useState(null)

  useEffect(() => {
    async function fetchNV() {
      try {
        const { data, error } = await supabase.from('nvpairs').select('category, label, value, sort_order').in('category', ['royalty_type', 'author_role', 'fiction_nonfiction', 'language']).order('sort_order')
        if (error) throw error
        const grouped = {}
        for (const row of data || []) { if (!grouped[row.category]) grouped[row.category] = []; grouped[row.category].push(row.value || row.label) }
        if (Object.keys(grouped).length > 0) setNvData(grouped)
      } catch {}
    }
    fetchNV()
  }, [])

  async function loadTitles() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('productions')
        .select(`productionid, productiontitle, productionstatus, productiongroup, createdate,
          publisher, publisher_city, copyright_year, genre, fiction_nonfiction, bisac,
          lccn_print, lccn_ebook, language, royalty_type, source_url,
          excerpt, summary, generated_extract,
          manuscript_scores ( scoreid, total_score, verdict, platform, episodes, pillar_a, pillar_b, pillar_c, dimension_scores, modelid, source_type, run_at ),
          manuscript_authors ( authorid, author_name, author_role, sortorder )`)
        .eq('productiongroup', 'TITLE').eq('activestatus', 'A').order('productiontitle')
      if (error) throw error

      const mapped = await Promise.all((data || []).map(async (p) => {
        const slug = slugify(p.productiontitle)
        let hasManuscript = false
        if (userId) { try { const result = await r2.listFiles(userId, slug, 'manuscripts'); hasManuscript = result.objects?.length > 0 } catch {} }

        const sc = Array.isArray(p.manuscript_scores) && p.manuscript_scores.length > 0 ? p.manuscript_scores[p.manuscript_scores.length - 1] : null
        const authors = (p.manuscript_authors || []).sort((a, b) => (a.sortorder || 0) - (b.sortorder || 0))

        return {
          id: p.productionid, title: p.productiontitle, slug,
          genre: p.genre || '', authors: authors.map(a => a.author_name).join(', '),
          _authors: authors.map(a => ({ name: a.author_name, role: a.author_role })),
          royalty_type: p.royalty_type || '', status: p.productionstatus || 'uploaded',
          episodes: sc?.episodes || null, score: sc?.total_score ?? null,
          platform: sc?.platform || null, version: 1, language: p.language || 'English',
          agreement: false, created: p.createdate, hasManuscript,
          pillarA: sc?.pillar_a ?? null, pillarB: sc?.pillar_b ?? null, pillarC: sc?.pillar_c ?? null,
          dimensions: sc?.dimension_scores || null,
          // Pass through raw fields for detail editing
          publisher: p.publisher, publisher_city: p.publisher_city, copyright_year: p.copyright_year,
          fiction_nonfiction: p.fiction_nonfiction, bisac: p.bisac,
          lccn_print: p.lccn_print, lccn_ebook: p.lccn_ebook,
          source_url: p.source_url, excerpt: p.excerpt, summary: p.summary,
          generated_extract: p.generated_extract,
        }
      }))
      setTitles(mapped)
    } catch (e) { console.error('Failed to load titles:', e) }
    setLoading(false)
  }

  useEffect(() => { loadTitles() }, [userId])

  function handleDiscoveryImport(mapped) { setPrefill(mapped); setView('wizard') }

  return (
    <div style={{ minHeight: '100vh', background: SURFACE2, fontFamily: 'DM Sans, sans-serif', color: CREAM }}>

      {view === 'list' && (
        <>
          <TitlesDataGrid titles={titles} loading={loading}
            onNewManuscript={() => { setPrefill(null); setView('wizard') }}
            onOpenTitle={title => { setSelectedTitle(title); setView('detail') }}
            onImportDiscovery={() => setShowDiscovery(true)} />
          {showDiscovery && <DiscoveryImportModal onClose={() => setShowDiscovery(false)} onImport={handleDiscoveryImport} />}
        </>
      )}

      {view === 'detail' && selectedTitle && (
        <TitleDetailView title={selectedTitle} userId={userId} nvData={nvData}
          onBack={() => { setSelectedTitle(null); loadTitles(); setView('list') }}
          onDelete={() => { setSelectedTitle(null); loadTitles(); setView('list') }}
          onRefresh={loadTitles} />
      )}

      {view === 'wizard' && (
        <ImportWizard userId={userId} nvData={nvData} prefill={prefill}
          onClose={() => { setView('list'); setPrefill(null) }}
          onComplete={() => { loadTitles(); setView('list'); setPrefill(null) }} />
      )}
    </div>
  )
}
