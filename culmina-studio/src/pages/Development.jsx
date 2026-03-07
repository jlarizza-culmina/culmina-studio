import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'

const LEVEL_ICONS  = { TITLE:'▣', ARC:'◠', ACT:'≡', EPISODE:'▶', SHOT:'◎', TAKE:'◈' }
const LEVEL_COLORS = { TITLE:GOLD, ARC:'#9C7AC8', ACT:'#7A9EC8', EPISODE:'#4A9C7A', SHOT:'#C87A4A', TAKE:CHARCOAL }
const CHILD_MAP    = { TITLE:'ARC', ARC:'ACT', ACT:'EPISODE', EPISODE:'SHOT', SHOT:'TAKE' }

const AI_MODELS    = ['Veo 2','Veo 3','Sora','Runway Gen-3','Kling','Pika 2']
const CURRENCIES   = ['USD','EUR','GBP','CAD','AUD','JPY','CNY','KRW','MXN','BRL']
const LIGHTING     = ['Natural Light','Key Light','High Key','Low Key','Three-Point','Rembrandt','Butterfly','Split','Rim/Back','Practical','Golden Hour','Blue Hour','Motivated','Cinematic Contrast']
const STATUSES     = ['development','pre_production','in_production','post_production','distribution','completed','paused']

function TreeNode({ node, depth, selectedId, onSelect, onAddChild, expanded, onToggle }) {
  const hasChildren = node.children && node.children.length > 0
  const isSelected  = selectedId === node.productionid
  const isExpanded  = expanded[node.productionid]
  const color       = LEVEL_COLORS[node.productiongroup] || CHARCOAL
  return (
    <div>
      <div onClick={() => onSelect(node)}
        style={{ display:'flex', alignItems:'center', gap:'6px', padding:`6px 8px 6px ${16+depth*16}px`, cursor:'pointer', userSelect:'none',
          background: isSelected ? 'rgba(201,146,74,0.1)' : 'transparent',
          borderLeft: isSelected ? `2px solid ${GOLD}` : '2px solid transparent', transition:'all 0.15s' }}>
        <span onClick={e=>{ e.stopPropagation(); if(hasChildren) onToggle(node.productionid) }}
          style={{ color:MUTED, fontSize:'0.6rem', width:'12px', display:'inline-block', cursor:hasChildren?'pointer':'default',
            transform:isExpanded?'rotate(90deg)':'none', transition:'transform 0.15s' }}>
          {hasChildren?'▶':''}
        </span>
        <span style={{ fontSize:'0.75rem', color }}>{LEVEL_ICONS[node.productiongroup]}</span>
        <span style={{ fontSize:'0.8rem', color:isSelected?CREAM:'#9A9590', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {node.productiontitle}
        </span>
      </div>
      {isExpanded && hasChildren && node.children.map(child => (
        <TreeNode key={child.productionid} node={child} depth={depth+1}
          selectedId={selectedId} onSelect={onSelect} onAddChild={onAddChild}
          expanded={expanded} onToggle={onToggle} />
      ))}
      {(isExpanded || isSelected) && CHILD_MAP[node.productiongroup] && (
        <div onClick={()=>onAddChild(node)}
          style={{ padding:`4px 8px 4px ${32+depth*16}px`, cursor:'pointer', color:GOLD, fontSize:'0.72rem', opacity:0.6 }}
          onMouseEnter={e=>e.currentTarget.style.opacity='1'}
          onMouseLeave={e=>e.currentTarget.style.opacity='0.6'}>
          + Add {CHILD_MAP[node.productiongroup].charAt(0)+CHILD_MAP[node.productiongroup].slice(1).toLowerCase()}
        </div>
      )}
    </div>
  )
}

function DetailPanel({ node, onRefresh, onDeactivate }) {
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [prompt, setPrompt]   = useState('')
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    if (node) setForm({
      productiontitle:  node.productiontitle  || '',
      synopsis:         node.synopsis         || '',
      notes:            node.notes            || '',
      productionstatus: node.productionstatus || 'development',
      basecurrency:     node.basecurrency     || 'USD',
      aimodel:          node.aimodel          || 'Veo 2',
      lightingtype:     node.lightingtype     || '',
      characters:       node.characters       || '',
      tone:             node.tone             || '',
    })
    setShowPrompt(false)
    setConfirmDeactivate(false)
  }, [node])

  async function handleSave() {
    setSaving(true)
    await supabase.from('productions')
      .update({ ...form, updatedate: new Date().toISOString() })
      .eq('productionid', node.productionid)
    setSaving(false); setSaved(true)
    setTimeout(()=>setSaved(false), 2000)
    onRefresh()
  }

  async function handleDeactivate() {
    await supabase.from('productions')
      .update({ activestatus:'H', updatedate: new Date().toISOString() })
      .eq('productionid', node.productionid)
    setConfirmDeactivate(false)
    onDeactivate()
    onRefresh()
  }

  function buildPrompt() {
    const parts = []
    if (form.productiontitle) parts.push(`Scene: ${form.productiontitle}`)
    if (form.synopsis)        parts.push(form.synopsis)
    if (form.characters)      parts.push(`Characters: ${form.characters}`)
    if (form.lightingtype)    parts.push(`Lighting: ${form.lightingtype}`)
    if (form.tone)            parts.push(`Tone: ${form.tone}`)
    parts.push('Cinematic. 16:9 1080p. Photorealistic.')
    if (form.aimodel)         parts.push(`Model: ${form.aimodel}`)
    setPrompt(parts.join('. '))
    setShowPrompt(true)
  }

  if (!node) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:MUTED,
      fontFamily:'Cormorant Garamond, serif', fontSize:'1.2rem', flexDirection:'column', gap:'12px' }}>
      <div style={{ fontSize:'2rem', opacity:0.3 }}>◎</div>
      <div>Select a node to edit</div>
    </div>
  )

  const color = LEVEL_COLORS[node.productiongroup] || CHARCOAL
  const lbl   = { display:'block', fontSize:'0.7rem', color:CHARCOAL, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'6px' }
  const inp   = { width:'100%', background:'rgba(255,255,255,0.03)', border:`1px solid ${BORDER}`, color:CREAM,
    padding:'10px 14px', fontSize:'0.85rem', fontFamily:'DM Sans, sans-serif', outline:'none', marginBottom:'20px' }
  const isShot = node.productiongroup === 'SHOT'

  return (
    <div style={{ padding:'32px', overflowY:'auto', height:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'1rem', color }}>{LEVEL_ICONS[node.productiongroup]}</span>
          <span style={{ fontSize:'0.7rem', color, letterSpacing:'0.15em', textTransform:'uppercase' }}>{node.productiongroup}</span>
          <span style={{ fontSize:'0.7rem', color:MUTED }}>· ID: {node.productionid}</span>
        </div>
        <button onClick={()=>setConfirmDeactivate(true)}
          style={{ background:'none', border:'none', color:'rgba(200,75,49,0.5)', fontSize:'0.72rem', cursor:'pointer', padding:0, letterSpacing:'0.06em' }}>
          Deactivate
        </button>
      </div>

      <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.8rem', fontWeight:300, color:CREAM, marginBottom:'32px' }}>
        {node.productiontitle}
      </h2>

      <label style={lbl}>Title</label>
      <input value={form.productiontitle||''} onChange={e=>setForm(f=>({...f,productiontitle:e.target.value}))} style={inp} />

      <label style={lbl}>Synopsis</label>
      <textarea value={form.synopsis||''} onChange={e=>setForm(f=>({...f,synopsis:e.target.value}))}
        rows={4} style={{...inp, resize:'vertical', fontFamily:'DM Sans, sans-serif'}} />

      <label style={lbl}>Status</label>
      <select value={form.productionstatus||''} onChange={e=>setForm(f=>({...f,productionstatus:e.target.value}))}
        style={{...inp, cursor:'pointer'}}>
        {STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
      </select>

      {/* Title-specific fields */}
      {node.productiongroup === 'TITLE' && (
        <>
          <div style={{ height:'1px', background:BORDER, margin:'8px 0 24px' }} />
          <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'16px' }}>Title Settings</div>
          <label style={lbl}>Base Currency</label>
          <select value={form.basecurrency||'USD'} onChange={e=>setForm(f=>({...f,basecurrency:e.target.value}))}
            style={{...inp, cursor:'pointer'}}>
            {CURRENCIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </>
      )}

      {/* Shot-specific fields */}
      {isShot && (
        <>
          <div style={{ height:'1px', background:BORDER, margin:'8px 0 24px' }} />
          <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'16px' }}>Shot Settings</div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            <div>
              <label style={lbl}>AI Model</label>
              <select value={form.aimodel||'Veo 2'} onChange={e=>setForm(f=>({...f,aimodel:e.target.value}))}
                style={{...inp, cursor:'pointer'}}>
                {AI_MODELS.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Lighting</label>
              <select value={form.lightingtype||''} onChange={e=>setForm(f=>({...f,lightingtype:e.target.value}))}
                style={{...inp, cursor:'pointer'}}>
                <option value="">Select...</option>
                {LIGHTING.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <label style={lbl}>Characters in Shot</label>
          <input value={form.characters||''} onChange={e=>setForm(f=>({...f,characters:e.target.value}))}
            style={inp} placeholder="e.g. Clara, Lord Ashford" />

          <label style={lbl}>Tone / Mood</label>
          <input value={form.tone||''} onChange={e=>setForm(f=>({...f,tone:e.target.value}))}
            style={inp} placeholder="e.g. tense, romantic, ominous" />
        </>
      )}

      <label style={lbl}>Notes</label>
      <textarea value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
        rows={3} style={{...inp, resize:'vertical', fontFamily:'DM Sans, sans-serif'}} />

      {/* Action buttons */}
      <div style={{ display:'flex', gap:'12px', marginTop:'8px' }}>
        <button onClick={handleSave} disabled={saving}
          style={{ background:saved?'#4A9C7A':GOLD, border:'none', color:'#1A1810', padding:'10px 28px', cursor:'pointer',
            fontFamily:'DM Sans, sans-serif', fontSize:'0.78rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>
          {saving?'Saving...':saved?'Saved ✓':'Save Changes'}
        </button>
        <button onClick={buildPrompt}
          style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'10px 20px', cursor:'pointer',
            fontFamily:'DM Sans, sans-serif', fontSize:'0.78rem', letterSpacing:'0.1em', textTransform:'uppercase' }}>
          Create Prompt
        </button>
      </div>

      {/* Prompt panel */}
      {showPrompt && (
        <div style={{ marginTop:'24px', background:SURFACE2, border:`1px solid ${BORDER}`, padding:'20px' }}>
          <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'12px' }}>Generated Prompt</div>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
            rows={5} style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:`1px solid ${BORDER}`, color:CREAM,
              padding:'10px 14px', fontSize:'0.78rem', fontFamily:'monospace', outline:'none', resize:'vertical', marginBottom:'12px' }} />
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={()=>{navigator.clipboard.writeText(prompt)}}
              style={{ background:GOLD, border:'none', color:'#1A1810', padding:'7px 18px', cursor:'pointer',
                fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:500 }}>
              Copy
            </button>
            <button onClick={()=>setShowPrompt(false)}
              style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'7px 14px', cursor:'pointer',
                fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Deactivate confirm */}
      {confirmDeactivate && (
        <div style={{ marginTop:'24px', background:'rgba(200,75,49,0.06)', border:'1px solid rgba(200,75,49,0.2)', padding:'20px' }}>
          <div style={{ fontSize:'0.82rem', color:CREAM, marginBottom:'14px' }}>
            Deactivate <strong>{node.productiontitle}</strong>? This will hide it from all views.
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={handleDeactivate}
              style={{ background:'#C84B31', border:'none', color:'#fff', padding:'7px 18px', cursor:'pointer',
                fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Confirm Deactivate
            </button>
            <button onClick={()=>setConfirmDeactivate(false)}
              style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'7px 14px', cursor:'pointer',
                fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function buildTree(rows) {
  const map = {}
  rows.forEach(r=>{ map[r.productionid]={...r, children:[]} })
  const roots = []
  rows.forEach(r=>{
    if (r.parentproductionid && map[r.parentproductionid]) map[r.parentproductionid].children.push(map[r.productionid])
    else if (!r.parentproductionid) roots.push(map[r.productionid])
  })
  return roots
}

export default function Development() {
  const [titles, setTitles]           = useState([])
  const [selectedTitleId, setSelectedTitleId] = useState('')
  const [tree, setTree]               = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [expanded, setExpanded]       = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [addParent, setAddParent]     = useState(null)
  const [newTitle, setNewTitle]       = useState('')
  const [loading, setLoading]         = useState(false)

  useEffect(()=>{
    supabase.from('productions').select('productionid, productiontitle')
      .eq('productiongroup','TITLE').eq('activestatus','A')
      .then(({data})=>{ if(data){ setTitles(data); if(data[0]) setSelectedTitleId(String(data[0].productionid)) } })
  },[])

  useEffect(()=>{ if(selectedTitleId) loadTree() },[selectedTitleId])

  async function loadTree() {
    setLoading(true)
    const {data} = await supabase.from('productions').select('*')
      .or(`productionid.eq.${selectedTitleId},titleproductionid.eq.${selectedTitleId}`)
      .eq('activestatus','A').order('sortorder')
    if(data){ setTree(buildTree(data)); setExpanded(e=>({...e,[selectedTitleId]:true})) }
    setLoading(false)
  }

  function toggleExpanded(id){ setExpanded(e=>({...e,[id]:!e[id]})) }

  async function handleAddChild(parent){ setAddParent(parent); setNewTitle(''); setShowAddModal(true) }

  async function handleCreate() {
    if(!newTitle.trim()) return
    const group = CHILD_MAP[addParent.productiongroup]
    await supabase.from('productions').insert({
      productiongroup: group, parentproductionid: addParent.productionid,
      titleproductionid: parseInt(selectedTitleId), productiontitle: newTitle,
      activestatus:'A', productionstatus:'development', sortorder:0
    })
    setShowAddModal(false); setExpanded(e=>({...e,[addParent.productionid]:true})); loadTree()
  }

  return (
    <div style={{ display:'flex', height:'calc(100vh - 84px)', fontFamily:'DM Sans, sans-serif', margin:'-32px', overflow:'hidden' }}>

      {/* Left tree */}
      <div style={{ width:'260px', minWidth:'260px', background:SURFACE2, borderRight:`1px solid ${BORDER}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'16px 12px', borderBottom:`1px solid ${BORDER}` }}>
          <select value={selectedTitleId} onChange={e=>{ setSelectedTitleId(e.target.value); setSelectedNode(null) }}
            style={{ width:'100%', background:SURFACE, border:`1px solid ${BORDER}`, color:CREAM, padding:'8px 12px',
              fontFamily:'DM Sans, sans-serif', fontSize:'0.8rem', outline:'none', cursor:'pointer' }}>
            <option value="">Select Title</option>
            {titles.map(t=><option key={t.productionid} value={t.productionid}>{t.productiontitle}</option>)}
          </select>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          {loading ? (
            <div style={{ padding:'24px', color:MUTED, fontSize:'0.8rem', textAlign:'center' }}>Loading...</div>
          ) : tree.length===0 ? (
            <div style={{ padding:'24px 16px', color:MUTED, fontSize:'0.78rem', textAlign:'center', lineHeight:1.6 }}>
              {selectedTitleId ? 'No nodes yet. Add your first Arc.' : 'Select a title to begin.'}
            </div>
          ) : tree.map(node=>(
            <TreeNode key={node.productionid} node={node} depth={0}
              selectedId={selectedNode?.productionid} onSelect={setSelectedNode}
              onAddChild={handleAddChild} expanded={expanded} onToggle={toggleExpanded} />
          ))}
        </div>

        {selectedTitleId && (
          <div style={{ padding:'12px', borderTop:`1px solid ${BORDER}` }}>
            <button onClick={()=>handleAddChild({productionid:parseInt(selectedTitleId),productiongroup:'TITLE'})}
              style={{ width:'100%', background:'rgba(201,146,74,0.08)', border:`1px solid ${BORDER}`, color:GOLD,
                padding:'8px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.08em' }}>
              + Add Arc
            </button>
          </div>
        )}
      </div>

      {/* Detail panel */}
      <div style={{ flex:1, background:SURFACE, overflow:'hidden' }}>
        <DetailPanel node={selectedNode} onRefresh={loadTree} onDeactivate={()=>setSelectedNode(null)} />
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
          onClick={()=>setShowAddModal(false)}>
          <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, padding:'32px', width:'400px' }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', color:CREAM, marginBottom:'20px', fontWeight:300 }}>
              Add {addParent && CHILD_MAP[addParent.productiongroup]}
            </h3>
            <label style={{ display:'block', fontSize:'0.7rem', color:CHARCOAL, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'8px' }}>Title</label>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleCreate()} autoFocus
              style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:`1px solid ${BORDER}`, color:CREAM,
                padding:'10px 14px', fontSize:'0.85rem', fontFamily:'DM Sans, sans-serif', outline:'none', marginBottom:'20px' }} />
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={handleCreate}
                style={{ background:GOLD, border:'none', color:'#1A1810', padding:'10px 24px', cursor:'pointer',
                  fontFamily:'DM Sans, sans-serif', fontSize:'0.78rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>
                Create
              </button>
              <button onClick={()=>setShowAddModal(false)}
                style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'10px 20px', cursor:'pointer',
                  fontFamily:'DM Sans, sans-serif', fontSize:'0.78rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
