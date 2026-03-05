import { useState } from 'react'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'
const GREEN = '#4A9C7A'

const STATUS_COLORS = {
  awaiting: { bg: 'rgba(201,146,74,0.15)', color: '#C9924A', label: 'Awaiting Review' },
  in_edit:  { bg: 'rgba(122,158,200,0.15)',color: '#7A9EC8', label: 'In Edit'         },
  approved: { bg: 'rgba(74,156,122,0.15)', color: '#4A9C7A', label: 'Approved'        },
  exported: { bg: 'rgba(74,156,122,0.2)',  color: '#4A9C7A', label: 'Exported'        },
}

const MOCK_QUEUE = [
  { id: 1, title: 'The Tunnels of Rasand', episode: 'S1E01: Into Darkness', duration: '8:24', status: 'in_edit',  assigned: 'Joe L.',  updated: '2h ago'  },
  { id: 2, title: 'The Tunnels of Rasand', episode: 'S1E02: The Warning',   duration: '7:55', status: 'awaiting', assigned: '--',      updated: '1d ago'  },
  { id: 3, title: 'The Tunnels of Rasand', episode: 'S1E03: The Map',       duration: '9:10', status: 'approved', assigned: 'Joe L.',  updated: '3d ago'  },
  { id: 4, title: 'The Scarlet Pimpernel', episode: 'S1E01: The Ball',      duration: '6:40', status: 'exported', assigned: 'Joe L.',  updated: '1w ago'  },
]

const MOCK_CAPTIONS = [
  { id: 1, start: '00:00:02', end: '00:00:05', text: 'The tunnel stretched endlessly before her.' },
  { id: 2, start: '00:00:06', end: '00:00:09', text: 'Clara held her breath and stepped forward.' },
  { id: 3, start: '00:00:11', end: '00:00:14', text: 'Something moved in the darkness ahead.' },
  { id: 4, start: '00:00:16', end: '00:00:20', text: 'Who is there? she whispered.' },
  { id: 5, start: '00:00:22', end: '00:00:26', text: 'No answer. Only the drip of water.' },
]

const MOCK_SHOTS = [
  { id: 1, name: 'Shot 1: Tunnel Entrance', voice: 'ElevenLabs - Aria' },
  { id: 2, name: 'Shot 2: The Figure',      voice: 'ElevenLabs - Josh'  },
  { id: 3, name: 'Shot 3: The Map',         voice: 'ElevenLabs - Aria'  },
]

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.awaiting
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '2px', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function WaveformViz() {
  const bars = Array.from({ length: 80 }, (_, i) => {
    const h = 20 + Math.abs(Math.sin(i * 0.4) * 30 + Math.sin(i * 0.15) * 20)
    return h
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '48px', padding: '0 8px' }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: '3px', height: `${Math.min(h, 44)}px`, background: i < 25 ? '#C9924A' : 'rgba(201,146,74,0.25)', borderRadius: '1px', flexShrink: 0 }} />
      ))}
    </div>
  )
}

function EpisodeEditor({ episode, onBack }) {
  const [activePanel, setActivePanel] = useState('voice')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(28)
  const [captions, setCaptions] = useState(MOCK_CAPTIONS)
  const [editingCaption, setEditingCaption] = useState(null)
  const [shots, setShots] = useState(MOCK_SHOTS)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [showToast, setShowToast] = useState(false)

  async function handleExport() {
    setExporting(true)
    await new Promise(r => setTimeout(r, 2500))
    setExporting(false); setExported(true); setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

  const lbl = { fontSize: '0.68rem', color: '#5C574E', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }
  const inp = { width: '100%', background: '#111009', border: '1px solid rgba(201,146,74,0.12)', color: '#F7F2E8', padding: '8px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', outline: 'none' }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {showToast && (
        <div style={{ position: 'fixed', top: '20px', right: '24px', background: '#4A9C7A', color: '#fff', padding: '12px 20px', fontSize: '0.82rem', zIndex: 2000, borderRadius: '2px' }}>
          Exported to Cloudflare R2 successfully
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#5C574E', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}>Back to Queue</button>
          <span style={{ color: 'rgba(201,146,74,0.12)' }}>|</span>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#F7F2E8', margin: 0, fontWeight: 300 }}>{episode.episode}</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ background: 'none', border: '1px solid rgba(201,146,74,0.12)', color: '#5C574E', padding: '8px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Save Draft</button>
          <button onClick={handleExport} disabled={exporting || exported}
            style={{ background: exported ? '#4A9C7A' : '#C9924A', border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            {exporting ? 'Exporting...' : exported ? 'Exported' : 'Approve & Export'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        <div>
          <div style={{ background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0806 0%, #1a1208 50%, #0a0806 100%)' }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'rgba(201,146,74,0.4)', marginBottom: '8px' }}>{episode.episode}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>VIDEO PREVIEW</div>
            </div>
            <button onClick={() => setPlaying(p => !p)}
              style={{ position: 'absolute', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(201,146,74,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#1A1810' }}>
              {playing ? 'II' : 'P'}
            </button>
          </div>
          <div style={{ background: '#111009', padding: '12px 16px', border: '1px solid rgba(201,146,74,0.12)', marginBottom: '2px' }}>
            <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(+e.target.value)} style={{ width: '100%', accentColor: '#C9924A', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: '#5C574E' }}>0:{String(Math.floor(progress * 0.5)).padStart(2,'0')}</span>
              <span style={{ fontSize: '0.7rem', color: '#5C574E' }}>{episode.duration}</span>
            </div>
          </div>
          <div style={{ background: '#111009', border: '1px solid rgba(201,146,74,0.12)', marginBottom: '20px' }}>
            <WaveformViz />
          </div>
          <div style={{ background: '#111009', border: '1px solid rgba(201,146,74,0.12)', padding: '20px' }}>
            <div style={{ fontSize: '0.68rem', color: '#5C574E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Export Settings</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {[['Format',['MP4','MOV']],['Resolution',['1920x1080','3840x2160','1280x720']],['Frame Rate',['24fps','29.97fps','25fps']]].map(([label, opts]) => (
                <div key={label}>
                  <label style={lbl}>{label}</label>
                  <select style={{...inp, cursor: 'pointer'}}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {exported && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(74,156,122,0.08)', border: '1px solid rgba(74,156,122,0.2)', fontSize: '0.75rem', color: '#4A9C7A' }}>
                R2 URL: culmina-prod-r2/tunnels-of-rasand/s1e01-into-darkness.mp4
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,146,74,0.12)', marginBottom: '16px' }}>
            {['voice', 'captions'].map(tab => (
              <button key={tab} onClick={() => setActivePanel(tab)}
                style={{ background: 'none', border: 'none', borderBottom: activePanel === tab ? '2px solid #C9924A' : '2px solid transparent', color: activePanel === tab ? '#C9924A' : '#5C574E', padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '-1px' }}>
                {tab === 'voice' ? 'Voice Track' : 'Captions'}
              </button>
            ))}
          </div>

          {activePanel === 'voice' && (
            <div>
              {shots.map(shot => (
                <div key={shot.id} style={{ marginBottom: '12px', padding: '14px', background: '#111009', border: '1px solid rgba(201,146,74,0.12)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#F7F2E8', marginBottom: '10px' }}>{shot.name}</div>
                  <label style={lbl}>AI Voice</label>
                  <select value={shot.voice} onChange={e => setShots(ss => ss.map(s => s.id === shot.id ? {...s, voice: e.target.value} : s))}
                    style={{...inp, marginBottom: '8px', cursor: 'pointer'}}>
                    {['ElevenLabs - Aria','ElevenLabs - Josh','ElevenLabs - Rachel','ElevenLabs - Adam'].map(v => <option key={v}>{v}</option>)}
                  </select>
                  <button style={{ background: 'none', border: '1px solid rgba(201,146,74,0.12)', color: '#C9924A', padding: '5px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.68rem' }}>Preview</button>
                </div>
              ))}
            </div>
          )}

          {activePanel === 'captions' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button style={{ background: '#C9924A', border: 'none', color: '#1A1810', padding: '7px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Auto-Generate</button>
                <select style={{ background: '#111009', border: '1px solid rgba(201,146,74,0.12)', color: '#F7F2E8', padding: '7px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
                  <option>English</option><option>Spanish</option><option>French</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                {captions.map(c => (
                  <div key={c.id} style={{ padding: '8px 10px', background: editingCaption === c.id ? 'rgba(201,146,74,0.06)' : 'transparent', border: '1px solid rgba(201,146,74,0.12)', marginBottom: '3px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.62rem', color: '#5C574E', fontFamily: 'monospace' }}>{c.start}</span>
                      <span style={{ fontSize: '0.6rem', color: '#6A6560' }}>to</span>
                      <span style={{ fontSize: '0.62rem', color: '#5C574E', fontFamily: 'monospace' }}>{c.end}</span>
                    </div>
                    {editingCaption === c.id ? (
                      <input value={c.text} onChange={e => setCaptions(cs => cs.map(x => x.id === c.id ? {...x, text: e.target.value} : x))}
                        onBlur={() => setEditingCaption(null)} autoFocus
                        style={{...inp, fontSize: '0.75rem', padding: '4px 6px'}} />
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#F7F2E8', cursor: 'pointer', lineHeight: 1.4 }} onClick={() => setEditingCaption(c.id)}>{c.text}</div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['.srt', '.vtt'].map(fmt => (
                  <button key={fmt} style={{ background: 'none', border: '1px solid rgba(201,146,74,0.12)', color: '#5C574E', padding: '6px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem' }}>Export {fmt}</button>
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
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = MOCK_QUEUE.filter(e => filter === 'all' || e.status === filter)

  if (selectedEpisode) return <EpisodeEditor episode={selectedEpisode} onBack={() => setSelectedEpisode(null)} />

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: '#F7F2E8' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: '#F7F2E8', margin: 0 }}>Post Production</h1>
        <div style={{ display: 'flex', gap: '2px' }}>
          {['all','awaiting','in_edit','approved','exported'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ background: filter === s ? 'rgba(201,146,74,0.12)' : 'none', border: '1px solid ' + (filter === s ? 'rgba(201,146,74,0.3)' : 'rgba(201,146,74,0.12)'), color: filter === s ? '#C9924A' : '#5C574E', padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'capitalize' }}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div style={{ border: '1px solid rgba(201,146,74,0.12)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(201,146,74,0.12)', background: '#111009' }}>
              {['Title','Episode','Duration','Status','Assigned To','Last Updated','Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.68rem', color: '#5C574E', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ep, i) => (
              <tr key={ep.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(201,146,74,0.12)' : 'none' }}>
                <td style={{ padding: '13px 16px', color: '#5C574E', fontSize: '0.78rem' }}>{ep.title}</td>
                <td style={{ padding: '13px 16px', color: '#F7F2E8', fontSize: '0.85rem' }}>{ep.episode}</td>
                <td style={{ padding: '13px 16px', color: '#5C574E', fontSize: '0.78rem' }}>{ep.duration}</td>
                <td style={{ padding: '13px 16px' }}><StatusBadge status={ep.status} /></td>
                <td style={{ padding: '13px 16px', color: '#5C574E', fontSize: '0.78rem' }}>{ep.assigned}</td>
                <td style={{ padding: '13px 16px', color: '#6A6560', fontSize: '0.78rem' }}>{ep.updated}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setSelectedEpisode(ep)} style={{ background: 'none', border: 'none', color: '#C9924A', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Open Editor</button>
                    {ep.status === 'approved' && <button style={{ background: 'none', border: 'none', color: '#4A9C7A', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Send to Distribution</button>}
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
