import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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

const lbl = { display: 'block', fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }
const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', borderRadius: '2px' }
const txtArea = { ...inp, minHeight: '72px', resize: 'vertical' }
const sel = { ...inp, cursor: 'pointer' }

const CONTENT_TYPES = ['text', 'video', 'audio']
const CONTENT_FORMATS = ['episode', 'chapter']
const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'manual']

const TYPE_ICONS = { text: '📖', video: '🎬', audio: '🎧' }
const TYPE_COLORS = {
  text:  { bg: 'rgba(201,146,74,0.12)', color: GOLD },
  video: { bg: 'rgba(122,158,200,0.12)', color: BLUE },
  audio: { bg: 'rgba(74,156,122,0.12)',  color: GREEN },
}

// ─── Source Card ──────────────────────────────────────────────────────────────
function SourceCard({ source, onClick }) {
  const [hover, setHover] = useState(false)
  const tc = TYPE_COLORS[source.contenttype] || TYPE_COLORS.text
  const icon = TYPE_ICONS[source.contenttype] || '📖'

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(201,146,74,0.04)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${hover ? 'rgba(201,146,74,0.3)' : BORDER}`,
        borderRadius: '6px', padding: '18px 20px', cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: tc.bg, fontSize: '1.3rem', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 600, color: CREAM }}>{source.sourcename}</div>
              {source.sourceurl && (
                <div style={{ fontSize: '0.68rem', color: BLUE, marginTop: '2px' }}>{source.sourceurl}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '0.6rem', background: tc.bg, color: tc.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {source.contenttype}
              </span>
              {source.agentenabled && (
                <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '0.6rem', background: 'rgba(74,156,122,0.12)', color: GREEN, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Agent Active
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: MUTED, lineHeight: 1.4, marginBottom: '8px' }}>
            {source.sourcedescription ? (source.sourcedescription.length > 120 ? source.sourcedescription.slice(0, 120) + '…' : source.sourcedescription) : 'No description'}
          </div>
          <div style={{ display: 'flex', gap: '16px', borderTop: `1px solid rgba(255,255,255,0.04)`, paddingTop: '8px' }}>
            <span style={{ fontSize: '0.68rem', color: CHARCOAL }}>
              {source.contentformat}-based · {source.defaultfreecount || 0} free
            </span>
            <span style={{ fontSize: '0.68rem', color: CHARCOAL }}>
              {source.typicalcost || 'Pricing TBD'}
            </span>
            {source.agentfrequency && source.agentfrequency !== 'manual' && (
              <span style={{ fontSize: '0.68rem', color: CHARCOAL }}>
                {source.agentfrequency} · {source.titlesperrun === 0 ? 'all' : source.titlesperrun} titles/run
              </span>
            )}
            <span style={{ marginLeft: 'auto', color: hover ? GOLD : 'rgba(255,255,255,0.1)', fontSize: '1rem', transition: 'color 0.2s' }}>→</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Genre Mapping Row ────────────────────────────────────────────────────────
function GenreMapRow({ map, culminaGenres, onUpdate, onDelete }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
      <div style={{ flex: 1 }}>
        <input value={map.sourcegenre || ''} onChange={e => onUpdate('sourcegenre', e.target.value)}
          style={inp} placeholder="Platform genre (e.g. CEO)" />
      </div>
      <span style={{ color: CHARCOAL, fontSize: '0.75rem', flexShrink: 0 }}>→</span>
      <div style={{ flex: 1 }}>
        <select value={map.culminagenre || ''} onChange={e => onUpdate('culminagenre', e.target.value)} style={sel}>
          <option value="">Select Culmina genre...</option>
          {culminaGenres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <button onClick={onDelete} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: '0.82rem', padding: '4px 8px', opacity: 0.6 }}>✕</button>
    </div>
  )
}

// ─── Source Detail / Editor ───────────────────────────────────────────────────
function SourceDetail({ sourceId, onBack }) {
  const { endUser } = useAuth()
  const [source, setSource] = useState(null)
  const [genreMaps, setGenreMaps] = useState([])
  const [culminaGenres, setCulminaGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const isNew = !sourceId

  useEffect(() => {
    loadCulminaGenres()
    if (isNew) {
      setSource({
        sourcename: '', sourceurl: '', sourcedescription: '',
        contenttype: 'text', contentformat: 'chapter',
        defaultfreecount: 0, paymentoptions: '', typicalcost: '',
        agentfrequency: 'weekly', titlesperrun: 10, agentenabled: false,
      })
      setGenreMaps([])
      setLoading(false)
    } else {
      loadSource()
    }
  }, [sourceId])

  async function loadCulminaGenres() {
    const { data } = await supabase.from('nvpair').select('nvname').eq('nvgroup', 'Genre').eq('active', true).order('nvname')
    if (data) setCulminaGenres(data.map(d => d.nvname))
  }

  async function loadSource() {
    setLoading(true)
    const [{ data: s }, { data: maps }] = await Promise.all([
      supabase.from('discovery_sources').select('*').eq('sourceid', sourceId).single(),
      supabase.from('discovery_genre_map').select('*').eq('sourceid', sourceId).eq('activestatus', 'A').order('sourcegenre'),
    ])
    if (s) setSource(s)
    if (maps) setGenreMaps(maps)
    setLoading(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  function updateSource(key, value) {
    setSource(s => ({ ...s, [key]: value }))
  }

  function addGenreMap() {
    setGenreMaps(maps => [...maps, { _isNew: true, sourcegenre: '', culminagenre: '', activestatus: 'A' }])
  }

  function updateGenreMap(index, key, value) {
    setGenreMaps(maps => maps.map((m, i) => i === index ? { ...m, [key]: value } : m))
  }

  function removeGenreMap(index) {
    const map = genreMaps[index]
    if (map.mapid) {
      setGenreMaps(maps => maps.map((m, i) => i === index ? { ...m, activestatus: 'H' } : m))
    } else {
      setGenreMaps(maps => maps.filter((_, i) => i !== index))
    }
  }

  async function handleSave() {
    if (!source.sourcename?.trim()) { showToast('Source name is required'); return }
    setSaving(true)
    try {
      let sid = sourceId

      const payload = {
        sourcename: source.sourcename,
        sourceurl: source.sourceurl || null,
        sourcedescription: source.sourcedescription || null,
        contenttype: source.contenttype,
        contentformat: source.contentformat,
        defaultfreecount: source.defaultfreecount || 0,
        paymentoptions: source.paymentoptions || null,
        typicalcost: source.typicalcost || null,
        agentfrequency: source.agentfrequency || 'manual',
        titlesperrun: source.titlesperrun || 0,
        agentenabled: !!source.agentenabled,
        updatedate: new Date().toISOString(),
      }

      if (isNew) {
        const { data, error } = await supabase.from('discovery_sources').insert({
          ...payload,
          activestatus: 'A',
          createdby: endUser?.enduserid,
          createdate: new Date().toISOString(),
        }).select().single()
        if (error) throw error
        sid = data.sourceid
      } else {
        const { error } = await supabase.from('discovery_sources').update({
          ...payload,
          updatedby: endUser?.enduserid,
        }).eq('sourceid', sid)
        if (error) throw error
      }

      // Save genre maps
      for (const map of genreMaps) {
        if (!map.sourcegenre || !map.culminagenre) continue

        const mapPayload = {
          sourceid: sid,
          sourcegenre: map.sourcegenre,
          culminagenre: map.culminagenre,
          activestatus: map.activestatus || 'A',
          updatedate: new Date().toISOString(),
        }

        if (map.mapid) {
          await supabase.from('discovery_genre_map').update(mapPayload).eq('mapid', map.mapid)
        } else if (map.activestatus !== 'H') {
          await supabase.from('discovery_genre_map').insert({ ...mapPayload, createdate: new Date().toISOString() })
        }
      }

      showToast('Source saved ✓')
      if (isNew) onBack()
      else await loadSource()
    } catch (e) {
      showToast(`Error: ${e.message}`)
    }
    setSaving(false)
  }

  async function handleDeactivate() {
    if (!confirm(`Deactivate "${source.sourcename}"? This will hide it from lists.`)) return
    await supabase.from('discovery_sources').update({ activestatus: 'H', updatedate: new Date().toISOString() }).eq('sourceid', sourceId)
    onBack()
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: MUTED }}>Loading source...</div>

  const activeGenreMaps = genreMaps.filter(m => m.activestatus !== 'H')

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: '16px', right: '24px', zIndex: 999,
          background: toast.includes('Error') ? 'rgba(200,75,49,0.9)' : 'rgba(74,156,122,0.9)',
          color: '#fff', padding: '10px 20px', fontSize: '0.8rem', borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack}
            style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '6px 14px', cursor: 'pointer', fontSize: '0.75rem', borderRadius: '2px' }}>
            ← Back
          </button>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: CREAM, margin: 0 }}>
            {isNew ? 'New Discovery Source' : source.sourcename}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isNew && (
            <button onClick={handleDeactivate}
              style={{ background: 'none', border: `1px solid rgba(200,75,49,0.3)`, color: RED, padding: '8px 16px', cursor: 'pointer', fontSize: '0.72rem', borderRadius: '2px' }}>
              Deactivate
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, borderRadius: '2px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Source'}
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontSize: '0.65rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Platform Information</div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 2 }}>
            <div style={lbl}>Source Name *</div>
            <input value={source.sourcename || ''} onChange={e => updateSource('sourcename', e.target.value)}
              style={inp} placeholder="e.g. Galatea, ReelShort" />
          </div>
          <div style={{ flex: 2 }}>
            <div style={lbl}>URL</div>
            <input value={source.sourceurl || ''} onChange={e => updateSource('sourceurl', e.target.value)}
              style={inp} placeholder="https://..." />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={lbl}>Description</div>
          <textarea value={source.sourcedescription || ''} onChange={e => updateSource('sourcedescription', e.target.value)}
            style={txtArea} placeholder="About this platform — what kind of content, target audience, unique features..." />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={lbl}>Content Type</div>
            <select value={source.contenttype || 'text'} onChange={e => updateSource('contenttype', e.target.value)} style={sel}>
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={lbl}>Content Format</div>
            <select value={source.contentformat || 'chapter'} onChange={e => updateSource('contentformat', e.target.value)} style={sel}>
              {CONTENT_FORMATS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}-based</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={lbl}>Default Free {source.contentformat === 'episode' ? 'Episodes' : 'Chapters'}</div>
            <input type="number" min="0" value={source.defaultfreecount || 0}
              onChange={e => updateSource('defaultfreecount', parseInt(e.target.value) || 0)}
              style={inp} />
          </div>
        </div>
      </div>

      {/* Payment */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontSize: '0.65rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Payment & Cost</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 2 }}>
            <div style={lbl}>Payment Options</div>
            <textarea value={source.paymentoptions || ''} onChange={e => updateSource('paymentoptions', e.target.value)}
              style={{ ...txtArea, minHeight: '56px' }} placeholder="e.g. Coin-based per chapter, subscription option, free tier..." />
          </div>
          <div style={{ flex: 1 }}>
            <div style={lbl}>Typical Cost</div>
            <input value={source.typicalcost || ''} onChange={e => updateSource('typicalcost', e.target.value)}
              style={inp} placeholder="e.g. $0.30/chapter" />
          </div>
        </div>
      </div>

      {/* Agent Config */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.65rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Agent Configuration</div>
          <div onClick={() => updateSource('agentenabled', !source.agentenabled)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <span style={{ fontSize: '0.72rem', color: source.agentenabled ? GREEN : MUTED }}>
              {source.agentenabled ? 'Agent Enabled' : 'Agent Disabled'}
            </span>
            <div style={{
              width: '40px', height: '22px', borderRadius: '11px', position: 'relative',
              background: source.agentenabled ? GREEN : 'rgba(255,255,255,0.08)',
              transition: 'background 0.2s', cursor: 'pointer',
            }}>
              <div style={{
                position: 'absolute', top: '3px', left: source.agentenabled ? '21px' : '3px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: source.agentenabled ? '#1A1810' : CHARCOAL,
                transition: 'left 0.2s',
              }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', opacity: source.agentenabled ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          <div style={{ flex: 1 }}>
            <div style={lbl}>Run Frequency</div>
            <select value={source.agentfrequency || 'weekly'} onChange={e => updateSource('agentfrequency', e.target.value)}
              disabled={!source.agentenabled} style={sel}>
              {FREQUENCIES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={lbl}>Titles per Run</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" min="0" value={source.titlesperrun || 0}
                onChange={e => updateSource('titlesperrun', parseInt(e.target.value) || 0)}
                disabled={!source.agentenabled}
                style={{ ...inp, flex: 1 }} />
              <span style={{ fontSize: '0.68rem', color: MUTED, whiteSpace: 'nowrap' }}>
                {source.titlesperrun === 0 ? '(all)' : ''}
              </span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '0.68rem', color: CHARCOAL }}>
          Set titles per run to 0 to extract all available titles each run.
        </div>
      </div>

      {/* Genre Mapping */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(201,146,74,0.03)',
        }}>
          <span style={{ fontSize: '0.68rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
            Genre Mapping ({activeGenreMaps.length})
          </span>
          <button onClick={addGenreMap}
            style={{ background: 'rgba(201,146,74,0.1)', border: `1px solid rgba(201,146,74,0.25)`, color: GOLD, padding: '5px 14px', cursor: 'pointer', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '2px' }}>
            + Add Mapping
          </button>
        </div>

        <div style={{ padding: '12px 16px' }}>
          {activeGenreMaps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: MUTED, fontSize: '0.78rem' }}>
              No genre mappings yet. Add mappings to translate this platform's genres to Culmina's genre system.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', padding: '0 0 6px' }}>
                <span style={{ flex: 1, fontSize: '0.62rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Platform Genre</span>
                <span style={{ width: '16px' }} />
                <span style={{ flex: 1, fontSize: '0.62rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Culmina Genre</span>
                <span style={{ width: '32px' }} />
              </div>
              {genreMaps.map((map, i) => {
                if (map.activestatus === 'H') return null
                return (
                  <GenreMapRow
                    key={map.mapid || `new-${i}`}
                    map={map}
                    culminaGenres={culminaGenres}
                    onUpdate={(key, val) => updateGenreMap(i, key, val)}
                    onDelete={() => removeGenreMap(i)}
                  />
                )
              })}
            </>
          )}
          {culminaGenres.length === 0 && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(201,146,74,0.06)', border: `1px solid rgba(201,146,74,0.15)`, borderRadius: '4px', fontSize: '0.72rem', color: GOLD }}>
              No Culmina genres found. Add genres to the "Genre" NVGroup in the NVPair Editor first.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Export: Discovery Sources Tab ──────────────────────────────────────
export default function DiscoverySourcesTab() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSourceId, setSelectedSourceId] = useState(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { loadSources() }, [])

  async function loadSources() {
    setLoading(true)
    const { data } = await supabase
      .from('discovery_sources')
      .select('*')
      .eq('activestatus', 'A')
      .order('sourcename')
    if (data) setSources(data)
    setLoading(false)
  }

  if (selectedSourceId !== null || showNew) {
    return (
      <SourceDetail
        sourceId={showNew ? null : selectedSourceId}
        onBack={() => { setSelectedSourceId(null); setShowNew(false); loadSources() }}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {sources.length} Sources · {sources.filter(s => s.agentenabled).length} Agents Active
        </div>
        <button onClick={() => setShowNew(true)}
          style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          + New Source
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: MUTED, fontSize: '0.82rem' }}>Loading sources...</div>
      ) : sources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: MUTED }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', marginBottom: '8px', color: CREAM }}>No discovery sources yet</div>
          <div style={{ fontSize: '0.82rem' }}>Click "+ New Source" to add a content platform for discovery.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sources.map(source => (
            <SourceCard key={source.sourceid} source={source} onClick={() => setSelectedSourceId(source.sourceid)} />
          ))}
        </div>
      )}
    </div>
  )
}
