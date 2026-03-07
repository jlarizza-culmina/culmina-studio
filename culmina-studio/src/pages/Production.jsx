import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'
const GREEN = '#4A9C7A'
const RED = '#C84B31'

const GROUP_COLORS = {
  TITLE:   GOLD,
  ARC:     '#9B7FD4',
  ACT:     '#5B9BD4',
  EPISODE: '#4A9C7A',
  SHOT:    '#C9924A',
  TAKE:    MUTED,
}

const STATUS_COLORS = {
  queued:        { bg:'rgba(201,146,74,0.15)',  color:'#C9924A',  label:'Queued'     },
  processing:    { bg:'rgba(201,146,74,0.25)',  color:'#FFB84A',  label:'Processing' },
  in_production: { bg:'rgba(201,146,74,0.25)',  color:'#FFB84A',  label:'In Prod'    },
  complete:      { bg:'rgba(74,156,122,0.15)',  color:'#4A9C7A',  label:'Complete'   },
  completed:     { bg:'rgba(74,156,122,0.15)',  color:'#4A9C7A',  label:'Complete'   },
  approved:      { bg:'rgba(74,156,122,0.2)',   color:'#4A9C7A',  label:'Approved'   },
  error:         { bg:'rgba(200,75,49,0.15)',   color:'#C84B31',  label:'Error'      },
  rejected:      { bg:'rgba(200,75,49,0.1)',    color:'#C84B31',  label:'Rejected'   },
  development:   { bg:'rgba(92,87,78,0.2)',     color:'#6A6560',  label:'Dev'        },
  pre_production:{ bg:'rgba(92,87,78,0.2)',     color:'#6A6560',  label:'Pre-Prod'   },
}

const AI_MODELS = ['Veo 2','Veo 3','Sora','Runway Gen-3','Kling','Pika 2']

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.queued
  return <span style={{ background:s.bg, color:s.color, padding:'2px 8px', fontSize:'0.67rem', letterSpacing:'0.07em', textTransform:'uppercase', borderRadius:'2px', whiteSpace:'nowrap' }}>{s.label}</span>
}

// ─── Tree ────────────────────────────────────────────────────────────────────

function TreeNode({ node, allNodes, selectedId, onSelect, depth=0 }) {
  const children = allNodes.filter(n => n.parentproductionid === node.productionid)
  const [open, setOpen] = useState(depth < 2)
  const isSelected = selectedId === node.productionid
  const color = GROUP_COLORS[node.productiongroup] || CHARCOAL

  return (
    <div>
      <div onClick={() => { setOpen(o => !o); onSelect(node) }}
        style={{ display:'flex', alignItems:'center', gap:'6px', padding:`6px 8px 6px ${10 + depth*16}px`, cursor:'pointer', background:isSelected?'rgba(201,146,74,0.08)':'transparent', borderLeft:isSelected?`2px solid ${GOLD}`:'2px solid transparent', transition:'all 0.15s' }}
        onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
        onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background='transparent' }}>
        {children.length > 0
          ? <span style={{ fontSize:'0.6rem', color:MUTED, width:'10px', flexShrink:0, transform:open?'rotate(90deg)':'none', transition:'transform 0.15s', display:'inline-block' }}>▶</span>
          : <span style={{ width:'10px', flexShrink:0 }} />}
        <span style={{ fontSize:'0.65rem', color, letterSpacing:'0.08em', textTransform:'uppercase', flexShrink:0 }}>{node.productiongroup[0]}</span>
        <span style={{ fontSize:'0.78rem', color:isSelected?CREAM:CHARCOAL, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{node.productiontitle}</span>
      </div>
      {open && children.map(child => (
        <TreeNode key={child.productionid} node={child} allNodes={allNodes} selectedId={selectedId} onSelect={onSelect} depth={depth+1} />
      ))}
    </div>
  )
}

// ─── Generate Takes Modal ────────────────────────────────────────────────────

function GenTakesModal({ shot, onClose, onDone }) {
  const [form, setForm] = useState({ aimodel: shot.aimodel||'Veo 2', variations:1 })
  const [saving, setSaving] = useState(false)

  async function handleGenerate() {
    setSaving(true)
    const inserts = Array.from({length:parseInt(form.variations)}, (_,i) => ({
      productiontitle: `Take ${i+1}`,
      productiongroup: 'TAKE',
      productionstatus: 'queued',
      parentproductionid: shot.productionid,
      aimodel: form.aimodel,
      activestatus: 'A',
      createdate: new Date().toISOString(),
      updatedate: new Date().toISOString(),
    }))
    await supabase.from('productions').insert(inserts)
    await supabase.from('productions').update({ productionstatus:'queued', aimodel:form.aimodel, updatedate:new Date().toISOString() }).eq('productionid', shot.productionid)
    setSaving(false)
    onDone()
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={onClose}>
      <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, padding:'32px', width:'440px', maxWidth:'90vw' }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', color:CREAM, marginBottom:'6px', fontWeight:300 }}>Generate Takes</h3>
        <div style={{ fontSize:'0.75rem', color:CHARCOAL, marginBottom:'24px' }}>{shot.productiontitle}</div>

        <label style={{ display:'block', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'6px' }}>AI Model</label>
        <select value={form.aimodel} onChange={e=>setForm(f=>({...f,aimodel:e.target.value}))}
          style={{ width:'100%', background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, padding:'9px 12px', fontFamily:'DM Sans, sans-serif', fontSize:'0.83rem', outline:'none', marginBottom:'16px', cursor:'pointer' }}>
          {AI_MODELS.map(m=><option key={m}>{m}</option>)}
        </select>

        <label style={{ display:'block', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'6px' }}>Variations (1–5)</label>
        <input type="number" min={1} max={5} value={form.variations} onChange={e=>setForm(f=>({...f,variations:Math.min(5,Math.max(1,e.target.value))}))}
          style={{ width:'100%', background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, padding:'9px 12px', fontFamily:'DM Sans, sans-serif', fontSize:'0.83rem', outline:'none', marginBottom:'24px' }} />

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={handleGenerate} disabled={saving}
            style={{ background:GOLD, border:'none', color:'#1A1810', padding:'10px 24px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, opacity:saving?0.7:1 }}>
            {saving?'Generating...':'Generate'}
          </button>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'10px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Queue Tab ───────────────────────────────────────────────────────────────

function QueueTab({ selectedTitleId }) {
  const [allNodes, setAllNodes]       = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [shots, setShots]             = useState([])
  const [loadingTree, setLoadingTree] = useState(true)
  const [loadingShots, setLoadingShots] = useState(false)
  const [genTarget, setGenTarget]     = useState(null)

  useEffect(() => {
    if (!selectedTitleId) return
    loadTree()
  }, [selectedTitleId])

  async function loadTree() {
    setLoadingTree(true)
    const { data } = await supabase.from('productions')
      .select('productionid, productiontitle, productiongroup, productionstatus, parentproductionid, aimodel')
      .eq('activestatus','A')
      .in('productiongroup',['TITLE','ARC','ACT','EPISODE','SHOT'])
      .order('productiontitle')
    if (data) setAllNodes(data)
    setLoadingTree(false)
  }

  async function loadShotsForNode(node) {
    setLoadingShots(true)
    setShots([])
    let ids = [node.productionid]

    if (node.productiongroup !== 'SHOT') {
      // Collect all descendant IDs
      const all = allNodes
      function collectDescendants(parentId) {
        const children = all.filter(n => n.parentproductionid === parentId)
        children.forEach(c => { ids.push(c.productionid); collectDescendants(c.productionid) })
      }
      collectDescendants(node.productionid)
    }

    const { data } = await supabase.from('productions')
      .select('*')
      .eq('activestatus','A')
      .eq('productiongroup','SHOT')
      .in(node.productiongroup === 'SHOT' ? 'productionid' : 'parentproductionid',
          node.productiongroup === 'EPISODE' ? [node.productionid] : ids)
      .order('productiontitle')

    if (data) setShots(data)
    setLoadingShots(false)
  }

  function handleSelectNode(node) {
    setSelectedNode(node)
    loadShotsForNode(node)
  }

  async function handleApprove(shot) {
    await supabase.from('productions').update({ productionstatus:'approved', updatedate:new Date().toISOString() }).eq('productionid', shot.productionid)
    setShots(s => s.map(x => x.productionid===shot.productionid ? {...x,productionstatus:'approved'} : x))
  }

  async function handleRequeue(shot) {
    await supabase.from('productions').update({ productionstatus:'queued', updatedate:new Date().toISOString() }).eq('productionid', shot.productionid)
    setShots(s => s.map(x => x.productionid===shot.productionid ? {...x,productionstatus:'queued'} : x))
  }

  function timeAgo(d) {
    if (!d) return '--'
    const m = Math.floor((Date.now()-new Date(d))/60000)
    if (m<60) return `${m}m ago`
    const h = Math.floor(m/60)
    if (h<24) return `${h}h ago`
    return `${Math.floor(h/24)}d ago`
  }

  const titleNode = allNodes.find(n => n.productiongroup==='TITLE' && String(n.productionid)===String(selectedTitleId))
  const counts = shots.reduce((acc,s) => {
    const k = ['queued','in_production','completed','approved','error'].find(x=>x===s.productionstatus) || 'queued'
    acc[k] = (acc[k]||0)+1; return acc
  }, {})

  return (
    <div style={{ display:'flex', gap:'0', height:'calc(100vh - 220px)', minHeight:'500px' }}>

      {/* Tree panel */}
      <div style={{ width:'260px', flexShrink:0, borderRight:`1px solid ${BORDER}`, overflowY:'auto', paddingTop:'8px' }}>
        {loadingTree ? (
          <div style={{ padding:'20px', color:MUTED, fontSize:'0.8rem' }}>Loading...</div>
        ) : !titleNode ? (
          <div style={{ padding:'20px', color:MUTED, fontSize:'0.8rem' }}>No title selected</div>
        ) : (
          <TreeNode
            node={titleNode}
            allNodes={allNodes}
            selectedId={selectedNode?.productionid}
            onSelect={handleSelectNode}
            depth={0}
          />
        )}
      </div>

      {/* Shot grid panel */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 0 0 24px' }}>
        {!selectedNode ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:MUTED, fontSize:'0.82rem' }}>
            Select a node in the tree to see its shots
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', paddingTop:'4px', flexWrap:'wrap', gap:'8px' }}>
              <div>
                <div style={{ fontSize:'0.7rem', color:CHARCOAL, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'2px' }}>{selectedNode.productiongroup}</div>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.2rem', color:CREAM, fontWeight:300 }}>{selectedNode.productiontitle}</div>
              </div>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                {Object.entries(counts).map(([k,v]) => (
                  <div key={k} style={{ background:SURFACE2, border:`1px solid ${BORDER}`, padding:'6px 14px', textAlign:'center' }}>
                    <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.3rem', color:STATUS_COLORS[k]?.color||GOLD, lineHeight:1 }}>{v}</div>
                    <div style={{ fontSize:'0.62rem', color:CHARCOAL, letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'3px' }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div style={{ border:`1px solid ${BORDER}`, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${BORDER}`, background:SURFACE2 }}>
                    {['Shot','AI Model','Status','Updated','Actions'].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'0.67rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingShots ? (
                    <tr><td colSpan={5} style={{ padding:'32px', textAlign:'center', color:MUTED, fontSize:'0.82rem' }}>Loading...</td></tr>
                  ) : shots.length===0 ? (
                    <tr><td colSpan={5} style={{ padding:'32px', textAlign:'center', color:MUTED, fontSize:'0.82rem' }}>No shots found under this node.</td></tr>
                  ) : shots.map((shot, i) => (
                    <tr key={shot.productionid}
                      style={{ borderBottom:i<shots.length-1?`1px solid ${BORDER}`:'none' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(201,146,74,0.02)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'12px 14px', color:CREAM, fontSize:'0.82rem' }}>{shot.productiontitle}</td>
                      <td style={{ padding:'12px 14px', color:CHARCOAL, fontSize:'0.78rem' }}>{shot.aimodel||'--'}</td>
                      <td style={{ padding:'12px 14px' }}><StatusBadge status={shot.productionstatus} /></td>
                      <td style={{ padding:'12px 14px', color:MUTED, fontSize:'0.75rem' }}>{timeAgo(shot.updatedate)}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                          <button onClick={()=>setGenTarget(shot)}
                            style={{ background:'none', border:'none', color:GOLD, fontSize:'0.72rem', cursor:'pointer', padding:0, whiteSpace:'nowrap' }}>
                            Generate Takes
                          </button>
                          {(shot.productionstatus==='complete'||shot.productionstatus==='completed') && (
                            <button onClick={()=>handleApprove(shot)} style={{ background:'none', border:'none', color:GREEN, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Approve</button>
                          )}
                          {shot.productionstatus==='queued' && (
                            <button onClick={()=>handleRequeue(shot)} style={{ background:'none', border:'none', color:CHARCOAL, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Cancel</button>
                          )}
                          {shot.productionstatus==='error' && (
                            <button onClick={()=>handleRequeue(shot)} style={{ background:'none', border:'none', color:RED, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Re-queue</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {genTarget && (
        <GenTakesModal
          shot={genTarget}
          onClose={()=>setGenTarget(null)}
          onDone={()=>loadShotsForNode(selectedNode)}
        />
      )}
    </div>
  )
}

// ─── Assembly Tab ────────────────────────────────────────────────────────────

function AssemblyTab({ selectedTitleId }) {
  const [episodes, setEpisodes]       = useState([])
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [shots, setShots]             = useState([])
  const [dragIdx, setDragIdx]         = useState(null)
  const [selectedShot, setSelectedShot] = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => { if (selectedTitleId) loadEpisodes() }, [selectedTitleId])

  async function loadEpisodes() {
    setLoading(true)
    const { data } = await supabase.from('productions').select('productionid,productiontitle,productionstatus')
      .eq('activestatus','A').eq('productiongroup','EPISODE').order('productiontitle')
    if (data) { setEpisodes(data); if (data[0]) { setSelectedEpisode(data[0]); loadShots(data[0].productionid) } }
    setLoading(false)
  }

  async function loadShots(episodeId) {
    const { data } = await supabase.from('productions').select('*')
      .eq('activestatus','A').eq('productiongroup','SHOT').eq('parentproductionid', episodeId)
      .order('productiontitle')
    if (data) setShots(data)
  }

  function onDragStart(i) { setDragIdx(i) }
  function onDragOver(e, i) {
    e.preventDefault()
    if (dragIdx===null||dragIdx===i) return
    const next=[...shots]; const [moved]=next.splice(dragIdx,1); next.splice(i,0,moved)
    setShots(next); setDragIdx(i)
  }
  function onDragEnd() { setDragIdx(null) }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'0.7rem', color:CHARCOAL, letterSpacing:'0.15em', textTransform:'uppercase' }}>Episode</span>
          <select value={selectedEpisode?.productionid||''} onChange={e=>{
            const ep=episodes.find(x=>String(x.productionid)===e.target.value)
            setSelectedEpisode(ep); setSelectedShot(null)
            if (ep) loadShots(ep.productionid)
          }} style={{ background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, padding:'7px 12px', fontFamily:'DM Sans, sans-serif', fontSize:'0.8rem', outline:'none', cursor:'pointer' }}>
            {episodes.map(ep=><option key={ep.productionid} value={ep.productionid}>{ep.productiontitle}</option>)}
          </select>
        </div>
        <button style={{ background:GOLD, border:'none', color:'#1A1810', padding:'8px 20px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>
          Export Episode
        </button>
      </div>
      <div style={{ display:'flex', gap:'8px', padding:'20px', background:SURFACE2, border:`1px solid ${BORDER}`, marginBottom:'24px', overflowX:'auto', minHeight:'120px', alignItems:'center' }}>
        {loading ? <span style={{ color:MUTED, fontSize:'0.82rem' }}>Loading...</span>
        : shots.length===0 ? <span style={{ color:MUTED, fontSize:'0.82rem' }}>No shots for this episode yet.</span>
        : shots.map((shot,i) => (
          <div key={shot.productionid} draggable
            onDragStart={()=>onDragStart(i)} onDragOver={e=>onDragOver(e,i)} onDragEnd={onDragEnd}
            onClick={()=>setSelectedShot(shot)}
            style={{ minWidth:'140px', height:'80px', background:selectedShot?.productionid===shot.productionid?'rgba(201,146,74,0.12)':SURFACE, border:`1px solid ${selectedShot?.productionid===shot.productionid?GOLD:BORDER}`, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'10px 12px', cursor:'grab', userSelect:'none', opacity:dragIdx===i?0.5:1, transition:'all 0.15s' }}>
            <div style={{ fontSize:'0.72rem', color:CREAM, lineHeight:1.3 }}>{shot.productiontitle}</div>
            <StatusBadge status={shot.productionstatus} />
          </div>
        ))}
      </div>
      {selectedShot && (
        <div style={{ background:SURFACE2, border:`1px solid ${BORDER}`, padding:'20px' }}>
          <div style={{ fontSize:'0.7rem', color:CHARCOAL, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'12px' }}>Shot Properties</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px' }}>
            {[['Name',selectedShot.productiontitle],['Status',selectedShot.productionstatus],['AI Model',selectedShot.aimodel||'--'],['Synopsis',selectedShot.synopsis||'--']].map(([label,value])=>(
              <div key={label}>
                <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'4px' }}>{label}</div>
                <div style={{ fontSize:'0.85rem', color:CREAM }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function Production() {
  const [activeTab, setActiveTab]         = useState('queue')
  const [titles, setTitles]               = useState([])
  const [selectedTitleId, setSelectedTitleId] = useState('')

  useEffect(() => {
    supabase.from('productions').select('productionid,productiontitle').eq('productiongroup','TITLE').eq('activestatus','A')
      .then(({ data }) => { if (data) { setTitles(data); if (data[0]) setSelectedTitleId(String(data[0].productionid)) } })
  }, [])

  const tabs = [{ id:'queue', label:'Production Queue' }, { id:'assembly', label:'Assembly View' }]

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif', color:CREAM }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px', flexWrap:'wrap', gap:'12px' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', fontWeight:300, color:CREAM, margin:0 }}>Production Studio</h1>
        <select value={selectedTitleId} onChange={e=>setSelectedTitleId(e.target.value)}
          style={{ background:SURFACE, border:`1px solid ${BORDER}`, color:CREAM, padding:'8px 16px', fontFamily:'DM Sans, sans-serif', fontSize:'0.82rem', outline:'none', cursor:'pointer', minWidth:'200px' }}>
          {titles.map(t=><option key={t.productionid} value={t.productionid}>{t.productiontitle}</option>)}
        </select>
      </div>
      <div style={{ display:'flex', borderBottom:`1px solid ${BORDER}`, marginBottom:'28px' }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{ background:'none', border:'none', borderBottom:activeTab===id?`2px solid ${GOLD}`:'2px solid transparent', color:activeTab===id?GOLD:CHARCOAL, padding:'10px 24px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.8rem', letterSpacing:'0.08em', textTransform:'uppercase', transition:'all 0.2s', marginBottom:'-1px' }}>
            {label}
          </button>
        ))}
      </div>
      {activeTab==='queue'    && <QueueTab    selectedTitleId={selectedTitleId} />}
      {activeTab==='assembly' && <AssemblyTab selectedTitleId={selectedTitleId} />}
    </div>
  )
}
