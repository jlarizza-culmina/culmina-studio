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

const STATUS_COLORS = {
  awaiting:    { bg:'rgba(201,146,74,0.15)', color:'#C9924A', label:'Awaiting Review' },
  in_edit:     { bg:'rgba(122,158,200,0.15)',color:'#7A9EC8', label:'In Edit'         },
  approved:    { bg:'rgba(74,156,122,0.15)', color:'#4A9C7A', label:'Approved'        },
  exported:    { bg:'rgba(74,156,122,0.2)',  color:'#4A9C7A', label:'Exported'        },
  in_production:{ bg:'rgba(201,146,74,0.2)', color:'#FFB84A', label:'In Production'   },
  completed:   { bg:'rgba(74,156,122,0.15)', color:'#4A9C7A', label:'Complete'        },
  development: { bg:'rgba(92,87,78,0.2)',    color:'#6A6560', label:'Dev'             },
}

const VOICE_OPTIONS = ['ElevenLabs - Aria','ElevenLabs - Josh','ElevenLabs - Rachel','ElevenLabs - Adam','ElevenLabs - Bella']

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.awaiting
  return <span style={{ background:s.bg, color:s.color, padding:'3px 10px', fontSize:'0.68rem', letterSpacing:'0.08em', textTransform:'uppercase', borderRadius:'2px', whiteSpace:'nowrap' }}>{s.label}</span>
}

function WaveformViz() {
  const bars = Array.from({length:80}, (_,i) => 20 + Math.abs(Math.sin(i*0.4)*30 + Math.sin(i*0.15)*20))
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'2px', height:'48px', padding:'0 8px' }}>
      {bars.map((h,i) => <div key={i} style={{ width:'3px', height:`${Math.min(h,44)}px`, background:i<25?GOLD:'rgba(201,146,74,0.25)', borderRadius:'1px', flexShrink:0 }} />)}
    </div>
  )
}

function EpisodeEditor({ episode, onBack, onStatusChange }) {
  const [activePanel, setActivePanel] = useState('voice')
  const [playing, setPlaying]         = useState(false)
  const [progress, setProgress]       = useState(0)
  const [shots, setShots]             = useState([])
  const [captions, setCaptions]       = useState([])
  const [editingCaption, setEditingCaption] = useState(null)
  const [exporting, setExporting]     = useState(false)
  const [exported, setExported]       = useState(episode.productionstatus === 'exported')
  const [showToast, setShowToast]     = useState(false)
  const [saving, setSaving]           = useState(false)

  const lbl = { fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:'6px' }
  const inp = { width:'100%', background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, padding:'8px 10px', fontFamily:'DM Sans, sans-serif', fontSize:'0.8rem', outline:'none' }

  useEffect(() => {
    async function loadShots() {
      const { data } = await supabase.from('productions')
        .select('productionid, productiontitle, productionstatus, aimodel, synopsis, voicetrack')
        .eq('activestatus','A')
        .eq('productiongroup','SHOT')
        .eq('parentproductionid', episode.productionid)
        .order('productiontitle')
      if (data) setShots(data.map(s => ({ ...s, voice: s.voicetrack || VOICE_OPTIONS[0] })))
    }
    loadShots()
  }, [episode])

  async function handleSaveDraft() {
    setSaving(true)
    await supabase.from('productions').update({
      productionstatus: 'in_edit', updatedate: new Date().toISOString()
    }).eq('productionid', episode.productionid)
    setSaving(false)
    onStatusChange(episode.productionid, 'in_edit')
  }

  async function handleExport() {
    setExporting(true)
    // Save voice track selections back to shots
    await Promise.all(shots.map(s =>
      supabase.from('productions').update({ voicetrack: s.voice, updatedate: new Date().toISOString() }).eq('productionid', s.productionid)
    ))
    // Mark episode as exported
    await supabase.from('productions').update({
      productionstatus: 'exported', updatedate: new Date().toISOString()
    }).eq('productionid', episode.productionid)
    setExporting(false); setExported(true); setShowToast(true)
    onStatusChange(episode.productionid, 'exported')
    setTimeout(() => setShowToast(false), 4000)
  }

  function timeAgo(d) {
    if (!d) return '--'
    const m = Math.floor((Date.now()-new Date(d))/60000)
    if (m<60) return `${m}m ago`
    const h = Math.floor(m/60)
    if (h<24) return `${h}h ago`
    return `${Math.floor(h/24)}d ago`
  }

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif' }}>
      {showToast && (
        <div style={{ position:'fixed', top:'20px', right:'24px', background:GREEN, color:'#fff', padding:'12px 20px', fontSize:'0.82rem', zIndex:2000, borderRadius:'2px' }}>
          Episode approved and exported to Cloudflare R2
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={onBack} style={{ background:'none', border:'none', color:CHARCOAL, cursor:'pointer', fontSize:'0.78rem', padding:0 }}>← Back to Queue</button>
          <span style={{ color:BORDER }}>|</span>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', color:CREAM, margin:0, fontWeight:300 }}>{episode.productiontitle}</h2>
          <StatusBadge status={episode.productionstatus} />
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={handleSaveDraft} disabled={saving}
            style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'8px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={handleExport} disabled={exporting||exported}
            style={{ background:exported?GREEN:GOLD, border:'none', color:'#1A1810', padding:'8px 20px', cursor:exported?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>
            {exporting ? 'Exporting...' : exported ? 'Exported ✓' : 'Approve & Export'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'20px', alignItems:'start' }}>
        {/* Left: video + waveform + export settings */}
        <div>
          <div style={{ background:'#000', aspectRatio:'16/9', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'8px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, #0a0806 0%, #1a1208 50%, #0a0806 100%)' }} />
            <div style={{ position:'relative', textAlign:'center' }}>
              <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.2rem', color:'rgba(201,146,74,0.4)', marginBottom:'8px' }}>{episode.productiontitle}</div>
              <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.2)', letterSpacing:'0.1em' }}>VIDEO PREVIEW</div>
            </div>
            <button onClick={()=>setPlaying(p=>!p)}
              style={{ position:'absolute', width:'48px', height:'48px', borderRadius:'50%', background:'rgba(201,146,74,0.9)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', color:'#1A1810' }}>
              {playing ? '⏸' : '▶'}
            </button>
          </div>
          <div style={{ background:SURFACE2, padding:'12px 16px', border:`1px solid ${BORDER}`, marginBottom:'2px' }}>
            <input type="range" min={0} max={100} value={progress} onChange={e=>setProgress(+e.target.value)} style={{ width:'100%', accentColor:GOLD, cursor:'pointer' }} />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
              <span style={{ fontSize:'0.7rem', color:CHARCOAL }}>{String(Math.floor(progress*0.5)).padStart(2,'0')}s</span>
              <span style={{ fontSize:'0.7rem', color:CHARCOAL }}>{episode.synopsis ? episode.synopsis.slice(0,20)+'…' : '--'}</span>
            </div>
          </div>
          <div style={{ background:SURFACE2, border:`1px solid ${BORDER}`, marginBottom:'20px' }}><WaveformViz /></div>

          <div style={{ background:SURFACE2, border:`1px solid ${BORDER}`, padding:'20px' }}>
            <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'16px' }}>Export Settings</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
              {[['Format',['MP4','MOV']],['Resolution',['1920x1080','3840x2160','1280x720']],['Frame Rate',['24fps','29.97fps','25fps']]].map(([label,opts])=>(
                <div key={label}>
                  <label style={lbl}>{label}</label>
                  <select style={{...inp, cursor:'pointer'}}>{opts.map(o=><option key={o}>{o}</option>)}</select>
                </div>
              ))}
            </div>
            {exported && (
              <div style={{ marginTop:'12px', padding:'10px 14px', background:'rgba(74,156,122,0.08)', border:'1px solid rgba(74,156,122,0.2)', fontSize:'0.75rem', color:GREEN }}>
                R2 URL: culmina-prod-r2/{episode.productiontitle.toLowerCase().replace(/\s+/g,'-')}.mp4
              </div>
            )}
          </div>
        </div>

        {/* Right: voice + captions */}
        <div>
          <div style={{ display:'flex', borderBottom:`1px solid ${BORDER}`, marginBottom:'16px' }}>
            {['voice','captions'].map(tab=>(
              <button key={tab} onClick={()=>setActivePanel(tab)}
                style={{ background:'none', border:'none', borderBottom:activePanel===tab?`2px solid ${GOLD}`:'2px solid transparent', color:activePanel===tab?GOLD:CHARCOAL, padding:'8px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'-1px' }}>
                {tab==='voice'?'Voice Track':'Captions'}
              </button>
            ))}
          </div>

          {activePanel==='voice' && (
            <div>
              {shots.length===0 && <div style={{ color:MUTED, fontSize:'0.8rem' }}>No shots found for this episode.</div>}
              {shots.map(shot=>(
                <div key={shot.productionid} style={{ marginBottom:'12px', padding:'14px', background:SURFACE2, border:`1px solid ${BORDER}` }}>
                  <div style={{ fontSize:'0.78rem', color:CREAM, marginBottom:'10px' }}>{shot.productiontitle}</div>
                  <label style={lbl}>AI Voice</label>
                  <select value={shot.voice} onChange={e=>setShots(ss=>ss.map(s=>s.productionid===shot.productionid?{...s,voice:e.target.value}:s))}
                    style={{...inp, marginBottom:'8px', cursor:'pointer'}}>
                    {VOICE_OPTIONS.map(v=><option key={v}>{v}</option>)}
                  </select>
                  <button style={{ background:'none', border:`1px solid ${BORDER}`, color:GOLD, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.68rem' }}>Preview</button>
                </div>
              ))}
            </div>
          )}

          {activePanel==='captions' && (
            <div>
              <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                <button style={{ background:GOLD, border:'none', color:'#1A1810', padding:'7px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:500 }}>Auto-Generate</button>
                <select style={{ background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, padding:'7px 10px', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', outline:'none', cursor:'pointer' }}>
                  <option>English</option><option>Spanish</option><option>French</option><option>Mandarin</option>
                </select>
              </div>
              {captions.length===0 ? (
                <div style={{ color:MUTED, fontSize:'0.78rem', padding:'16px 0' }}>No captions yet — click Auto-Generate.</div>
              ) : captions.map(c=>(
                <div key={c.id} style={{ padding:'8px 10px', background:editingCaption===c.id?'rgba(201,146,74,0.06)':'transparent', border:`1px solid ${BORDER}`, marginBottom:'3px' }}>
                  <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'4px' }}>
                    <span style={{ fontSize:'0.62rem', color:CHARCOAL, fontFamily:'monospace' }}>{c.start}</span>
                    <span style={{ fontSize:'0.6rem', color:MUTED }}>→</span>
                    <span style={{ fontSize:'0.62rem', color:CHARCOAL, fontFamily:'monospace' }}>{c.end}</span>
                  </div>
                  {editingCaption===c.id ? (
                    <input value={c.text} onChange={e=>setCaptions(cs=>cs.map(x=>x.id===c.id?{...x,text:e.target.value}:x))}
                      onBlur={()=>setEditingCaption(null)} autoFocus style={{...inp,fontSize:'0.75rem',padding:'4px 6px'}} />
                  ) : (
                    <div style={{ fontSize:'0.75rem', color:CREAM, cursor:'pointer', lineHeight:1.4 }} onClick={()=>setEditingCaption(c.id)}>{c.text}</div>
                  )}
                </div>
              ))}
              <div style={{ display:'flex', gap:'6px', marginTop:'10px' }}>
                {['.srt','.vtt'].map(fmt=>(
                  <button key={fmt} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'6px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.7rem' }}>Export {fmt}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Post() {
  const [episodes, setEpisodes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [titles, setTitles]       = useState([])
  const [selectedTitleId, setSelectedTitleId] = useState('')
  const [filter, setFilter]       = useState('all')
  const [selectedEpisode, setSelectedEpisode] = useState(null)

  useEffect(() => {
    supabase.from('productions').select('productionid,productiontitle').eq('productiongroup','TITLE').eq('activestatus','A')
      .then(({ data }) => { if (data) { setTitles(data); if (data[0]) setSelectedTitleId(String(data[0].productionid)) } })
  }, [])

  useEffect(() => { if (selectedTitleId) loadEpisodes() }, [selectedTitleId])

  async function loadEpisodes() {
    setLoading(true)
    // Get all episode-group productions under this title by walking the tree
    const { data: allNodes } = await supabase.from('productions')
      .select('productionid,productiontitle,productiongroup,productionstatus,parentproductionid,synopsis,updatedate,createdate')
      .eq('activestatus','A')
      .in('productiongroup',['ARC','ACT','EPISODE'])

    if (!allNodes) { setLoading(false); return }

    // Collect episode IDs under selected title
    function getDescendants(parentId, group) {
      return allNodes.filter(n => n.parentproductionid===parentId && (!group || n.productiongroup===group))
    }

    const arcs  = getDescendants(parseInt(selectedTitleId), 'ARC')
    const acts  = arcs.flatMap(arc => getDescendants(arc.productionid, 'ACT'))
    const eps   = [
      ...getDescendants(parseInt(selectedTitleId), 'EPISODE'),
      ...arcs.flatMap(arc => getDescendants(arc.productionid, 'EPISODE')),
      ...acts.flatMap(act => getDescendants(act.productionid, 'EPISODE')),
    ]

    setEpisodes(eps)
    setLoading(false)
  }

  function handleStatusChange(productionid, newStatus) {
    setEpisodes(eps => eps.map(e => e.productionid===productionid ? {...e, productionstatus:newStatus} : e))
    if (selectedEpisode?.productionid===productionid) setSelectedEpisode(e => ({...e, productionstatus:newStatus}))
  }

  function timeAgo(d) {
    if (!d) return '--'
    const m = Math.floor((Date.now()-new Date(d))/60000)
    if (m<60) return `${m}m ago`
    const h = Math.floor(m/60); if (h<24) return `${h}h ago`
    return `${Math.floor(h/24)}d ago`
  }

  if (selectedEpisode) {
    return <EpisodeEditor episode={selectedEpisode} onBack={()=>setSelectedEpisode(null)} onStatusChange={handleStatusChange} />
  }

  const filtered = episodes.filter(e => filter==='all' || e.productionstatus===filter)

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif', color:CREAM }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'12px' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', fontWeight:300, color:CREAM, margin:0 }}>Post Production</h1>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
          <select value={selectedTitleId} onChange={e=>setSelectedTitleId(e.target.value)}
            style={{ background:SURFACE, border:`1px solid ${BORDER}`, color:CREAM, padding:'7px 14px', fontFamily:'DM Sans, sans-serif', fontSize:'0.8rem', outline:'none', cursor:'pointer' }}>
            {titles.map(t=><option key={t.productionid} value={t.productionid}>{t.productiontitle}</option>)}
          </select>
          <div style={{ display:'flex', gap:'2px' }}>
            {['all','development','in_production','in_edit','awaiting','approved','exported'].map(s=>(
              <button key={s} onClick={()=>setFilter(s)}
                style={{ background:filter===s?'rgba(201,146,74,0.12)':'none', border:`1px solid ${filter===s?'rgba(201,146,74,0.3)':BORDER}`, color:filter===s?GOLD:CHARCOAL, padding:'6px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.06em', textTransform:'capitalize' }}>
                {s.replace(/_/g,' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ border:`1px solid ${BORDER}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${BORDER}`, background:SURFACE2 }}>
              {['Episode','Status','Updated','Actions'].map(h=>(
                <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding:'32px', textAlign:'center', color:MUTED, fontSize:'0.82rem' }}>Loading...</td></tr>
            ) : filtered.length===0 ? (
              <tr><td colSpan={4} style={{ padding:'32px', textAlign:'center', color:MUTED, fontSize:'0.82rem' }}>No episodes found.</td></tr>
            ) : filtered.map((ep,i)=>(
              <tr key={ep.productionid} style={{ borderBottom:i<filtered.length-1?`1px solid ${BORDER}`:'none' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(201,146,74,0.02)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'13px 16px', color:CREAM, fontSize:'0.85rem' }}>{ep.productiontitle}</td>
                <td style={{ padding:'13px 16px' }}><StatusBadge status={ep.productionstatus} /></td>
                <td style={{ padding:'13px 16px', color:MUTED, fontSize:'0.78rem' }}>{timeAgo(ep.updatedate)}</td>
                <td style={{ padding:'13px 16px' }}>
                  <div style={{ display:'flex', gap:'12px' }}>
                    <button onClick={()=>setSelectedEpisode(ep)}
                      style={{ background:'none', border:'none', color:GOLD, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Open Editor</button>
                    {ep.productionstatus==='approved' && (
                      <button style={{ background:'none', border:'none', color:GREEN, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Send to Distribution</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
