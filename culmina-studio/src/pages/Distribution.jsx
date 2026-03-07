import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD    = '#C9924A'
const CHARCOAL= '#5C574E'
const CREAM   = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2= '#111009'
const BORDER  = 'rgba(201,146,74,0.12)'
const MUTED   = '#6A6560'
const GREEN   = '#4A9C7A'
const RED     = '#C84B31'

const PLATFORM_COLORS = {
  ReelShort: '#E8673A', TikTok: '#69C9D0', YouTube: '#FF0000',
  Tubi: '#FA3B1E', 'Pluto TV': '#835AFF',
}

const STATUS_COLORS = {
  scheduled:    { bg:'rgba(122,158,200,0.15)', color:'#7A9EC8', label:'Scheduled'    },
  distributing: { bg:'rgba(201,146,74,0.25)',  color:'#FFB84A', label:'Distributing' },
  published:    { bg:'rgba(74,156,122,0.15)',  color:'#4A9C7A', label:'Published'    },
  paused:       { bg:'rgba(106,101,96,0.2)',   color:'#6A6560', label:'Paused'       },
  removed:      { bg:'rgba(200,75,49,0.15)',   color:'#C84B31', label:'Removed'      },
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.draft
  return <span style={{ background:s.bg, color:s.color, padding:'3px 10px', fontSize:'0.68rem', letterSpacing:'0.08em', textTransform:'uppercase', borderRadius:'2px', whiteSpace:'nowrap' }}>{s.label}</span>
}

function NewReleaseModal({ platforms, selectedTitleId, onClose, onSaved }) {
  const [episodes, setEpisodes] = useState([])
  const [form, setForm] = useState({ episodeproductionid:'', platformid:'', scheduledreleasedate:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('productions').select('productionid,productiontitle').eq('activestatus','A').eq('productiongroup','EPISODE').order('productiontitle')
      .then(({ data }) => { if (data) setEpisodes(data) })
  }, [])

  async function handleSave() {
    if (!form.episodeproductionid || !form.platformid) return
    setSaving(true); setError('')
    const { data, error } = await supabase.from('releases').insert({
      titleproductionid: parseInt(selectedTitleId), episodeproductionid: parseInt(form.episodeproductionid),
      platformid: parseInt(form.platformid), releasestatus:'scheduled',
      scheduledreleasedate: form.scheduledreleasedate||null, notes: form.notes||null,
      activestatus:'A', createdate:new Date().toISOString(), updatedate:new Date().toISOString(),
    }).select().single()
    if (error) { setError(error.message); setSaving(false); return }
    // Fetch with joins separately to avoid FK hint issues
    if (data) {
      const { data: full } = await supabase.from('releases')
        .select('*, productions!releases_episodeproductionid_fkey(productiontitle), platforms(platformname,platformtype)')
        .eq('releaseid', data.releaseid).single()
      onSaved(full || data)
    }
    setSaving(false); onClose()
  }

  const lbl = { display:'block', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'6px' }
  const inp = { width:'100%', background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, padding:'9px 12px', fontFamily:'DM Sans, sans-serif', fontSize:'0.82rem', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, padding:'32px', width:'480px', maxWidth:'90vw' }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', color:CREAM, marginBottom:'24px', fontWeight:300 }}>New Release</h3>
        <label style={lbl}>Episode</label>
        <select value={form.episodeproductionid} onChange={e=>setForm(f=>({...f,episodeproductionid:e.target.value}))} style={{...inp, marginBottom:'16px', cursor:'pointer'}}>
          <option value="">Select episode...</option>
          {episodes.map(ep=><option key={ep.productionid} value={ep.productionid}>{ep.productiontitle}</option>)}
        </select>
        <label style={lbl}>Platform</label>
        <select value={form.platformid} onChange={e=>setForm(f=>({...f,platformid:e.target.value}))} style={{...inp, marginBottom:'16px', cursor:'pointer'}}>
          <option value="">Select platform...</option>
          {platforms.map(p=><option key={p.platformid} value={p.platformid}>{p.platformname}</option>)}
        </select>
        <label style={lbl}>Scheduled Release Date</label>
        <input type="date" value={form.scheduledreleasedate} onChange={e=>setForm(f=>({...f,scheduledreleasedate:e.target.value}))} style={{...inp, marginBottom:'16px'}} />
        <label style={lbl}>Notes</label>
        <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional" style={{...inp, marginBottom:'24px'}} />
        {error && <div style={{ marginBottom:'12px', padding:'8px 12px', background:'rgba(200,75,49,0.1)', border:'1px solid rgba(200,75,49,0.3)', color:'#C84B31', fontSize:'0.75rem' }}>{error}</div>}
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={handleSave} disabled={saving||!form.episodeproductionid||!form.platformid}
            style={{ background:GOLD, border:'none', color:'#1A1810', padding:'10px 24px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, opacity:(saving||!form.episodeproductionid||!form.platformid)?0.5:1 }}>
            {saving?'Saving...':'Create Release'}
          </button>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'10px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ releases, platforms, loading }) {
  const totalViews   = releases.reduce((s,r)=>s+parseInt(r.viewcount||0),0)
  const totalRevenue = releases.reduce((s,r)=>s+parseFloat(r.revenue||0),0)
  const liveCount    = releases.filter(r=>r.releasestatus==='published').length
  const livePlats    = new Set(releases.filter(r=>r.releasestatus==='published').map(r=>r.platformid)).size
  const kpis = [
    { label:'Total Views',     value: totalViews   ? `${(totalViews/1000).toFixed(1)}K` : '--' },
    { label:'Total Revenue',   value: totalRevenue ? `$${totalRevenue.toLocaleString()}` : '--' },
    { label:'Active Releases', value: String(liveCount) },
    { label:'Platforms Live',  value: String(livePlats) },
  ]
  const platTotals = platforms.map(p=>({...p, totalViews:releases.filter(r=>r.platformid===p.platformid).reduce((s,r)=>s+parseInt(r.viewcount||0),0), totalRevenue:releases.filter(r=>r.platformid===p.platformid).reduce((s,r)=>s+parseFloat(r.revenue||0),0) }))
  const maxViews = Math.max(...platTotals.map(p=>p.totalViews),1)
  const recentLive = releases.filter(r=>r.releasestatus==='published').sort((a,b)=>new Date(b.publishedat||b.createdate)-new Date(a.publishedat||a.createdate)).slice(0,5)

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', background:BORDER, marginBottom:'28px' }}>
        {kpis.map(({label,value})=>(
          <div key={label} style={{ background:SURFACE, padding:'20px 24px' }}>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', color:GOLD, fontWeight:300, lineHeight:1 }}>{loading?'...':value}</div>
            <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:'6px' }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
        <div style={{ background:SURFACE2, border:`1px solid ${BORDER}`, padding:'24px' }}>
          <div style={{ fontSize:'0.7rem', color:CHARCOAL, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'20px' }}>Platform Performance</div>
          {loading ? <div style={{ color:MUTED, fontSize:'0.82rem' }}>Loading...</div>
          : platTotals.filter(p=>p.active).map(p=>(
            <div key={p.platformid} style={{ marginBottom:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:PLATFORM_COLORS[p.platformname]||GOLD }} />
                  <span style={{ fontSize:'0.82rem', color:CREAM }}>{p.platformname}</span>
                </div>
                <span style={{ fontSize:'0.78rem', color:CHARCOAL }}>{p.totalViews?`${(p.totalViews/1000).toFixed(1)}K views`:'--'}</span>
              </div>
              <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'2px' }}>
                <div style={{ height:'100%', background:PLATFORM_COLORS[p.platformname]||GOLD, borderRadius:'2px', width:`${Math.round(p.totalViews/maxViews*100)}%`, opacity:0.7 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:SURFACE2, border:`1px solid ${BORDER}`, padding:'24px' }}>
          <div style={{ fontSize:'0.7rem', color:CHARCOAL, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'20px' }}>Recent Live Releases</div>
          {loading ? <div style={{ color:MUTED, fontSize:'0.82rem' }}>Loading...</div>
          : recentLive.length===0 ? <div style={{ color:MUTED, fontSize:'0.82rem' }}>No live releases yet.</div>
          : recentLive.map((r,i)=>{
            const pn=r.platforms?.platformname||'--'
            return (
              <div key={r.releaseid} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:i<recentLive.length-1?`1px solid ${BORDER}`:'none' }}>
                <div>
                  <div style={{ fontSize:'0.8rem', color:CREAM, marginBottom:'2px' }}>{r.productions?.productiontitle||'--'}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:PLATFORM_COLORS[pn]||CHARCOAL }} />
                    <span style={{ fontSize:'0.7rem', color:CHARCOAL }}>{pn}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'0.8rem', color:GREEN }}>{r.revenue?`$${Number(r.revenue).toLocaleString()}`:'--'}</div>
                  <div style={{ fontSize:'0.7rem', color:CHARCOAL }}>{r.viewcount?`${Number(r.viewcount).toLocaleString()} views`:'--'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ReleasesTab({ releases, setReleases, platforms, selectedTitleId, loading }) {
  const [filter, setFilter]       = useState('all')
  const [showModal, setShowModal] = useState(false)

  async function handlePublish(r) {
    const { data } = await supabase.from('releases').update({ releasestatus:'published', publishedat:new Date().toISOString(), updatedate:new Date().toISOString() })
      .eq('releaseid',r.releaseid).select('*, productions!episodeproductionid(productiontitle), platforms(platformname,platformtype)').single()
    if (data) setReleases(rs=>rs.map(x=>x.releaseid===data.releaseid?data:x))
  }

  async function handleRemove(r) {
    if (!confirm('Remove this release?')) return
    await supabase.from('releases').update({ activestatus:'H', updatedate:new Date().toISOString() }).eq('releaseid',r.releaseid)
    setReleases(rs=>rs.filter(x=>x.releaseid!==r.releaseid))
  }

  const platFilters = ['all',...new Set(releases.map(r=>r.platforms?.platformname).filter(Boolean))]
  const statusFilters = ['all','scheduled','distributing','published','paused']
  const filtered = filter==='all' ? releases : (statusFilters.includes(filter) ? releases.filter(r=>r.releasestatus===filter) : releases.filter(r=>r.platforms?.platformname===filter))

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
        <div style={{ display:'flex', gap:'2px', flexWrap:'wrap' }}>
          {platFilters.map(p=>(
            <button key={p} onClick={()=>setFilter(p)} style={{ background:filter===p?'rgba(201,146,74,0.12)':'none', border:`1px solid ${filter===p?'rgba(201,146,74,0.3)':BORDER}`, color:filter===p?GOLD:CHARCOAL, padding:'6px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em' }}>{p}</button>
          ))}
        </div>
        <button onClick={()=>setShowModal(true)} style={{ background:GOLD, border:'none', color:'#1A1810', padding:'8px 20px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>+ New Release</button>
      </div>
      <div style={{ border:`1px solid ${BORDER}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${BORDER}`, background:SURFACE2 }}>
              {['Episode','Platform','Status','Views','Revenue','Scheduled','Actions'].map(h=>(
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:MUTED }}>Loading...</td></tr>
            : filtered.length===0 ? <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:MUTED, fontSize:'0.82rem' }}>No releases yet — click + New Release to add one.</td></tr>
            : filtered.map((r,i)=>{
              const pn=r.platforms?.platformname||'--'
              return (
                <tr key={r.releaseid} style={{ borderBottom:i<filtered.length-1?`1px solid ${BORDER}`:'none' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(201,146,74,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'13px 16px', color:CREAM, fontSize:'0.83rem' }}>{r.productions?.productiontitle||'--'}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:PLATFORM_COLORS[pn]||CHARCOAL }} />
                      <span style={{ fontSize:'0.8rem', color:CHARCOAL }}>{pn}</span>
                    </div>
                  </td>
                  <td style={{ padding:'13px 16px' }}><StatusBadge status={r.releasestatus} /></td>
                  <td style={{ padding:'13px 16px', color:r.viewcount?CREAM:MUTED, fontSize:'0.83rem' }}>{r.viewcount?Number(r.viewcount).toLocaleString():'--'}</td>
                  <td style={{ padding:'13px 16px', color:r.revenue?GREEN:MUTED, fontSize:'0.83rem' }}>{r.revenue?`$${Number(r.revenue).toLocaleString()}`:'--'}</td>
                  <td style={{ padding:'13px 16px', color:CHARCOAL, fontSize:'0.78rem' }}>{r.scheduledreleasedate?new Date(r.scheduledreleasedate).toLocaleDateString():'--'}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', gap:'10px' }}>
                      {r.releasestatus==='scheduled' && <button onClick={()=>handlePublish(r)} style={{ background:'none', border:'none', color:GREEN, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Publish</button>}
                      <button onClick={()=>handleRemove(r)} style={{ background:'none', border:'none', color:RED, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Remove</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {showModal && <NewReleaseModal platforms={platforms} selectedTitleId={selectedTitleId} onClose={()=>setShowModal(false)} onSaved={r=>setReleases(rs=>[r,...rs])} />}
    </div>
  )
}

function PlatformsTab({ platforms, setPlatforms }) {
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)

  function openSettings(p) { setSelected(p); setForm({ apiendpoint:p.apiendpoint||'', apikey:'', contactname:p.contactname||'', contactemail:p.contactemail||'' }) }

  async function saveSettings() {
    setSaving(true)
    const updates = { updatedate:new Date().toISOString(), contactname:form.contactname, contactemail:form.contactemail, apiendpoint:form.apiendpoint }
    if (form.apikey) updates.apikey = form.apikey
    await supabase.from('platforms').update(updates).eq('platformid',selected.platformid)
    setPlatforms(ps=>ps.map(p=>p.platformid===selected.platformid?{...p,...updates}:p))
    setSaving(false); setSelected(null)
  }

  async function toggleActive(p) {
    const newActive=!p.active
    await supabase.from('platforms').update({ active:newActive, updatedate:new Date().toISOString() }).eq('platformid',p.platformid)
    setPlatforms(ps=>ps.map(x=>x.platformid===p.platformid?{...x,active:newActive}:x))
  }

  const lbl = { display:'block', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'6px' }
  const inp = { width:'100%', background:SURFACE, border:`1px solid ${BORDER}`, color:CREAM, padding:'9px 12px', fontFamily:'DM Sans, sans-serif', fontSize:'0.82rem', outline:'none', boxSizing:'border-box' }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'2px', marginBottom:'24px' }}>
        {platforms.map(p=>(
          <div key={p.platformid} style={{ background:selected?.platformid===p.platformid?'rgba(201,146,74,0.06)':SURFACE2, border:`1px solid ${selected?.platformid===p.platformid?'rgba(201,146,74,0.3)':BORDER}`, padding:'20px 24px', transition:'all 0.2s' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:PLATFORM_COLORS[p.platformname]||CHARCOAL }} />
                <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.1rem', color:CREAM }}>{p.platformname}</span>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <span style={{ fontSize:'0.65rem', color:CHARCOAL, letterSpacing:'0.08em', textTransform:'uppercase' }}>{p.platformtype}</span>
                <button onClick={()=>toggleActive(p)} title={p.active?'Deactivate':'Activate'}
                  style={{ width:'20px', height:'20px', borderRadius:'50%', background:p.active?'rgba(74,156,122,0.2)':'rgba(255,255,255,0.05)', border:`1px solid ${p.active?GREEN:BORDER}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:p.active?GREEN:CHARCOAL }} />
                </button>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', marginBottom:'14px' }}>
              {[['Rev Share',`${Math.round((p.revshare||0)*100)}%`],['Contact',p.contactname||'--']].map(([label,value])=>(
                <div key={label}>
                  <div style={{ fontSize:'0.65rem', color:CHARCOAL, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'2px' }}>{label}</div>
                  <div style={{ fontSize:'0.85rem', color:value==='--'?MUTED:CREAM }}>{value}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>selected?.platformid===p.platformid?setSelected(null):openSettings(p)}
              style={{ background:'none', border:`1px solid rgba(201,146,74,0.3)`, color:GOLD, padding:'5px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.7rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>
              {selected?.platformid===p.platformid?'Close':'Settings'}
            </button>
          </div>
        ))}
      </div>
      {selected && (
        <div style={{ background:SURFACE2, border:`1px solid ${BORDER}`, padding:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.2rem', color:CREAM }}>{selected.platformname} — Settings</div>
            <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', color:MUTED, cursor:'pointer', fontSize:'1rem' }}>✕</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
            <div><label style={lbl}>API Endpoint</label><input value={form.apiendpoint} onChange={e=>setForm(f=>({...f,apiendpoint:e.target.value}))} style={inp} placeholder="https://api.platform.com/v1" /></div>
            <div><label style={lbl}>API Key</label><input type="password" value={form.apikey} onChange={e=>setForm(f=>({...f,apikey:e.target.value}))} style={inp} placeholder="Enter to update" /></div>
            <div><label style={lbl}>Contact Name</label><input value={form.contactname} onChange={e=>setForm(f=>({...f,contactname:e.target.value}))} style={inp} /></div>
            <div><label style={lbl}>Contact Email</label><input value={form.contactemail} onChange={e=>setForm(f=>({...f,contactemail:e.target.value}))} style={inp} /></div>
          </div>
          <button onClick={saveSettings} disabled={saving}
            style={{ background:GOLD, border:'none', color:'#1A1810', padding:'9px 24px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, opacity:saving?0.7:1 }}>
            {saving?'Saving...':'Save Settings'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Distribution() {
  const [activeTab, setActiveTab]         = useState('overview')
  const [titles, setTitles]               = useState([])
  const [selectedTitleId, setSelectedTitleId] = useState('')
  const [platforms, setPlatforms]         = useState([])
  const [releases, setReleases]           = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    supabase.from('productions').select('productionid,productiontitle').eq('productiongroup','TITLE').eq('activestatus','A')
      .then(({ data }) => { if (data) { setTitles(data); if (data[0]) setSelectedTitleId(String(data[0].productionid)) } })
    supabase.from('platforms').select('*').eq('activestatus','A').order('platformname')
      .then(({ data }) => { if (data) setPlatforms(data) })
  }, [])

  useEffect(() => { if (selectedTitleId) loadReleases() }, [selectedTitleId])

  async function loadReleases() {
    setLoading(true)
    const { data } = await supabase.from('releases')
      .select('*, productions!episodeproductionid(productiontitle), platforms(platformname,platformtype)')
      .eq('activestatus','A').eq('titleproductionid', selectedTitleId)
      .order('createdate',{ ascending:false })
    if (data) setReleases(data)
    setLoading(false)
  }

  const tabs = [{ id:'overview', label:'Overview' }, { id:'releases', label:'Releases' }, { id:'platforms', label:'Platforms' }]

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif', color:CREAM }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px', flexWrap:'wrap', gap:'12px' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', fontWeight:300, color:CREAM, margin:0 }}>Distribution</h1>
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
      {activeTab==='overview'  && <OverviewTab  releases={releases} platforms={platforms} loading={loading} />}
      {activeTab==='releases'  && <ReleasesTab  releases={releases} setReleases={setReleases} platforms={platforms} selectedTitleId={selectedTitleId} loading={loading} />}
      {activeTab==='platforms' && <PlatformsTab platforms={platforms} setPlatforms={setPlatforms} />}
    </div>
  )
}
