import { useState, useEffect, useRef } from 'react'
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
  const children = allNodes.filter(n => n.parentproductionid === node.productionid).sort((a,b) => (a.sortorder||0)-(b.sortorder||0))
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
        <span style={{ fontSize:'0.65rem', color, letterSpacing:'0.08em', textTransform:'uppercase', flexShrink:0 }}>{node.productiongroup === 'EPISODE' ? 'EP' : node.productiongroup === 'ACT' ? 'AC' : node.productiongroup[0]}</span>
        {node.productiongroup === 'SHOT' && (
          <span style={{ fontSize:'0.6rem', marginLeft:'2px' }}>{node.productionstatus === 'approved' ? '🟢' : (node.productionstatus === 'completed' || node.productionstatus === 'in_production') ? '🟡' : '⚪'}</span>
        )}
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
  const [phase,   setPhase]   = useState('setup')   // 'setup' | 'generating' | 'done'
  const [form,    setForm]    = useState({
    model:          'veo-3.1-generate-preview',
    prompt:         shot.aigeneratedprompt || shot.prompt || '',
    negativePrompt: shot.negativeprompt   || '',
    duration:       8,
    variations:     1,
  })
  const [takes,        setTakes]        = useState([])
  const [assets,       setAssets]       = useState([])
  const [loadingAssets,setLoadingAssets]= useState(true)
  const pollRef    = useRef(null)
  const takesRef  = useRef([])
  const pollCount = useRef(0)
  const MAX_POLLS = 60  // 60 x 8s = 8 min max

  useEffect(() => {
    loadAssets()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function loadAssets() {
    const { data } = await supabase
      .from('production_assets')
      .select('assetid, instanceid, assets(assetname, assettype), assetinstances(instancename)')
      .eq('productionid', shot.productionid)
      .eq('activestatus', 'A')
      .eq('included', true)
    setAssets(data || [])
    setLoadingAssets(false)
  }

  async function handleGenerate() {
    setPhase('generating')
    // Mark shot as in_production
    await supabase.from('productions').update({
      productionstatus: 'in_production', aimodel: form.model,
      updatedate: new Date().toISOString(),
    }).eq('productionid', shot.productionid)

    const { count: existingTakeCount } = await supabase.from('productions').select('productionid', { count: 'exact', head: true }).eq('parentproductionid', shot.productionid).eq('productiongroup', 'TAKE')
    const takeOffset = existingTakeCount || 0
    const newTakes = []
    for (let i = 0; i < parseInt(form.variations); i++) {
      const takeNumber = takeOffset + i + 1
      // Insert TAKE row (need .select() to get productionid)
      const { data: takeData, error: takeErr } = await supabase
        .from('productions')
        .insert([{
          productiontitle:    `Take ${takeNumber}`,
          productiongroup:    'TAKE',
          parentproductionid: shot.productionid,
          aimodel:            form.model,
          productionstatus:   'in_production',
          prompt:             form.prompt,
          activestatus:       'A',
          createdate:         new Date().toISOString(),
          updatedate:         new Date().toISOString(),
        }])
        .select('productionid')
        .single()

      if (takeErr) {
        newTakes.push({ tempId: i, name: `Take ${takeNumber}`, status: 'error', error: takeErr.message })
        continue
      }
      const takeId = takeData.productionid

      // Submit to Veo
      let opResult = {}
      try {
        const resp = await fetch('/api/veo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt:          form.prompt,
            model:           form.model,
            aspectRatio:     '9:16',
            durationSeconds: parseInt(form.duration),
            negativePrompt:  form.negativePrompt || undefined,
          }),
        })
        opResult = await resp.json()
      } catch (err) {
        opResult = { error: err.message }
      }

      if (opResult.error) {
        await supabase.from('productions').update({
          productionstatus: 'error', notes: opResult.error,
          updatedate: new Date().toISOString(),
        }).eq('productionid', takeId)
        newTakes.push({ productionid: takeId, name: `Take ${takeNumber}`, status: 'error', error: opResult.error })
      } else {
        await supabase.from('productions').update({
          operationname: opResult.operationName,
          updatedate: new Date().toISOString(),
        }).eq('productionid', takeId)
        newTakes.push({ productionid: takeId, name: `Take ${takeNumber}`, status: 'in_production', operationName: opResult.operationName })
      }
    }

    takesRef.current = newTakes
    setTakes([...newTakes])
    startPolling()
  }

  function startPolling() {
    pollCount.current = 0
    pollRef.current = setInterval(async () => {
      pollCount.current += 1
      if (pollCount.current > MAX_POLLS) {
        clearInterval(pollRef.current)
        // Mark all still-pending takes as error
        const stillPending = takesRef.current.filter(t => t.status === 'in_production')
        for (const t of stillPending) {
          await supabase.from('productions').update({ productionstatus: 'error', notes: 'Timed out after 8 minutes', updatedate: new Date().toISOString() }).eq('productionid', t.productionid)
        }
        const timedOut = takesRef.current.map(t => t.status === 'in_production' ? { ...t, status: 'error', error: 'Timed out after 8 minutes' } : t)
        takesRef.current = timedOut
        setTakes([...timedOut])
        setPhase('done')
        return
      }
      const pending = takesRef.current.filter(t => t.status === 'in_production' && t.operationName)
      if (pending.length === 0) {
        clearInterval(pollRef.current)
        setPhase('done')
        onDone()
        return
      }
      const updates = []
      for (const take of pending) {
        try {
          const result = await fetch(`/api/veo-poll?op=${encodeURIComponent(take.operationName)}`).then(r => r.json())
          if (result.done) {
            if (result.error) {
              await supabase.from('productions').update({ productionstatus: 'error', notes: result.error, updatedate: new Date().toISOString() }).eq('productionid', take.productionid)
              updates.push({ id: take.productionid, status: 'error', error: result.error })
            } else {
              await supabase.from('productions').update({ productionstatus: 'completed', videourl: result.videoUri, updatedate: new Date().toISOString() }).eq('productionid', take.productionid)
              updates.push({ id: take.productionid, status: 'completed', videoUri: result.videoUri })
            }
          }
        } catch { /* retry next tick */ }
      }
      if (updates.length > 0) {
        const updated = takesRef.current.map(t => {
          const u = updates.find(x => x.id === t.productionid)
          return u ? { ...t, ...u } : t
        })
        takesRef.current = updated
        setTakes([...updated])
      }
    }, 8000)
  }

  const inputStyle  = { width:'100%', background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, padding:'9px 12px', fontFamily:'DM Sans, sans-serif', fontSize:'0.82rem', outline:'none', boxSizing:'border-box' }
  const labelStyle  = { display:'block', fontSize:'0.67rem', color:CHARCOAL, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'6px' }
  const rowStyle    = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={phase === 'setup' ? onClose : undefined}>
      <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, padding:'32px', width:'620px', maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.5rem', color:CREAM, marginBottom:'4px', fontWeight:300 }}>
          {phase === 'setup' ? 'Generate Takes' : phase === 'generating' ? 'Generating…' : 'Generation Complete'}
        </h3>
        <div style={{ fontSize:'0.72rem', color:CHARCOAL, marginBottom:'24px' }}>{shot.productiontitle}</div>

        {/* ── SETUP PHASE ── */}
        {phase === 'setup' && (
          <>
            {/* Prompt */}
            <label style={labelStyle}>Veo Prompt</label>
            <textarea value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} rows={5}
              style={{ ...inputStyle, resize:'vertical', lineHeight:1.5, marginBottom:'14px' }} />

            {/* Negative prompt */}
            <label style={labelStyle}>Negative Prompt <span style={{ color:MUTED, fontWeight:300, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
            <input value={form.negativePrompt} onChange={e => setForm(f => ({ ...f, negativePrompt: e.target.value }))}
              style={{ ...inputStyle, marginBottom:'16px' }} placeholder="e.g. blurry, low quality, text, watermark" />

            {/* Model / Duration / Variations */}
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Model</label>
                <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  style={{ ...inputStyle, cursor:'pointer' }}>
                  <option value="veo-3.1-generate-preview">Veo 3.1 (preview)</option>
                  <option value="veo-2.0-generate-001">Veo 2</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Duration (sec)</label>
                <input type="number" min={5} max={8} value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: Math.min(8, Math.max(5, parseInt(e.target.value)||8)) }))}
                  style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={labelStyle}>Variations (1–5)</label>
              <input type="number" min={1} max={5} value={form.variations}
                onChange={e => setForm(f => ({ ...f, variations: Math.min(5, Math.max(1, parseInt(e.target.value)||1)) }))}
                style={{ ...inputStyle, width:'120px' }} />
            </div>

            {/* Asset context */}
            {!loadingAssets && assets.length > 0 && (
              <div style={{ marginBottom:'24px' }}>
                <label style={labelStyle}>Assets in this shot</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {assets.map((a, i) => (
                    <span key={i} style={{ background:SURFACE2, border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'3px 10px', fontSize:'0.72rem', borderRadius:'2px' }}>
                      {a.assets?.assetname || '—'}{a.assetinstances?.instancename ? ` · ${a.assetinstances.instancename}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt empty warning */}
            {!form.prompt.trim() && (
              <div style={{ color:'#FFB84A', fontSize:'0.75rem', marginBottom:'16px' }}>
                ⚠ No prompt found on this shot. Add one in Development before generating.
              </div>
            )}

            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleGenerate} disabled={!form.prompt.trim()}
                style={{ background:GOLD, border:'none', color:'#1A1810', padding:'10px 28px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, opacity:!form.prompt.trim()?0.5:1 }}>
                Generate {form.variations > 1 ? `${form.variations} Takes` : 'Take'}
              </button>
              <button onClick={onClose}
                style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'10px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem' }}>
                Cancel
              </button>
            </div>
          </>
        )}

        {/* ── GENERATING / DONE PHASE ── */}
        {(phase === 'generating' || phase === 'done') && (
          <>
            {phase === 'generating' && (
              <div style={{ fontSize:'0.78rem', color:MUTED, marginBottom:'20px' }}>
                Submitted to Veo · polling every 8s · typical wait 2–4 minutes
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px' }}>
              {takes.map((take, i) => (
                <div key={take.productionid || i}
                  style={{ background:SURFACE2, border:`1px solid ${BORDER}`, padding:'16px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: take.videoUri ? '12px' : 0 }}>
                    <span style={{ color:CREAM, fontSize:'0.85rem' }}>{take.name}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      {take.status === 'in_production' && (
                        <span style={{ fontSize:'0.7rem', color:MUTED }}>polling…</span>
                      )}
                      <StatusBadge status={take.status === 'completed' ? 'complete' : take.status} />
                    </div>
                  </div>
                  {take.error && (
                    <div style={{ fontSize:'0.72rem', color:RED, marginTop:'8px' }}>{take.error}</div>
                  )}
                  {take.videoUri && (
                    <video
                      src={`/api/veo-proxy?uri=${encodeURIComponent(take.videoUri)}`}
                      controls
                      style={{ width:'100%', maxHeight:'280px', background:'#000', marginTop:'10px', display:'block' }}
                    />
                  )}
                </div>
              ))}
            </div>
            {phase === 'done' && (
              <button onClick={onClose}
                style={{ background:GOLD, border:'none', color:'#1A1810', padding:'10px 28px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>
                Done
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}


// ─── Take Card ───────────────────────────────────────────────────────────────
function TakeCard({ take, shotId, onApprove, onReject, onDelete, timeAgo }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [notes, setNotes] = useState(take.productiontakenotes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const isRejected = take.productionstatus === 'rejected'
  const isApproved = take.productionstatus === 'approved'
  const hasVideo = !!take.videourl
  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from('productions').update({ productiontakenotes: notes, updatedate: new Date().toISOString() }).eq('productionid', take.productionid)
    setSavingNotes(false); setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000)
  }
  return (
    <div style={{ background:SURFACE2, border:`1px solid ${isApproved?'rgba(74,156,122,0.4)':isRejected?'rgba(92,87,78,0.3)':BORDER}`, padding:'14px 16px', marginRight:'24px', opacity:isRejected?0.55:1, transition:'opacity 0.2s', marginBottom:'8px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ color:isRejected?MUTED:CREAM, fontSize:'0.85rem', fontWeight:isApproved?500:400 }}>{take.productiontitle}</span>
          <span style={{ color:MUTED, fontSize:'0.72rem' }}>{timeAgo(take.updatedate)}</span>
          <span style={{ color:MUTED, fontSize:'0.72rem' }}>{take.aimodel||''}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <StatusBadge status={take.productionstatus} />
          {!isApproved && !isRejected && hasVideo && (
            <button onClick={() => onApprove(take, shotId)} style={{ background:'none', border:`1px solid ${GREEN}`, color:GREEN, padding:'3px 10px', fontSize:'0.67rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.08em', textTransform:'uppercase' }}>Approve</button>
          )}
          {!isApproved && !isRejected && hasVideo && (
            <button onClick={() => onReject(take, shotId)} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'3px 10px', fontSize:'0.67rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.08em', textTransform:'uppercase' }}>Reject</button>
          )}
          {isRejected && (
            <button onClick={() => onApprove(take, shotId)} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'3px 8px', fontSize:'0.65rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>Un-reject</button>
          )}
          <button onClick={() => onDelete(take, shotId)} style={{ background:'none', border:'1px solid rgba(200,75,49,0.3)', color:RED, padding:'3px 8px', fontSize:'0.65rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.06em', textTransform:'uppercase' }}>Delete</button>
        </div>
      </div>
      {hasVideo && <video src={`/api/veo-proxy?uri=${encodeURIComponent(take.videourl)}`} controls style={{ width:'100%', maxHeight:'320px', background:'#000', display:'block', borderRadius:'2px', marginBottom:'12px' }} />}
      {take.notes && !hasVideo && <div style={{ fontSize:'0.72rem', color:RED, marginBottom:'10px' }}>{take.notes}</div>}
      {take.prompt && (
        <div style={{ marginBottom:'10px' }}>
          <button onClick={() => setShowPrompt(p=>!p)} style={{ background:'none', border:'none', color:MUTED, fontSize:'0.68rem', cursor:'pointer', padding:0, letterSpacing:'0.06em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'4px' }}>
            <span style={{ fontSize:'0.55rem', transform:showPrompt?'rotate(90deg)':'none', display:'inline-block', transition:'transform 0.15s' }}>▶</span>
            {showPrompt ? 'Hide Prompt' : 'View Prompt'}
          </button>
          {showPrompt && <div style={{ marginTop:'8px', padding:'10px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${BORDER}`, fontSize:'0.75rem', color:CHARCOAL, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{take.prompt}</div>}
        </div>
      )}
      <div>
        <div style={{ fontSize:'0.67rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'6px' }}>Production Notes</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add notes about this take…" rows={2}
          style={{ width:'100%', background:'rgba(0,0,0,0.25)', border:`1px solid ${BORDER}`, color:CREAM, padding:'8px 10px', fontFamily:'DM Sans, sans-serif', fontSize:'0.78rem', outline:'none', resize:'vertical', lineHeight:1.5, boxSizing:'border-box' }} />
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'6px' }}>
          <button onClick={saveNotes} disabled={savingNotes} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'4px 14px', fontSize:'0.67rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.08em', textTransform:'uppercase', opacity:savingNotes?0.6:1 }}>{savingNotes?'Saving…':'Save Notes'}</button>
          {notesSaved && <span style={{ fontSize:'0.7rem', color:GREEN }}>✓ Saved</span>}
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
  const [expandedTakes, setExpandedTakes] = useState({})   // { shotId: [take rows] | 'loading' }

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
      .order('sortorder')
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
      .order('sortorder')

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

  async function toggleTakes(shotId) {
    if (expandedTakes[shotId]) {
      setExpandedTakes(t => { const n = {...t}; delete n[shotId]; return n })
      return
    }
    setExpandedTakes(t => ({ ...t, [shotId]: 'loading' }))
    const { data } = await supabase.from('productions')
      .select('*')
      .eq('activestatus', 'A')
      .eq('productiongroup', 'TAKE')
      .eq('activestatus', 'A')
      .eq('parentproductionid', shotId)
      .order('createdate', { ascending: false })
    setExpandedTakes(t => ({ ...t, [shotId]: data || [] }))
  }

  async function handleApproveTake(take, shotId) {
    await supabase.from('productions').update({ productionstatus: 'approved', updatedate: new Date().toISOString() }).eq('productionid', take.productionid)
    // Mark the parent shot as approved too
    await supabase.from('productions').update({ productionstatus: 'approved', updatedate: new Date().toISOString() }).eq('productionid', shotId)
    setShots(s => s.map(x => x.productionid === shotId ? { ...x, productionstatus: 'approved' } : x))
    setExpandedTakes(t => ({
      ...t,
      [shotId]: (t[shotId] || []).map(tk => tk.productionid === take.productionid ? { ...tk, productionstatus: 'approved' } : tk)
    }))
  }

  async function handleRejectTake(take, shotId) {
    await supabase.from('productions').update({ productionstatus: 'rejected', updatedate: new Date().toISOString() }).eq('productionid', take.productionid)
    setExpandedTakes(t => ({ ...t, [shotId]: (t[shotId] || []).map(tk => tk.productionid === take.productionid ? { ...tk, productionstatus: 'rejected' } : tk) }))
  }

  async function handleDeleteTake(take, shotId) {
    await supabase.from('productions').update({ activestatus: 'I', updatedate: new Date().toISOString() }).eq('productionid', take.productionid)
    setExpandedTakes(t => ({ ...t, [shotId]: (t[shotId] || []).filter(tk => tk.productionid !== take.productionid) }))
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
                  ) : shots.map((shot, i) => {
                    const takes     = expandedTakes[shot.productionid]
                    const isOpen    = !!takes
                    const isLoading = takes === 'loading'
                    const takeList  = Array.isArray(takes) ? takes : []
                    const hasTakes  = shot.productionstatus === 'completed' || shot.productionstatus === 'approved' || shot.productionstatus === 'in_production'
                    return (
                      <>
                        <tr key={shot.productionid}
                          style={{ borderBottom: (!isOpen && i < shots.length-1) ? `1px solid ${BORDER}` : 'none' }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(201,146,74,0.02)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'12px 14px', color:CREAM, fontSize:'0.82rem' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              {hasTakes && (
                                <button onClick={() => toggleTakes(shot.productionid)}
                                  style={{ background:'none', border:'none', color:MUTED, cursor:'pointer', padding:0, fontSize:'0.65rem', transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform 0.15s' }}>▶</button>
                              )}
                              {shot.productiontitle}
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px', color:CHARCOAL, fontSize:'0.78rem' }}>{shot.aimodel||'--'}</td>
                          <td style={{ padding:'12px 14px' }}><StatusBadge status={shot.productionstatus} /></td>
                          <td style={{ padding:'12px 14px', color:MUTED, fontSize:'0.75rem' }}>{timeAgo(shot.updatedate)}</td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                              <button onClick={()=>setGenTarget(shot)}
                                style={{ background:'none', border:'none', color:GOLD, fontSize:'0.72rem', cursor:'pointer', padding:0, whiteSpace:'nowrap' }}>
                                Generate Takes
                              </button>
                              {hasTakes && (
                                <button onClick={() => toggleTakes(shot.productionid)}
                                  style={{ background:'none', border:'none', color:CHARCOAL, fontSize:'0.72rem', cursor:'pointer', padding:0, whiteSpace:'nowrap' }}>
                                  {isOpen ? 'Hide Takes' : 'View Takes'}
                                </button>
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

                        {/* ── Inline Takes Viewer ── */}
                        {isOpen && (
                          <tr key={`takes-${shot.productionid}`}>
                            <td colSpan={5} style={{ padding:'0 0 16px 40px', background:'rgba(0,0,0,0.2)' }}>
                              {isLoading ? (
                                <div style={{ padding:'16px', color:MUTED, fontSize:'0.8rem' }}>Loading takes…</div>
                              ) : takeList.length === 0 ? (
                                <div style={{ padding:'16px', color:MUTED, fontSize:'0.8rem' }}>No takes yet — click Generate Takes to create one.</div>
                              ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:'12px', paddingTop:'12px' }}>
                                  {takeList.map((take, ti) => (
                                    <TakeCard
                                      key={take.productionid}
                                      take={take}
                                      shotId={shot.productionid}
                                      onApprove={handleApproveTake}
                                      onReject={handleRejectTake}
                                      onDelete={handleDeleteTake}
                                      timeAgo={timeAgo}
                                    />
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
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
      .eq('activestatus','A').eq('productiongroup','EPISODE').order('sortorder')
    if (data) { setEpisodes(data); if (data[0]) { setSelectedEpisode(data[0]); loadShots(data[0].productionid) } }
    setLoading(false)
  }

  async function loadShots(episodeId) {
    const { data } = await supabase.from('productions').select('*')
      .eq('activestatus','A').eq('productiongroup','SHOT').eq('parentproductionid', episodeId)
      .order('sortorder')
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
    supabase.from('productions').select('productionid,productiontitle,productionstatus').eq('productiongroup','TITLE').eq('activestatus','A')
      .in('productionstatus',['Pre-Production','Production','Post-Production'])
      .order('productiontitle')
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
