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

const DEFAULT_ROYALTY_TYPES = ['Royalty-Free', 'Free Proprietary', 'One-Time Payment', 'Residuals', 'Custom', 'Other']
const DEFAULT_AUTHOR_ROLES = ['Author', 'Co-Author', 'Editor', 'Ghostwriter', 'Translator', 'Estate']
const DEFAULT_FICTION_OPTS  = ['Fiction', 'Non-Fiction']
const DEFAULT_LANGUAGES    = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Russian']

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
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${v.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.85rem', fontWeight: 700, color: v.color }}>{score}</div>
      <span style={{ background: v.bg, color: v.color, padding: '2px 7px', fontSize: '0.58rem', letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 2 }}>{v.label}</span>
    </div>
  )
}
const STATUS_CONFIG = {
  complete: { color: GREEN, label: 'Scored' }, processing: { color: GOLD, label: 'Processing' },
  uploaded: { color: BLUE, label: 'Uploaded' }, error: { color: RED, label: 'Error' },
  development: { color: BLUE, label: 'Development' }, 'In Production': { color: GOLD, label: 'In Production' },
}
const lbl = { display: 'block', fontSize: '0.62rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }
const inpStyle = (extra) => ({ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', borderRadius: 2, ...extra })
const btnGold = (disabled) => ({ background: disabled ? 'rgba(201,146,74,0.3)' : GOLD, border: 'none', color: disabled ? MUTED : '#1A1810', padding: '8px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 2 })

// ═══════════════════════════════════════════════════════════════════════════════
// TITLES DATA GRID — with filters, checkboxes, actions, XLS import
// ═══════════════════════════════════════════════════════════════════════════════
function TitlesDataGrid({ titles, loading, onNewManuscript, onOpenTitle, onImportDiscovery, onImportXLS, onBulkDelete }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortCol, setSortCol] = useState('title')
  const [sortDir, setSortDir] = useState('asc')
  const [checked, setChecked] = useState(new Set())
  const xlsRef = useRef()

  const statuses = ['all', ...new Set(titles.map(t => t.status).filter(Boolean))]

  const filtered = titles.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    const q = search.toLowerCase()
    return !q || t.title.toLowerCase().includes(q) || (t.genre || '').toLowerCase().includes(q) || (t.authors || '').toLowerCase().includes(q)
  })
  const sorted = [...filtered].sort((a, b) => {
    let av, bv
    switch (sortCol) {
      case 'title': av = a.title.toLowerCase(); bv = b.title.toLowerCase(); break
      case 'authors': av = (a.authors || '').toLowerCase(); bv = (b.authors || '').toLowerCase(); break
      case 'genre': av = (a.genre || '').toLowerCase(); bv = (b.genre || '').toLowerCase(); break
      case 'status': av = a.status; bv = b.status; break
      case 'score': av = a.score ?? -1; bv = b.score ?? -1; break
      case 'reads': av = a.read_count ?? -1; bv = b.read_count ?? -1; break
      case 'created': av = a.created || ''; bv = b.created || ''; break
      default: av = ''; bv = ''
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function handleSort(col) { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc') } }
  const arrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  const thS = (col) => ({ padding: '10px 12px', textAlign: 'left', fontSize: '0.62rem', color: sortCol === col ? CREAM : MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap', fontWeight: 600, background: sortCol === col ? 'rgba(201,146,74,0.06)' : 'transparent' })
  const allChecked = sorted.length > 0 && sorted.every(t => checked.has(t.id))
  function toggleAll() { if (allChecked) setChecked(new Set()); else setChecked(new Set(sorted.map(t => t.id))) }
  function toggleOne(id) { setChecked(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n }) }
  const scoredCount = titles.filter(t => t.score != null).length

  function handleXLSUpload(e) {
    const file = e.target.files?.[0]
    if (file && onImportXLS) onImportXLS(file)
    e.target.value = ''
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1500, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: CREAM, fontWeight: 300, margin: 0 }}>Manuscripts</h1>
          <p style={{ color: MUTED, fontSize: '0.78rem', margin: '6px 0 0' }}>{titles.length} titles · {scoredCount} scored</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onImportDiscovery} style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '8px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.68rem', cursor: 'pointer', borderRadius: 2 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = LOC_ACCENT; e.currentTarget.style.color = LOC_ACCENT }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL }}>↓ Discovery JSON</button>
          <button onClick={() => xlsRef.current?.click()} style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '8px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.68rem', cursor: 'pointer', borderRadius: 2 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = CHARCOAL }}>↓ Import XLS</button>
          <input ref={xlsRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleXLSUpload} />
          <button onClick={onNewManuscript} style={btnGold(false)}>+ New Manuscript</button>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search titles, genres, authors…" style={inpStyle({ width: 280 })} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inpStyle({ width: 160, cursor: 'pointer' })}>
          {statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : (STATUS_CONFIG[s]?.label || s)}</option>)}
        </select>
        {checked.size > 0 && (
          <button onClick={() => onBulkDelete && onBulkDelete([...checked])}
            style={{ background: `${RED}18`, border: `1px solid ${RED}44`, color: RED, padding: '8px 14px', fontSize: '0.68rem', cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif' }}>
            Delete {checked.size} selected
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>Loading…</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ color: MUTED, fontSize: '0.85rem', marginBottom: 16 }}>{search || statusFilter !== 'all' ? 'No matching titles' : 'No manuscripts yet'}</div>
          <button onClick={onNewManuscript} style={btnGold(false)}>+ Import First Manuscript</button>
        </div>
      ) : (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
            <thead>
              <tr style={{ background: '#16140E' }}>
                <th style={{ ...thS(''), cursor: 'default', width: 36, textAlign: 'center' }}>
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: GOLD }} />
                </th>
                <th style={thS('title')} onClick={() => handleSort('title')}>Title{arrow('title')}</th>
                <th style={thS('authors')} onClick={() => handleSort('authors')}>Author(s){arrow('authors')}</th>
                <th style={thS('genre')} onClick={() => handleSort('genre')}>Genre{arrow('genre')}</th>
                <th style={thS('status')} onClick={() => handleSort('status')}>Status{arrow('status')}</th>
                <th style={{ ...thS('score'), textAlign: 'center' }} onClick={() => handleSort('score')}>Score{arrow('score')}</th>
                <th style={thS('reads')} onClick={() => handleSort('reads')}>Reads{arrow('reads')}</th>
                <th style={thS('created')} onClick={() => handleSort('created')}>Created{arrow('created')}</th>
                <th style={{ ...thS(''), cursor: 'default', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, i) => {
                const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.uploaded
                return (
                  <tr key={t.id}
                    style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,146,74,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={checked.has(t.id)} onChange={() => toggleOne(t.id)} style={{ accentColor: GOLD }} />
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}` }} onClick={() => onOpenTitle(t)}>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.92rem', color: CREAM }}>{t.title}</div>
                      {t.discovery_source && <div style={{ fontSize: '0.58rem', color: MUTED, marginTop: 1 }}>via {t.discovery_source}</div>}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, color: CHARCOAL, fontSize: '0.75rem' }} onClick={() => onOpenTitle(t)}>{t.authors || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, color: CHARCOAL, fontSize: '0.75rem' }} onClick={() => onOpenTitle(t)}>{t.genre || '—'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}` }} onClick={() => onOpenTitle(t)}>
                      <span style={{ background: `${sc.color}22`, border: `1px solid ${sc.color}44`, color: sc.color, padding: '2px 7px', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2 }}>{sc.label}</span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'center' }} onClick={() => onOpenTitle(t)}>
                      {t.score != null ? <ScoreBadge score={t.score} /> : <span style={{ color: MUTED, fontSize: '0.7rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, color: CHARCOAL, fontSize: '0.75rem' }} onClick={() => onOpenTitle(t)}>
                      {t.read_count ? t.read_count.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, color: MUTED, fontSize: '0.7rem' }} onClick={() => onOpenTitle(t)}>
                      {t.created ? new Date(t.created).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => onOpenTitle({ ...t, _jumpTo: 'scoring' })}
                          style={{ background: 'none', border: `1px solid ${BORDER}`, color: GOLD, padding: '3px 8px', fontSize: '0.6rem', cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif' }}>Score</button>
                        <button onClick={() => onOpenTitle(t)}
                          style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '3px 8px', fontSize: '0.6rem', cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif' }}>Edit</button>
                      </div>
                    </td>
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
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: CREAM, fontWeight: 300, margin: 0 }}>Import from IP Discovery Tool</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={() => fileRef.current?.click()} style={{ background: `${LOC_ACCENT}12`, border: `1px solid ${LOC_ACCENT}44`, color: LOC_ACCENT, padding: '8px 16px', fontSize: '0.72rem', cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif', alignSelf: 'flex-start' }}>Upload .json File</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
          <textarea value={json} onChange={e => { setJson(e.target.value); if (e.target.value.trim()) parse(e.target.value) }} placeholder='Paste JSON…' rows={5} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: 12, fontFamily: 'monospace', fontSize: '0.72rem', outline: 'none', resize: 'vertical', borderRadius: 2 }} />
          {error && <div style={{ color: RED, fontSize: '0.72rem' }}>⚠ {error}</div>}
          {preview && <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: 12 }}><div style={{ fontSize: '0.6rem', color: LOC_ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>{Object.entries(preview).map(([k,v])=>(<div key={k} style={{ display:'flex',gap:10,padding:'3px 0',borderBottom:`1px solid ${BORDER}` }}><span style={{ width:100,color:MUTED,fontSize:'0.68rem',flexShrink:0 }}>{k}</span><span style={{ color:CREAM,fontSize:'0.72rem',wordBreak:'break-all' }}>{typeof v==='object'?JSON.stringify(v):String(v)}</span></div>))}</div>}
          <button onClick={() => { if (preview) { onImport(preview); onClose() } }} disabled={!preview} style={{ ...btnGold(!preview), padding: '11px' }}>Apply to New Manuscript →</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// XLS IMPORT — parses Galatea/IP tool spreadsheets
// ═══════════════════════════════════════════════════════════════════════════════
async function parseXLSAndImport(file, supabaseClient) {
  // Dynamically import SheetJS
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws)
  if (!rows.length) throw new Error('No data rows found in spreadsheet')

  // Map columns — flexible matching for Galatea or generic format
  const colMap = (row) => {
    const get = (...keys) => { for (const k of keys) { const v = row[k]; if (v != null && v !== '') return String(v) } return null }
    return {
      productiontitle: get('title', 'Title', 'Book Title', 'name', 'Name') || 'Untitled',
      genre: get('categories', 'genre', 'Genre', 'Category'),
      chapter_count: parseInt(get('chapters', 'Chapters', '# Chapters', 'Number of Chapters') || '0') || null,
      read_count: parseInt(String(get('reads', 'Reads', '# Reads', 'Number of Reads', 'views', 'Views') || '0').replace(/,/g, '')) || null,
      summary: get('summary', 'Summary', 'Description', 'description'),
      discovery_source: get('source', 'Source', 'Platform') || file.name.replace(/\.[^.]+$/, ''),
      source_url: get('url', 'URL', 'Link', 'link'),
      productionstatus: 'uploaded', productiongroup: 'TITLE', activestatus: 'A',
      createdate: new Date().toISOString(), updatedate: new Date().toISOString(),
    }
  }
  const authorMap = (row) => {
    const a = row.author || row.Author || row['Author Name'] || row.authors || ''
    return a ? [{ author_name: String(a), author_role: 'Author', sortorder: 1 }] : []
  }

  let imported = 0
  for (const row of rows) {
    const prod = colMap(row)
    if (!prod.productiontitle || prod.productiontitle === 'Untitled') continue
    try {
      const { data, error } = await supabaseClient.from('productions').insert(prod).select().single()
      if (error) continue
      const authors = authorMap(row)
      if (authors.length > 0 && data?.productionid) {
        await supabaseClient.from('manuscript_authors').insert(authors.map(a => ({ ...a, productionid: data.productionid })))
      }
      imported++
    } catch { /* skip row on error */ }
  }
  return { total: rows.length, imported }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED EDITABLE FORM — used by Detail View and Import Wizard
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
  const [fetching, setFetching] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { if (mode === 'edit' && userId && titleSlug) loadR2() }, [userId, titleSlug, mode])

  async function loadR2() { setR2Loading(true); try { const r = await r2.listFiles(userId, titleSlug, 'manuscripts'); setR2Files(r.objects || []) } catch { setR2Files([]) } setR2Loading(false) }

  async function handleFileUpload(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer?.files[0] || e.target.files[0]
    if (!f || !userId || !titleSlug) return
    setUploading(true); setUploadProgress(0)
    try { await r2.uploadFile(userId, titleSlug, 'manuscripts', f, { version: form.version || '1' }, p => setUploadProgress(p)); await loadR2(); if (onFileUploaded) onFileUploaded() } catch (err) { console.error('Upload failed:', err) }
    setUploading(false)
  }

  async function handleExtractText(filename) {
    if (!userId || !titleSlug) return; setExtracting(true)
    try {
      const { blob, contentType } = await r2.downloadFile(userId, titleSlug, 'manuscripts', filename)
      if (contentType?.includes('text') || filename.endsWith('.txt')) {
        const text = await blob.text()
        const words = text.split(/\s+/)
        if (!form.excerpt) setForm(f => ({ ...f, excerpt: words.slice(0, 3000).join(' '), _fullText: text }))
        else setForm(f => ({ ...f, _fullText: text }))
      } else { alert('PDF/DOCX text extraction requires manual paste. Download the file and copy text into Excerpt or Summary.') }
    } catch (err) { console.error('Extract failed:', err) }
    setExtracting(false)
  }

  async function handleDownload(filename) {
    if (!userId || !titleSlug) return
    try { const { blob } = await r2.downloadFile(userId, titleSlug, 'manuscripts', filename); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) } catch {}
  }

  // URL Fetch — actually downloads text from URL
  async function handleFetchURL() {
    if (!form.sourceUrl?.trim()) return; setFetching(true)
    try {
      const res = await fetch(form.sourceUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const words = clean.split(/\s+/)
      setForm(f => ({ ...f, excerpt: f.excerpt || words.slice(0, 3000).join(' '), _fullText: clean }))
    } catch (err) {
      // CORS will block most URLs — suggest Gutenberg .txt
      alert(`Fetch failed: ${err.message}. Note: most websites block direct fetch due to CORS. Project Gutenberg .txt links work well.`)
    }
    setFetching(false)
  }

  // Generate extract via AI
  async function handleGenerateExtract() {
    const sourceText = form.excerpt || form._fullText || form.summary
    if (!sourceText) { alert('Enter an excerpt, summary, or extract text from a manuscript first.'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `You are an expert at preparing manuscript excerpts for AI scoring. Given the following text, create an optimized extract of approximately 1500-2000 words that best represents the work's narrative structure, emotional velocity, dialogue quality, character dynamics, and scene variety for micro-drama adaptation scoring.\n\nFocus on:\n- Opening hook / first scene\n- A key emotional turning point\n- A dialogue-heavy scene\n- A scene showing character relationships\n\nRespond with ONLY the extract text, no commentary.\n\nSOURCE TEXT:\n${sourceText.slice(0, 15000)}`, max_tokens: 3000 })
      })
      const data = await res.json()
      const extract = (data.content?.map(c => c.text || '').join('') || '').trim()
      if (extract) setForm(f => ({ ...f, generatedExtract: extract }))
    } catch (err) { alert('Generate failed: ' + err.message) }
    setGenerating(false)
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function addAuthor() { setForm(f => ({ ...f, authors: [...f.authors, { name: '', role: 'Author' }] })) }
  function removeAuthor(idx) { setForm(f => ({ ...f, authors: f.authors.filter((_, i) => i !== idx) })) }
  function updateAuthor(idx, key, val) { setForm(f => ({ ...f, authors: f.authors.map((a, i) => i === idx ? { ...a, [key]: val } : a) })) }

  async function lookupLCCN() {
    if (!form.lccnPrint?.trim()) return; setLccnStatus('loading')
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=lccn:${form.lccnPrint.trim()}&limit=1`)
      const data = await res.json()
      if (data.docs?.length > 0) {
        const doc = data.docs[0]
        setForm(f => ({ ...f, name: f.name || doc.title || f.name, authors: doc.author_name?.length > 0 ? doc.author_name.map(n => ({ name: n, role: 'Author' })) : f.authors, publisher: doc.publisher?.[0] || f.publisher, publisherCity: doc.publish_place?.[0] || f.publisherCity, copyrightYear: doc.first_publish_year ? String(doc.first_publish_year) : f.copyrightYear, genre: doc.subject?.[0] || f.genre, language: doc.language?.[0] === 'eng' ? 'English' : doc.language?.[0] || f.language }))
        setLccnStatus('ok')
      } else setLccnStatus('fail')
    } catch { setLccnStatus('fail') }
  }

  const hasTitle = form.name?.trim().length > 0
  const hasAuthor = form.authors?.some(a => a.name.trim().length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Manuscript File ── */}
      <div style={{ background: '#16140E', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '16px 18px' }}>
        <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Manuscript File</div>
        {r2Files.length > 0 && <div style={{ marginBottom: 14 }}>{r2Files.map((f, i) => { const name = f.key?.split('/').pop() || `File ${i+1}`; return (
          <div key={f.key||i} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:SURFACE2,border:`1px solid ${BORDER}`,borderRadius:3,marginBottom:6 }}>
            <span style={{ color:BLUE,fontSize:'0.85rem' }}>📄</span>
            <div style={{ flex:1,minWidth:0 }}><div style={{ color:CREAM,fontSize:'0.78rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{name}</div>{f.size&&<div style={{ color:MUTED,fontSize:'0.6rem',marginTop:1 }}>{(f.size/1024/1024).toFixed(1)} MB</div>}</div>
            <button onClick={()=>handleExtractText(name)} disabled={extracting} style={{ background:`${LOC_ACCENT}12`,border:`1px solid ${LOC_ACCENT}44`,color:LOC_ACCENT,padding:'4px 10px',fontSize:'0.6rem',cursor:extracting?'wait':'pointer',borderRadius:2,fontFamily:'DM Sans, sans-serif',whiteSpace:'nowrap' }}>{extracting?'Extracting…':'Extract Text'}</button>
            <button onClick={()=>handleDownload(name)} style={{ background:'none',border:`1px solid ${BORDER}`,color:CHARCOAL,padding:'4px 10px',fontSize:'0.6rem',cursor:'pointer',borderRadius:2,fontFamily:'DM Sans, sans-serif' }}>Download</button>
          </div>)})}</div>}
        {(userId && titleSlug) ? (
          <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={handleFileUpload}
            style={{ border:`1px dashed ${dragOver?GOLD:BORDER}`,borderRadius:4,padding:'16px',textAlign:'center',cursor:'pointer',background:dragOver?'rgba(201,146,74,0.05)':'transparent' }}
            onClick={()=>document.getElementById('ms-detail-file')?.click()}>
            <input id="ms-detail-file" type="file" accept=".pdf,.doc,.docx,.txt,.epub" style={{ display:'none' }} onChange={handleFileUpload} />
            {uploading ? <div><div style={{ color:GOLD,fontSize:'0.8rem',marginBottom:4 }}>Uploading… {Math.round(uploadProgress*100)}%</div><div style={{ height:3,background:'rgba(255,255,255,0.06)',borderRadius:2 }}><div style={{ width:`${uploadProgress*100}%`,height:'100%',background:GOLD,borderRadius:2 }}/></div></div>
            : <div><div style={{ color:CHARCOAL,fontSize:'1.1rem',marginBottom:3 }}>↑</div><div style={{ color:CREAM,fontSize:'0.75rem',marginBottom:2 }}>{r2Files.length>0?'Upload new version':'Drop manuscript or click to browse'}</div><div style={{ color:MUTED,fontSize:'0.62rem' }}>PDF · DOCX · TXT · EPUB</div></div>}
          </div>
        ) : <div style={{ color:MUTED,fontSize:'0.72rem',padding:'12px',textAlign:'center',border:`1px dashed ${BORDER}`,borderRadius:4 }}>{mode==='new'?'File upload available after saving':'Save first to enable upload'}</div>}
        {r2Loading && <div style={{ color:MUTED,fontSize:'0.7rem',marginTop:8 }}>Loading files…</div>}
      </div>

      {/* ── Title ── */}
      <div style={{ background:'#16140E',border:`1px solid ${BORDER}`,borderRadius:4,padding:'16px 18px' }}>
        <div style={{ fontSize:'0.62rem',color:GOLD,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14 }}>Required Fields</div>
        <div><div style={lbl}>Title *</div><input style={inpStyle({ borderColor:!hasTitle?`${RED}44`:BORDER })} value={form.name||''} placeholder="Title of the work" onChange={e=>set('name',e.target.value)}/></div>
      </div>

      {/* ── Authors ── */}
      <div style={{ background:'#16140E',border:`1px solid ${BORDER}`,borderRadius:4,padding:'16px 18px' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
          <div style={{ fontSize:'0.62rem',color:GOLD,letterSpacing:'0.12em',textTransform:'uppercase' }}>Authors *</div>
          <button onClick={addAuthor} style={{ background:`${GOLD}18`,border:`1px solid ${GOLD}44`,color:GOLD,padding:'4px 12px',fontSize:'0.62rem',cursor:'pointer',borderRadius:2,fontFamily:'DM Sans, sans-serif' }}>+ Add</button>
        </div>
        {(form.authors||[]).map((author,idx)=>(
          <div key={idx} style={{ display:'flex',gap:10,marginBottom:8,alignItems:'flex-end' }}>
            <div style={{ flex:2 }}>{idx===0&&<div style={lbl}>Name</div>}<input style={inpStyle({ borderColor:idx===0&&!hasAuthor?`${RED}44`:BORDER })} value={author.name} placeholder="Author name" onChange={e=>updateAuthor(idx,'name',e.target.value)}/></div>
            <div style={{ flex:1 }}>{idx===0&&<div style={lbl}>Role</div>}<select style={inpStyle({ cursor:'pointer' })} value={author.role} onChange={e=>updateAuthor(idx,'role',e.target.value)}>{authorRoles.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
            {(form.authors||[]).length>1&&<button onClick={()=>removeAuthor(idx)} style={{ background:'none',border:'none',color:RED,cursor:'pointer',fontSize:'1rem',padding:'8px 4px',flexShrink:0 }}>✕</button>}
          </div>
        ))}
      </div>

      {/* ── Publication ── */}
      <div style={{ background:'#16140E',border:`1px solid ${BORDER}`,borderRadius:4,padding:'16px 18px' }}>
        <div style={{ fontSize:'0.62rem',color:CHARCOAL,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14 }}>Publication</div>
        <div style={{ display:'flex',gap:12,marginBottom:10 }}>
          <div style={{ flex:2 }}><div style={lbl}>Publisher</div><input style={inpStyle()} value={form.publisher||''} placeholder="Publisher" onChange={e=>set('publisher',e.target.value)}/></div>
          <div style={{ flex:1 }}><div style={lbl}>Publisher City</div><input style={inpStyle()} value={form.publisherCity||''} placeholder="City" onChange={e=>set('publisherCity',e.target.value)}/></div>
          <div style={{ flex:1 }}><div style={lbl}>Copyright Year</div><input style={inpStyle()} value={form.copyrightYear||''} placeholder="YYYY" maxLength={4} onChange={e=>set('copyrightYear',e.target.value.replace(/\D/g,'').slice(0,4))}/></div>
        </div>
        <div style={{ display:'flex',gap:12,marginBottom:10 }}>
          <div style={{ flex:1 }}><div style={lbl}>Fiction / Non-Fiction</div><div style={{ display:'flex',gap:6 }}>{fictionOpts.map(o=>(<button key={o} onClick={()=>set('fictionNonfiction',o)} style={{ flex:1,background:form.fictionNonfiction===o?`${GOLD}22`:SURFACE2,border:`1px solid ${form.fictionNonfiction===o?GOLD:BORDER}`,color:form.fictionNonfiction===o?GOLD:MUTED,padding:'8px',fontSize:'0.72rem',cursor:'pointer',borderRadius:2,fontFamily:'DM Sans, sans-serif' }}>{o}</button>))}</div></div>
          <div style={{ flex:1 }}><div style={lbl}>Genre</div><input style={inpStyle()} value={form.genre||''} placeholder="e.g. Romance — Historical" onChange={e=>set('genre',e.target.value)}/></div>
        </div>
        <div style={{ display:'flex',gap:12 }}>
          <div style={{ flex:1 }}><div style={lbl}>Language</div><select style={inpStyle({ cursor:'pointer' })} value={form.language||'English'} onChange={e=>set('language',e.target.value)}>{languages.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
          <div style={{ flex:1 }}><div style={lbl}>Version</div><input style={inpStyle()} value={form.version||'1'} type="number" min="1" onChange={e=>set('version',e.target.value)}/></div>
        </div>
      </div>

      {/* ── Discovery Fields ── */}
      <div style={{ background:'#16140E',border:`1px solid ${BORDER}`,borderRadius:4,padding:'16px 18px' }}>
        <div style={{ fontSize:'0.62rem',color:CHARCOAL,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14 }}>Discovery & Platform Data</div>
        <div style={{ display:'flex',gap:12,marginBottom:10 }}>
          <div style={{ flex:1 }}><div style={lbl}># Chapters/Episodes</div><input style={inpStyle()} value={form.chapterCount||''} type="number" min="0" placeholder="0" onChange={e=>set('chapterCount',e.target.value)}/></div>
          <div style={{ flex:1 }}><div style={lbl}># Free Chapters</div><input style={inpStyle()} value={form.freeChapterCount||''} type="number" min="0" placeholder="0" onChange={e=>set('freeChapterCount',e.target.value)}/></div>
          <div style={{ flex:1 }}><div style={lbl}># Reads/Views</div><input style={inpStyle()} value={form.readCount||''} type="number" min="0" placeholder="0" onChange={e=>set('readCount',e.target.value)}/></div>
        </div>
        <div style={{ display:'flex',gap:12 }}>
          <div style={{ flex:1 }}><div style={lbl}>IMDB URL</div><input style={inpStyle()} value={form.imdbUrl||''} placeholder="https://imdb.com/title/…" onChange={e=>set('imdbUrl',e.target.value)}/></div>
          <div style={{ flex:1 }}><div style={lbl}>Discovery Source</div><input style={inpStyle()} value={form.discoverySource||''} placeholder="e.g. Galatea, Gutenberg" onChange={e=>set('discoverySource',e.target.value)}/></div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ background:'#16140E',border:`1px solid ${BORDER}`,borderRadius:4,padding:'16px 18px' }}>
        <div style={{ fontSize:'0.62rem',color:GOLD,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14 }}>Content (for scoring)</div>
        <div style={{ marginBottom:12 }}><div style={lbl}>Summary</div><textarea style={{ ...inpStyle(),resize:'vertical',minHeight:60 }} value={form.summary||''} placeholder="Paste or type a summary…" rows={3} onChange={e=>set('summary',e.target.value)}/></div>
        <div style={{ marginBottom:12 }}><div style={lbl}>Excerpt</div><textarea style={{ ...inpStyle(),resize:'vertical',minHeight:80 }} value={form.excerpt||''} placeholder="Paste an excerpt (opening chapters, key scenes)…" rows={4} onChange={e=>set('excerpt',e.target.value)}/>{form.excerpt&&<div style={{ fontSize:'0.6rem',color:MUTED,marginTop:3 }}>{form.excerpt.split(/\s+/).length.toLocaleString()} words</div>}</div>
        <div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
            <div style={lbl}>Generated Extract</div>
            <button onClick={handleGenerateExtract} disabled={generating||(!form.excerpt&&!form._fullText&&!form.summary)}
              style={{ background:generating?'rgba(201,146,74,0.2)':`${GOLD}18`,border:`1px solid ${GOLD}44`,color:GOLD,padding:'4px 12px',fontSize:'0.6rem',cursor:generating?'wait':'pointer',borderRadius:2,fontFamily:'DM Sans, sans-serif' }}>
              {generating?'Generating…':'✦ Generate Extract'}
            </button>
          </div>
          <textarea style={{ ...inpStyle(),resize:'vertical',minHeight:60 }} value={form.generatedExtract||''} placeholder="AI-generated scoring-optimized extract…" rows={3} onChange={e=>set('generatedExtract',e.target.value)}/>
          {form.generatedExtract&&<div style={{ fontSize:'0.6rem',color:MUTED,marginTop:3 }}>{form.generatedExtract.split(/\s+/).length.toLocaleString()} words</div>}
        </div>
      </div>

      {/* ── Source URL with Fetch ── */}
      <div style={{ display:'flex',gap:10,alignItems:'flex-end' }}>
        <div style={{ flex:1 }}><div style={lbl}>Source URL (optional)</div><input style={inpStyle()} value={form.sourceUrl||''} placeholder="e.g. https://gutenberg.org/files/1342/1342-0.txt" onChange={e=>set('sourceUrl',e.target.value)}/></div>
        <button onClick={handleFetchURL} disabled={fetching||!form.sourceUrl?.trim()}
          style={{ ...btnGold(fetching||!form.sourceUrl?.trim()),padding:'9px 16px',marginBottom:0,flexShrink:0 }}>
          {fetching?'Fetching…':'Fetch Text'}
        </button>
      </div>

      {/* ── LOC ── */}
      <div style={{ background:'#16140E',border:`1px solid ${showLoc?LOC_ACCENT+'44':BORDER}`,borderRadius:4,overflow:'hidden' }}>
        <button onClick={()=>setShowLoc(s=>!s)} style={{ width:'100%',padding:'14px 18px',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontSize:'0.62rem',color:LOC_ACCENT,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:'DM Sans, sans-serif' }}>Library of Congress — LCCN Lookup</span>
          <span style={{ color:LOC_ACCENT,fontSize:'0.8rem',transform:showLoc?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s' }}>▾</span>
        </button>
        {showLoc&&(
          <div style={{ padding:'0 18px 16px' }}>
            <div style={{ background:SURFACE2,borderRadius:4,padding:'12px 14px',marginBottom:14,border:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:'0.62rem',color:CHARCOAL,marginBottom:8 }}>Enter LCCN to auto-populate. Example: <span style={{ color:CREAM,fontFamily:'monospace' }}>2018046290</span></div>
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                <input value={form.lccnPrint||''} onChange={e=>{set('lccnPrint',e.target.value);setLccnStatus(null)}} placeholder="e.g. 2018046290" style={inpStyle({ flex:1 })}/>
                <button onClick={lookupLCCN} disabled={!form.lccnPrint?.trim()||lccnStatus==='loading'} style={{ background:form.lccnPrint?.trim()?`${LOC_ACCENT}18`:'rgba(255,255,255,0.04)',border:`1px solid ${form.lccnPrint?.trim()?LOC_ACCENT+'55':BORDER}`,color:form.lccnPrint?.trim()?LOC_ACCENT:MUTED,borderRadius:2,padding:'8px 16px',cursor:form.lccnPrint?.trim()?'pointer':'not-allowed',fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.1em',whiteSpace:'nowrap',fontFamily:'DM Sans, sans-serif' }}>{lccnStatus==='loading'?'Looking up…':'Lookup LOC'}</button>
                {form.lccnPrint&&<a href={`https://lccn.loc.gov/${form.lccnPrint}`} target="_blank" rel="noreferrer" style={{ fontSize:'0.6rem',color:CHARCOAL,textDecoration:'none',whiteSpace:'nowrap' }}>↗ LOC</a>}
              </div>
              {lccnStatus==='ok'&&<div style={{ fontSize:'0.65rem',color:GREEN,marginTop:8 }}>✓ Fields populated</div>}
              {lccnStatus==='fail'&&<div style={{ fontSize:'0.65rem',color:GOLD,marginTop:8 }}>Record not found</div>}
            </div>
            <div style={{ display:'flex',gap:12,marginBottom:10 }}>
              <div style={{ flex:1 }}><div style={lbl}>LCCN (Print)</div><input style={inpStyle()} value={form.lccnPrint||''} placeholder="e.g. 2018046290" onChange={e=>set('lccnPrint',e.target.value)}/></div>
              <div style={{ flex:1 }}><div style={lbl}>LCCN (eBook)</div><input style={inpStyle()} value={form.lccnEbook||''} placeholder="e.g. 2018046291" onChange={e=>set('lccnEbook',e.target.value)}/></div>
            </div>
            <div><div style={lbl}>BISAC Code</div><input style={inpStyle()} value={form.bisac||''} placeholder="e.g. FIC027110" onChange={e=>set('bisac',e.target.value)}/></div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TITLE DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════════════════
const DETAIL_STEPS = [
  { key: 'overview', label: 'Overview', icon: '◉' },
  { key: 'manuscript', label: 'Manuscript', icon: '📄' },
  { key: 'rights', label: 'Rights', icon: '⚖' },
  { key: 'scoring', label: 'Score Report', icon: '◈' },
]

function TitleDetailView({ title, onBack, onDelete, onRefresh, userId, nvData }) {
  const { endUser } = useAuth()
  const [activeStep, setActiveStep] = useState(title._jumpTo || 'overview')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const royaltyTypes = nvData?.royalty_type || DEFAULT_ROYALTY_TYPES

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
    chapterCount: title.chapter_count || '', freeChapterCount: title.free_chapter_count || '',
    readCount: title.read_count || '', imdbUrl: title.imdb_url || '',
    discoverySource: title.discovery_source || '',
    fee: '', royaltyRate: '', signDate: '', publicDomain: title.royalty_type === 'Royalty-Free',
  })

  const hasScore = title.score != null
  const isComplete = title.status === 'complete' && hasScore
  const sc = STATUS_CONFIG[title.status] || STATUS_CONFIG.uploaded

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleSave() {
    if (!form.name?.trim()) { showToast('Title required'); return }
    setSaving(true)
    try {
      await supabase.from('productions').update({
        productiontitle: form.name, language: form.language,
        publisher: form.publisher||null, publisher_city: form.publisherCity||null,
        copyright_year: form.copyrightYear||null, genre: form.genre||null,
        fiction_nonfiction: form.fictionNonfiction||null, bisac: form.bisac||null,
        lccn_print: form.lccnPrint||null, lccn_ebook: form.lccnEbook||null,
        royalty_type: form.royaltyType||null, source_url: form.sourceUrl||null,
        excerpt: form.excerpt||null, summary: form.summary||null,
        generated_extract: form.generatedExtract||null,
        chapter_count: parseInt(form.chapterCount)||null,
        free_chapter_count: parseInt(form.freeChapterCount)||null,
        read_count: parseInt(form.readCount)||null,
        imdb_url: form.imdbUrl||null, discovery_source: form.discoverySource||null,
        updatedate: new Date().toISOString(),
      }).eq('productionid', title.id)

      await supabase.from('manuscript_authors').delete().eq('productionid', title.id)
      const validAuthors = (form.authors||[]).filter(a=>a.name.trim())
      if (validAuthors.length>0) await supabase.from('manuscript_authors').insert(validAuthors.map((a,i)=>({ productionid:title.id,author_name:a.name,author_role:a.role||'Author',sortorder:i+1 })))
      showToast('Saved ✓'); if (onRefresh) onRefresh()
    } catch (e) { showToast('Error: '+e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await supabase.from('manuscript_user_scores').delete().match({ productionid:title.id })
      await supabase.from('manuscript_scores').delete().eq('productionid',title.id)
      await supabase.from('manuscript_authors').delete().eq('productionid',title.id)
      await supabase.from('productions').delete().eq('productionid',title.id)
      if (userId&&title.slug) { try { await r2.deleteFolder(userId,title.slug) } catch{} }
      onDelete()
    } catch(e) { console.error(e); setDeleting(false) }
  }

  return (
    <div style={{ minHeight:'100vh',background:SURFACE2,fontFamily:'DM Sans, sans-serif',color:CREAM,display:'flex' }}>
      {toast&&<div style={{ position:'fixed',top:16,right:24,zIndex:999,background:toast.includes('Error')?'rgba(200,75,49,0.9)':'rgba(74,156,122,0.9)',color:'#fff',padding:'10px 20px',fontSize:'0.8rem',borderRadius:4 }}>{toast}</div>}

      {/* Left Nav */}
      <div style={{ width:220,flexShrink:0,background:SURFACE,borderRight:`1px solid ${BORDER}`,display:'flex',flexDirection:'column',padding:'24px 0' }}>
        <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 20px',margin:'0 12px 20px',background:'none',border:`1px solid ${BORDER}`,color:CHARCOAL,cursor:'pointer',borderRadius:2,fontFamily:'DM Sans, sans-serif',fontSize:'0.72rem' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.color=CREAM}} onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=CHARCOAL}}>← Back to List</button>

        <div style={{ padding:'0 20px 20px',borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:'1.05rem',color:CREAM,fontWeight:400,lineHeight:1.3,marginBottom:6 }}>{form.name||title.title}</div>
          <span style={{ background:`${sc.color}22`,border:`1px solid ${sc.color}44`,color:sc.color,padding:'2px 8px',fontSize:'0.55rem',letterSpacing:'0.1em',textTransform:'uppercase',borderRadius:2 }}>{sc.label}</span>
          {hasScore&&<div style={{ marginTop:10 }}><ScoreBadge score={title.score}/></div>}
        </div>

        <div style={{ padding:'16px 0',flex:1 }}>
          {DETAIL_STEPS.map(step=>(
            <button key={step.key} onClick={()=>setActiveStep(step.key)}
              style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'11px 20px',background:activeStep===step.key?'rgba(201,146,74,0.08)':'transparent',border:'none',borderLeft:`3px solid ${activeStep===step.key?GOLD:'transparent'}`,cursor:'pointer',fontFamily:'DM Sans, sans-serif' }}>
              <span style={{ fontSize:'0.82rem',opacity:0.7 }}>{step.icon}</span>
              <span style={{ fontSize:'0.72rem',color:activeStep===step.key?CREAM:CHARCOAL,fontWeight:activeStep===step.key?600:400 }}>{step.label}</span>
            </button>
          ))}
        </div>

        {(activeStep==='manuscript'||activeStep==='rights')&&(
          <div style={{ padding:'12px 12px 0',borderTop:`1px solid ${BORDER}` }}>
            <button onClick={handleSave} disabled={saving} style={{ ...btnGold(saving),width:'100%',padding:'9px' }}>{saving?'Saving…':'Save Changes'}</button>
          </div>
        )}
        {!isComplete&&(
          <div style={{ padding:'12px 12px',borderTop:`1px solid ${BORDER}` }}>
            {!confirmDelete?<button onClick={()=>setConfirmDelete(true)} style={{ width:'100%',padding:'8px',background:'none',border:`1px solid ${RED}44`,color:RED,cursor:'pointer',borderRadius:2,fontFamily:'DM Sans, sans-serif',fontSize:'0.65rem' }}>Delete Title</button>
            :<div style={{ display:'flex',flexDirection:'column',gap:6 }}><div style={{ fontSize:'0.62rem',color:RED,textAlign:'center' }}>Delete all data?</div><div style={{ display:'flex',gap:6 }}><button onClick={()=>setConfirmDelete(false)} style={{ flex:1,padding:'6px',background:'none',border:`1px solid ${BORDER}`,color:CHARCOAL,cursor:'pointer',borderRadius:2,fontSize:'0.62rem',fontFamily:'DM Sans, sans-serif' }}>Cancel</button><button onClick={handleDelete} disabled={deleting} style={{ flex:1,padding:'6px',background:RED,border:'none',color:CREAM,cursor:deleting?'wait':'pointer',borderRadius:2,fontSize:'0.62rem',fontWeight:600,fontFamily:'DM Sans, sans-serif' }}>{deleting?'…':'Confirm'}</button></div></div>}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex:1,overflowY:'auto',maxHeight:'100vh' }}>
        {activeStep==='overview'&&(
          <div style={{ padding:'32px 40px',maxWidth:800 }}>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif',fontSize:'1.8rem',color:CREAM,fontWeight:300,margin:'0 0 6px' }}>{form.name||title.title}</h2>
            <p style={{ color:MUTED,fontSize:'0.78rem',margin:'0 0 24px' }}>{form.authors?.filter(a=>a.name).map(a=>a.name).join(', ')||'Unknown'} · {form.genre||'Unclassified'} · v{form.version||1}</p>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14 }}>
              {[{ l:'Status',v:sc.label,c:sc.color },{ l:'Score',v:hasScore?`${title.score}/100`:'—',c:hasScore?getVerdict(title.score).color:MUTED },{ l:'Platform',v:title.platform||'—',c:CHARCOAL },{ l:'Episodes',v:title.episodes||'—',c:CHARCOAL },{ l:'Reads',v:form.readCount?Number(form.readCount).toLocaleString():'—',c:CHARCOAL },{ l:'Created',v:title.created?new Date(title.created).toLocaleDateString():'—',c:CHARCOAL }].map(item=>(
                <div key={item.l} style={{ background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:4,padding:'14px 16px' }}>
                  <div style={{ fontSize:'0.6rem',color:MUTED,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6 }}>{item.l}</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:'1.1rem',color:item.c,fontWeight:600 }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStep==='manuscript'&&(
          <div style={{ padding:'32px 40px',maxWidth:800 }}>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif',fontSize:'1.5rem',color:CREAM,fontWeight:300,margin:'0 0 20px' }}>Manuscript Details</h2>
            <ManuscriptForm form={form} setForm={setForm} nvData={nvData} mode="edit" userId={userId} titleSlug={title.slug} onFileUploaded={()=>{}}/>
          </div>
        )}

        {activeStep==='rights'&&(
          <div style={{ padding:'32px 40px',maxWidth:800 }}>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif',fontSize:'1.5rem',color:CREAM,fontWeight:300,margin:'0 0 20px' }}>Rights & Licensing</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
              <div style={{ background:'#16140E',border:`1px solid ${BORDER}`,borderRadius:4,padding:'16px 18px' }}>
                <div style={{ fontSize:'0.62rem',color:GOLD,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14 }}>Royalty Type</div>
                <select style={inpStyle({ cursor:'pointer' })} value={form.royaltyType||''} onChange={e=>setForm(f=>({...f,royaltyType:e.target.value}))}><option value="">Select…</option>{royaltyTypes.map(r=><option key={r} value={r}>{r}</option>)}</select>
              </div>
              <label style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'12px 14px',border:`1px solid ${form.publicDomain?GREEN:BORDER}`,borderRadius:4,background:form.publicDomain?'rgba(74,156,122,0.08)':'transparent' }}>
                <input type="checkbox" checked={form.publicDomain} onChange={e=>setForm(f=>({...f,publicDomain:e.target.checked}))} style={{ accentColor:GREEN }}/>
                <div><div style={{ color:CREAM,fontSize:'0.83rem' }}>Public domain / royalty-free</div></div>
              </label>
              {!form.publicDomain&&(<>
                <div style={{ display:'flex',gap:14 }}>
                  <div style={{ flex:1 }}><div style={lbl}>Licensing Fee ($)</div><input style={inpStyle()} value={form.fee} type="number" placeholder="0.00" onChange={e=>setForm(f=>({...f,fee:e.target.value}))}/></div>
                  <div style={{ flex:1 }}><div style={lbl}>Royalty Rate (%)</div><input style={inpStyle()} value={form.royaltyRate} type="number" placeholder="0–100" onChange={e=>setForm(f=>({...f,royaltyRate:e.target.value}))}/></div>
                </div>
                <div><div style={lbl}>Agreement Date</div><input style={inpStyle()} value={form.signDate} type="date" onChange={e=>setForm(f=>({...f,signDate:e.target.value}))}/></div>
              </>)}
            </div>
          </div>
        )}

        {activeStep==='scoring'&&(
          <ScoringRunner title={{ ...title,excerpt:form.excerpt,summary:form.summary,generated_extract:form.generatedExtract,_fullText:form._fullText }} onScored={()=>{if(onRefresh)onRefresh()}}/>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT WIZARD
// ═══════════════════════════════════════════════════════════════════════════════
const WIZARD_STEPS = ['Manuscript', 'Rights', 'Confirm & Save']

function ImportWizard({ onClose, onComplete, userId, nvData, prefill }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: prefill?.name||'', version: '1', language: prefill?.language||'English',
    sourceUrl: '', royaltyType: prefill?.royaltyType||'',
    authors: prefill?.authors||[{ name:'',role:'Author' }],
    publisher: prefill?.publisher||'', publisherCity: prefill?.publisherCity||'',
    copyrightYear: prefill?.copyrightYear||'', genre: prefill?.genre||'',
    fictionNonfiction: prefill?.fictionNonfiction||'', bisac: prefill?.bisac||'',
    lccnPrint: prefill?.lccnPrint||'', lccnEbook: prefill?.lccnEbook||'',
    summary: prefill?.summary||'', excerpt:'', generatedExtract:'',
    chapterCount:'', freeChapterCount:'', readCount:'', imdbUrl:'', discoverySource:'',
    fee:'', royaltyRate:'', signDate:'', publicDomain: false,
  })
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const royaltyTypes = nvData?.royalty_type||DEFAULT_ROYALTY_TYPES
  const hasTitle = form.name?.trim().length>0
  const hasAuthor = (form.authors||[]).some(a=>a.name.trim().length>0)
  const canProceed = hasTitle && hasAuthor

  function handleFileDrop(e) { e.preventDefault();setDragOver(false);const f=e.dataTransfer?.files[0]||e.target.files[0];if(f){setFile(f);if(!form.name)setForm(fm=>({...fm,name:f.name.replace(/\.[^.]+$/,'')}))} }

  async function handleCreate() {
    setSaving(true); setError('')
    try {
      const slug = slugify(form.name)
      if (file&&userId) await r2.uploadFile(userId,slug,'manuscripts',file,{ version:form.version })
      const { data:prod,error:pe } = await supabase.from('productions').insert({
        productiontitle:form.name, productionstatus:'uploaded', productiongroup:'TITLE', activestatus:'A',
        language:form.language, publisher:form.publisher||null, publisher_city:form.publisherCity||null,
        copyright_year:form.copyrightYear||null, genre:form.genre||null,
        fiction_nonfiction:form.fictionNonfiction||null, bisac:form.bisac||null,
        lccn_print:form.lccnPrint||null, lccn_ebook:form.lccnEbook||null,
        royalty_type:form.royaltyType||null, source_url:form.sourceUrl||null,
        excerpt:form.excerpt||null, summary:form.summary||null, generated_extract:form.generatedExtract||null,
        chapter_count:parseInt(form.chapterCount)||null, free_chapter_count:parseInt(form.freeChapterCount)||null,
        read_count:parseInt(form.readCount)||null, imdb_url:form.imdbUrl||null, discovery_source:form.discoverySource||null,
        createdate:new Date().toISOString(), updatedate:new Date().toISOString(),
      }).select().single()
      if (pe) throw pe
      const validAuthors = (form.authors||[]).filter(a=>a.name.trim())
      if (validAuthors.length>0) await supabase.from('manuscript_authors').insert(validAuthors.map((a,i)=>({ productionid:prod.productionid,author_name:a.name,author_role:a.role||'Author',sortorder:i+1 })))
      onComplete()
    } catch(e) { setError(e.message); setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }} onClick={onClose}>
      <div style={{ background:SURFACE,border:`1px solid ${BORDER}`,width:720,maxWidth:'95vw',maxHeight:'92vh',overflowY:'auto',borderRadius:4 }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'22px 28px',borderBottom:`1px solid ${BORDER}`,display:'flex',justifyContent:'space-between' }}>
          <div><h2 style={{ fontFamily:'Cormorant Garamond, serif',fontSize:'1.5rem',color:CREAM,fontWeight:300,margin:0 }}>Import Manuscript</h2></div>
          <button onClick={onClose} style={{ background:'none',border:'none',color:MUTED,cursor:'pointer',fontSize:'1.2rem' }}>✕</button>
        </div>
        <div style={{ padding:'14px 28px',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center' }}>
          {WIZARD_STEPS.map((s,i)=>(
            <div key={s} style={{ display:'flex',alignItems:'center',flex:i<WIZARD_STEPS.length-1?1:'none' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:24,height:24,borderRadius:'50%',background:i<step?GREEN:i===step?GOLD:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.62rem',color:i<=step?'#1A1810':CHARCOAL,fontWeight:700 }}>{i<step?'✓':i+1}</div>
                <span style={{ fontSize:'0.7rem',color:i===step?CREAM:MUTED,letterSpacing:'0.06em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{s}</span>
              </div>
              {i<WIZARD_STEPS.length-1&&<div style={{ flex:1,height:1,background:i<step?GREEN:BORDER,margin:'0 12px' }}/>}
            </div>
          ))}
        </div>
        <div style={{ padding:'24px 28px' }}>
          {step===0&&(
            <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
              <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={handleFileDrop}
                style={{ border:`1px dashed ${dragOver?GOLD:BORDER}`,borderRadius:4,padding:'18px',textAlign:'center',cursor:'pointer',background:dragOver?'rgba(201,146,74,0.05)':'transparent' }}
                onClick={()=>document.getElementById('wiz-file')?.click()}>
                <input id="wiz-file" type="file" accept=".pdf,.doc,.docx,.txt,.epub" style={{ display:'none' }} onChange={handleFileDrop}/>
                {file?<div><div style={{ color:GREEN,fontSize:'1rem',marginBottom:3 }}>✓</div><div style={{ color:CREAM,fontSize:'0.8rem' }}>{file.name}</div><div style={{ color:MUTED,fontSize:'0.65rem',marginTop:2 }}>{(file.size/1024/1024).toFixed(1)} MB</div></div>
                :<div><div style={{ color:CHARCOAL,fontSize:'1.2rem',marginBottom:4 }}>↑</div><div style={{ color:CREAM,fontSize:'0.78rem',marginBottom:2 }}>Drop manuscript or click to browse</div><div style={{ color:MUTED,fontSize:'0.62rem' }}>PDF · DOCX · TXT · EPUB</div></div>}
              </div>
              <ManuscriptForm form={form} setForm={setForm} nvData={nvData} mode="new"/>
              {!canProceed&&<div style={{ fontSize:'0.65rem',color:RED }}>{!hasTitle?'Title required':'Author required'}</div>}
              <button onClick={()=>setStep(1)} disabled={!canProceed} style={{ ...btnGold(!canProceed),padding:'12px' }}>Continue →</button>
            </div>
          )}
          {step===1&&(
            <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
              <div style={{ background:'#16140E',border:`1px solid ${BORDER}`,borderRadius:4,padding:'16px 18px' }}><div style={{ fontSize:'0.62rem',color:GOLD,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14 }}>Royalty Type</div><select style={inpStyle({ cursor:'pointer' })} value={form.royaltyType||''} onChange={e=>setForm(f=>({...f,royaltyType:e.target.value}))}><option value="">Select…</option>{royaltyTypes.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
              <label style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'12px 14px',border:`1px solid ${form.publicDomain?GREEN:BORDER}`,borderRadius:4,background:form.publicDomain?'rgba(74,156,122,0.08)':'transparent' }}><input type="checkbox" checked={form.publicDomain} onChange={e=>setForm(f=>({...f,publicDomain:e.target.checked}))} style={{ accentColor:GREEN }}/><div style={{ color:CREAM,fontSize:'0.83rem' }}>Public domain / royalty-free</div></label>
              {!form.publicDomain&&(<><div style={{ display:'flex',gap:14 }}><div style={{ flex:1 }}><div style={lbl}>Fee ($)</div><input style={inpStyle()} value={form.fee} type="number" placeholder="0" onChange={e=>setForm(f=>({...f,fee:e.target.value}))}/></div><div style={{ flex:1 }}><div style={lbl}>Royalty %</div><input style={inpStyle()} value={form.royaltyRate} type="number" placeholder="0" onChange={e=>setForm(f=>({...f,royaltyRate:e.target.value}))}/></div></div><div><div style={lbl}>Agreement Date</div><input style={inpStyle()} value={form.signDate} type="date" onChange={e=>setForm(f=>({...f,signDate:e.target.value}))}/></div></>)}
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={()=>setStep(0)} style={{ background:'none',border:`1px solid ${BORDER}`,color:CHARCOAL,padding:'11px 20px',fontSize:'0.72rem',cursor:'pointer',borderRadius:2,fontFamily:'DM Sans, sans-serif' }}>← Back</button>
                <button onClick={()=>setStep(2)} style={{ ...btnGold(false),flex:1,padding:'11px' }}>Continue →</button>
              </div>
            </div>
          )}
          {step===2&&(
            <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
              <div style={{ background:'#1A1810',border:`1px solid ${BORDER}`,borderRadius:4,padding:16 }}>
                <div style={{ fontSize:'0.62rem',color:MUTED,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12 }}>Confirm</div>
                {[['Title',form.name],['Author(s)',(form.authors||[]).filter(a=>a.name.trim()).map(a=>`${a.name} (${a.role})`).join(', ')||'—'],['Genre',`${form.fictionNonfiction?form.fictionNonfiction+' · ':''}${form.genre||'—'}`],['Publisher',form.publisher||'—'],['Royalty',form.royaltyType||'—'],['Source',form.discoverySource||'—'],['File',file?`${file.name}`:'None'],['Excerpt',form.excerpt?`${form.excerpt.split(/\s+/).length} words`:'—']].map(([k,v])=>(
                  <div key={k} style={{ display:'flex',gap:10,padding:'4px 0',borderBottom:`1px solid ${BORDER}` }}><span style={{ width:90,color:MUTED,fontSize:'0.7rem',flexShrink:0 }}>{k}</span><span style={{ color:CREAM,fontSize:'0.75rem',wordBreak:'break-all' }}>{v}</span></div>
                ))}
              </div>
              {error&&<div style={{ padding:'10px 14px',background:'rgba(200,75,49,0.1)',border:'1px solid rgba(200,75,49,0.2)',color:RED,fontSize:'0.75rem',borderRadius:4 }}>⚠ {error}</div>}
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={()=>setStep(1)} style={{ background:'none',border:`1px solid ${BORDER}`,color:CHARCOAL,padding:'11px 20px',fontSize:'0.72rem',cursor:'pointer',borderRadius:2,fontFamily:'DM Sans, sans-serif' }}>← Back</button>
                <button onClick={handleCreate} disabled={saving} style={{ ...btnGold(saving),flex:1,padding:'11px' }}>{saving?'Creating…':'Create Manuscript'}</button>
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
  const [importStatus, setImportStatus] = useState(null) // { total, imported }

  useEffect(() => {
    async function fetchNV() {
      try {
        const { data,error } = await supabase.from('nvpairs').select('category,label,value,sort_order').in('category',['royalty_type','author_role','fiction_nonfiction','language']).order('sort_order')
        if (error) throw error
        const g = {}; for (const r of data||[]) { if(!g[r.category])g[r.category]=[]; g[r.category].push(r.value||r.label) }
        if (Object.keys(g).length>0) setNvData(g)
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
          chapter_count, free_chapter_count, read_count, imdb_url, discovery_source,
          manuscript_scores ( scoreid, total_score, verdict, platform, episodes, pillar_a, pillar_b, pillar_c, dimension_scores, modelid, source_type, run_at ),
          manuscript_authors ( authorid, author_name, author_role, sortorder )`)
        .eq('productiongroup','TITLE').eq('activestatus','A').order('productiontitle')
      if (error) throw error

      const mapped = await Promise.all((data||[]).map(async (p) => {
        const slug = slugify(p.productiontitle)
        let hasManuscript = false
        if (userId) { try { const r = await r2.listFiles(userId,slug,'manuscripts'); hasManuscript=r.objects?.length>0 } catch{} }
        const sc = Array.isArray(p.manuscript_scores)&&p.manuscript_scores.length>0?p.manuscript_scores[p.manuscript_scores.length-1]:null
        const authors = (p.manuscript_authors||[]).sort((a,b)=>(a.sortorder||0)-(b.sortorder||0))
        return {
          id:p.productionid, title:p.productiontitle, slug,
          genre:p.genre||'', authors:authors.map(a=>a.author_name).join(', '),
          _authors:authors.map(a=>({ name:a.author_name,role:a.author_role })),
          royalty_type:p.royalty_type||'', status:p.productionstatus||'uploaded',
          episodes:sc?.episodes||null, score:sc?.total_score??null,
          platform:sc?.platform||null, version:1, language:p.language||'English',
          agreement:false, created:p.createdate, hasManuscript,
          pillarA:sc?.pillar_a??null, pillarB:sc?.pillar_b??null, pillarC:sc?.pillar_c??null,
          dimensions:sc?.dimension_scores||null,
          publisher:p.publisher, publisher_city:p.publisher_city, copyright_year:p.copyright_year,
          fiction_nonfiction:p.fiction_nonfiction, bisac:p.bisac,
          lccn_print:p.lccn_print, lccn_ebook:p.lccn_ebook,
          source_url:p.source_url, excerpt:p.excerpt, summary:p.summary,
          generated_extract:p.generated_extract,
          chapter_count:p.chapter_count, free_chapter_count:p.free_chapter_count,
          read_count:p.read_count, imdb_url:p.imdb_url, discovery_source:p.discovery_source,
        }
      }))
      setTitles(mapped)
    } catch(e) { console.error('Failed:',e) }
    setLoading(false)
  }

  useEffect(() => { loadTitles() }, [userId])

  async function handleImportXLS(file) {
    setImportStatus({ total:'…',imported:'…' })
    try {
      const result = await parseXLSAndImport(file, supabase)
      setImportStatus(result)
      loadTitles()
      setTimeout(()=>setImportStatus(null), 5000)
    } catch(e) { setImportStatus({ error:e.message }); setTimeout(()=>setImportStatus(null),5000) }
  }

  async function handleBulkDelete(ids) {
    if (!confirm(`Delete ${ids.length} titles? This cannot be undone.`)) return
    for (const id of ids) {
      await supabase.from('manuscript_user_scores').delete().match({ productionid:id })
      await supabase.from('manuscript_scores').delete().eq('productionid',id)
      await supabase.from('manuscript_authors').delete().eq('productionid',id)
      await supabase.from('productions').delete().eq('productionid',id)
    }
    loadTitles()
  }

  return (
    <div style={{ minHeight:'100vh',background:SURFACE2,fontFamily:'DM Sans, sans-serif',color:CREAM }}>
      {importStatus&&(
        <div style={{ position:'fixed',top:16,right:24,zIndex:999,background:importStatus.error?'rgba(200,75,49,0.9)':'rgba(74,156,122,0.9)',color:'#fff',padding:'12px 20px',fontSize:'0.8rem',borderRadius:4,boxShadow:'0 4px 12px rgba(0,0,0,0.3)' }}>
          {importStatus.error?`Import failed: ${importStatus.error}`:`Imported ${importStatus.imported} of ${importStatus.total} titles`}
        </div>
      )}

      {view==='list'&&(
        <>
          <TitlesDataGrid titles={titles} loading={loading}
            onNewManuscript={()=>{setPrefill(null);setView('wizard')}}
            onOpenTitle={t=>{setSelectedTitle(t);setView('detail')}}
            onImportDiscovery={()=>setShowDiscovery(true)}
            onImportXLS={handleImportXLS}
            onBulkDelete={handleBulkDelete}/>
          {showDiscovery&&<DiscoveryImportModal onClose={()=>setShowDiscovery(false)} onImport={m=>{setPrefill(m);setView('wizard')}}/>}
        </>
      )}

      {view==='detail'&&selectedTitle&&(
        <TitleDetailView title={selectedTitle} userId={userId} nvData={nvData}
          onBack={()=>{setSelectedTitle(null);loadTitles();setView('list')}}
          onDelete={()=>{setSelectedTitle(null);loadTitles();setView('list')}}
          onRefresh={loadTitles}/>
      )}

      {view==='wizard'&&(
        <ImportWizard userId={userId} nvData={nvData} prefill={prefill}
          onClose={()=>{setView('list');setPrefill(null)}}
          onComplete={()=>{loadTitles();setView('list');setPrefill(null)}}/>
      )}
    </div>
  )
}
