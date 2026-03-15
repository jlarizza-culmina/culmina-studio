import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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
    if (n.parentid && map[n.parentid]) map[n.parentid].children.push(map[n.productionid])
    else if (!n.parentid) roots.push(map[n.productionid])
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
              {node.productionname || node.title || 'Untitled'}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: C.muted }}>
            {node.activestatus === 'A' ? '● Active' : '○ Inactive'}
            {node.productionstage && <span style={{ marginLeft: '10px' }}>{node.productionstage}</span>}
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
          {node.productionname || node.title || 'Untitled'}
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

// Modal overlay for AI generation results
function Modal({ title, content, onClose }) {
  if (!content) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: C.ghost, border: `1px solid ${C.borderHi}`,
        borderRadius: '12px', width: '100%', maxWidth: '760px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: C.cream, lineHeight: 1.7, margin: 0 }}>
            {content}
          </pre>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button style={S.btn('ghost')} onClick={() => navigator.clipboard?.writeText(content)}>Copy</button>
          <button style={S.btn('primary')} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// Detail view for a selected node
function NodeDetailPanel({ node, onSave, onAddChild }) {
  const [form, setForm] = useState({})

  useEffect(() => {
    if (node) setForm({ ...node })
  }, [node?.productionid])

  if (!node) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '0.85rem' }}>
      Select a node to edit
    </div>
  )

  const field = (key, label, opts = {}) => (
    <div style={{ marginBottom: '14px' }} key={key}>
      <label style={{ display: 'block', fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{label}</label>
      {opts.textarea ? (
        <textarea
          value={form[key] || ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={opts.rows || 3}
          style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 10px', color: C.cream, fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      ) : opts.select ? (
        <select
          value={form[key] || ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 10px', color: C.cream, fontSize: '0.82rem' }}
        >
          <option value="">— Select —</option>
          {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type="text"
          value={form[key] || ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', background: C.dim, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 10px', color: C.cream, fontSize: '0.82rem', boxSizing: 'border-box' }}
        />
      )}
    </div>
  )

  const childType = CHILD_MAP[node.productiongroup]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
      {/* Node type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.95rem', color: LEVEL_COLORS[node.productiongroup] }}>{LEVEL_ICONS[node.productiongroup]}</span>
        <span style={{ fontSize: '0.7rem', color: LEVEL_COLORS[node.productiongroup], textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{node.productiongroup}</span>
        {childType && (
          <button
            onClick={() => onAddChild(node)}
            style={{ ...S.btn('ghost'), fontSize: '0.68rem', padding: '4px 10px', marginLeft: 'auto' }}
          >+ Add {childType}</button>
        )}
      </div>

      {field('productionname', 'Name')}
      {field('description', 'Description', { textarea: true, rows: 3 })}

      {node.productiongroup === 'TITLE' && <>
        {field('aspectratio', 'Aspect Ratio', { select: true, options: ['9:16 Vertical', '16:9 Horizontal', '1:1 Square', '4:5'] })}
        {field('language', 'Language', { select: true, options: ['English', 'Spanish', 'Portuguese', 'Mandarin', 'Hindi', 'French'] })}
      </>}

      {node.productiongroup === 'EPISODE' && <>
        {field('episodenumber', 'Episode #')}
        {field('logline', 'Logline', { textarea: true, rows: 2 })}
        {field('cliffhanger', 'Cliffhanger', { textarea: true, rows: 2 })}
        {field('targetruntime', 'Target Runtime (sec)')}
      </>}

      {node.productiongroup === 'SHOT' && <>
        {field('shotlength', 'Length (sec)')}
        {field('cameraangle', 'Camera Angle')}
        {field('lighting', 'Lighting')}
        {field('prompt', 'Veo Prompt', { textarea: true, rows: 5 })}
        {field('script', 'Script / Dialog', { textarea: true, rows: 4 })}
        {field('notes', 'Notes', { textarea: true, rows: 2 })}
      </>}

      {(node.productiongroup === 'ARC' || node.productiongroup === 'ACT') && <>
        {field('summary', 'Summary', { textarea: true, rows: 4 })}
      </>}

      {field('productionstage', 'Stage', { select: true, options: ['Development', 'Pre-Production', 'Production', 'Post-Production', 'Distribution', 'Complete'] })}
      {field('activestatus', 'Status', { select: true, options: ['A', 'I', 'H'] })}

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
        <button style={S.btn('primary')} onClick={() => onSave(form)}>Save Changes</button>
      </div>
    </div>
  )
}

// ── AI Generation helpers ─────────────────────────────────────

async function callClaude(prompt) {
  const res = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

function buildAssetsPrompt(titleNode, allNodes) {
  const desc = titleNode.description || titleNode.productionname
  return `You are Culmina AI Drama Studio's Asset Generator. Given this production:

TITLE: ${titleNode.productionname}
DESCRIPTION: ${desc}

Generate a complete asset list for this micro-drama series. For each asset, provide:

CHARACTERS (all named characters):
- Asset Name: [Character Name]
- Role: [Lead / Supporting / Antagonist]
- Instances: [list 2-4 instance names, e.g. "Hero Portrait", "Action Pose", "Formal Attire"]
- For each instance, write a detailed Imagen/Midjourney prompt
- Physical Description: Age, build, hair, eyes, distinguishing features
- Wardrobe per instance
- No Tattoos / No Scars (or specify)
- Voice Notes: Tone, accent, style for ElevenLabs

SETS / ENVIRONMENTS:
- Asset Name: [Location Name]
- Environment Prompt: Detailed Imagen/Veo environment reference prompt
- Aspect Ratio: 9:16 or 16:9
- Lighting mood

Format clearly with headers and dashes. Be specific and production-ready.`
}

function buildSeriesBiblePrompt(titleNode) {
  return `You are Culmina AI Drama Studio. Generate a Series Bible for this production:

TITLE: ${titleNode.productionname}
DESCRIPTION: ${titleNode.description || ''}

Produce a structured Series Bible with these sections:

## TITLE OVERVIEW
- Overview (2-3 paragraphs)
- Genre: (list 2-3 micro-drama genres)
- Setting Description: (specific locations)
- Time Period:
- Tone: (e.g. "Suspenseful, romantic, witty — think Bridgerton meets Mission: Impossible")
- Aspect Ratio: 9:16 Vertical
- The Hook: (compelling 1-paragraph hook)
- Central Conflict: (1-2 paragraphs)
- Why It Works for Micro-Drama: (1 paragraph)

## ARC STRUCTURE
For each story arc (2-4 arcs):
- Arc Name & Description
- Key Sets used in this arc
- Main Characters/Instances featured
- Key Props

## ACT BREAKDOWN
For each act (3-5 acts per arc):
- Act Number & Name
- Episodes covered (e.g. Eps 1-5)
- Act Summary
- Sets, Characters, Props

## EPISODE LIST
For each episode (aim for 50-70 episodes total):
- Ep # | Episode Name | Logline | Cliffhanger

Be specific, compelling, and production-ready for ReelShort/TikTok micro-drama format.`
}

function buildProductionGuidePrompt(titleNode) {
  return `You are Culmina AI Drama Studio's Production Guide Generator. Create an AI Production Guide for:

TITLE: ${titleNode.productionname}
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

// ── Main Component ─────────────────────────────────────────────
export default function Development() {
  const [allNodes,    setAllNodes]    = useState([])
  const [tree,        setTree]        = useState([])
  const [titles,      setTitles]      = useState([])
  const [view,        setView]        = useState('grid')      // 'grid' | 'detail'
  const [activeTitle, setActiveTitle] = useState(null)
  const [selectedNode,setSelectedNode]= useState(null)
  const [expanded,    setExpanded]    = useState({})
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [aiLoading,   setAiLoading]   = useState({})          // { titleId: 'assets'|'bible'|'guide' }
  const [modal,       setModal]       = useState(null)        // { title, content }
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
    const { error } = await supabase
      .from('productions')
      .update(formData)
      .eq('productionid', formData.productionid)
    if (error) alert('Save failed: ' + error.message)
    setSaving(false)
  }

  const handleAddChild = async (parentNode) => {
    const childType = CHILD_MAP[parentNode.productiongroup]
    if (!childType) return
    const name = prompt(`New ${childType} name:`)
    if (!name) return
    const { data, error } = await supabase.from('productions').insert([{
      productionname: name,
      productiongroup: childType,
      parentid: parentNode.productionid,
      activestatus: 'A',
    }]).select()
    if (error) { alert('Error: ' + error.message); return }
    // Reload
    const { data: all } = await supabase.from('productions').select('*').order('sortorder', { ascending: true })
    setAllNodes(all || [])
    const t = buildTree(all || [])
    setTree(t)
    setTitles(flattenTitles(t))
  }

  // AI actions
  const runAI = async (titleNode, action) => {
    setAiLoading(l => ({ ...l, [titleNode.productionid]: action }))
    try {
      let prompt, modalTitle
      if (action === 'assets') {
        prompt = buildAssetsPrompt(titleNode, allNodes)
        modalTitle = `Assets — ${titleNode.productionname}`
      } else if (action === 'bible') {
        prompt = buildSeriesBiblePrompt(titleNode)
        modalTitle = `Series Bible — ${titleNode.productionname}`
      } else {
        prompt = buildProductionGuidePrompt(titleNode)
        modalTitle = `AI Production Guide — ${titleNode.productionname}`
      }
      const result = await callClaude(prompt)
      setModal({ title: modalTitle, content: result })
    } catch (e) {
      alert('AI generation failed: ' + e.message)
    }
    setAiLoading(l => { const n = { ...l }; delete n[titleNode.productionid]; return n })
  }

  // Get subtree for active title
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
            {view === 'grid' ? 'Development' : (activeTitle?.productionname || 'Development')}
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
            const { data, error } = await supabase.from('productions').insert([{
              productionname: name, productiongroup: 'TITLE', activestatus: 'A',
            }]).select()
            if (error) { alert(error.message); return }
            const { data: all } = await supabase.from('productions').select('*').order('sortorder')
            const t = buildTree(all || [])
            setTree(t); setTitles(flattenTitles(t))
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

          {/* Left: Tree */}
          <div style={{
            width: '260px', flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            overflowY: 'auto',
            background: C.panel,
            padding: '12px 0',
          }}>
            {/* Title heuristics bar */}
            {activeSubtree && (
              <div style={{ padding: '0 14px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: '8px' }}>
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
          </div>

          {/* Right: Detail panel */}
          <div style={{ flex: 1, overflowY: 'auto', background: C.ink }}>
            <NodeDetailPanel
              node={selectedNode}
              onSave={handleSave}
              onAddChild={handleAddChild}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && <Modal title={modal.title} content={modal.content} onClose={() => setModal(null)} />}
    </div>
  )
}
