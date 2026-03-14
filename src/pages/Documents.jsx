import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import * as r2 from '../lib/r2-client'

// ── Design Tokens ──
const GOLD     = '#C9924A'
const CREAM    = '#F7F2E8'
const SURFACE  = '#1A1810'
const SURFACE2 = '#111009'
const BORDER   = 'rgba(201,146,74,0.12)'
const MUTED    = '#6A6560'
const GREEN    = '#4A9C7A'
const RED      = '#C84B31'
const BLUE     = '#7A9EC8'

const FIXED_FOLDERS = [
  { key: 'manuscripts',         label: 'Manuscripts',          icon: '📜', description: 'Original manuscript files and revisions' },
  { key: 'manuscript-extracts', label: 'Manuscript Extracts',  icon: '✂️', description: 'Extracted scenes, chapters, and passages' },
  { key: 'legal-documents',     label: 'Legal Documents',      icon: '⚖️', description: 'Contracts, licenses, and agreements' },
  { key: 'exported-documents',  label: 'Exported Documents',   icon: '📤', description: 'Episodes, scripts, and production exports' },
  { key: 'imported-documents',  label: 'Imported Documents',   icon: '📥', description: 'Uploaded source material and references' },
  { key: 'other',               label: 'Other',                icon: '📁', description: 'Miscellaneous project files' },
]

const FILE_ICONS = {
  'application/pdf': '📄',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'text/markdown': '📋', 'text/plain': '📃',
  'video/mp4': '🎬', 'video/webm': '🎬',
  'audio/mpeg': '🎵', 'audio/wav': '🎵',
  'image/png': '🖼️', 'image/jpeg': '🖼️', 'image/webp': '🖼️',
  'application/json': '⚙️', 'application/zip': '📦',
}

function fileIcon(contentType) {
  return FILE_ICONS[contentType] || '📎'
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Breadcrumb Navigation ──
function Breadcrumbs({ path, onNavigate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '16px 0', fontSize: '0.8rem', flexWrap: 'wrap' }}>
      <span onClick={() => onNavigate('root')}
        style={{ cursor: 'pointer', color: path.length === 0 ? GOLD : MUTED, transition: 'color 0.2s' }}
        onMouseEnter={e => e.target.style.color = GOLD}
        onMouseLeave={e => { if (path.length > 0) e.target.style.color = MUTED }}>
        Repository
      </span>
      {path.map((seg, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'rgba(201,146,74,0.3)', fontSize: '0.65rem' }}>▸</span>
          <span onClick={() => onNavigate(i)}
            style={{
              cursor: i < path.length - 1 ? 'pointer' : 'default',
              color: i === path.length - 1 ? CREAM : MUTED,
              fontWeight: i === path.length - 1 ? 500 : 400,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => { if (i < path.length - 1) e.target.style.color = GOLD }}
            onMouseLeave={e => { if (i < path.length - 1) e.target.style.color = MUTED }}>
            {seg}
          </span>
        </span>
      ))}
    </div>
  )
}

// ── R2 Path Indicator ──
function R2Path({ parts }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
      marginBottom: '16px', borderRadius: '4px',
      background: 'rgba(122,158,200,0.06)', border: '1px solid rgba(122,158,200,0.12)',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: BLUE }}>
        r2://culmina-docs/{parts.join('/')}/
      </span>
    </div>
  )
}

// ── Upload Dropzone ──
function UploadZone({ userId, titleSlug, folder, onUploaded }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function handleFiles(files) {
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        await r2.uploadFile(userId, titleSlug, folder, file, {}, (p) => setProgress(p))
      }
      onUploaded()
    } catch (e) {
      setError(e.message)
    }
    setUploading(false)
    setProgress(0)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles([...e.dataTransfer.files])
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          padding: '24px', borderRadius: '6px', textAlign: 'center',
          border: `2px dashed ${dragging ? 'rgba(201,146,74,0.5)' : 'rgba(201,146,74,0.15)'}`,
          background: dragging ? 'rgba(201,146,74,0.06)' : 'rgba(201,146,74,0.02)',
          cursor: uploading ? 'default' : 'pointer', transition: 'all 0.2s',
        }}>
        <input ref={inputRef} type="file" multiple hidden onChange={e => handleFiles([...e.target.files])} />
        {uploading ? (
          <>
            <div style={{ fontSize: '0.82rem', color: GOLD, marginBottom: '8px' }}>
              Uploading... {Math.round(progress * 100)}%
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progress * 100}%`, height: '100%', background: GOLD, transition: 'width 0.2s' }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '1.2rem', marginBottom: '6px', opacity: 0.4 }}>⬆</div>
            <div style={{ fontSize: '0.8rem', color: MUTED }}>Drop files here or click to upload</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(106,101,96,0.6)', marginTop: '4px' }}>
              Files stored at <code style={{ color: BLUE }}>/{titleSlug}/{folder}/</code>
            </div>
          </>
        )}
      </div>
      {error && (
        <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(200,75,49,0.1)', border: '1px solid rgba(200,75,49,0.2)', color: RED, fontSize: '0.75rem' }}>
          ⚠ {error}
        </div>
      )}
    </div>
  )
}

// ── Title Card ──
function TitleCard({ title, folderCounts, onClick }) {
  const [hovered, setHovered] = useState(false)
  const totalFiles = folderCounts ? Object.values(folderCounts).reduce((a, b) => a + b, 0) : '...'
  const statusColor = title.status === 'In Production' ? GOLD : title.status === 'Complete' ? GREEN : BLUE

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(201,146,74,0.05)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${hovered ? 'rgba(201,146,74,0.3)' : BORDER}`,
        borderRadius: '6px', padding: '18px', cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.25)' : 'none',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 600, color: CREAM, marginBottom: '3px' }}>
            {title.name}
          </div>
          <div style={{ fontSize: '0.72rem', color: MUTED }}>
            {title.genre || 'Unclassified'} · {title.episodes || 0} Episodes
          </div>
        </div>
        {title.status && (
          <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem',
            fontWeight: 500, background: `${statusColor}18`, color: statusColor,
            border: `1px solid ${statusColor}30`, letterSpacing: '0.3px',
          }}>
            {title.status}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid rgba(255,255,255,0.04)`, paddingTop: '10px' }}>
        <span style={{ fontSize: '0.72rem', color: MUTED }}>{totalFiles} files across {FIXED_FOLDERS.length} folders</span>
        <span style={{ color: hovered ? GOLD : 'rgba(255,255,255,0.12)', fontSize: '1rem', transition: 'all 0.2s' }}>→</span>
      </div>
      <div style={{ marginTop: '8px', padding: '5px 10px', borderRadius: '3px', background: 'rgba(0,0,0,0.25)', fontFamily: 'monospace', fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}>
        r2://culmina-docs/{title.slug}/
      </div>
    </div>
  )
}

// ── Folder Row ──
function FolderRow({ folder, fileCount, onClick }) {
  const [hovered, setHovered] = useState(false)
  const empty = fileCount === 0

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '13px 16px', cursor: 'pointer',
        background: hovered ? 'rgba(201,146,74,0.04)' : 'transparent',
        borderBottom: `1px solid rgba(255,255,255,0.03)`,
        transition: 'background 0.15s',
      }}>
      <span style={{ fontSize: '1.15rem', filter: empty ? 'grayscale(0.6) opacity(0.45)' : 'none' }}>{folder.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: empty ? MUTED : CREAM }}>{folder.label}</div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(106,101,96,0.7)', marginTop: '1px' }}>{folder.description}</div>
      </div>
      <span style={{ fontSize: '0.75rem', color: empty ? 'rgba(106,101,96,0.4)' : MUTED, minWidth: '55px', textAlign: 'right' }}>
        {fileCount} {fileCount === 1 ? 'file' : 'files'}
      </span>
      <span style={{ color: hovered ? GOLD : 'rgba(255,255,255,0.08)', fontSize: '0.8rem', transition: 'color 0.15s' }}>▸</span>
    </div>
  )
}

// ── File Row ──
function FileRow({ file, onDownload, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const icon = fileIcon(file.httpMetadata?.contentType)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 16px',
        background: hovered ? 'rgba(201,146,74,0.03)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.02)',
        transition: 'background 0.12s',
      }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', color: '#D0C8BC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {file.name}
        </div>
      </div>
      <span style={{ fontSize: '0.72rem', color: MUTED, whiteSpace: 'nowrap' }}>{formatSize(file.size)}</span>
      <span style={{ fontSize: '0.72rem', color: 'rgba(106,101,96,0.6)', whiteSpace: 'nowrap', minWidth: '80px', textAlign: 'right' }}>
        {formatDate(file.lastModified)}
      </span>
      <div style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', display: 'flex', gap: '6px' }}>
        <button onClick={() => onDownload(file.name)}
          style={{
            background: 'rgba(201,146,74,0.12)', border: '1px solid rgba(201,146,74,0.25)',
            borderRadius: '3px', padding: '3px 8px', cursor: 'pointer',
            fontSize: '0.65rem', color: GOLD, letterSpacing: '0.3px',
          }}>
          Download
        </button>
        <button onClick={() => onDelete(file.name)}
          style={{
            background: 'rgba(200,75,49,0.08)', border: '1px solid rgba(200,75,49,0.2)',
            borderRadius: '3px', padding: '3px 8px', cursor: 'pointer',
            fontSize: '0.65rem', color: RED, letterSpacing: '0.3px',
          }}>
          Delete
        </button>
      </div>
    </div>
  )
}

// ── Main Page Component ──
export default function Documents() {
  const { user, endUser } = useAuth()
  const userId = user?.id

  // Navigation state
  const [view, setView] = useState('titles')       // titles | folders | files
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [fadeIn, setFadeIn] = useState(true)

  // Data state
  const [titles, setTitles] = useState([])
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [folderCounts, setFolderCounts] = useState({})
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [files, setFiles] = useState([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const transition = (cb) => {
    setFadeIn(false)
    setTimeout(() => { cb(); setFadeIn(true) }, 140)
  }

  // ── Load titles from Supabase (metadata) + R2 (file counts) ──
  const loadTitles = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      // Get title metadata from Supabase
      const { data: titleData, error: titleErr } = await supabase
        .from('productions')
        .select('productionid, productiontitle, productionstatus, productiongroup')
        .eq('productiongroup', 'TITLE')
        .eq('activestatus', 'A')
        .order('productiontitle')

      if (titleErr) throw titleErr

      // Map to the shape the UI expects
      const titlesWithSlugs = (titleData || []).map(t => ({
        titleid: t.productionid,
        name: t.productiontitle,
        status: t.productionstatus,
        genre: '',
        episodes: 0,
        slug: t.productiontitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }))


      setTitles(titlesWithSlugs)

      // Try to get file counts from R2 for each title
      const counts = {}
      for (const title of titlesWithSlugs) {
        try {
          const result = await r2.listFolders(userId, title.slug)
          const titleCounts = {}
          for (const f of result.folders) {
            titleCounts[f.key] = f.fileCount
          }
          counts[title.slug] = titleCounts
        } catch {
          // R2 might not have this title yet — that's fine
          counts[title.slug] = {}
        }
      }
      setFolderCounts(counts)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { loadTitles() }, [loadTitles])

  // ── Navigation handlers ──
  function navigateToTitles() {
    transition(() => {
      setView('titles')
      setSelectedTitle(null)
      setSelectedFolder(null)
      setBreadcrumbs([])
    })
  }

  function navigateToFolders(title) {
    transition(() => {
      setView('folders')
      setSelectedTitle(title)
      setSelectedFolder(null)
      setBreadcrumbs([title.name])
    })
  }

  async function navigateToFiles(folder) {
    transition(async () => {
      setView('files')
      setSelectedFolder(folder)
      setBreadcrumbs([selectedTitle.name, folder.label])
      await loadFiles(folder.key)
    })
  }

  async function loadFiles(folderKey) {
    setLoading(true)
    try {
      const result = await r2.listFiles(userId, selectedTitle.slug, folderKey)
      setFiles(result.objects || [])
    } catch (e) {
      setFiles([])
      // Not an error if folder is just empty
      if (!e.message.includes('404')) setError(e.message)
    }
    setLoading(false)
  }

  function handleBreadcrumbNav(target) {
    if (target === 'root') navigateToTitles()
    else if (target === 0) navigateToFolders(selectedTitle)
  }

  // ── File actions ──
  async function handleDownload(filename) {
    try {
      const { blob, contentType } = await r2.downloadFile(userId, selectedTitle.slug, selectedFolder.key, filename)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      showToast(`Download failed: ${e.message}`)
    }
  }

  async function handleDelete(filename) {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return
    try {
      await r2.deleteFile(userId, selectedTitle.slug, selectedFolder.key, filename)
      showToast('File deleted')
      await loadFiles(selectedFolder.key)
    } catch (e) {
      showToast(`Delete failed: ${e.message}`)
    }
  }

  async function handleUploaded() {
    showToast('Upload complete ✓')
    await loadFiles(selectedFolder.key)
    // Refresh folder counts
    try {
      const result = await r2.listFolders(userId, selectedTitle.slug)
      const titleCounts = {}
      for (const f of result.folders) titleCounts[f.key] = f.fileCount
      setFolderCounts(prev => ({ ...prev, [selectedTitle.slug]: titleCounts }))
    } catch {}
  }

  // ── Render ──
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM, position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '16px', right: '24px', zIndex: 999,
          background: toast.includes('failed') || toast.includes('Error') ? 'rgba(200,75,49,0.9)' : 'rgba(74,156,122,0.9)',
          color: '#fff', padding: '10px 20px', fontSize: '0.8rem', borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: 0 }}>
          Document Repository
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            padding: '5px 12px', borderRadius: '4px', fontSize: '0.68rem',
            background: 'rgba(74,156,122,0.1)', color: GREEN,
            border: '1px solid rgba(74,156,122,0.2)',
          }}>
            ● R2 Connected
          </div>
          <div style={{
            padding: '5px 12px', borderRadius: '4px', fontSize: '0.68rem',
            color: MUTED, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
          }}>
            {titles.length} Titles
          </div>
        </div>
      </div>

      <Breadcrumbs path={breadcrumbs} onNavigate={handleBreadcrumbNav} />

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'rgba(200,75,49,0.08)', border: '1px solid rgba(200,75,49,0.2)', color: RED, fontSize: '0.8rem', borderRadius: '4px' }}>
          ⚠ {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: RED, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Content */}
      <div style={{
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}>
        {/* ── Titles View ── */}
        {view === 'titles' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED, fontSize: '0.85rem' }}>Loading titles...</div>
          ) : titles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', marginBottom: '8px' }}>No titles found</div>
              <div style={{ fontSize: '0.82rem' }}>Create a title in the Manuscript module to get started.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.68rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', fontWeight: 500 }}>
                Titles
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {titles.map(title => (
                  <TitleCard
                    key={title.titleid}
                    title={title}
                    folderCounts={folderCounts[title.slug]}
                    onClick={() => navigateToFolders(title)}
                  />
                ))}
              </div>
            </>
          )
        )}

        {/* ── Folders View ── */}
        {view === 'folders' && selectedTitle && (
          <>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 600, color: CREAM, marginBottom: '3px' }}>
                {selectedTitle.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: MUTED }}>
                {selectedTitle.genre || 'Unclassified'} · {selectedTitle.episodes || 0} Episodes · {selectedTitle.status || 'Draft'}
              </div>
            </div>

            <R2Path parts={[selectedTitle.slug]} />

            <div style={{
              border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden',
              background: 'rgba(255,255,255,0.01)',
            }}>
              <div style={{
                padding: '10px 16px', borderBottom: `1px solid ${BORDER}`,
                fontSize: '0.65rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase',
                fontWeight: 500, display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Folder</span>
                <span style={{ marginRight: '24px' }}>Files</span>
              </div>
              {FIXED_FOLDERS.map(folder => (
                <FolderRow
                  key={folder.key}
                  folder={folder}
                  fileCount={(folderCounts[selectedTitle.slug] || {})[folder.key] || 0}
                  onClick={() => navigateToFiles(folder)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Files View ── */}
        {view === 'files' && selectedFolder && (
          <>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                <span style={{ fontSize: '1.3rem' }}>{selectedFolder.icon}</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 600, color: CREAM }}>
                  {selectedFolder.label}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: MUTED }}>{selectedFolder.description}</div>
            </div>

            <R2Path parts={[selectedTitle.slug, selectedFolder.key]} />

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED, fontSize: '0.82rem' }}>Loading files...</div>
            ) : files.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '10px', opacity: 0.2 }}>📂</div>
                <div style={{ fontSize: '0.85rem', color: MUTED, marginBottom: '4px' }}>No files in {selectedFolder.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(106,101,96,0.5)' }}>Upload files below to get started</div>
              </div>
            ) : (
              <div style={{
                border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <div style={{
                  padding: '10px 16px', borderBottom: `1px solid ${BORDER}`,
                  fontSize: '0.65rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontWeight: 500, display: 'flex', gap: '12px',
                }}>
                  <span style={{ flex: 1 }}>File</span>
                  <span style={{ minWidth: '60px' }}>Size</span>
                  <span style={{ minWidth: '80px', textAlign: 'right' }}>Modified</span>
                  <span style={{ width: '130px' }} />
                </div>
                {files.map((file, i) => (
                  <FileRow key={file.key || i} file={file} onDownload={handleDownload} onDelete={handleDelete} />
                ))}
              </div>
            )}

            <UploadZone
              userId={userId}
              titleSlug={selectedTitle.slug}
              folder={selectedFolder.key}
              onUploaded={handleUploaded}
            />
          </>
        )}
      </div>
    </div>
  )
}
