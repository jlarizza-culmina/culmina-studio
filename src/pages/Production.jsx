import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'

const STATUS_COLORS = {
  queued:     { bg: 'rgba(201,146,74,0.15)', color: '#C9924A', label: 'Queued' },
  processing: { bg: 'rgba(201,146,74,0.25)', color: '#FFB84A', label: 'Processing' },
  complete:   { bg: 'rgba(74,156,122,0.15)', color: '#4A9C7A', label: 'Complete' },
  error:      { bg: 'rgba(200,75,49,0.15)',  color: '#C84B31', label: 'Error' },
  approved:   { bg: 'rgba(74,156,122,0.2)',  color: '#4A9C7A', label: 'Approved' },
  rejected:   { bg: 'rgba(200,75,49,0.1)',   color: '#C84B31', label: 'Rejected' },
}

const MOCK_QUEUE = [
  { id: 1, level: 'SHOT',    name: 'Shot 1: Tunnel Entrance', model: 'Veo 2', status: 'complete',   progress: 100, submitted: '10m ago', duration: '4.2s' },
  { id: 2, level: 'SHOT',    name: 'Shot 2: The Figure',      model: 'Veo 2', status: 'processing', progress: 62,  submitted: '3m ago',  duration: '—' },
  { id: 3, level: 'EPISODE', name: 'Episode 1: Into Darkness',model: 'Veo 2', status: 'queued',     progress: 0,   submitted: '1m ago',  duration: '—' },
  { id: 4, level: 'SHOT',    name: 'Shot 3: The Map',         model: 'Veo 3', status: 'error',      progress: 0,   submitted: '8m ago',  duration: '—' },
  { id: 5, level: 'SHOT',    name: 'Shot 4: Underground',     duration: '3.8s', model: 'Veo 2',     status: 'approved', progress: 100, submitted: '1h ago' },
]

const MOCK_SHOTS = [
  { id: 1, name: 'Shot 1: Tunnel Entrance', duration: '4.2s', status: 'approved' },
  { id: 5, name: 'Shot 4: Underground',     duration: '3.8s', status: 'approved' },
  { id: 2, name: 'Shot 2: The Figure',      duration: '—',    status: 'processing' },
]

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.queued
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '2px', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function ProgressBar({ pct }) {
  return (
    <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: GOLD, transition: 'width 0.4s ease' }} />
    </div>
  )
}

function QueueTab({ titles, selectedTitleId, setSelectedTitleId }) {
  const [selected, setSelected] = useState([])
  const [showGenPanel, setShowGenPanel] = useState(false)

  const counts = { queued: 0, processing: 0, complete: 0, error: 0 }
  MOCK_QUEUE.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })

  function toggleSelect(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.entries(counts).map(([k, v]) => (
            <div key={k} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: STATUS_COLORS[k]?.color || GOLD, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>{k}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selected.length > 0 && (
            <button style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Re-queue ({selected.length})
            </button>
          )}
          <button onClick={() => setShowGenPanel(true)}
            style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            + Generate Take
          </button>
        </div>
      </div>

      <div style={{ border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
              <th style={{ width: '40px', padding: '12px 16px' }}>
                <input type="checkbox" onChange={e => setSelected(e.target.checked ? MOCK_QUEUE.map(r => r.id) : [])} style={{ cursor: 'pointer', accentColor: GOLD }} />
              </th>
              {['Level','Name','AI Model','Status','Progress','Submitted','Duration','Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_QUEUE.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: i < MOCK_QUEUE.length - 1 ? `1px solid ${BORDER}` : 'none', background: selected.includes(row.id) ? 'rgba(201,146,74,0.04)' : 'transparent' }}>
                <td style={{ padding: '14px 16px' }}>
                  <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleSelect(row.id)} style={{ cursor: 'pointer', accentColor: GOLD }} />
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{row.level}</span>
                </td>
                <td style={{ padding: '14px 16px', color: CREAM, fontSize: '0.83rem' }}>{row.name}</td>
                <td style={{ padding: '14px 16px', color: CHARCOAL, fontSize: '0.8rem' }}>{row.model}</td>
                <td style={{ padding: '14px 16px' }}><StatusBadge status={row.status} /></td>
                <td style={{ padding: '14px 16px', minWidth: '120px' }}>
                  {row.status === 'processing'
                    ? <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><ProgressBar pct={row.progress} /><span style={{ fontSize: '0.68rem', color: CHARCOAL }}>{row.progress}%</span></div>
                    : <span style={{ fontSize: '0.75rem', color: MUTED }}>—</span>}
                </td>
                <td style={{ padding: '14px 16px', color: MUTED, fontSize: '0.78rem' }}>{row.submitted}</td>
                <td style={{ padding: '14px 16px', color: MUTED, fontSize: '0.78rem' }}>{row.duration}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>View</button>
                    {row.status === 'complete' && <button style={{ background: 'none', border: 'none', color: '#4A9C7A', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Approve</button>}
                    {row.status === 'error' && <button style={{ background: 'none', border: 'none', color: '#C84B31', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Re-queue</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showGenPanel && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowGenPanel(false)}>
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: '36px', width: '500px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: CREAM, marginBottom: '24px', fontWeight: 300 }}>Generate Take</h3>
            <label style={{ display: 'block', fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Shot / Episode</label>
            <select style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.83rem', outline: 'none', marginBottom: '20px' }}>
              <option>Shot 1: Tunnel Entrance</option>
              <option>Shot 2: The Figure</option>
              <option>Episode 1: Into Darkness</option>
            </select>
            <label style={{ display: 'block', fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>AI Model</label>
            <select style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.83rem', outline: 'none', marginBottom: '20px' }}>
              <option>Veo 2</option><option>Veo 3</option><option>Sora</option><option>Runway Gen-3</option>
            </select>
            <label style={{ display: 'block', fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Variations (1-5)</label>
            <input type="number" min={1} max={5} defaultValue={1}
              style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.83rem', outline: 'none', marginBottom: '28px' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowGenPanel(false)}
                style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '11px 28px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
                Generate
              </button>
              <button onClick={() => setShowGenPanel(false)}
                style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '11px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AssemblyTab() {
  const [shots, setShots] = useState(MOCK_SHOTS)
  const [dragIdx, setDragIdx] = useState(null)
  const [selectedShot, setSelectedShot] = useState(null)

  function onDragStart(i) { setDragIdx(i) }
  function onDragOver(e, i) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    const next = [...shots]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setShots(next); setDragIdx(i)
  }
  function onDragEnd() { setDragIdx(null) }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Episode 1: Into Darkness — Shot Timeline</div>
        <button style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          Export Episode
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px', padding: '20px', background: SURFACE2, border: `1px solid ${BORDER}`, marginBottom: '24px', overflowX: 'auto', minHeight: '120px', alignItems: 'center' }}>
        {shots.map((shot, i) => (
          <div key={shot.id} draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            onClick={() => setSelectedShot(shot)}
            style={{ minWidth: '140px', height: '80px', background: selectedShot?.id === shot.id ? 'rgba(201,146,74,0.12)' : SURFACE, border: `1px solid ${selectedShot?.id === shot.id ? GOLD : BORDER}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 12px', cursor: 'grab', userSelect: 'none', opacity: dragIdx === i ? 0.5 : 1, transition: 'all 0.15s' }}>
            <div style={{ fontSize: '0.72rem', color: CREAM, lineHeight: 1.3 }}>{shot.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status={shot.status} />
              <span style={{ fontSize: '0.68rem', color: MUTED }}>{shot.duration}</span>
            </div>
          </div>
        ))}
      </div>
      {selectedShot && (
        <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Shot Properties</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[{ label: 'Name', value: selectedShot.name }, { label: 'Duration', value: selectedShot.duration }, { label: 'Status', value: selectedShot.status }].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '0.85rem', color: CREAM }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Production() {
  const [activeTab, setActiveTab] = useState('queue')
  const [titles, setTitles] = useState([])
  const [selectedTitleId, setSelectedTitleId] = useState('')

  useEffect(() => {
    supabase.from('productions').select('productionid, productiontitle').eq('productiongroup', 'TITLE').eq('activestatus', 'A')
      .then(({ data }) => { if (data) { setTitles(data); if (data[0]) setSelectedTitleId(String(data[0].productionid)) } })
  }, [])

  const tabs = [{ id: 'queue', label: 'Production Queue' }, { id: 'assembly', label: 'Assembly View' }]

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: 0 }}>Production Studio</h1>
        <select value={selectedTitleId} onChange={e => setSelectedTitleId(e.target.value)}
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: CREAM, padding: '8px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', cursor: 'pointer', minWidth: '200px' }}>
          <option value="">All Titles</option>
          {titles.map(t => <option key={t.productionid} value={t.productionid}>{t.productiontitle}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '28px' }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ background: 'none', border: 'none', borderBottom: activeTab === id ? `2px solid ${GOLD}` : '2px solid transparent', color: activeTab === id ? GOLD : CHARCOAL, padding: '10px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>
      {activeTab === 'queue'    && <QueueTab titles={titles} selectedTitleId={selectedTitleId} setSelectedTitleId={setSelectedTitleId} />}
      {activeTab === 'assembly' && <AssemblyTab />}
    </div>
  )
}
