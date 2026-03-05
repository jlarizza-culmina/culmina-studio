import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const BORDER = 'rgba(201,146,74,0.12)'

const MODULES = [
  { path: '/manuscript',   icon: '📄', name: 'Manuscript Import',  desc: 'Upload and manage author manuscripts' },
  { path: '/assets',       icon: '🎨', name: 'Asset Creator',       desc: 'Generate characters, sets, and visuals' },
  { path: '/development',  icon: '✍️', name: 'Development',         desc: 'Build your production hierarchy' },
  { path: '/production',   icon: '🎬', name: 'Production Studio',   desc: 'Generate cinematic shots with AI' },
  { path: '/post',         icon: '🎞️', name: 'Post Production',     desc: 'Voice, captions, and final export' },
  { path: '/distribution', icon: '📡', name: 'Distribution',        desc: 'Publish to streaming platforms' },
  { path: '/finances',     icon: '💰', name: 'Finances',            desc: 'Budgets, royalties, and payouts' },
  { path: '/admin',        icon: '⚙️', name: 'Admin',               desc: 'Users, roles, and configuration' },
  { path: '/7stages',      icon: '🎭', name: '7 Stages',            desc: 'Film production reference guide' },
]

const typeColor = {
  TITLE:   '#C9924A',
  ARC:     '#9C7AC8',
  ACT:     '#7A9EC8',
  EPISODE: '#4A9C7A',
  SHOT:    '#C87A7A',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function groupLabel(group) {
  const map = {
    TITLE:   'New title created',
    ARC:     'Arc added',
    ACT:     'Act added',
    EPISODE: 'Episode updated',
    SHOT:    'Shot updated',
    TAKE:    'Take generated',
  }
  return map[group] || 'Production updated'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { displayName } = useAuth()
  const [titles, setTitles]         = useState([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [stats, setStats]           = useState({ episodes: 0, releases: 0, revenue: 0 })
  const [activity, setActivity]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [hoveredModule, setHoveredModule] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)

      // 1. Titles
      const { data: titleData } = await supabase
        .from('productions')
        .select('productionid, productiontitle, updatedate')
        .eq('productiongroup', 'TITLE')
        .eq('activestatus', 'A')
        .order('updatedate', { ascending: false })

      if (titleData) setTitles(titleData)

      // 2. Episode count
      const { count: episodeCount } = await supabase
        .from('productions')
        .select('productionid', { count: 'exact', head: true })
        .eq('productiongroup', 'EPISODE')
        .eq('activestatus', 'A')

      // 3. Recent activity — last 10 updated productions
      const { data: activityData } = await supabase
        .from('productions')
        .select('productionid, productiontitle, productiongroup, updatedate')
        .eq('activestatus', 'A')
        .order('updatedate', { ascending: false })
        .limit(8)

      if (activityData) setActivity(activityData)

      setStats(s => ({ ...s, episodes: episodeCount || 0 }))
      setLoading(false)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>{greeting}</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.4rem', fontWeight: 300, color: GOLD, margin: 0 }}>
            Welcome back, {displayName || 'Studio'}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select value={selectedTitle} onChange={e => setSelectedTitle(e.target.value)}
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: CREAM, padding: '10px 16px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', cursor: 'pointer', minWidth: '200px' }}>
            <option value="">All Titles</option>
            {titles.map(t => (
              <option key={t.productionid} value={t.productionid}>{t.productiontitle}</option>
            ))}
          </select>
          <button onClick={() => navigate('/development')}
            style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '10px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            + New Production
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '40px', background: BORDER }}>
        {[
          { label: 'Active Titles',     value: loading ? '…' : titles.length },
          { label: 'Episodes in Prod',  value: loading ? '…' : stats.episodes },
          { label: 'Platform Releases', value: '—' },
          { label: 'Revenue MTD',       value: '$0' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: SURFACE, padding: '24px 28px' }}>
            <div style={{ fontFamily: 'Cormorant Garamath, serif', fontSize: '2.2rem', color: GOLD, fontWeight: 300, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Production Modules</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {MODULES.map(({ path, icon, name, desc }) => (
              <div key={name}
                onClick={() => navigate(path)}
                onMouseEnter={() => setHoveredModule(name)}
                onMouseLeave={() => setHoveredModule(null)}
                style={{ background: hoveredModule === name ? 'rgba(201,146,74,0.07)' : SURFACE, border: `1px solid ${hoveredModule === name ? 'rgba(201,146,74,0.3)' : BORDER}`, padding: '28px 24px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>{icon}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: hoveredModule === name ? GOLD : CREAM, marginBottom: '6px', transition: 'color 0.2s' }}>{name}</div>
                <div style={{ fontSize: '0.75rem', color: CHARCOAL, lineHeight: 1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: '24px' }}>
          <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Recent Activity</div>
          {loading ? (
            <div style={{ fontSize: '0.78rem', color: CHARCOAL }}>Loading…</div>
          ) : activity.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: CHARCOAL, textAlign: 'center', padding: '24px 0' }}>No recent activity</div>
          ) : (
            activity.map((item, i) => (
              <div key={item.productionid} style={{ padding: '12px 0', borderBottom: i < activity.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: typeColor[item.productiongroup] || GOLD, flexShrink: 0 }} />
                  <div style={{ fontSize: '0.78rem', color: CREAM, lineHeight: 1.4 }}>
                    {groupLabel(item.productiongroup)}
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: CHARCOAL, paddingLeft: '14px', marginBottom: '2px' }}>{item.productiontitle}</div>
                <div style={{ fontSize: '0.68rem', color: '#4A4540', paddingLeft: '14px' }}>{timeAgo(item.updatedate)}</div>
              </div>
            ))
          )}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>
            <button onClick={() => navigate('/development')} style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
              View all productions →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
