import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const NAV_ITEMS = [
  { path: 'dashboard',    label: 'Dashboard',        icon: '⬡' },
  { path: 'manuscript',   label: 'Manuscript',        icon: '📄' },
  { path: 'assets',       label: 'Asset Creator',     icon: '🎨' },
  { path: 'development',  label: 'Development',       icon: '✍️' },
  { path: 'production',   label: 'Production Studio', icon: '🎬' },
  { path: 'post',         label: 'Post Production',   icon: '🎞️' },
  { path: 'distribution', label: 'Distribution',      icon: '📡' },
  { path: 'finances',     label: 'Finances',          icon: '💰' },
  { path: 'series',       label: 'Series Manager',    icon: '🗂️' },
  { path: 'repository',   label: 'Repository',        icon: '🗄️' },
  { path: 'admin',        label: 'Admin',             icon: '⚙️' },
  { path: 'profile',      label: 'Profile',           icon: '👤' },
]

const RESOURCE_ITEMS = [
  { path: '7stages',  label: '7 Stages',  icon: '🎭' },
  { path: 'lighting', label: 'Lighting',  icon: '💡' },
]

export function AppShell() {
  const { displayName, signOut, isSysAdmin } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: collapsed ? '10px 0' : '10px 20px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    textDecoration: 'none',
    color: isActive ? '#C9924A' : '#8A8680',
    background: isActive ? 'rgba(201,146,74,0.08)' : 'transparent',
    borderLeft: isActive ? '2px solid #C9924A' : '2px solid transparent',
    fontSize: '0.82rem', transition: 'all 0.15s ease',
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0F0E0B', fontFamily: 'DM Sans, sans-serif' }}>
      <aside style={{
        width: collapsed ? '60px' : '220px', minWidth: collapsed ? '60px' : '220px',
        background: '#1A1810', borderRight: '1px solid #2A2720',
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease, min-width 0.2s ease', overflow: 'hidden'
      }}>

        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 0' : '24px 20px', borderBottom: '1px solid #2A2720',
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#C9924A', letterSpacing: '0.05em' }}>Culmina</div>
              <div style={{ fontSize: '0.6rem', color: '#5C574E', letterSpacing: '0.15em', textTransform: 'uppercase' }}>AI Drama Studio</div>
            </div>
          )}
          {collapsed && <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: '#C9924A' }}>C</div>}
        </div>

        {/* Main Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0', display: 'flex', flexDirection: 'column' }}>
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <NavLink key={path} to={`/${path}`} style={({ isActive }) => linkStyle(isActive)}>
              <span style={{ fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}

          {/* Resources Section */}
          <div style={{ marginTop: '8px', borderTop: '1px solid #2A2720', paddingTop: '8px' }}>
            <button onClick={() => setResourcesOpen(r => !r)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: collapsed ? '10px 0' : '10px 20px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#5C574E', fontSize: '0.72rem', letterSpacing: '0.08em',
                textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#8A8680'}
              onMouseLeave={e => e.currentTarget.style.color = '#5C574E'}>
              <span style={{ fontSize: '0.85rem', minWidth: '20px', textAlign: 'center' }}>📚</span>
              {!collapsed && (
                <>
                  <span style={{ flex: 1, textAlign: 'left' }}>Resources</span>
                  <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: resourcesOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                </>
              )}
            </button>

            {(resourcesOpen || collapsed) && RESOURCE_ITEMS.map(({ path, label, icon }) => (
              <NavLink key={path} to={`/${path}`} style={({ isActive }) => ({
                ...linkStyle(isActive),
                paddingLeft: collapsed ? '0' : '36px',
                fontSize: '0.78rem',
              })}>
                <span style={{ fontSize: '0.9rem', minWidth: '20px', textAlign: 'center' }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User / Sign Out */}
        <div style={{ borderTop: '1px solid #2A2720', padding: collapsed ? '12px 0' : '12px 20px' }}>
          {!collapsed && (
            <div style={{ fontSize: '0.75rem', color: '#5C574E', marginBottom: '8px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
          )}
          <button onClick={handleSignOut} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#5C574E', fontSize: '0.75rem', padding: 0,
            display: 'flex', alignItems: 'center', gap: '6px',
            justifyContent: collapsed ? 'center' : 'flex-start', width: '100%'
          }}>
            <span>↩</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: '#0F0E0B' }}>
        <div style={{
          height: '52px', borderBottom: '1px solid #2A2720',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px',
          background: '#1A1810', position: 'sticky', top: 0, zIndex: 10
        }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#5C574E', fontSize: '1.1rem', lineHeight: 1, padding: '4px'
          }}>☰</button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '0.78rem', color: '#5C574E' }}>
            {displayName && `Welcome, ${displayName}`}
          </span>
          {isSysAdmin && (
            <NavLink to="/admin" style={{ color: '#5C574E', fontSize: '0.85rem', textDecoration: 'none' }}>⚙</NavLink>
          )}
        </div>
        <div style={{ padding: '32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
