import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

// ── Brand tokens ───────────────────────────────────────────────
const C = {
  ink:     '#1A1810',
  cream:   '#F7F2E8',
  gold:    '#C9924A',
  char:    '#5C574E',
  dim:     '#3A3830',
  ghost:   '#2A2820',
  panel:   '#12110D',
  muted:   '#6A6560',
  border:  'rgba(201,146,74,0.12)',
  borderHi:'rgba(201,146,74,0.28)',
  green:   '#4A9C7A',
  red:     '#C87A4A',
  purple:  '#9C7AC8',
  blue:    '#7A9EC8',
}

const LEVEL_COLORS = {
  TITLE:   C.gold,
  ARC:     C.purple,
  ACT:     C.blue,
  EPISODE: C.green,
  SHOT:    C.red,
  TAKE:    C.char,
}
const LEVEL_ICONS = {
  TITLE: '▣', ARC: '◠', ACT: '≡', EPISODE: '▶', SHOT: '◎', TAKE: '◈',
}
const CHILD_MAP = {
  TITLE: 'ARC', ARC: 'ACT', ACT: 'EPISODE', EPISODE: 'SHOT', SHOT: 'TAKE',
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: C.ink,
    color: C.cream,
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px 28px 16px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.5rem',
    fontWeight: 600,
    color: C.cream,
    letterSpacing: '0.02em',
    margin: 0,
  },
  headerSub: {
    fontSize: '0.75rem',
    color: C.muted,
    marginTop: '2px',
  },
  btn: (variant = 'ghost') => ({
    padding: variant === 'primary' ? '8px 18px' : '7px 14px',
    borderRadius: '6px',
    border: variant === 'primary' ? 'none' : `1px solid ${C.borderHi}`,
    background: variant === 'primary' ? C.gold : 'transparent',
    color: variant === 'primary' ? C.ink : C.cream,
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  }),
}

// ── Utility ───────────────────────────────────────────────────
function buildTree(flat) {
  const map = {}
  flat.forEach(n => { map[n.productionid] = { ...n, children: [] } })
  const roots = []
  flat.forEach(n => {
    if (n.parentproductionid && map[n.parentproductionid]) map[n.parentproductionid].children.push(map[n.productionid])
    else if (!n.parentproductionid) roots.push(map[n.productionid])
  })
  return roots
}

function flattenTitles(tree) {
  return tree.filter(n => n.productiongroup === 'TITLE')
}

function countDescendants(node, type) {
  let c = 0
  if (node.productiongroup === type) c++
  ;(node.children || []).forEach(ch => { c += countDescendants(ch, type) })
  return c
}

// ── Components ────────────────────────────────────────────────

// Grid Card for landing view
function TitleCard({ node, onOpen, onGenerateAssets, onSeriesBible, onProductionGuide }) {
  const arcs     = countDescendants(node, 'ARC')
  const episodes = countDescendants(node, 'EPISODE')
  const shots    = countDescendants(node, 'SHOT')

  return (
    <div style={{
      background: C.ghost,
      border: `1px solid ${C.border}`,
      borderRadius: '10px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      transition: 'border-color 0.15s',
      cursor: 'default',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: C.gold, fontSize: '0.85rem' }}>▣</span>
            <span
              style={{ fontSize: '1rem', fontWeight: 700, color: C.cream, cursor: 'pointer', fontFamily: "'Cormorant Garamond', serif' ", letterSpacing: '0.01em' }}
              onClick={() => onOpen(node)}
            >
              {node.productiontitle || node.title || 'Untitled'}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: C.muted }}>
            {node.activestatus === 'A' ? '● Active' : '○ Inactive'}
            {node.productionstatus && <span style={{ marginLeft: '10px' }}>{node.productionstatus}</span>}
          </div>
        </div>
        <button
          style={{ ...S.btn('ghost'), fontSize: '0.72rem', padding: '5px 10px', flexShrink: 0 }}
          onClick={() => onOpen(node)}
        >
          Open ↗
        </button>
      </div>

      {/* Heuristics */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {[
          { label: 'Arcs',     val: arcs,     color: C.purple },
          { label: 'Episodes', val: episodes, color: C.green },
          { label: 'Shots',    val: shots,    color: C.red },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color, fontFamily: "'Cormorant Garamond', serif'" }}>{val}</div>
            <div style={{ fontSize: '0.65rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: `1px solid ${C.border}`, paddingTop: '14px' }}>
        <ActionButton icon="🎨" label="Generate Assets"      onClick={() => onGenerateAssets(node)} />
        <ActionButton icon="📖" label="Series Bible"         onClick={() => onSeriesBible(node)} />
        <ActionButton icon="🎬" label="AI Production Guide"  onClick={() => onProductionGuide(node)} />
      </div>
    </div>
  )
}

function ActionButton({ icon, label, onClick, loading }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '7px 12px',
        borderRadius: '6px',
        border: `1px solid ${hover ? C.gold : C.borderHi}`,
        background: hover ? 'rgba(201,146,74,0.08)' : 'transparent',
        color: hover ? C.gold : C.cream,
        fontSize: '0.72rem',
        fontWeight: 600,
        cursor: loading ? 'wait' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'all 0.15s',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? <Spinner /> : icon} {label}
    </button>
  )
}

function Spinner() {
  return <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', fontSize: '0.7rem' }}>⟳</span>
}

// Tree node in detail view
function TreeNode({ node, depth, selectedId, onSelect, expanded, onToggle, onAddChild }) {
  const hasChildren = node.children && node.children.length > 0
  const isSelected  = selectedId === node.productionid
  const isExpanded  = expanded[node.productionid]
  const color       = LEVEL_COLORS[node.productiongroup] || C.char

  return (
    <div>
      <div
        onClick={() => onSelect(node)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: `5px 8px 5px ${12 + depth * 14}px`,
          cursor: 'pointer', userSelect: 'none',
          background: isSelected ? 'rgba(201,146,74,0.1)' : 'transparent',
          borderLeft: isSelected ? `2px solid ${C.gold}` : '2px solid transparent',
          transition: 'all 0.12s',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
      >
        <span
          onClick={e => { e.stopPropagation(); if (hasChildren) onToggle(node.productionid) }}
          style={{
            color: C.muted, fontSize: '0.55rem', width: '10px', flexShrink: 0,
            cursor: hasChildren ? 'pointer' : 'default',
            transform: isExpanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s', display: 'inline-block',
          }}
        >{hasChildren ? '▶' : ''}</span>
        <span style={{ fontSize: '0.7rem', color, flexShrink: 0 }}>{LEVEL_ICONS[node.productiongroup]}</span>
        <span style={{ fontSize: '0.78rem', color: isSelected ? C.gold : C.cream, fontWeight: isSelected ? 600 : 400 }}>
          {node.productiontitle || node.title || 'Untitled'}
        </span>
      </div>
      {isExpanded && hasChildren && node.children.map(ch => (
        <TreeNode key={ch.productionid} node={ch} depth={depth + 1}
          selectedId={selectedId} onSelect={onSelect}
          expanded={expanded} onToggle={onToggle} onAddChild={onAddChild} />
      ))}
    </div>
  )
}

// Modal overlay — supports text preview and Series Bible confirm modes
function Modal({ title, content, onClose, biblePreview, onConfirmBible, bibleWriting }) {
  if (!content && !biblePreview) return null

  const isBible = !!biblePreview

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: C.ghost, border: `1px solid ${C.borderHi}`,
        borderRadius: '12px', width: '100%', maxWidth: '680px',
        maxHeight: '82vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {isBible ? (
            // Bible confirm view — show summary stats
            <div>
              <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'rgba(201,146,74,0.06)', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '0.7rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Will write to database</div>
                {[
                  { label: 'Title fields updated', val: '✓', color: C.gold },
                  { label: 'Arcs',     val: biblePreview.arcs?.length || 0,     color: C.purple },
                  { label: 'Acts',     val: biblePreview.arcs?.reduce((s, a) => s + (a.acts?.length || 0), 0) || 0, color: C.blue },
                  { label: 'Episodes', val: biblePreview.arcs?.reduce((s, a) => s + (a.acts?.reduce((ss, act) => ss + (act.episodes?.length || 0), 0) || 0), 0) || 0, color: C.green },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '0.82rem', color: C.cream }}>{label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.72rem', color: C.muted, lineHeight: 1.6 }}>
                ⚠️ This will <strong style={{ color: C.cream }}>delete all existing</strong> Arcs, Acts, and Episodes under this title and replace them with the generated hierarchy. Title metadata fields will be overwritten.
              </div>

              {/* Arc preview */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Arc Preview</div>
                {(biblePreview.arcs || []).map((arc, i) => (
                  <div key={i} style={{ marginBottom: '8px', padding: '10px 12px', background: C.panel, borderRadius: '6px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: C.purple, marginBottom: '2px' }}>◠ {arc.name}</div>
                    <div style={{ fontSize: '0.72rem', color: C.muted }}>{arc.description?.slice(0, 120)}{arc.description?.length > 120 ? '…' : ''}</div>
                    <div style={{ fontSize: '0.68rem', color: C.char, marginTop: '4px' }}>
                      {arc.acts?.length || 0} acts · {arc.acts?.reduce((s, a) => s + (a.episodes?.length || 0), 0) || 0} episodes
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Plain text preview
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: C.cream, lineHeight: 1.7, margin: 0 }}>
              {content}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button style={S.btn('ghost')} onClick={onClose} disabled={bibleWriting}>Cancel</button>
          {isBible ? (
            <button
              style={{ ...S.btn('primary'), opacity: bibleWriting ? 0.6 : 1 }}
              onClick={onConfirmBible}
              disabled={bibleWriting}
            >
              {bibleWriting ? <><Spinner /> Writing…</> : '✓ Write to Database'}
            </button>
          ) : (
            <button style={S.btn('ghost')} onClick={() => navigator.clipboard?.writeText(content)}>Copy</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Inheritance resolution ───────────────────────────────────
// Walks up the node's ancestor chain (passed as ancestorMap) to find
// the nearest non-null value for a field. Returns { value, sourceGroup }.
function resolveInherited(key, node, allNodes) {
  const map = {}
  allNodes.forEach(n => { map[n.productionid] = n })
  let current = node
  while (current) {
    const val = current[key]
    if (val !== null && val !== undefined && val !== '') {
      return { value: val, sourceGroup: current.productiongroup, sourceId: current.productionid }
    }
    current = current.parentproductionid ? map[current.parentproductionid] : null
  }
  return { value: null, sourceGroup: null, sourceId: null }
}

// Resolve additive negative prompts from root down to node
function resolveNegativePrompts(node, allNodes) {
  const map = {}
  allNodes.forEach(n => { map[n.productionid] = n })
  const chain = []
  let current = node
  while (current) {
    chain.unshift(current)
    current = current.parentproductionid ? map[current.parentproductionid] : null
  }
  return chain.filter(n => n.negativeprompt).map(n => n.negativeprompt).join(', ')
}

const LEVEL_BADGE_COLORS = {
  TITLE: '#C9924A', ARC: '#9C7AC8', ACT: '#7A9EC8',
  EPISODE: '#4A9C7A', SHOT: '#C87A4A',
}

// Detail view for a selected node
function NodeDetailPanel({ node, onSave, onAddChild, allNodes }) {
  const [form,          setForm]          = useState({})
  const [shotAssets,    setShotAssets]    = useState([])   // production_assets for this shot
  const [episodeAssets, setEpisodeAssets] = useState([])   // production_assets for parent episode
  const [availAssets,   setAvailAssets]   = useState([])   // all assets for this title
  const [assetTab,      setAssetTab]      = useState('cast') // 'cast' | 'sets' | 'props' | 'other'
  const [loadingAssets, setLoadingAssets] = useState(false)

  useEffect(() => {
    if (node) {
      setForm({ ...node })
      if (node.productiongroup === 'EPISODE' || node.productiongroup === 'SHOT') {
        loadAssetData(node)
      }
    }
  }, [node?.productionid])

  const loadAssetData = async (n) => {
    setLoadingAssets(true)
    // Find title productionid by walking up
    const map = {}
    allNodes.forEach(a => { map[a.productionid] = a })
    let cur = n
    while (cur && cur.productiongroup !== 'TITLE') {
      cur = cur.parentproductionid ? map[cur.parentproductionid] : null
    }
    const titleId = cur?.productionid || cur?.titleproductionid

    // Load all assets for this title
    if (titleId) {
      const { data: assets } = await supabase
        .from('assets')
        .select('assetid, assetname, name, assettype, characterimportance, assetinstances(instanceid, instancename)')
        .eq('titleproductionid', titleId)
        .eq('activestatus', 'A')
        .order('assetname')
      setAvailAssets(assets || [])
    }

    // Load this node's production_assets
    const { data: nodeAssets } = await supabase
      .from('production_assets')
      .select('*, assets(assetname, name, assettype), assetinstances(instancename)')
      .eq('productionid', n.productionid)
      .eq('activestatus', 'A')
    setShotAssets(nodeAssets || [])

    // If shot, also load parent episode assets
    if (n.productiongroup === 'SHOT' && n.parentproductionid) {
      const { data: epAssets } = await supabase
        .from('production_assets')
        .select('*, assets(assetname, name, assettype), assetinstances(instancename)')
        .eq('productionid', n.parentproductionid)
        .eq('activestatus', 'A')
      setEpisodeAssets(epAssets || [])
    } else {
      setEpisodeAssets([])
    }
    setLoadingAssets(false)
  }

  const toggleShotAsset = async (epAsset, included) => {
    // Check if override already exists
    const existing = shotAssets.find(s =>
      s.assetid === epAsset.assetid &&
      (s.instanceid === epAsset.instanceid || (!s.instanceid && !epAsset.instanceid))
    )
    if (existing) {
      if (existing.included === included) {
        // Remove override — delete the shot-level row
        await supabase.from('production_assets').delete().eq('id', existing.id)
      } else {
        await supabase.from('production_assets').update({ included }).eq('id', existing.id)
      }
    } else {
      await supabase.from('production_assets').insert([{
        productionid: node.productionid,
        assetid:      epAsset.assetid,
        instanceid:   epAsset.instanceid || null,
        assetlevel:   'SHOT',
        included,
        activestatus: 'A',
      }])
    }
    await loadAssetData(node)
  }

  const addEpisodeAsset = async (assetid, instanceid) => {
    const existing = (node.productiongroup === 'SHOT' ? shotAssets : shotAssets)
      .find(a => a.assetid === assetid && a.instanceid === (instanceid || null))
    if (existing) return
    await supabase.from('production_assets').insert([{
      productionid: node.productionid,
      assetid,
      instanceid:   instanceid || null,
      assetlevel:   node.productiongroup,
      included:     true,
      activestatus: 'A',
    }])
    await loadAssetData(node)
  }

  const removeAsset = async (paId) => {
    await supabase.from('production_assets').update({ activestatus: 'I' }).eq('id', paId)
    await loadAssetData(node)
  }

  if (!node) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '0.85rem' }}>
      Select a node to edit
    </div>
  )

  // ── Inherited field renderer ──────────────────────────────
  const inheritableField = (key, label, opts = {}) => {
    const isShot = node.productiongroup === 'SHOT'
    const isShotOnly = opts.shotOnly
    const resolved = resolveInherited(key, node, allNodes)
    const isOverriding = form[key] && form[key] !== '' &&
      resolved.sourceId !== node.productionid &&
      resolved.value === form[key]
    const inheritedFrom = resolved.sourceGroup && resolved.sourceId !== node.productionid
      ? resolved.sourceGroup : null
    const placeholder = inheritedFrom
      ? `↑ ${inheritedFrom}: ${(resolved.value || '').slice(0, 50)}${resolved.value?.length > 50 ? '…' : ''}`
      : (opts.placeholder || '')

    return (
      <div style={{ marginBottom: '14px' }} key={key}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
          <label style={{ fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
          {inheritedFrom && !form[key] && (
            <span style={{ fontSize: '0.6rem', background: `${LEVEL_BADGE_COLORS[inheritedFrom]}22`, color: LEVEL_BADGE_COLORS[inheritedFrom], padding: '1px 6px', borderRadius: '3px', letterSpacing: '0.06em' }}>
              ↑ {inheritedFrom}
            </span>
          )}
          {form[key] && inheritedFrom && (
            <span style={{ fontSize: '0.6rem', background: 'rgba(74,156,122,0.15)', color: C.green, padding: '1px 6px', borderRadius: '3px' }}>
              OVERRIDDEN
            </span>
          )}
          {form[key] && inheritedFrom && (
            <button
              onClick={() => setForm(f => ({ ...f, [key]: '' }))}
              style={{ fontSize: '0.58rem', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', padding: '0 4px' }}
            >↩ Revert</button>
          )}
        </div>
        {opts.textarea ? (
          <textarea
            value={form[key] || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            rows={opts.rows || 3}
            style={{ width: '100%', background: C.dim, border: `1px solid ${form[key] ? C.green + '44' : C.border}`, borderRadius: '6px', padding: '8px 10px', color: C.cream, fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        ) : opts.select ? (
          <select
            value={form[key] || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{ width: '100%', background: C.dim, border: `1px solid ${form[key] ? C.green + '44' : C.border}`, borderRadius: '6px', padding: '8px 10px', color: form[key] ? C.cream : C.muted, fontSize: '0.82rem' }}
          >
            <option value="">{placeholder || '— Select —'}</option>
            {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type="text"
            value={form[key] || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            style={{ width: '100%', background: C.dim, border: `1px solid ${form[key] ? C.green + '44' : C.border}`, borderRadius: '6px', padding: '8px 10px', color: C.cream, fontSize: '0.82rem', boxSizing: 'border-box' }}
          />
        )}
      </div>
    )
  }

  // ── Standard field (non-inheritable) ─────────────────────
  const field = (key, label, opts = {}) => (
    <div style={{ marginBottom: '14px' }} key={key}>
      <label style={{ display: 'block', fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{label}</label>
      {opts.textarea ? (
        <textarea value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={opts.rows || 3}
          style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 10px', color: C.cream, fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      ) : opts.select ? (
        <select value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 10px', color: C.cream, fontSize: '0.82rem' }}>
          <option value="">— Select —</option>
          {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 10px', color: C.cream, fontSize: '0.82rem', boxSizing: 'border-box' }} />
      )}
    </div>
  )

  // ── Asset panel (Episode + Shot) ──────────────────────────
  const AssetPanel = () => {
    const isShot = node.productiongroup === 'SHOT'
    const displayAssets = isShot ? episodeAssets : shotAssets
    const ownAssets = shotAssets

    // For shots: episode assets with shot-level override state
    const getShotState = (epAsset) => {
      const override = ownAssets.find(s =>
        s.assetid === epAsset.assetid &&
        (s.instanceid === epAsset.instanceid || (!s.instanceid && !epAsset.instanceid))
      )
      if (!override) return 'inherited'  // included by default
      return override.included ? 'included' : 'excluded'
    }

    const filterByTab = (assets) => assets.filter(a => {
      const type = a.assets?.assettype || ''
      if (assetTab === 'cast') return ['Person','Animal','AnimateObject'].includes(type)
      if (assetTab === 'sets') return type === 'Set'
      if (assetTab === 'props') return type === 'Prop'
      return !['Person','Animal','AnimateObject','Set','Prop'].includes(type)
    })

    return (
      <div style={{ marginTop: '24px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
        <div style={{ fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          {isShot ? 'Shot Assets (inherited from Episode)' : 'Episode Assets'}
        </div>

        {/* Asset type tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {[['cast','👥 Cast'],['sets','🏛 Sets'],['props','📦 Props'],['other','◈ Other']].map(([k,l]) => (
            <button key={k} onClick={() => setAssetTab(k)} style={{
              padding: '4px 10px', borderRadius: '4px', border: `1px solid ${assetTab === k ? C.gold : C.border}`,
              background: assetTab === k ? 'rgba(201,146,74,0.1)' : 'transparent',
              color: assetTab === k ? C.gold : C.muted, fontSize: '0.68rem', cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>

        {loadingAssets ? (
          <div style={{ fontSize: '0.72rem', color: C.muted }}>Loading…</div>
        ) : isShot ? (
          // Shot view: episode assets as checkboxes
          <div>
            {filterByTab(episodeAssets).length === 0 && (
              <div style={{ fontSize: '0.72rem', color: C.muted }}>No episode assets in this category</div>
            )}
            {filterByTab(episodeAssets).map(ea => {
              const state = getShotState(ea)
              const label = ea.assets?.assetname || ea.assets?.name || 'Unknown'
              const inst = ea.assetinstances?.instancename
              return (
                <div key={ea.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => toggleShotAsset(ea, true)} style={{
                      width: '18px', height: '18px', borderRadius: '3px', border: `1px solid ${state !== 'excluded' ? C.green : C.border}`,
                      background: state !== 'excluded' ? 'rgba(74,156,122,0.2)' : 'transparent',
                      cursor: 'pointer', fontSize: '0.6rem', color: C.green,
                    }}>✓</button>
                    <button onClick={() => toggleShotAsset(ea, false)} style={{
                      width: '18px', height: '18px', borderRadius: '3px', border: `1px solid ${state === 'excluded' ? C.red : C.border}`,
                      background: state === 'excluded' ? 'rgba(200,122,74,0.2)' : 'transparent',
                      cursor: 'pointer', fontSize: '0.6rem', color: C.red,
                    }}>✕</button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: state === 'excluded' ? C.muted : C.cream, textDecoration: state === 'excluded' ? 'line-through' : 'none', flex: 1 }}>
                    {label}{inst ? ` — ${inst}` : ''}
                  </span>
                  {state === 'inherited' && <span style={{ fontSize: '0.6rem', color: C.muted }}>↑ EP</span>}
                </div>
              )
            })}
          </div>
        ) : (
          // Episode view: own assets list + add from available
          <div>
            {filterByTab(ownAssets).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '0.72rem', flex: 1, color: C.cream }}>
                  {a.assets?.assetname || a.assets?.name}
                  {a.assetinstances?.instancename ? ` — ${a.assetinstances.instancename}` : ''}
                </span>
                <button onClick={() => removeAsset(a.id)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
              </div>
            ))}
            {/* Add asset from title pool */}
            <div style={{ marginTop: '10px' }}>
              <select
                onChange={e => {
                  if (!e.target.value) return
                  const [aid, iid] = e.target.value.split(':')
                  addEpisodeAsset(Number(aid), iid ? Number(iid) : null)
                  e.target.value = ''
                }}
                style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '6px 8px', color: C.muted, fontSize: '0.72rem' }}
              >
                <option value="">+ Add asset…</option>
                {filterByTab(availAssets.map(a => ({ assets: a, assetid: a.assetid, instanceid: null }))).map(a => {
                  const asset = a.assets
                  return [
                    <option key={`${asset.assetid}:null`} value={`${asset.assetid}:`}>{asset.assetname || asset.name}</option>,
                    ...(asset.assetinstances || []).map(inst => (
                      <option key={`${asset.assetid}:${inst.instanceid}`} value={`${asset.assetid}:${inst.instanceid}`}>
                        {asset.assetname || asset.name} — {inst.instancename}
                      </option>
                    ))
                  ]
                })}
              </select>
            </div>
          </div>
        )}
      </div>
    )
  }

  const childType = CHILD_MAP[node.productiongroup]
  const isEpisodeOrShot = node.productiongroup === 'EPISODE' || node.productiongroup === 'SHOT'
  const resolvedNeg = resolveNegativePrompts(node, allNodes)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
      {/* Node type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.95rem', color: LEVEL_COLORS[node.productiongroup] }}>{LEVEL_ICONS[node.productiongroup]}</span>
        <span style={{ fontSize: '0.7rem', color: LEVEL_COLORS[node.productiongroup], textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{node.productiongroup}</span>
        {childType && (
          <button onClick={() => onAddChild(node)} style={{ ...S.btn('ghost'), fontSize: '0.68rem', padding: '4px 10px', marginLeft: 'auto' }}>
            + Add {childType}
          </button>
        )}
      </div>

      {/* ── Core fields ── */}
      {field('productiontitle', 'Name')}
      {field('synopsis', 'Description', { textarea: true, rows: 3 })}

      {/* ── Title-only fields ── */}
      {node.productiongroup === 'TITLE' && <>
        <div style={{ fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 10px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
          Series Visual Identity
        </div>
        {field('aspectratio', 'Aspect Ratio', { select: true, options: ['9:16 Vertical', '16:9 Horizontal', '1:1 Square', '4:5'] })}
        {field('language', 'Language', { select: true, options: ['English', 'Spanish', 'Portuguese', 'Mandarin', 'Hindi', 'French'] })}
        {field('visualstyle', 'Visual Style', { textarea: true, rows: 2, placeholder: 'e.g. Neo-noir, high contrast, deep shadows, neon accents' })}
        {field('moodtone', 'Mood / Tone', { placeholder: 'e.g. Tense, claustrophobic, desperate' })}
        {field('lensdof', 'Lens / Depth of Field', { placeholder: 'e.g. Shallow DOF, 50mm f/1.4' })}
        {field('negativeprompt', 'Negative Prompt', { textarea: true, rows: 2, placeholder: 'What to exclude from all video generation' })}
      </>}

      {/* ── Arc fields ── */}
      {node.productiongroup === 'ARC' && <>
        <div style={{ fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 10px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
          Arc Visual Style
        </div>
        {inheritableField('visualstyle', 'Visual Style', { textarea: true, rows: 2 })}
        {inheritableField('moodtone', 'Mood / Tone')}
        {inheritableField('lensdof', 'Lens / Depth of Field')}
        {field('negativeprompt', 'Negative Prompt (adds to Title)', { textarea: true, rows: 2, placeholder: 'Additional exclusions for this arc' })}
      </>}

      {/* ── Act fields ── */}
      {node.productiongroup === 'ACT' && <>
        <div style={{ fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 10px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
          Act Visual Style
        </div>
        {inheritableField('visualstyle', 'Visual Style', { textarea: true, rows: 2 })}
        {inheritableField('moodtone', 'Mood / Tone')}
        {field('negativeprompt', 'Negative Prompt (adds up chain)', { textarea: true, rows: 2 })}
      </>}

      {/* ── Episode fields ── */}
      {node.productiongroup === 'EPISODE' && <>
        {field('episodenumber', 'Episode #')}
        {field('logline', 'Logline', { textarea: true, rows: 2 })}
        {field('cliffhanger', 'Cliffhanger', { textarea: true, rows: 2 })}
        {field('targetruntime', 'Target Runtime (sec)')}
        <div style={{ fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 10px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
          Episode Visual Style
        </div>
        {inheritableField('visualstyle', 'Visual Style', { textarea: true, rows: 2 })}
        {inheritableField('moodtone', 'Mood / Tone')}
        {inheritableField('lensdof', 'Lens / Depth of Field')}
        {inheritableField('referenceimageflag', 'Use Reference Images (Image-to-Video)', { select: true, options: ['true','false'] })}
        {field('negativeprompt', 'Negative Prompt (adds up chain)', { textarea: true, rows: 2 })}
      </>}

      {/* ── Shot fields ── */}
      {node.productiongroup === 'SHOT' && <>
        {field('shotlength', 'Length (sec)')}
        {field('cameraangle', 'Camera Angle', { placeholder: 'e.g. Medium Two Shot, Close-Up, Wide Establishing' })}
        {field('cameramovement', 'Camera Movement', { placeholder: 'e.g. Slow dolly in, handheld tracking, static' })}
        {field('subjectaction', 'Subject Action', { placeholder: 'e.g. Raises sword, turns to camera, breaks into tears' })}
        {inheritableField('moodtone', 'Mood / Tone')}
        {inheritableField('visualstyle', 'Visual Style')}
        {inheritableField('lensdof', 'Lens / Depth of Field')}
        {inheritableField('referenceimageflag', 'Use Reference Images', { select: true, options: ['true','false'] })}
        {/* Resolved negative prompts — read-only combined view */}
        {resolvedNeg && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
              Negative Prompt (resolved)
            </label>
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 10px', fontSize: '0.75rem', color: C.muted, fontFamily: 'monospace' }}>
              {resolvedNeg}
            </div>
          </div>
        )}
        {field('negativeprompt', 'Negative Prompt (shot-specific additions)', { textarea: true, rows: 2 })}
        {field('lighting', 'Lighting')}
        {field('prompt', 'Veo Prompt', { textarea: true, rows: 5 })}
        {field('script', 'Script / Dialog', { textarea: true, rows: 4 })}
        {field('notes', 'Notes', { textarea: true, rows: 2 })}
      </>}

      {/* ── Status fields ── */}
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
        {field('productionstatus', 'Stage', { select: true, options: ['Development', 'Pre-Production', 'Production', 'Post-Production', 'Distribution', 'Complete'] })}
        {field('activestatus', 'Status', { select: true, options: ['A', 'I', 'H'] })}
      </div>

      {/* ── Asset panel (Episode + Shot) ── */}
      {isEpisodeOrShot && <AssetPanel />}

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
        <button style={S.btn('primary')} onClick={() => onSave(form)}>Save Changes</button>
      </div>
    </div>
  )
}


// ── AI Generation helpers ─────────────────────────────────────

async function callClaude(prompt, maxTokens = 4000) {
  const res = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

function buildAssetsPrompt(titleNode) {
  return `You are Culmina AI Drama Studio's Asset Generator. Return ONLY valid JSON — no markdown, no preamble, no backticks.

Generate a complete asset list for this micro-drama series:

TITLE: ${titleNode.productiontitle}
DESCRIPTION: ${titleNode.description || '(infer from title)'}
TONE: ${titleNode.tone || ''}
SETTING: ${titleNode.settingdescription || ''}

Return this exact JSON structure:
{
  "characters": [
    {
      "assetname": "Character full name",
      "assettype": "Person",
      "characterimportance": "Lead",
      "speakingrole": true,
      "sex": "Male",
      "age": "late 20s",
      "heightft": 6, "heightin": 1,
      "weightlbs": 185,
      "bodyshape": "Athletic",
      "skintone": "Medium",
      "ethnicity": "Caucasian",
      "haircolor": "Dark brown",
      "hairlength": "Short",
      "eyecolor": "Green",
      "scars": "Small scar above left eyebrow",
      "tattoos": "None",
      "piercings": "None",
      "description": "2-3 sentence character description",
      "instances": [
        {
          "instancename": "Hero Portrait",
          "clothingdescription": "Detailed clothing for this instance",
          "prompt": "Full detailed Imagen/Midjourney photorealistic cinematic portrait prompt 80+ words",
          "voiceprompt": "ElevenLabs voice direction: tone, accent, pace, style, emotional quality"
        }
      ]
    }
  ],
  "sets": [
    {
      "assetname": "Location name",
      "assettype": "Set",
      "description": "2 sentence set description",
      "setdominantcolor": "#hex",
      "setsecondarycolor": "#hex",
      "setaccentcolor": "#hex",
      "instances": [
        {
          "instancename": "Day Exterior",
          "prompt": "Full detailed Imagen/Veo environment reference prompt 80+ words",
          "voiceprompt": "Ambient audio description or sound design notes"
        }
      ]
    }
  ]
}

Requirements:
- ALL named characters with 2-4 instances each
- ALL key sets with 1-2 instances each
- Every prompt must be 80+ words, photorealistic, cinematic
- Return ONLY the JSON object, nothing else`
}

function buildSeriesBiblePrompt(titleNode) {
  return `You are Culmina AI Drama Studio's Series Bible Generator. Return ONLY valid JSON — no markdown, no preamble, no backticks.

Generate a complete Series Bible for this micro-drama production targeting ReelShort and TikTok:

TITLE: ${titleNode.productiontitle}
DESCRIPTION: ${titleNode.description || '(no description provided — infer from title)'}

Return this exact JSON structure:

{
  "title": {
    "overview": "2-3 paragraph series overview",
    "genre": "e.g. Romantic Thriller, Fantasy Romance",
    "settingdescription": "e.g. Paris, Dover, London, Calais",
    "timeperiod": "e.g. September–October 1792",
    "tone": "e.g. Suspenseful, romantic, witty. Think Bridgerton meets Mission: Impossible.",
    "aspectratio": "9:16 Vertical",
    "hook": "1 compelling paragraph hook",
    "centralconflict": "1-2 paragraph central conflict",
    "whymicrodrama": "1 paragraph on why it works for micro-drama"
  },
  "arcs": [
    {
      "name": "Arc name",
      "description": "Arc description 2-3 sentences",
      "sets": "Comma-separated key sets/locations",
      "characters": "Comma-separated main characters and instances",
      "props": "Comma-separated key props",
      "acts": [
        {
          "actnumber": 1,
          "name": "Act name",
          "episoderange": "e.g. Eps 1–5",
          "summary": "Act summary 2-3 sentences",
          "sets": "Comma-separated sets",
          "characters": "Comma-separated characters",
          "props": "Comma-separated props",
          "episodes": [
            {
              "episodenumber": 1,
              "name": "Episode name",
              "summary": "Episode summary 1-2 sentences",
              "logline": "One-line logline",
              "cliffhanger": "Episode cliffhanger",
              "sets": "Comma-separated sets",
              "characters": "Comma-separated characters",
              "props": "Comma-separated props"
            }
          ]
        }
      ]
    }
  ]
}

Requirements:
- 2–4 Arcs total
- 3–5 Acts per Arc
- 50–70 Episodes total spread across all Acts
- Be specific, dramatic, and production-ready for ReelShort/TikTok micro-drama format
- Return ONLY the JSON object, nothing else`
}

function buildProductionGuidePrompt(titleNode) {
  return `You are Culmina AI Drama Studio's Production Guide Generator. Create an AI Production Guide for:

TITLE: ${titleNode.productiontitle}
DESCRIPTION: ${titleNode.description || ''}

Generate Episodes 1-5 in full detail:

For each EPISODE:
## EPISODE [#]: [NAME]
- Target Runtime: [60-90 seconds]
- Sets: [list 2-3 sets]
- Characters/Instances: [list with instance names]
- Props: [key props]

For each SHOT within the episode (6-8 shots per episode):
### SHOT [N]: [SHOT NAME]
- Length: [6-10 sec]
- Camera Angle: [e.g. Medium Two Shot, Close-Up, Wide Establishing]
- Lighting: [mood + technical]
- Set: [one location]
- Props: [specific props]
- Characters: [who appears, which instance]
- Script/Dialog:
  [CHARACTER]: "[line]"
  [CHARACTER]: "[line]"
- Veo Prompt: [Full detailed Veo scene generation prompt, 100+ words, cinematic, specific]
- Notes: [production notes]

End with a VOICE GENERATION NOTES section for each character covering tone, style, accent for ElevenLabs.

Be highly specific and production-ready.`
}

// ── Asset Tree (left panel, 2nd tree) ────────────────────────

const IMPORTANCE_ORDER = ['Lead', 'Supporting', 'Background', 'Cameo']
const IMPORTANCE_COLORS = {
  Lead:       C.gold,
  Supporting: C.green,
  Background: C.blue,
  Cameo:      C.purple,
}
const ASSET_TYPE_ICONS = {
  Person:        '👤',
  Animal:        '🐾',
  AnimateObject: '🤖',
  Set:           '🏛',
  Prop:          '📦',
  Sound:         '🎵',
  Other:         '◈',
}
const CHARACTER_TYPES = ['Person', 'Animal', 'AnimateObject']

function AssetTree({ titleId, onOpenAsset }) {
  const [assets,    setAssets]    = useState([])
  const [instances, setInstances] = useState({})   // { assetid: [inst, ...] }
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState({ Characters: true })

  useEffect(() => {
    if (!titleId) return
    const load = async () => {
      setLoading(true)
      const { data: assetData } = await supabase
        .from('assets')
        .select('assetid, assetname, name, assettype, characterimportance, activestatus')
        .eq('titleproductionid', titleId)
        .eq('activestatus', 'A')
        .order('assetname')
      const assets = assetData || []
      setAssets(assets)

      // Fetch all instances for these assets in one query
      if (assets.length > 0) {
        const ids = assets.map(a => a.assetid)
        const { data: instData } = await supabase
          .from('assetinstances')
          .select('instanceid, assetid, instancename, activestatus')
          .in('assetid', ids)
          .eq('activestatus', 'A')
          .order('sortorder')
        const byAsset = {}
        for (const inst of (instData || [])) {
          if (!byAsset[inst.assetid]) byAsset[inst.assetid] = []
          byAsset[inst.assetid].push(inst)
        }
        setInstances(byAsset)
      }
      setLoading(false)
    }
    load()
  }, [titleId])

  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }))

  const chevron = (isOpen) => (
    <span style={{ fontSize: '0.5rem', color: C.muted, width: '8px', flexShrink: 0,
      transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▶</span>
  )

  const rowStyle = (depth) => ({
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: `4px 8px 4px ${8 + depth * 12}px`,
    cursor: 'pointer', userSelect: 'none',
  })

  const hoverHandlers = {
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent',
  }

  // Group assets
  const isChar = a => CHARACTER_TYPES.includes(a.assettype)
  const characters = assets.filter(isChar)
  const sets       = assets.filter(a => a.assettype === 'Set')
  const props      = assets.filter(a => a.assettype === 'Prop')
  const sound      = assets.filter(a => a.assettype === 'Sound')
  const other      = assets.filter(a => !isChar(a) && !['Set','Prop','Sound'].includes(a.assettype))

  const charsByImportance = {}
  for (const imp of IMPORTANCE_ORDER) {
    const byImp = characters.filter(a => (a.characterimportance || 'Supporting') === imp)
    if (byImp.length === 0) continue
    const byType = {}
    for (const type of CHARACTER_TYPES) {
      const ofType = byImp.filter(a => a.assettype === type)
      if (ofType.length > 0) byType[type] = ofType
    }
    charsByImportance[imp] = byType
  }

  if (loading) return <div style={{ padding: '12px 14px', fontSize: '0.72rem', color: C.muted }}>Loading assets…</div>
  if (assets.length === 0) return <div style={{ padding: '12px 14px', fontSize: '0.72rem', color: C.muted }}>No assets yet</div>

  // Asset node with expandable instances underneath
  const AssetNode = ({ asset, depth = 0 }) => {
    const key = `asset_${asset.assetid}`
    const isOpen = expanded[key]
    const insts = instances[asset.assetid] || []
    const hasInsts = insts.length > 0
    const label = asset.assetname || asset.name || 'Unnamed'

    return (
      <div>
        <div
          onClick={() => { if (hasInsts) toggle(key); else onOpenAsset(asset.assetid) }}
          style={rowStyle(depth)}
          {...hoverHandlers}
        >
          {hasInsts ? chevron(isOpen) : <span style={{ width: '8px', flexShrink: 0 }} />}
          <span style={{ fontSize: '0.65rem', color: C.gold, flexShrink: 0 }}>◈</span>
          <span
            style={{ fontSize: '0.75rem', color: C.cream, flex: 1 }}
            onClick={e => { e.stopPropagation(); onOpenAsset(asset.assetid) }}
          >{label}</span>
          {hasInsts && <span style={{ fontSize: '0.6rem', color: C.muted }}>{insts.length}</span>}
        </div>
        {isOpen && hasInsts && insts.map(inst => (
          <div
            key={inst.instanceid}
            onClick={() => onOpenAsset(asset.assetid)}
            style={rowStyle(depth + 1)}
            {...hoverHandlers}
          >
            <span style={{ width: '8px', flexShrink: 0 }} />
            <span style={{ fontSize: '0.6rem', color: C.muted, flexShrink: 0 }}>▸</span>
            <span style={{ fontSize: '0.72rem', color: C.muted }}>{inst.instancename || 'Instance'}</span>
          </div>
        ))}
      </div>
    )
  }

  const Section = ({ label, icon, count, children }) => {
    const key = label
    const isOpen = expanded[key]
    return (
      <div>
        <div onClick={() => toggle(key)} style={rowStyle(0)} {...hoverHandlers}>
          {chevron(isOpen)}
          <span style={{ fontSize: '0.72rem' }}>{icon}</span>
          <span style={{ fontSize: '0.75rem', color: C.cream, fontWeight: 600, flex: 1 }}>{label}</span>
          <span style={{ fontSize: '0.65rem', color: C.muted }}>{count}</span>
        </div>
        {isOpen && children}
      </div>
    )
  }

  const ImportanceGroup = ({ importance, typeMap }) => {
    const key = `imp_${importance}`
    const isOpen = expanded[key] !== false
    const color = IMPORTANCE_COLORS[importance] || C.muted
    const total = Object.values(typeMap).reduce((s, a) => s + a.length, 0)
    return (
      <div>
        <div onClick={() => toggle(key)} style={rowStyle(1)} {...hoverHandlers}>
          {chevron(isOpen)}
          <span style={{ fontSize: '0.68rem', color, fontWeight: 700, flex: 1, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{importance}</span>
          <span style={{ fontSize: '0.62rem', color: C.muted }}>{total}</span>
        </div>
        {isOpen && Object.entries(typeMap).map(([type, items]) => (
          <TypeGroup key={type} type={type} items={items} />
        ))}
      </div>
    )
  }

  const TypeGroup = ({ type, items }) => {
    const key = `type_${type}`
    const isOpen = expanded[key] !== false
    return (
      <div>
        <div onClick={() => toggle(key)} style={rowStyle(2)} {...hoverHandlers}>
          {chevron(isOpen)}
          <span style={{ fontSize: '0.65rem' }}>{ASSET_TYPE_ICONS[type]}</span>
          <span style={{ fontSize: '0.7rem', color: C.muted, flex: 1 }}>{type}</span>
          <span style={{ fontSize: '0.6rem', color: C.muted }}>{items.length}</span>
        </div>
        {isOpen && items.map(a => <AssetNode key={a.assetid} asset={a} depth={3} />)}
      </div>
    )
  }

  const FlatSection = ({ items, depth = 1 }) => (
    <div>
      {items.map(a => <AssetNode key={a.assetid} asset={a} depth={depth} />)}
    </div>
  )

  return (
    <div>
      {characters.length > 0 && (
        <Section label="Characters" icon="👥" count={characters.length}>
          {Object.entries(charsByImportance).map(([imp, typeMap]) => (
            <ImportanceGroup key={imp} importance={imp} typeMap={typeMap} />
          ))}
        </Section>
      )}
      {sets.length > 0 && (
        <Section label="Sets" icon="🏛" count={sets.length}>
          <FlatSection items={sets} />
        </Section>
      )}
      {props.length > 0 && (
        <Section label="Props" icon="📦" count={props.length}>
          <FlatSection items={props} />
        </Section>
      )}
      {sound.length > 0 && (
        <Section label="Sound" icon="🎵" count={sound.length}>
          <FlatSection items={sound} />
        </Section>
      )}
      {other.length > 0 && (
        <Section label="Other" icon="◈" count={other.length}>
          <FlatSection items={other} />
        </Section>
      )}
    </div>
  )
}

// Assets confirm modal
function AssetsConfirmModal({ titleNode, parsed, writing, onConfirm, onClose }) {
  const chars = parsed.characters || []
  const sets  = parsed.sets || []
  const totalInstances = [...chars, ...sets].reduce((s, a) => s + (a.instances?.length || 0), 0)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.80)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}>
      <div style={{ background:C.ghost, border:`1px solid ${C.borderHi}`, borderRadius:'12px', width:'100%', maxWidth:'620px', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'18px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'1.1rem', fontWeight:600 }}>Generate Assets — {titleNode.productiontitle}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, fontSize:'1.2rem', cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
          <div style={{ marginBottom:'16px', padding:'14px 16px', background:'rgba(201,146,74,0.06)', borderRadius:'8px', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:'0.7rem', color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>Will write to assets table</div>
            {[
              { label:'Characters', val:chars.length,     color:C.gold },
              { label:'Sets',       val:sets.length,      color:C.blue },
              { label:'Instances',  val:totalInstances,   color:C.green },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:'0.82rem', color:C.cream }}>{label}</span>
                <span style={{ fontSize:'0.82rem', fontWeight:700, color }}>{val}</span>
              </div>
            ))}
          </div>

          {chars.length > 0 && (
            <div style={{ marginBottom:'12px' }}>
              <div style={{ fontSize:'0.68rem', color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>Characters</div>
              {chars.map((c, i) => (
                <div key={i} style={{ marginBottom:'6px', padding:'8px 12px', background:C.panel, borderRadius:'6px', border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:C.gold }}>{c.assetname}</div>
                  <div style={{ fontSize:'0.7rem', color:C.muted }}>{c.characterimportance} · {c.instances?.length || 0} instances</div>
                </div>
              ))}
            </div>
          )}
          {sets.length > 0 && (
            <div>
              <div style={{ fontSize:'0.68rem', color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>Sets</div>
              {sets.map((s, i) => (
                <div key={i} style={{ marginBottom:'6px', padding:'8px 12px', background:C.panel, borderRadius:'6px', border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:C.blue }}>{s.assetname}</div>
                  <div style={{ fontSize:'0.7rem', color:C.muted }}>{s.instances?.length || 0} instances</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding:'14px 24px', borderTop:`1px solid ${C.border}`, display:'flex', gap:'8px', justifyContent:'flex-end' }}>
          <button style={S.btn('ghost')} onClick={onClose} disabled={writing}>Cancel</button>
          <button style={{ ...S.btn('primary'), opacity:writing?0.6:1 }} onClick={onConfirm} disabled={writing}>
            {writing ? <><Spinner /> Writing…</> : '✓ Write to Assets'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Write Assets to Supabase ──────────────────────────────────
async function writeAssetsToDb(titleId, assetsJson) {
  const allAssets = [
    ...(assetsJson.characters || []),
    ...(assetsJson.sets || []),
  ]

  for (const asset of allAssets) {
    // Derive description from asset.description + first instance prompt
    const firstPrompt = asset.instances?.[0]?.prompt || ''
    const fullDescription = [asset.description, firstPrompt].filter(Boolean).join('\n\n')

    // speakingrole: handle both boolean true and string "Yes"/"true"
    const isSpeaking = asset.speakingrole === true
      || String(asset.speakingrole).toLowerCase() === 'yes'
      || String(asset.speakingrole).toLowerCase() === 'true'

    // characterimportance: map from role string if needed
    const importance = asset.characterimportance
      || (asset.role === 'Lead' ? 'Lead'
        : asset.role === 'Antagonist' ? 'Antagonist'
        : asset.role === 'Supporting' ? 'Supporting' : null)

    // Insert asset record
    const { data: assetData, error: assetErr } = await supabase
      .from('assets')
      .insert([{
        assetname:            asset.assetname,
        name:                 asset.assetname,        // alias column
        assettype:            asset.assettype || 'Person',
        titleproductionid:    titleId,
        description:          fullDescription,
        characterimportance:  importance,
        speakingrole:         isSpeaking,
        sex:                  asset.sex || null,
        haircolor:            asset.haircolor || null,
        hairlength:           asset.hairlength || null,
        eyecolor:             asset.eyecolor || null,
        bodyshape:            asset.bodyshape || null,
        skintone:             asset.skintone || null,
        ethnicity:            asset.ethnicity || null,
        scars:                asset.scars || null,
        tattoos:              asset.tattoos || null,
        piercings:            asset.piercings || null,
        setdominantcolor:     asset.setdominantcolor || null,
        setsecondarycolor:    asset.setsecondarycolor || null,
        setaccentcolor:       asset.setaccentcolor || null,
        aigenerated:          true,
        activestatus:         'A',
      }])
      .select('assetid')
      .single()
    if (assetErr) throw new Error(`Asset insert failed (${asset.assetname}): ${assetErr.message}`)
    const assetId = assetData.assetid

    // Insert instances — populate description with the instance prompt
    let instSort = 1
    for (const inst of (asset.instances || [])) {
      const { error: instErr } = await supabase
        .from('assetinstances')
        .insert([{
          assetid:              assetId,
          instancename:           inst.instancename,
          clothingdescription:    inst.clothingdescription || null,
          prompt:                 inst.prompt || null,
          description:            inst.prompt || null,
          aigeneratedprompt:      inst.prompt || null,
          aigeneratedpromptdate:  inst.prompt ? new Date().toISOString() : null,
          voiceprompt:            inst.voiceprompt || null,
          activestatus:           'A',
          sortorder:              instSort++,
        }])
      if (instErr) throw new Error(`Instance insert failed (${inst.instancename}): ${instErr.message}`)
    }
  }
}

// ── Write Series Bible to Supabase ───────────────────────────
async function writeSeriesBible(titleId, bible) {
  // 1. Update title fields
  const { error: titleErr } = await supabase
    .from('productions')
    .update({
      synopsis: bible.title.overview,
      genre:            bible.title.genre,
      settingdescription: bible.title.settingdescription,
      timeperiod:       bible.title.timeperiod,
      tone:             bible.title.tone,
      aspectratio:      bible.title.aspectratio,
      hook:             bible.title.hook,
      centralconflict:  bible.title.centralconflict,
      whymicrodrama:    bible.title.whymicrodrama,
    })
    .eq('productionid', titleId)
  if (titleErr) throw new Error('Title update failed: ' + titleErr.message)

  // 2. Delete all existing descendants (arcs, acts, episodes, shots, takes)
  // Recursive delete via parentid chain — delete from leaves up
  const deleteDescendants = async (parentId) => {
    const { data: children } = await supabase
      .from('productions')
      .select('productionid')
      .eq('parentproductionid', parentId)
    if (children && children.length > 0) {
      for (const child of children) await deleteDescendants(child.productionid)
      const ids = children.map(c => c.productionid)
      await supabase.from('productions').delete().in('productionid', ids)
    }
  }
  await deleteDescendants(titleId)

  // 3. Insert arcs → acts → episodes
  let arcSort = 0
  for (const arc of (bible.arcs || [])) {
    const { data: arcData, error: arcErr } = await supabase
      .from('productions')
      .insert([{
        productiontitle:   arc.name,
        productiongroup:  'ARC',
        parentproductionid:         titleId,
        synopsis:      arc.description,
        sets:             arc.sets,
        characters:       arc.characters,
        props:            arc.props,
        activestatus:     'A',
        sortorder:        arcSort++,
      }])
      .select('productionid')
      .single()
    if (arcErr) throw new Error('Arc insert failed: ' + arcErr.message)
    const arcId = arcData.productionid

    let actSort = 0
    for (const act of (arc.acts || [])) {
      const { data: actData, error: actErr } = await supabase
        .from('productions')
        .insert([{
          productiontitle:   act.name,
          productiongroup:  'ACT',
          parentproductionid:         arcId,
          actnumber:        act.actnumber,
          episoderange:     act.episoderange,
          synopsis:      act.summary,
          sets:             act.sets,
          characters:       act.characters,
          props:            act.props,
          activestatus:     'A',
          sortorder:        actSort++,
        }])
        .select('productionid')
        .single()
      if (actErr) throw new Error('Act insert failed: ' + actErr.message)
      const actId = actData.productionid

      let epSort = 0
      for (const ep of (act.episodes || [])) {
        const { error: epErr } = await supabase
          .from('productions')
          .insert([{
            productiontitle:   ep.name,
            productiongroup:  'EPISODE',
            parentproductionid:         actId,
            episodenumber:    ep.episodenumber,
            synopsis:      ep.summary,
            logline:          ep.logline,
            cliffhanger:      ep.cliffhanger,
            sets:             ep.sets,
            characters:       ep.characters,
            props:            ep.props,
            activestatus:     'A',
            sortorder:        epSort++,
          }])
        if (epErr) throw new Error('Episode insert failed: ' + epErr.message)
        epSort++
      }
      actSort++
    }
    arcSort++
  }
}

// ── Main Component ─────────────────────────────────────────────
export default function Development() {
  const navigate = useNavigate()
  const [allNodes,    setAllNodes]    = useState([])
  const [tree,        setTree]        = useState([])
  const [titles,      setTitles]      = useState([])
  const [view,        setView]        = useState('grid')
  const [activeTitle, setActiveTitle] = useState(null)
  const [selectedNode,setSelectedNode]= useState(null)
  const [expanded,    setExpanded]    = useState({})
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [aiLoading,   setAiLoading]   = useState({})
  const [modal,       setModal]       = useState(null)
  const [bibleModal,  setBibleModal]  = useState(null)
  const [bibleWriting,setBibleWriting]= useState(false)
  const [assetsModal, setAssetsModal] = useState(null)
  const [assetsWriting,setAssetsWriting] = useState(false)
  const [openAssetId, setOpenAssetId] = useState(null)   // asset drawer
  const [leftTab,     setLeftTab]     = useState('story') // 'story' | 'assets'
  const [error,       setError]       = useState(null)

  // Load productions
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('productions')
        .select('*')
        .order('sortorder', { ascending: true })
      if (error) { setError(error.message); setLoading(false); return }
      setAllNodes(data || [])
      const t = buildTree(data || [])
      setTree(t)
      setTitles(flattenTitles(t))
      setLoading(false)
    }
    load()
  }, [])

  const openTitle = useCallback((titleNode) => {
    setActiveTitle(titleNode)
    setSelectedNode(titleNode)
    // Auto-expand the title
    setExpanded(e => ({ ...e, [titleNode.productionid]: true }))
    setView('detail')
  }, [])

  const handleToggle = useCallback((id) => {
    setExpanded(e => ({ ...e, [id]: !e[id] }))
  }, [])

  const handleSave = async (formData) => {
    setSaving(true)
    const { children: _c, _tempId, ...dbData } = formData
    const { error } = await supabase
      .from('productions')
      .update(dbData)
      .eq('productionid', dbData.productionid)
    if (error) alert('Save failed: ' + error.message)
    setSaving(false)
  }

  const handleAddChild = async (parentNode) => {
    const childType = CHILD_MAP[parentNode.productiongroup]
    if (!childType) return
    const name = prompt(`New ${childType} name:`)
    if (!name) return
    const { error } = await supabase.from('productions').insert([{
      productiontitle: name,
      productiongroup: childType,
      parentproductionid: parentNode.productionid,
      activestatus: 'A',
    }])
    if (error) { alert('Error: ' + error.message); return }
    await reloadProductions()
  }

  // Reload helper
  const reloadProductions = async () => {
    const { data: all } = await supabase.from('productions').select('*').order('sortorder', { ascending: true })
    setAllNodes(all || [])
    const t = buildTree(all || [])
    setTree(t)
    setTitles(flattenTitles(t))
    // Refresh activeTitle node from new tree
    if (activeTitle) {
      const refreshed = (all || []).find(n => n.productionid === activeTitle.productionid)
      if (refreshed) setActiveTitle(refreshed)
    }
  }

  const runAI = async (titleNode, action) => {
    setAiLoading(l => ({ ...l, [titleNode.productionid]: action }))
    try {
      if (action === 'bible') {
        const prompt = buildSeriesBiblePrompt(titleNode)
        const result = await callClaude(prompt)
        const clean = result.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        setBibleModal({ titleNode, parsed })
      } else if (action === 'assets') {
        const prompt = buildAssetsPrompt(titleNode)
        const result = await callClaude(prompt, 8000)
        const clean = result.replace(/```json|```/g, '').trim()
        let parsed
        try {
          parsed = JSON.parse(clean)
        } catch (jsonErr) {
          // Attempt to salvage truncated JSON by closing open structures
          const salvage = clean
            .replace(/,\s*$/, '')           // trailing comma
            .replace(/"\s*$/, '"')           // unclosed string — close it
          const chars = (salvage.match(/\[/g)||[]).length - (salvage.match(/\]/g)||[]).length
          const braces = (salvage.match(/\{/g)||[]).length - (salvage.match(/\}/g)||[]).length
          const repaired = salvage + ']'.repeat(Math.max(0,chars)) + '}'.repeat(Math.max(0,braces))
          parsed = JSON.parse(repaired)
        }
        setAssetsModal({ titleNode, parsed })
      } else {
        const prompt = buildProductionGuidePrompt(titleNode)
        const modalTitle = `AI Production Guide — ${titleNode.productiontitle}`
        const result = await callClaude(prompt)
        setModal({ title: modalTitle, content: result })
      }
    } catch (e) {
      alert('AI generation failed: ' + e.message)
    }
    setAiLoading(l => { const n = { ...l }; delete n[titleNode.productionid]; return n })
  }

  // Confirm Series Bible write
  const handleConfirmBible = async () => {
    if (!bibleModal) return
    setBibleWriting(true)
    try {
      await writeSeriesBible(bibleModal.titleNode.productionid, bibleModal.parsed)
      await reloadProductions()
      setBibleModal(null)
      // Auto-expand the title in detail view if we're there
      if (activeTitle?.productionid === bibleModal.titleNode.productionid) {
        setExpanded(e => ({ ...e, [activeTitle.productionid]: true }))
      }
    } catch (e) {
      alert('Write failed: ' + e.message)
    }
    setBibleWriting(false)
  }

  // Confirm Assets write
  const handleConfirmAssets = async () => {
    if (!assetsModal) return
    setAssetsWriting(true)
    try {
      await writeAssetsToDb(assetsModal.titleNode.productionid, assetsModal.parsed)
      setAssetsModal(null)
    } catch (e) {
      alert('Assets write failed: ' + e.message)
    }
    setAssetsWriting(false)
  }
  const activeSubtree = activeTitle
    ? tree.find(t => t.productionid === activeTitle.productionid)
    : null

  if (loading) return (
    <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted, fontSize: '0.85rem' }}>Loading productions…</div>
    </div>
  )

  if (error) return (
    <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</div>
    </div>
  )

  return (
    <div style={S.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={S.header}>
        <div>
          {view === 'detail' && (
            <button
              style={{ ...S.btn('ghost'), fontSize: '0.7rem', marginBottom: '6px', padding: '4px 10px' }}
              onClick={() => setView('grid')}
            >← All Titles</button>
          )}
          <h1 style={S.headerTitle}>
            {view === 'grid' ? 'Development' : (activeTitle?.productiontitle || 'Development')}
          </h1>
          <div style={S.headerSub}>
            {view === 'grid'
              ? `${titles.length} title${titles.length !== 1 ? 's' : ''}`
              : `${activeTitle?.productiongroup || ''} · Hierarchy Editor`}
          </div>
        </div>
        {view === 'grid' && (
          <button style={S.btn('primary')} onClick={async () => {
            const name = prompt('New title name:')
            if (!name) return
            const { error } = await supabase.from('productions').insert([{
              productiontitle: name, productiongroup: 'TITLE', activestatus: 'A',
            }])
            if (error) { alert(error.message); return }
            await reloadProductions()
          }}>+ New Title</button>
        )}
        {view === 'detail' && activeTitle && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <ActionButton icon="🎨" label="Generate Assets"     loading={aiLoading[activeTitle.productionid] === 'assets'}  onClick={() => runAI(activeTitle, 'assets')} />
            <ActionButton icon="📖" label="Series Bible"        loading={aiLoading[activeTitle.productionid] === 'bible'}   onClick={() => runAI(activeTitle, 'bible')} />
            <ActionButton icon="🎬" label="AI Production Guide" loading={aiLoading[activeTitle.productionid] === 'guide'}   onClick={() => runAI(activeTitle, 'guide')} />
          </div>
        )}
      </div>

      {/* Body */}
      {view === 'grid' ? (
        /* ── GRID VIEW ─────────────────────────────────── */
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {titles.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.muted, marginTop: '60px', fontSize: '0.9rem' }}>
              No titles yet. Click <strong style={{ color: C.gold }}>+ New Title</strong> to start.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {titles.map(t => (
                <TitleCard
                  key={t.productionid}
                  node={t}
                  onOpen={openTitle}
                  onGenerateAssets={n => runAI(n, 'assets')}
                  onSeriesBible={n => runAI(n, 'bible')}
                  onProductionGuide={n => runAI(n, 'guide')}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── DETAIL VIEW ───────────────────────────────── */
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: Tabbed Tree Panel */}
          <div style={{
            width: '260px', flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column',
            background: C.panel,
          }}>
            {/* Tab switcher */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              {[
                { key: 'story',  label: 'Story' },
                { key: 'assets', label: 'Assets' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setLeftTab(key)}
                  style={{
                    flex: 1, padding: '9px 0', background: 'transparent', border: 'none',
                    borderBottom: leftTab === key ? `2px solid ${C.gold}` : '2px solid transparent',
                    color: leftTab === key ? C.gold : C.muted,
                    fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    transition: 'all 0.15s',
                  }}
                >{label}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
              {leftTab === 'story' ? (
                <>
                  {/* Title heuristics bar */}
                  {activeSubtree && (
                    <div style={{ padding: '0 14px 10px', borderBottom: `1px solid ${C.border}`, marginBottom: '8px' }}>
                      {[
                        { label: 'Arcs',     val: countDescendants(activeSubtree, 'ARC'),     color: C.purple },
                        { label: 'Episodes', val: countDescendants(activeSubtree, 'EPISODE'), color: C.green },
                        { label: 'Shots',    val: countDescendants(activeSubtree, 'SHOT'),    color: C.red },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                          <span style={{ fontSize: '0.68rem', color: C.muted }}>{label}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeSubtree && (
                    <TreeNode
                      node={activeSubtree}
                      depth={0}
                      selectedId={selectedNode?.productionid}
                      onSelect={setSelectedNode}
                      expanded={expanded}
                      onToggle={handleToggle}
                      onAddChild={handleAddChild}
                    />
                  )}
                </>
              ) : (
                <AssetTree
                  titleId={activeTitle?.productionid}
                  onOpenAsset={id => navigate(`/assets?assetid=${id}`)}
                />
              )}
            </div>
          </div>

          {/* Right: Detail panel */}
          <div style={{ flex: 1, overflowY: 'auto', background: C.ink }}>
            <NodeDetailPanel
              node={selectedNode}
              onSave={handleSave}
              onAddChild={handleAddChild}
              allNodes={allNodes}
            />
          </div>
        </div>
      )}

      {/* Text result Modal */}
      {modal && <Modal title={modal.title} content={modal.content} onClose={() => setModal(null)} />}

      {/* Series Bible confirm Modal */}
      {bibleModal && (
        <Modal
          title={`Series Bible — ${bibleModal.titleNode.productiontitle}`}
          biblePreview={bibleModal.parsed}
          onClose={() => { if (!bibleWriting) setBibleModal(null) }}
          onConfirmBible={handleConfirmBible}
          bibleWriting={bibleWriting}
        />
      )}

      {/* Assets confirm Modal */}
      {assetsModal && (
        <AssetsConfirmModal
          titleNode={assetsModal.titleNode}
          parsed={assetsModal.parsed}
          writing={assetsWriting}
          onConfirm={handleConfirmAssets}
          onClose={() => { if (!assetsWriting) setAssetsModal(null) }}
        />
      )}
    </div>
  )
}
