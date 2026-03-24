/**
 * EpisodeAssembler.jsx  —  Culmina Post-Production › Assemble Tab
 *
 * Drop at: src/components/postproduction/EpisodeAssembler.jsx
 *
 * Uses the single self-referencing `productions` table:
 *   productiongroup  = 'TITLE' | 'ARC' | 'ACT' | 'EPISODE' | 'SHOT' | 'TAKE'
 *   parentproductionid links each row to its parent
 *   Key columns: productionid, productiontitle, productionstatus,
 *                activestatus, videourl, synopsis, updatedate
 *
 * ── Supabase migration (run once) ────────────────────────────────────────────
 *
 *   create table if not exists episode_manifests (
 *     id                  uuid primary key default gen_random_uuid(),
 *     episode_id          integer unique not null
 *                           references productions(productionid) on delete cascade,
 *     manifest            jsonb not null default '[]',
 *     include_recap       boolean default false,
 *     include_title_shot  boolean default false,
 *     recap_shot_id       integer references productions(productionid),
 *     shot_count          integer,
 *     created_at          timestamptz default now(),
 *     updated_at          timestamptz default now()
 *   );
 *
 * ── Integration into Post.jsx ─────────────────────────────────────────────────
 *
 *   // 1. Import
 *   import EpisodeAssembler from '../components/postproduction/EpisodeAssembler'
 *
 *   // 2. Add to your tabs array
 *   { id: 'assemble', label: 'Assemble' }
 *
 *   // 3. Add the panel
 *   {activeTab === 'assemble' && <EpisodeAssembler />}
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// ── Brand tokens (matches existing Post.jsx palette) ──────────────────────────
const GOLD    = '#C9924A'
const CHARCOAL= '#5C574E'
const CREAM   = '#F7F2E8'
const SURFACE = '#1A1810'
const BORDER  = 'rgba(201,146,74,0.12)'
const MUTED   = '#6A6560'
const GREEN   = '#4A9C7A'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pick the best available TAKE for a shot (approved > completed > any) */
function bestTake(takes) {
  if (!takes?.length) return null
  const rank = t => t.productionstatus === 'approved' ? 2 : t.productionstatus === 'completed' ? 1 : 0
  return takes.reduce((a, b) => rank(b) > rank(a) ? b : a)
}

function takeStatus(take) {
  if (!take) return 'missing'
  if (take.productionstatus === 'approved') return 'approved'
  if (take.productionstatus === 'completed') return 'completed'
  return 'pending'
}

// ── Small UI pieces ────────────────────────────────────────────────────────────

function SectionLabel({ children, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 14px', borderBottom: `1px solid ${BORDER}`,
      background: 'rgba(201,146,74,0.03)' }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: MUTED }}>{children}</span>
      {right && <span style={{ fontSize: 10, color: MUTED }}>{right}</span>}
    </div>
  )
}

function TypeBadge({ type }) {
  const map = {
    title_shot: { label: 'Title', bg: 'rgba(122,158,200,0.15)', color: '#7A9EC8' },
    recap:      { label: 'Recap', bg: 'rgba(201,146,74,0.15)',  color: GOLD      },
    shot:       { label: 'Shot',  bg: 'rgba(92,87,78,0.2)',     color: CHARCOAL  },
  }
  const s = map[type] || map.shot
  return <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
    padding: '2px 7px', borderRadius: 2, textTransform: 'uppercase',
    letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{s.label}</span>
}

function StatusBadge({ status }) {
  const map = {
    approved:  { label: '✓ Approved',   bg: 'rgba(74,156,122,0.15)', color: GREEN     },
    completed: { label: '✓ Take Ready', bg: 'rgba(74,156,122,0.1)',  color: GREEN     },
    pending:   { label: '⏳ Pending',   bg: 'rgba(201,146,74,0.15)', color: GOLD      },
    missing:   { label: '✗ No Take',   bg: 'rgba(200,80,80,0.15)',  color: '#C85050' },
    synthetic: { label: '⚡ Injected', bg: 'rgba(122,158,200,0.1)', color: '#7A9EC8' },
  }
  const s = map[status] || map.missing
  return <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
    padding: '2px 8px', borderRadius: 2, whiteSpace: 'nowrap' }}>{s.label}</span>
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 3, padding: '4px 14px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(255,255,255,0.02)' }}>
      <span style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase',
        letterSpacing: '0.1em', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: color || CREAM, lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

function InjectRow({ icon, label, sublabel, enabled, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
      cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.35 }}>
      <input type="checkbox" checked={checked} disabled={!enabled}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: GOLD, width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: CREAM }}>{icon} {label}</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>{sublabel}</div>
      </div>
    </label>
  )
}

function SyntheticRow({ seq, type, description }) {
  return (
    <tr style={{ background: 'rgba(201,146,74,0.02)', borderTop: `1px solid ${BORDER}` }}>
      <td style={{ padding: '9px 14px', color: MUTED, fontSize: 11, textAlign: 'center' }}>{seq}</td>
      <td style={{ padding: '9px 14px', textAlign: 'center' }}><TypeBadge type={type} /></td>
      <td style={{ padding: '9px 14px', color: MUTED, fontStyle: 'italic', fontSize: 12 }}>{description}</td>
      <td style={{ padding: '9px 14px', textAlign: 'center' }}>—</td>
      <td style={{ padding: '9px 14px', textAlign: 'center' }}><StatusBadge status="synthetic" /></td>
      <td />
    </tr>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EpisodeAssembler() {
  const [titles, setTitles]         = useState([])
  const [selTitle, setSelTitle]     = useState('')
  const [episodes, setEpisodes]     = useState([])
  const [selEp, setSelEp]           = useState('')
  const [epIndex, setEpIndex]       = useState(-1)

  const [shots, setShots]           = useState([])
  const [takesMap, setTakesMap]     = useState({})   // shotId → best take row
  const [prevLastShot, setPrevLastShot] = useState(null)
  const [prevLastTake, setPrevLastTake] = useState(null)

  const [includeRecap, setIncludeRecap]         = useState(false)
  const [includeTitleShot, setIncludeTitleShot] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [toast, setToast]     = useState(null)

  // ── Load titles ───────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('productions')
      .select('productionid, productiontitle')
      .eq('productiongroup', 'TITLE')
      .eq('activestatus', 'A')
      .order('productiontitle')
      .then(({ data }) => setTitles(data || []))
  }, [])

  // ── Load episodes when title changes ─────────────────────────────────────────
  useEffect(() => {
    if (!selTitle) { setEpisodes([]); setSelEp(''); return }
    fetchEpisodes(parseInt(selTitle))
  }, [selTitle])

  async function fetchEpisodes(titleId) {
    const { data: nodes } = await supabase
      .from('productions')
      .select('productionid, productiontitle, productiongroup, parentproductionid')
      .eq('activestatus', 'A')
      .in('productiongroup', ['ARC', 'ACT', 'EPISODE'])

    if (!nodes) return

    const ch = (pid, grp) => nodes.filter(n => n.parentproductionid === pid && n.productiongroup === grp)
    const arcs = ch(titleId, 'ARC')
    const acts = arcs.flatMap(a => ch(a.productionid, 'ACT'))
    const eps  = [
      ...ch(titleId, 'EPISODE'),
      ...arcs.flatMap(a => ch(a.productionid, 'EPISODE')),
      ...acts.flatMap(a => ch(a.productionid, 'EPISODE')),
    ].sort((a, b) => a.productionid - b.productionid)

    setEpisodes(eps)
    setSelEp('')
    setShots([])
  }

  // ── Load shots when episode selected ─────────────────────────────────────────
  useEffect(() => {
    if (!selEp) { setShots([]); setEpIndex(-1); return }
    const idx = episodes.findIndex(e => e.productionid === parseInt(selEp))
    setEpIndex(idx)
    fetchEpisodeData(parseInt(selEp), idx)
  }, [selEp])

  async function fetchEpisodeData(epId, idx) {
    setLoading(true)
    setIncludeRecap(false)
    setIncludeTitleShot(false)
    setPrevLastShot(null)
    setPrevLastTake(null)
    setSaved(false)

    // 1. Shots
    const { data: shotRows } = await supabase
      .from('productions')
      .select('productionid, productiontitle, productionstatus, synopsis, videourl')
      .eq('productiongroup', 'SHOT')
      .eq('parentproductionid', epId)
      .eq('activestatus', 'A')
      .order('productionid')

    const shots_ = shotRows || []
    setShots(shots_)

    // 2. Best take per shot
    if (shots_.length) {
      const ids = shots_.map(s => s.productionid)
      const { data: takeRows } = await supabase
        .from('productions')
        .select('productionid, productionstatus, videourl, parentproductionid')
        .eq('productiongroup', 'TAKE')
        .eq('activestatus', 'A')
        .in('parentproductionid', ids)

      const map = {}
      for (const t of (takeRows || [])) {
        const cur = map[t.parentproductionid]
        if (!cur || (t.productionstatus === 'approved' && cur.productionstatus !== 'approved')) {
          map[t.parentproductionid] = t
        }
      }
      setTakesMap(map)
    } else {
      setTakesMap({})
    }

    // 3. Existing manifest
    const { data: mf } = await supabase
      .from('episode_manifests')
      .select('include_recap, include_title_shot')
      .eq('episode_id', epId)
      .maybeSingle()

    if (mf) {
      setIncludeRecap(mf.include_recap || false)
      setIncludeTitleShot(mf.include_title_shot || false)
      setSaved(true)
    }

    // 4. Previous episode's last shot (for recap)
    if (idx > 0) {
      const prevEp = episodes[idx - 1]
      const { data: prevShots } = await supabase
        .from('productions')
        .select('productionid, productiontitle')
        .eq('productiongroup', 'SHOT')
        .eq('parentproductionid', prevEp.productionid)
        .eq('activestatus', 'A')
        .order('productionid', { ascending: false })
        .limit(1)

      if (prevShots?.length) {
        const ps = prevShots[0]
        setPrevLastShot(ps)
        const { data: pt } = await supabase
          .from('productions')
          .select('productionid, productionstatus, videourl')
          .eq('productiongroup', 'TAKE')
          .eq('parentproductionid', ps.productionid)
          .eq('activestatus', 'A')
        setPrevLastTake(bestTake(pt))
      }
    }

    setLoading(false)
  }

  // ── Reorder ───────────────────────────────────────────────────────────────────
  function moveShot(i, dir) {
    const j = i + dir
    if (j < 0 || j >= shots.length) return
    const next = [...shots]
    ;[next[i], next[j]] = [next[j], next[i]]
    setShots(next)
  }

  // ── Build manifest ────────────────────────────────────────────────────────────
  function buildManifest() {
    const isEp1 = epIndex === 0
    const items = []

    if (includeTitleShot && isEp1) items.push({
      type: 'title_shot', synthetic: true,
      description: 'Series title card — generated at export',
      duration_seconds: 5,
    })

    if (includeRecap && prevLastShot) items.push({
      type: 'recap', synthetic: true,
      shot_id: prevLastShot.productionid,
      description: prevLastShot.productiontitle || 'Last shot of previous episode',
      video_url: prevLastTake?.videourl || null,
    })

    shots.forEach((shot, i) => {
      const take = takesMap[shot.productionid]
      items.push({
        type: 'shot', sequence: i + 1,
        shot_id: shot.productionid,
        shot_title: shot.productiontitle,
        take_id: take?.productionid || null,
        video_url: take?.videourl || null,
        status: takeStatus(take),
      })
    })

    return items
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function saveManifest() {
    setSaving(true)
    const { error } = await supabase.from('episode_manifests').upsert({
      episode_id:         parseInt(selEp),
      manifest:           buildManifest(),
      include_recap:      includeRecap,
      include_title_shot: includeTitleShot && epIndex === 0,
      recap_shot_id:      includeRecap && prevLastShot ? prevLastShot.productionid : null,
      shot_count:         shots.length,
      updated_at:         new Date().toISOString(),
    }, { onConflict: 'episode_id' })
    setSaving(false)
    if (!error) { setSaved(true); flash('Manifest saved', true) }
    else { flash('Error saving', false); console.error(error) }
  }

  function flash(msg, ok) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const isEp1         = epIndex === 0
  const prevEpNum     = epIndex > 0 ? `Ep ${epIndex}` : ''
  const withTake      = shots.filter(s => takesMap[s.productionid]).length
  const missing       = shots.length - withTake
  const manifestItems = selEp ? buildManifest() : []

  // ── Shared styles ─────────────────────────────────────────────────────────────
  const card   = { border: `1px solid ${BORDER}`, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }
  const sel    = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 3,
                   color: CREAM, padding: '7px 10px', fontSize: 12, width: '100%',
                   fontFamily: 'DM Sans, sans-serif' }
  const th     = { padding: '7px 14px', fontSize: 10, fontWeight: 700, color: MUTED,
                   textTransform: 'uppercase', letterSpacing: '0.08em',
                   background: 'rgba(201,146,74,0.03)', borderBottom: `1px solid ${BORDER}`,
                   textAlign: 'center', whiteSpace: 'nowrap' }
  const arrBtn = { background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
                   borderRadius: 3, width: 24, height: 24, cursor: 'pointer', color: CHARCOAL,
                   fontSize: 11, display: 'inline-flex', alignItems: 'center',
                   justifyContent: 'center', padding: 0 }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 24px', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 5 }}>Title</div>
          <select style={sel} value={selTitle}
            onChange={e => { setSelTitle(e.target.value); setSelEp('') }}>
            <option value="">— Select title —</option>
            {titles.map(t => <option key={t.productionid} value={t.productionid}>{t.productiontitle}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 5 }}>Episode</div>
          <select style={sel} value={selEp} disabled={!episodes.length}
            onChange={e => setSelEp(e.target.value)}>
            <option value="">— Select episode —</option>
            {episodes.map((e, i) => (
              <option key={e.productionid} value={e.productionid}>
                Ep {i + 1}{e.productiontitle ? `: ${e.productiontitle}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!selEp && !loading && (
        <div style={{ textAlign: 'center', padding: '72px 0', color: MUTED }}>
          <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 12 }}>🎞</div>
          <div style={{ fontSize: 13 }}>Select a title and episode to assemble</div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '72px 0', color: MUTED, fontSize: 13 }}>
          Loading…
        </div>
      )}

      {selEp && !loading && (
        <>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <StatChip label="Shots"     value={shots.length} />
            <StatChip label="With Take" value={withTake}  color={GREEN} />
            {missing > 0 && <StatChip label="No Take" value={missing} color="#C85050" />}
            <StatChip label="Manifest"  value={saved ? 'Saved ✓' : 'Unsaved'} color={saved ? GOLD : MUTED} />
          </div>

          {/* Injections */}
          <div style={card}>
            <SectionLabel right="Prepended at export">Episode Injections</SectionLabel>
            <div style={{ padding: '8px 16px' }}>
              <InjectRow icon="🎞️" label="Title Shot"
                sublabel={isEp1 ? 'Series title card, ~5 sec — Episode 1 only' : 'Available on Episode 1 only'}
                enabled={isEp1} checked={includeTitleShot} onChange={setIncludeTitleShot} />
              <div style={{ height: 1, background: BORDER }} />
              <InjectRow icon="↩️" label="Prepend Recap"
                sublabel={
                  isEp1 ? 'Not available for Episode 1' :
                  prevLastShot
                    ? `Last shot of ${prevEpNum}: "${(prevLastShot.productiontitle || '').slice(0, 55)}${(prevLastShot.productiontitle || '').length > 55 ? '…' : ''}"`
                    : 'Previous episode has no shots yet'
                }
                enabled={!isEp1 && !!prevLastShot}
                checked={includeRecap} onChange={setIncludeRecap} />
            </div>
          </div>

          {/* Manifest table */}
          <div style={card}>
            <SectionLabel right="Use ↑ ↓ to reorder">
              Clip Manifest — {manifestItems.length} item{manifestItems.length !== 1 ? 's' : ''}
            </SectionLabel>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Type</th>
                  <th style={{ ...th, textAlign: 'left' }}>Shot</th>
                  <th style={th}>Take</th>
                  <th style={th}>Status</th>
                  <th style={th}>Order</th>
                </tr>
              </thead>
              <tbody>
                {includeTitleShot && isEp1 && (
                  <SyntheticRow seq="0a" type="title_shot"
                    description="Series title card — generated at export" />
                )}
                {includeRecap && prevLastShot && (
                  <SyntheticRow seq="0b" type="recap"
                    description={`${prevLastShot.productiontitle || 'Recap shot'} (${prevEpNum})`} />
                )}

                {shots.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: MUTED, fontSize: 12 }}>
                    No shots found for this episode
                  </td></tr>
                )}

                {shots.map((shot, i) => {
                  const take = takesMap[shot.productionid]
                  const status = takeStatus(take)
                  return (
                    <tr key={shot.productionid}
                      style={{ borderTop: `1px solid ${BORDER}` }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,146,74,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: MUTED, fontSize: 11, width: 36 }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', width: 60 }}>
                        <TypeBadge type="shot" />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'left' }}>
                        <div style={{ color: CREAM, fontWeight: 500, lineHeight: 1.4 }}>
                          {shot.productiontitle || `Shot ${i + 1}`}
                        </div>
                        {shot.synopsis && (
                          <div style={{ fontSize: 11, color: MUTED, marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
                            {shot.synopsis}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', width: 70 }}>
                        {take?.videourl
                          ? <a href={take.videourl} target="_blank" rel="noreferrer"
                              style={{ color: GOLD, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>▶ View</a>
                          : <span style={{ color: MUTED, fontSize: 11 }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', width: 120 }}>
                        <StatusBadge status={status} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', width: 72 }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button style={{ ...arrBtn, opacity: i === 0 ? 0.25 : 1 }}
                            disabled={i === 0} onClick={() => moveShot(i, -1)}>↑</button>
                          <button style={{ ...arrBtn, opacity: i === shots.length - 1 ? 0.25 : 1 }}
                            disabled={i === shots.length - 1} onClick={() => moveShot(i, 1)}>↓</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {shots.length > 0 && (
              <div style={{ padding: '8px 16px', borderTop: `1px solid ${BORDER}`,
                display: 'flex', justifyContent: 'flex-end', fontSize: 11, color: MUTED, gap: 20 }}>
                <span>{shots.length} shots</span>
                <span style={{ color: CHARCOAL, fontWeight: 600 }}>{withTake} / {shots.length} have takes</span>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
            {toast && (
              <span style={{ fontSize: 12, fontWeight: 500, color: toast.ok ? GREEN : '#C85050' }}>
                {toast.msg}
              </span>
            )}
            <button
              style={{ background: GOLD, color: '#1A1810', border: 'none', borderRadius: 3,
                padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                opacity: saving || !shots.length ? 0.5 : 1 }}
              disabled={saving || !shots.length}
              onClick={saveManifest}
            >
              {saving ? 'Saving…' : saved ? 'Update Manifest' : 'Save Manifest'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
