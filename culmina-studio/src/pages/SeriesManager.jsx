import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const GOLD    = '#C9924A'
const CHARCOAL= '#5C574E'
const CREAM   = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2= '#111009'
const BORDER  = 'rgba(201,146,74,0.12)'
const MUTED   = '#6A6560'
const GREEN   = '#4A9C7A'
const RED     = '#C84B31'

const lbl = { display:'block', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'6px' }
const inp = { width:'100%', background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, padding:'9px 12px', fontFamily:'DM Sans, sans-serif', fontSize:'0.82rem', outline:'none', boxSizing:'border-box' }

function SeriesModal({ series, endUserId, onClose, onSaved }) {
  const editing = !!series
  const [form, setForm] = useState({
    seriesname: series?.seriesname || '',
    startdate:  series?.startdate  || '',
    enddate:    series?.enddate    || '',
    notes:      series?.notes      || '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleSave() {
    if (!form.seriesname.trim()) { setError('Series name is required'); return }
    setSaving(true); setError('')
    const payload = {
      seriesname:   form.seriesname.trim(),
      startdate:    form.startdate  || null,
      enddate:      form.enddate    || null,
      notes:        form.notes      || null,
      enduserid:    endUserId,
      activestatus: 'A',
      updatedate:   new Date().toISOString(),
    }
    let data, err
    if (editing) {
      ;({ data, error: err } = await supabase.from('series').update(payload).eq('seriesid', series.seriesid).select().single())
    } else {
      payload.createdate = new Date().toISOString()
      ;({ data, error: err } = await supabase.from('series').insert(payload).select().single())
    }
    if (err) { setError(err.message); setSaving(false); return }
    onSaved(data, editing)
    setSaving(false); onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={onClose}>
      <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, padding:'32px', width:'460px', maxWidth:'90vw' }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', color:CREAM, marginBottom:'24px', fontWeight:300 }}>
          {editing ? 'Edit Series' : 'New Series'}
        </h3>

        <label style={lbl}>Series Name *</label>
        <input value={form.seriesname} onChange={e=>setForm(f=>({...f,seriesname:e.target.value}))}
          placeholder="e.g. The Rasand Chronicles" style={{...inp, marginBottom:'16px'}} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
          <div>
            <label style={lbl}>Start Date</label>
            <input type="date" value={form.startdate} onChange={e=>setForm(f=>({...f,startdate:e.target.value}))} style={inp} />
          </div>
          <div>
            <label style={lbl}>End Date</label>
            <input type="date" value={form.enddate} onChange={e=>setForm(f=>({...f,enddate:e.target.value}))} style={inp} />
          </div>
        </div>

        <label style={lbl}>Notes</label>
        <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3}
          placeholder="Optional" style={{...inp, marginBottom:'24px', resize:'vertical'}} />

        {error && <div style={{ marginBottom:'14px', padding:'8px 12px', background:'rgba(200,75,49,0.1)', border:'1px solid rgba(200,75,49,0.3)', color:RED, fontSize:'0.75rem' }}>{error}</div>}

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ background:GOLD, border:'none', color:'#1A1810', padding:'10px 24px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, opacity:saving?0.7:1 }}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Series'}
          </button>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'10px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function AssignTitleModal({ series, onClose, onDone }) {
  const [titles,   setTitles]   = useState([])
  const [selected, setSelected] = useState('')
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    supabase.from('productions').select('productionid, productiontitle, seriesid')
      .eq('productiongroup','TITLE').eq('activestatus','A').order('productiontitle')
      .then(({ data }) => { if (data) setTitles(data) })
  }, [])

  async function handleAssign() {
    if (!selected) return
    setSaving(true)
    await supabase.from('productions').update({ seriesid: series.seriesid, updatedate: new Date().toISOString() }).eq('productionid', parseInt(selected))
    setSaving(false); onDone(); onClose()
  }

  const unassigned = titles.filter(t => !t.seriesid || t.seriesid === series.seriesid)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={onClose}>
      <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, padding:'32px', width:'420px', maxWidth:'90vw' }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', color:CREAM, marginBottom:'6px', fontWeight:300 }}>Assign Title</h3>
        <div style={{ fontSize:'0.75rem', color:CHARCOAL, marginBottom:'20px' }}>to {series.seriesname}</div>

        <label style={lbl}>Title</label>
        <select value={selected} onChange={e=>setSelected(e.target.value)}
          style={{...inp, marginBottom:'24px', cursor:'pointer'}}>
          <option value="">Select a title...</option>
          {unassigned.map(t=><option key={t.productionid} value={t.productionid}>{t.productiontitle}{t.seriesid===series.seriesid?' (already assigned)':''}</option>)}
        </select>

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={handleAssign} disabled={saving||!selected}
            style={{ background:GOLD, border:'none', color:'#1A1810', padding:'10px 24px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, opacity:(saving||!selected)?0.5:1 }}>
            {saving?'Assigning...':'Assign'}
          </button>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'10px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function SeriesManager() {
  const { endUser } = useAuth()
  const [series,   setSeries]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [assignTarget, setAssignTarget] = useState(null)
  const [expanded, setExpanded] = useState({})

  useEffect(() => { loadSeries() }, [])

  async function loadSeries() {
    setLoading(true)
    const { data } = await supabase.from('series')
      .select('*').eq('activestatus','A').order('seriesname')
    if (data) setSeries(data)
    setLoading(false)
  }

  async function loadTitles(seriesid) {
    const { data } = await supabase.from('productions')
      .select('productionid, productiontitle, productionstatus, createdate')
      .eq('productiongroup','TITLE').eq('activestatus','A').eq('seriesid', seriesid)
      .order('productiontitle')
    return data || []
  }

  async function toggleExpand(s) {
    const id = s.seriesid
    if (expanded[id]) { setExpanded(e=>({...e,[id]:null})); return }
    const titles = await loadTitles(id)
    setExpanded(e=>({...e,[id]:titles}))
  }

  async function handleDeactivate(s) {
    if (!confirm(`Archive "${s.seriesname}"?`)) return
    await supabase.from('series').update({ activestatus:'H', updatedate:new Date().toISOString() }).eq('seriesid', s.seriesid)
    setSeries(ss=>ss.filter(x=>x.seriesid!==s.seriesid))
  }

  async function handleUnassign(titleId, seriesid) {
    await supabase.from('productions').update({ seriesid: null, updatedate: new Date().toISOString() }).eq('productionid', titleId)
    setExpanded(e=>({ ...e, [seriesid]: (e[seriesid]||[]).filter(t=>t.productionid!==titleId) }))
  }

  function handleSaved(data, editing) {
    if (editing) setSeries(ss=>ss.map(s=>s.seriesid===data.seriesid?data:s))
    else setSeries(ss=>[...ss, data])
  }

  function formatDate(d) {
    if (!d) return '--'
    return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
  }

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif', color:CREAM }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', fontWeight:300, color:CREAM, margin:0 }}>Series Manager</h1>
          <div style={{ fontSize:'0.72rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:'4px' }}>Organize titles into series</div>
        </div>
        <button onClick={()=>{ setEditTarget(null); setShowModal(true) }}
          style={{ background:GOLD, border:'none', color:'#1A1810', padding:'9px 22px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>
          + New Series
        </button>
      </div>

      {loading ? (
        <div style={{ color:MUTED, fontSize:'0.82rem' }}>Loading...</div>
      ) : series.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:MUTED }}>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', marginBottom:'8px' }}>No series yet</div>
          <div style={{ fontSize:'0.82rem' }}>Create your first series to start organizing titles.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
          {series.map(s => (
            <div key={s.seriesid}>
              {/* Series row */}
              <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, padding:'18px 24px', display:'flex', alignItems:'center', gap:'16px' }}>
                {/* Expand toggle */}
                <button onClick={()=>toggleExpand(s)}
                  style={{ background:'none', border:'none', color:CHARCOAL, cursor:'pointer', fontSize:'0.7rem', width:'20px', padding:0, transition:'transform 0.15s', transform:expanded[s.seriesid]?'rotate(90deg)':'none' }}>
                  ▶
                </button>

                {/* Series name + dates */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.15rem', color:CREAM, marginBottom:'3px' }}>{s.seriesname}</div>
                  <div style={{ fontSize:'0.72rem', color:CHARCOAL }}>
                    {formatDate(s.startdate)} {s.enddate ? `→ ${formatDate(s.enddate)}` : '→ ongoing'}
                  </div>
                </div>

                {/* Title count badge */}
                <div style={{ background:'rgba(201,146,74,0.08)', border:`1px solid ${BORDER}`, padding:'4px 14px', textAlign:'center', minWidth:'60px' }}>
                  <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.2rem', color:GOLD, lineHeight:1 }}>
                    {expanded[s.seriesid] ? expanded[s.seriesid].length : '—'}
                  </div>
                  <div style={{ fontSize:'0.6rem', color:CHARCOAL, letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'2px' }}>Titles</div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                  <button onClick={()=>setAssignTarget(s)}
                    style={{ background:'none', border:`1px solid rgba(201,146,74,0.3)`, color:GOLD, padding:'5px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.7rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                    + Assign Title
                  </button>
                  <button onClick={()=>{ setEditTarget(s); setShowModal(true) }}
                    style={{ background:'none', border:'none', color:GOLD, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Edit</button>
                  <button onClick={()=>handleDeactivate(s)}
                    style={{ background:'none', border:'none', color:RED, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Archive</button>
                </div>
              </div>

              {/* Expanded titles */}
              {expanded[s.seriesid] && (
                <div style={{ borderLeft:`2px solid rgba(201,146,74,0.15)`, marginLeft:'20px' }}>
                  {expanded[s.seriesid].length===0 ? (
                    <div style={{ padding:'14px 24px', color:MUTED, fontSize:'0.78rem', background:SURFACE2, border:`1px solid ${BORDER}`, borderTop:'none' }}>
                      No titles assigned yet — click + Assign Title.
                    </div>
                  ) : expanded[s.seriesid].map((t,i)=>(
                    <div key={t.productionid} style={{ background:SURFACE2, border:`1px solid ${BORDER}`, borderTop:'none', padding:'12px 24px', display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:GOLD, opacity:0.5, flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'0.85rem', color:CREAM }}>{t.productiontitle}</div>
                        <div style={{ fontSize:'0.7rem', color:CHARCOAL, marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{t.productionstatus||'development'}</div>
                      </div>
                      <div style={{ fontSize:'0.7rem', color:MUTED }}>{formatDate(t.createdate)}</div>
                      <button onClick={()=>handleUnassign(t.productionid, s.seriesid)}
                        style={{ background:'none', border:'none', color:CHARCOAL, fontSize:'0.7rem', cursor:'pointer', padding:0 }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SeriesModal
          series={editTarget}
          endUserId={endUser?.enduserid}
          onClose={()=>{ setShowModal(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}

      {assignTarget && (
        <AssignTitleModal
          series={assignTarget}
          onClose={()=>setAssignTarget(null)}
          onDone={()=>{ const id=assignTarget.seriesid; setExpanded(e=>({...e,[id]:null})); loadTitles(id).then(titles=>setExpanded(e=>({...e,[id]:titles}))) }}
        />
      )}
    </div>
  )
}
