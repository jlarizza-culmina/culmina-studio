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

const ACTIVITY = [
  { time: '2h ago', text: 'New manuscript submitted', type: 'manuscript' },
  { time: '4h ago', text: 'Episode 3 shot generated', type: 'production' },
  { time: '1d ago', text: 'Arc 1 development complete', type: 'development' },
  { time: '2d ago', text: 'Distribution to ReelShort', type: 'distribution' },
  { time: '3d ago', text: 'Asset approved: Hero portrait', type: 'asset' },
]

const typeColor = { manuscript: '#7A9EC8', production: '#C9924A', development: '#9C7AC8', distribution: '#4A9C7A', asset: '#C87A7A' }

export default function Dashboard() {
  const navigate = useNavigate()
  const { displayName } = useAuth()
  const [titles, setTitles] = useState([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [hoveredModule, setHoveredModule] = useState(null)

  useEffect(() => {
    supabase.from('productions').select('productionid, productiontitle')
      .eq('productiongroup', 'TITLE').eq('activestatus', 'A')
      .then(({ data }) => { if (data) setTitles(data) })
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
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
            {titles.map(t => <option key={t.productionid} value={t.productionid}>{t.productiontitle}</option>)}
          </select>
          <button onClick={() => navigate('/development')}
            style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '10px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            + New Production
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '40px', background: BORDER }}>
        {[
          { label: 'Active Titles', value: titles.length || '0' },
          { label: 'Episodes in Prod', value: '—' },
          { label: 'Platform Releases', value: '—' },
          { label: 'Revenue MTD', value: '$0' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: SURFACE, padding: '24px 28px' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', color: GOLD, fontWeight: 300, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>{label}</div>
          </div>
        ))}
      </div>

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

        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: '24px' }}>
          <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Recent Activity</div>
          {ACTIVITY.map(({ time, text, type }, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: typeColor[type] || GOLD, flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: CREAM, lineHeight: 1.4 }}>{text}</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: CHARCOAL, paddingLeft: '14px' }}>{time}</div>
            </div>
          ))}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${BORDER}` }}>
            <button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>View all activity →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
