import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'

const PLATFORMS = [
  { id: 1, name: 'ReelShort',  type: 'Paywall',    color: '#E8673A', priority: 'Primary',  active: true,  releases: 12, views: '284K', revenue: '$4,820' },
  { id: 2, name: 'TikTok',     type: 'Social',     color: '#69C9D0', priority: 'Primary',  active: true,  releases: 8,  views: '1.2M', revenue: '$640' },
  { id: 3, name: 'YouTube',    type: 'AVOD',       color: '#FF0000', priority: 'Primary',  active: true,  releases: 10, views: '92K',  revenue: '$310' },
  { id: 4, name: 'Tubi',       type: 'FAST',       color: '#FA3B1E', priority: 'Secondary',active: false, releases: 0,  views: '—',    revenue: '—' },
  { id: 5, name: 'Pluto TV',   type: 'FAST',       color: '#835AFF', priority: 'Secondary',active: false, releases: 0,  views: '—',    revenue: '—' },
]

const RELEASES = [
  { id: 1, episode: 'S1E01: Into Darkness',  platform: 'ReelShort', status: 'live',    views: '48K',  revenue: '$820',  date: '2026-01-15' },
  { id: 2, episode: 'S1E01: Into Darkness',  platform: 'YouTube',   status: 'live',    views: '12K',  revenue: '$48',   date: '2026-01-15' },
  { id: 3, episode: 'S1E01: Into Darkness',  platform: 'TikTok',    status: 'live',    views: '210K', revenue: '$140',  date: '2026-01-15' },
  { id: 4, episode: 'S1E02: The Warning',    platform: 'ReelShort', status: 'live',    views: '41K',  revenue: '$710',  date: '2026-01-22' },
  { id: 5, episode: 'S1E02: The Warning',    platform: 'YouTube',   status: 'live',    views: '9K',   revenue: '$36',   date: '2026-01-22' },
  { id: 6, episode: 'S1E03: The Map',        platform: 'ReelShort', status: 'pending', views: '—',    revenue: '—',     date: '2026-02-01' },
  { id: 7, episode: 'S1E03: The Map',        platform: 'TikTok',    status: 'pending', views: '—',    revenue: '—',     date: '2026-02-01' },
]

const STATUS_COLORS = {
  live:    { bg: 'rgba(74,156,122,0.15)', color: '#4A9C7A', label: 'Live' },
  pending: { bg: 'rgba(201,146,74,0.15)', color: '#C9924A', label: 'Pending' },
  draft:   { bg: 'rgba(106,101,96,0.2)',  color: '#6A6560', label: 'Draft' },
  error:   { bg: 'rgba(200,75,49,0.15)',  color: '#C84B31', label: 'Error' },
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.draft
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '2px', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function KPIBar({ titles }) {
  const kpis = [
    { label: 'Total Views',     value: '1.58M', delta: '+12%' },
    { label: 'Total Revenue',   value: '$5,770', delta: '+8%' },
    { label: 'Active Releases', value: '5',     delta: '' },
    { label: 'Platforms Live',  value: '3',     delta: '' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: BORDER, marginBottom: '32px' }}>
      {kpis.map(({ label, value, delta }) => (
        <div key={label} style={{ background: SURFACE, padding: '20px 24px' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: GOLD, fontWeight: 300, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {value}
            {delta && <span style={{ fontSize: '0.75rem', color: '#4A9C7A', fontFamily: 'DM Sans, sans-serif' }}>{delta}</span>}
          </div>
          <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

function PlatformsTab() {
  const [selected, setSelected] = useState(null)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2px', marginBottom: '24px' }}>
        {PLATFORMS.map(p => (
          <div key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
            style={{ background: selected?.id === p.id ? 'rgba(201,146,74,0.06)' : SURFACE2, border: `1px solid ${selected?.id === p.id ? 'rgba(201,146,74,0.3)' : BORDER}`, padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color }} />
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: CREAM }}>{p.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.type}</span>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.active ? '#4A9C7A' : CHARCOAL }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[{ label: 'Releases', value: p.releases }, { label: 'Views', value: p.views }, { label: 'Revenue', value: p.revenue }].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '0.9rem', color: value === '—' ? MUTED : CREAM }}>{value}</div>
                </div>
              ))}
            </div>
            {!p.active && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${BORDER}` }}>
                <button style={{ background: 'none', border: `1px solid rgba(201,146,74,0.3)`, color: GOLD, padding: '5px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Set Up Platform
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && selected.active && (
        <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: CREAM }}>{selected.name} — Platform Settings</div>
            <button style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '1rem' }} onClick={() => setSelected(null)}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {['API Key', 'Channel ID', 'Content Policy', 'Default Quality'].map(field => (
              <div key={field}>
                <label style={{ display: 'block', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>{field}</label>
                <input type={field === 'API Key' ? 'password' : 'text'} placeholder={field === 'API Key' ? '••••••••••••' : `Enter ${field}`}
                  style={{ width: '100%', background: SURFACE, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' }} />
              </div>
            ))}
          </div>
          <button style={{ marginTop: '16px', background: GOLD, border: 'none', color: '#1A1810', padding: '9px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            Save Settings
          </button>
        </div>
      )}
    </div>
  )
}

function ReleasesTab() {
  const [filter, setFilter] = useState('all')
  const platforms = ['all', ...new Set(RELEASES.map(r => r.platform))]
  const filtered = filter === 'all' ? RELEASES : RELEASES.filter(r => r.platform === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {platforms.map(p => (
            <button key={p} onClick={() => setFilter(p)}
              style={{ background: filter === p ? 'rgba(201,146,74,0.12)' : 'none', border: `1px solid ${filter === p ? 'rgba(201,146,74,0.3)' : BORDER}`, color: filter === p ? GOLD : CHARCOAL, padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'capitalize', transition: 'all 0.15s' }}>
              {p}
            </button>
          ))}
        </div>
        <button style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          + New Release
        </button>
      </div>

      <div style={{ border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
              {['Episode', 'Platform', 'Status', 'Views', 'Revenue', 'Release Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const plat = PLATFORMS.find(p => p.name === row.platform)
              return (
                <tr key={row.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,146,74,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '13px 16px', color: CREAM, fontSize: '0.83rem' }}>{row.episode}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: plat?.color || CHARCOAL }} />
                      <span style={{ fontSize: '0.8rem', color: CHARCOAL }}>{row.platform}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding: '13px 16px', color: row.views === '—' ? MUTED : CREAM, fontSize: '0.83rem' }}>{row.views}</td>
                  <td style={{ padding: '13px 16px', color: row.revenue === '—' ? MUTED : '#4A9C7A', fontSize: '0.83rem' }}>{row.revenue}</td>
                  <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{row.date}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>View</button>
                      {row.status === 'pending' && <button style={{ background: 'none', border: 'none', color: '#4A9C7A', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Publish</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Distribution() {
  const [activeTab, setActiveTab] = useState('overview')
  const [titles, setTitles] = useState([])
  const [selectedTitleId, setSelectedTitleId] = useState('')

  useEffect(() => {
    supabase.from('productions').select('productionid, productiontitle').eq('productiongroup', 'TITLE').eq('activestatus', 'A')
      .then(({ data }) => { if (data) { setTitles(data); if (data[0]) setSelectedTitleId(String(data[0].productionid)) } })
  }, [])

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'releases',  label: 'Releases' },
    { id: 'platforms', label: 'Platforms' },
  ]

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: 0 }}>Distribution</h1>
        <select value={selectedTitleId} onChange={e => setSelectedTitleId(e.target.value)}
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: CREAM, padding: '8px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', cursor: 'pointer', minWidth: '200px' }}>
          <option value="">All Titles</option>
          {titles.map(t => <option key={t.productionid} value={t.productionid}>{t.productiontitle}</option>)}
        </select>
      </div>

      <KPIBar />

      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '28px' }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ background: 'none', border: 'none', borderBottom: activeTab === id ? `2px solid ${GOLD}` : '2px solid transparent', color: activeTab === id ? GOLD : CHARCOAL, padding: '10px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '24px' }}>
            <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Platform Performance</div>
            {PLATFORMS.filter(p => p.active).map((p, i) => (
              <div key={p.id} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                    <span style={{ fontSize: '0.82rem', color: CREAM }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: CHARCOAL }}>{p.views} views</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', background: p.color, borderRadius: '2px', width: i === 0 ? '65%' : i === 1 ? '22%' : '13%', opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '24px' }}>
            <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Recent Releases</div>
            {RELEASES.filter(r => r.status === 'live').slice(0, 4).map((r, i) => {
              const plat = PLATFORMS.find(p => p.name === r.platform)
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: CREAM, marginBottom: '2px' }}>{r.episode}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: plat?.color }} />
                      <span style={{ fontSize: '0.7rem', color: CHARCOAL }}>{r.platform}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#4A9C7A' }}>{r.revenue}</div>
                    <div style={{ fontSize: '0.7rem', color: CHARCOAL }}>{r.views} views</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {activeTab === 'releases'  && <ReleasesTab />}
      {activeTab === 'platforms' && <PlatformsTab />}
    </div>
  )
}
