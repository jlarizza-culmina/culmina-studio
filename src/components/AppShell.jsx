import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import GlobalHeader from './GlobalHeader'
import GlobalFooter from './GlobalFooter'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { to: '/manuscripts',  label: 'Manuscript Import', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { to: '/assets',       label: 'Asset Creator',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> },
  { to: '/development',  label: 'Development',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
  { to: '/production',   label: 'Production Studio', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> },
  { to: '/post',         label: 'Post Production', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { to: '/distribution', label: 'Distribution',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> },
  { to: '/finances',     label: 'Finances',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { to: '/admin',        label: 'Admin',          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
]

const BREADCRUMBS = {
  '/manuscripts': 'Manuscript Import',
  '/assets': 'Asset Creator',
  '/development': 'Development',
  '/production': 'Production Studio',
  '/post': 'Post Production',
  '/distribution': 'Distribution',
  '/finances': 'Finances',
  '/admin': 'Admin',
}

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const breadcrumb = BREADCRUMBS[location.pathname]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GlobalHeader breadcrumb={breadcrumb} />
      <div style={styles.layout}>
        <nav style={styles.sidebar}>
          <div style={styles.sidebarNav}>
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  background: isActive ? 'var(--gold-lite)' : 'transparent',
                  color: isActive ? 'var(--gold)' : 'var(--char)',
                  fontWeight: isActive ? 400 : 300,
                  borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                })}
              >
                <span style={{ opacity: 0.6, flexShrink: 0 }}>{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
            <div style={{ margin: '8px 16px', height: 1, background: 'var(--border)' }}></div>
            <div style={styles.lockedItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              7 Stages
              <span style={styles.comingBadge}>Coming</span>
            </div>
          </div>
        </nav>
        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
      <GlobalFooter />
    </div>
  )
}

const styles = {
  layout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: 220,
    background: 'var(--white)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto',
  },
  sidebarNav: {
    padding: '12px 0',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: '.8rem',
    textDecoration: 'none',
    transition: 'all 150ms',
    position: 'relative',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  },
  lockedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 18px',
    fontSize: '.8rem',
    color: 'var(--char)',
    opacity: 0.35,
    fontWeight: 300,
  },
  comingBadge: {
    marginLeft: 'auto',
    fontSize: '.58rem',
    background: 'var(--cream-mid)',
    color: 'var(--char)',
    border: '1px solid var(--border)',
    padding: '2px 6px',
    borderRadius: 4,
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px 28px',
    background: 'var(--cream)',
  },
}

