#!/bin/bash
set -e
echo "🎬 Porting prototype screens to React..."
mkdir -p src/components src/pages

cat > src/components/CulminaLogo.jsx << 'FILEEOF'
export default function CulminaLogo({ height = 36 }) {
  return (
    <svg viewBox="0 0 110 162" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height }}>
      <path d="M 6,55 A 49,49 0 0,1 104,55" stroke="#3A3630" strokeWidth="2" fill="none" strokeLinecap="square"/>
      <line x1="6" y1="55" x2="6" y2="118" stroke="#3A3630" strokeWidth="2" strokeLinecap="square"/>
      <line x1="104" y1="55" x2="104" y2="118" stroke="#3A3630" strokeWidth="2" strokeLinecap="square"/>
      <line x1="6" y1="108" x2="55" y2="7" stroke="#C9924A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="104" y1="108" x2="55" y2="7" stroke="#C9924A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="30" y1="63" x2="80" y2="63" stroke="#C9924A" strokeWidth="1" strokeLinecap="round"/>
      <line x1="42" y1="36" x2="68" y2="36" stroke="#5C574E" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="55" y1="36" x2="55" y2="118" stroke="#5C574E" strokeWidth="1.8"/>
    </svg>
  )
}

export function CulminaLogoHero({ height = 100 }) {
  return (
    <svg viewBox="0 0 110 162" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height, filter: 'drop-shadow(0 4px 16px rgba(201,146,74,.18))' }}>
      <path d="M 6,55 A 49,49 0 0,1 104,55" stroke="rgba(92,87,78,.25)" strokeWidth="2.5" fill="none" strokeLinecap="square"/>
      <line x1="6" y1="55" x2="6" y2="118" stroke="rgba(92,87,78,.25)" strokeWidth="2.5" strokeLinecap="square"/>
      <line x1="104" y1="55" x2="104" y2="118" stroke="rgba(92,87,78,.25)" strokeWidth="2.5" strokeLinecap="square"/>
      <line x1="6" y1="108" x2="55" y2="7" stroke="#C9924A" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="104" y1="108" x2="55" y2="7" stroke="#C9924A" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="30" y1="63" x2="80" y2="63" stroke="#C9924A" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="42" y1="36" x2="68" y2="36" stroke="#5C574E" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="55" y1="36" x2="55" y2="118" stroke="#5C574E" strokeWidth="2.5"/>
    </svg>
  )
}

FILEEOF
echo '  ✓ src/components/CulminaLogo.jsx'

cat > src/components/GlobalHeader.jsx << 'FILEEOF'
import { useNavigate } from 'react-router-dom'
import CulminaLogo from './CulminaLogo'

export default function GlobalHeader({ breadcrumb, showAuth = true, showSignIn = false }) {
  const navigate = useNavigate()

  return (
    <header style={styles.header}>
      <div style={styles.logoLockup} onClick={() => navigate('/dashboard')}>
        <CulminaLogo height={36} />
        <div style={styles.logoText}>
          <span style={styles.logoName}>Culmina</span>
          <span style={styles.logoSub}>AI Drama Studio</span>
        </div>
      </div>

      {breadcrumb && (
        <div style={styles.breadcrumb}>/ <span style={{ color: '#F7F2E8' }}>{breadcrumb}</span></div>
      )}

      <div style={styles.right}>
        {showSignIn ? (
          <button onClick={() => navigate('/login')} style={styles.signInBtn}>Sign In</button>
        ) : showAuth ? (
          <>
            <button style={styles.bellBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span style={styles.bellBadge}></span>
            </button>
            <span style={styles.nick}>JSmith</span>
            <div style={styles.avatar}>JS</div>
          </>
        ) : null}
      </div>
    </header>
  )
}

const styles = {
  header: {
    height: 64,
    background: '#1A1810',
    borderBottom: '1px solid #C9924A',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logoLockup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1,
  },
  logoName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    fontWeight: 400,
    color: '#F7F2E8',
    letterSpacing: '.06em',
  },
  logoSub: {
    fontSize: '.5rem',
    fontWeight: 200,
    color: 'rgba(247,242,232,.45)',
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    marginTop: 3,
  },
  breadcrumb: {
    marginLeft: 16,
    fontSize: '.75rem',
    color: '#9A9188',
  },
  right: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  signInBtn: {
    border: '1px solid #C9924A',
    color: '#C9924A',
    background: 'transparent',
    padding: '7px 20px',
    borderRadius: 6,
    fontSize: '.8rem',
    fontWeight: 400,
    letterSpacing: '.05em',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
  },
  bellBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(247,242,232,.55)',
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#C9924A',
    border: '2px solid #1A1810',
  },
  nick: {
    fontSize: '.83rem',
    color: '#F7F2E8',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#C9924A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '.72rem',
    fontWeight: 500,
    color: '#1A1810',
    cursor: 'pointer',
  },
}

FILEEOF
echo '  ✓ src/components/GlobalHeader.jsx'

cat > src/components/GlobalFooter.jsx << 'FILEEOF'
export default function GlobalFooter() {
  return (
    <footer style={styles.footer}>
      <span>© 2026 Culmina AI, Inc. All rights reserved.</span>
      <span style={styles.links}>
        <a href="#" style={styles.link}>Privacy Policy</a>
        <a href="#" style={styles.link}>Terms of Service</a>
        <a href="#" style={styles.link}>Cookie Policy</a>
        <a href="#" style={styles.link}>Accessibility</a>
      </span>
      <div style={styles.center}>
        <span style={styles.contact}>Contact Us</span>
      </div>
      <div style={styles.right}>
        <a href="#" style={{ fontSize: '.72rem', color: '#9A9188', textDecoration: 'none' }}>Lighting Descriptions</a>
      </div>
    </footer>
  )
}

const styles = {
  footer: {
    background: '#1A1810',
    borderTop: '1px solid #C9924A',
    padding: '14px 32px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    flexShrink: 0,
    fontSize: '.72rem',
    color: 'rgba(247,242,232,.4)',
    fontWeight: 200,
  },
  links: { display: 'flex', gap: 0 },
  link: {
    color: 'rgba(247,242,232,.45)',
    margin: '0 8px',
    fontSize: '.72rem',
    textDecoration: 'none',
  },
  center: { margin: '0 auto' },
  contact: {
    color: '#C9924A',
    cursor: 'pointer',
    fontSize: '.72rem',
    fontWeight: 300,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
}

FILEEOF
echo '  ✓ src/components/GlobalFooter.jsx'

cat > src/components/AppShell.jsx << 'FILEEOF'
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

FILEEOF
echo '  ✓ src/components/AppShell.jsx'

cat > src/pages/Home.jsx << 'FILEEOF'
import { useNavigate } from 'react-router-dom'
import GlobalHeader from '../components/GlobalHeader'
import GlobalFooter from '../components/GlobalFooter'
import { CulminaLogoHero } from '../components/CulminaLogo'

const VALUE_CARDS = [
  { icon: '📖', title: 'Import Manuscripts', body: 'Upload any manuscript — PDF, Word, ePub. Our AI parses scenes, characters, and structure automatically.' },
  { icon: '🎬', title: 'AI Production', body: 'Generate video takes with Veo 3.1, compose scenes, add voice and captions — all within Culmina.' },
  { icon: '🌐', title: 'Global Distribution', body: 'Publish to ReelShort, TikTok, YouTube and more. Track views, revenue, and royalties in one place.' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GlobalHeader showAuth={false} showSignIn={true} />

      <section style={styles.hero}>
        <div style={styles.heroMark}><CulminaLogoHero height={100} /></div>
        <h1 style={styles.heroWordmark}>Culmina</h1>
        <p style={styles.heroSubTitle}>AI Drama Studio</p>
        <div style={styles.heroRule}></div>
        <p style={styles.heroTagline}>"Where every story reaches its peak."</p>
        <div style={styles.heroCtas}>
          <button onClick={() => navigate('/login')} style={styles.btnPrimary}>Get Started</button>
          <button style={styles.btnGhost}>Learn More</button>
        </div>
        <div style={styles.heroValue}>
          {VALUE_CARDS.map(c => (
            <div key={c.title} style={styles.valueCard}>
              <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{c.icon}</div>
              <div style={styles.valueTitle}>{c.title}</div>
              <div style={styles.valueBody}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      <GlobalFooter />
    </div>
  )
}

const styles = {
  hero: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 24px',
    background: `
      radial-gradient(ellipse 70% 55% at 50% 0%, rgba(201,146,74,.13) 0%, transparent 65%),
      radial-gradient(ellipse 45% 40% at 85% 85%, rgba(92,87,78,.07) 0%, transparent 60%),
      var(--cream)`,
    position: 'relative',
    overflow: 'hidden',
  },
  heroMark: { marginBottom: 24 },
  heroWordmark: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(3rem,6vw,5.5rem)',
    fontWeight: 300,
    color: 'var(--ink)',
    letterSpacing: '.08em',
    marginBottom: 6,
  },
  heroSubTitle: {
    fontSize: '.85rem',
    fontWeight: 200,
    color: 'var(--char)',
    letterSpacing: '.3em',
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  heroRule: {
    width: 60,
    height: 1,
    background: 'var(--gold)',
    opacity: 0.45,
    marginBottom: 20,
  },
  heroTagline: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.1rem,2.5vw,1.6rem)',
    fontWeight: 300,
    fontStyle: 'italic',
    color: 'var(--char)',
    marginBottom: 36,
    maxWidth: 600,
  },
  heroCtas: {
    display: 'flex',
    gap: 14,
    justifyContent: 'center',
    marginBottom: 60,
  },
  btnPrimary: {
    padding: '11px 28px',
    background: 'var(--gold)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 7,
    fontSize: '.9rem',
    fontWeight: 400,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
  },
  btnGhost: {
    padding: '11px 28px',
    background: 'var(--white)',
    border: '1px solid var(--border)',
    color: 'var(--char)',
    borderRadius: 7,
    fontSize: '.9rem',
    fontWeight: 400,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
  },
  heroValue: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20,
    maxWidth: 860,
    width: '100%',
  },
  valueCard: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '24px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(26,24,16,.07)',
    transition: 'transform 180ms, box-shadow 180ms',
  },
  valueTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    color: 'var(--ink)',
    marginBottom: 6,
    fontWeight: 400,
  },
  valueBody: {
    fontSize: '.78rem',
    color: 'var(--char)',
    lineHeight: 1.65,
  },
}

FILEEOF
echo '  ✓ src/pages/Home.jsx'

cat > src/pages/Login.jsx << 'FILEEOF'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import GlobalHeader from '../components/GlobalHeader'
import GlobalFooter from '../components/GlobalFooter'
import { CulminaLogoHero } from '../components/CulminaLogo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GlobalHeader showAuth={false} />
      <div style={styles.center}>
        <div style={styles.card}>
          <div style={{ marginBottom: 16 }}><CulminaLogoHero height={60} /></div>
          <h1 style={styles.title}>Culmina</h1>
          <p style={styles.sub}>AI Drama Studio</p>

          <form onSubmit={handleLogin}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Login Name <span style={{ color: 'var(--gold)' }}>*</span></label>
              <input style={styles.input} type="email" placeholder="username or email" value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
            </div>
            <div style={{ ...styles.formGroup, marginBottom: 20 }}>
              <label style={styles.label}>Password <span style={{ color: 'var(--gold)' }}>*</span></label>
              <input style={styles.input} type="password" placeholder="••••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: 10 }}>{error}</p>}
            <button type="submit" disabled={loading} style={styles.btnPrimary}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={styles.divider}><span>or</span></div>
          <button style={styles.oauthBtn}>Continue with Google (OAuth)</button>
          <button style={styles.oauthBtn}>Continue with Microsoft (SAML)</button>
          <a href="#" style={styles.forgotLink}>Forgot password?</a>
        </div>
      </div>
      <GlobalFooter />
    </div>
  )
}

const styles = {
  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,146,74,.1) 0%, transparent 60%), var(--cream)`,
  },
  card: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '40px 36px',
    width: 390,
    boxShadow: '0 8px 40px rgba(26,24,16,.1), 0 2px 8px rgba(26,24,16,.06)',
    textAlign: 'center',
  },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', fontWeight: 400, marginBottom: 4 },
  sub: { fontSize: '.67rem', letterSpacing: '.2em', color: 'var(--char)', textTransform: 'uppercase', marginBottom: 28 },
  formGroup: { textAlign: 'left', marginBottom: 16 },
  label: { display: 'block', fontSize: '.65rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char)', marginBottom: 6 },
  input: {
    width: '100%', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7,
    padding: '9px 12px', color: 'var(--ink)', fontSize: '.85rem', fontWeight: 300, outline: 'none', fontFamily: 'var(--font-body)',
  },
  btnPrimary: {
    width: '100%', background: 'var(--gold)', color: 'var(--white)', border: 'none', borderRadius: 7,
    padding: 11, fontSize: '.88rem', fontWeight: 400, fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex', justifyContent: 'center',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', color: 'var(--char)', fontSize: '.73rem',
  },
  oauthBtn: {
    width: '100%', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7,
    padding: 9, fontSize: '.8rem', color: 'var(--char)', marginBottom: 8, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  forgotLink: { fontSize: '.73rem', color: 'var(--char)', marginTop: 14, display: 'block', textDecoration: 'none' },
}

FILEEOF
echo '  ✓ src/pages/Login.jsx'

cat > src/pages/Dashboard.jsx << 'FILEEOF'
import { useNavigate } from 'react-router-dom'

const MODULES = [
  { icon: '📖', name: 'Manuscript Import', desc: 'Upload and AI-process source manuscripts to seed your production hierarchy.', to: '/manuscripts', badge: '2 processed', badgeType: 'gold' },
  { icon: '🎨', name: 'Asset Creator', desc: 'Database of characters, sets, props and animated objects — AI image generation included.', to: '/assets', badge: '47 assets', badgeType: 'char' },
  { icon: '✍️', name: 'Development', desc: 'Build the Title→Arc→Act→Episode→Shot hierarchy and craft your AI prompts.', to: '/development', badge: 'In Progress', badgeType: 'suc' },
  { icon: '🎬', name: 'Production Studio', desc: 'Generate video takes with Veo 3.1, approve shots, and assemble episodes.', to: '/production', badge: '12 queued', badgeType: 'char' },
  { icon: '🎧', name: 'Post Production', desc: 'Add voice tracks, closed captions, and export finalized episodes to Cloudflare R2.', to: '/post', badge: '3 pending', badgeType: 'char' },
  { icon: '📡', name: 'Distribution', desc: 'Release episodes to ReelShort, TikTok, YouTube. Track views and revenue.', to: '/distribution', badge: '2 live', badgeType: 'suc' },
  { icon: '💰', name: 'Finances', desc: 'Budget, expenses, revenue tracking, royalty management and payee payments.', to: '/finances', badge: '$24,500 budget', badgeType: 'char' },
  { icon: '⚙️', name: 'Admin', desc: 'User management, roles, entitlements, picklist editor, system settings.', to: '/admin', badge: 'SysAdmin', badgeType: 'gold' },
  { icon: '🔒', name: '7 Stages', desc: 'Educational guide to the 7 stages of film production mapped to Culmina modules.', locked: true, badge: 'No Access', badgeType: 'char' },
]

const BADGE_STYLES = {
  gold: { background: '#C9924A', color: '#FFFFFF' },
  char: { background: 'var(--cream-mid)', color: 'var(--char)', border: '1px solid var(--border)' },
  suc:  { background: 'rgba(58,139,103,.1)', color: '#3A8B67', border: '1px solid rgba(58,139,103,.25)' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      <p style={styles.greeting}>Welcome back, JSmith</p>
      <p style={styles.date}>{today} · <a href="#" style={{ color: 'var(--gold)', textDecoration: 'none' }}>3 active productions</a></p>

      <div style={styles.controls}>
        <select style={styles.titleSelect}>
          <option>📽 The Tunnels of Rasand</option>
          <option>📽 The Scarlet Pimpernel</option>
          <option>📽 All Titles</option>
        </select>
        <button style={styles.btnPrimary}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Production
        </button>
      </div>

      <div style={styles.grid}>
        {MODULES.map(m => (
          <div
            key={m.name}
            onClick={() => !m.locked && navigate(m.to)}
            style={{
              ...styles.tile,
              opacity: m.locked ? 0.5 : 1,
              cursor: m.locked ? 'default' : 'pointer',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>{m.icon}</div>
            <div style={styles.tileName}>{m.name}</div>
            <div style={styles.tileDesc}>{m.desc}</div>
            <span style={{ ...styles.badge, ...BADGE_STYLES[m.badgeType] }}>{m.badge}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  greeting: { fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 300, color: 'var(--ink)', marginBottom: 4 },
  date: { fontSize: '.8rem', color: 'var(--char)', marginBottom: 24 },
  controls: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 },
  titleSelect: {
    minWidth: 240, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7,
    padding: '9px 32px 9px 12px', color: 'var(--ink)', fontSize: '.85rem', fontWeight: 300,
    fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239A9188' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 18px',
    background: 'var(--gold)', color: 'var(--white)', border: 'none', borderRadius: 7,
    fontSize: '.8rem', fontWeight: 400, fontFamily: 'var(--font-body)', cursor: 'pointer',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 },
  tile: {
    background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12,
    padding: 20, textAlign: 'center', boxShadow: '0 1px 4px rgba(26,24,16,.05)',
    transition: 'all 180ms',
  },
  tileName: { fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)', marginBottom: 4, fontWeight: 400 },
  tileDesc: { fontSize: '.72rem', color: 'var(--char)', lineHeight: 1.55, marginBottom: 10 },
  badge: {
    display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 4,
    fontSize: '.65rem', fontWeight: 400, letterSpacing: '.05em',
  },
}

FILEEOF
echo '  ✓ src/pages/Dashboard.jsx'

cat > src/pages/Development.jsx << 'FILEEOF'
import { useState } from 'react'

const TREE_DATA = {
  id: 'title', name: 'The Tunnels of Rasand', type: 'Title',
  children: [{
    id: 'arc1', name: 'Arc 1: The Descent', type: 'Arc',
    children: [{
      id: 'act1', name: 'Act 1', type: 'Act',
      children: [
        { id: 'ep1', name: 'Episode 1: Into Darkness', type: 'Episode',
          children: [
            { id: 'shot1', name: 'Shot 1: Tunnel Entrance', type: 'Shot' },
            { id: 'shot2', name: 'Shot 2: The Figure', type: 'Shot' },
          ]},
        { id: 'ep2', name: 'Episode 2: The Warning', type: 'Episode', children: [] },
      ]}]
  }]
}

const LEVEL_ICONS = {
  Title: '📽', Arc: '🌊', Act: '📋', Episode: '▶️', Shot: '🎯',
}

function TreeNode({ node, depth = 0, selected, onSelect }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selected?.id === node.id

  return (
    <div style={{ marginLeft: depth > 0 ? 18 : 0, borderLeft: depth > 0 ? '1px solid var(--border)' : 'none' }}>
      <div
        onClick={() => { onSelect(node); if (hasChildren) setOpen(!open) }}
        style={{
          ...s.treeNode,
          background: isSelected ? 'var(--gold-lite)' : 'transparent',
          color: isSelected ? 'var(--gold)' : 'var(--char)',
          borderLeft: isSelected ? '3px solid var(--gold)' : '3px solid transparent',
        }}
      >
        {hasChildren ? (
          <svg style={{ width: 14, height: 14, transition: 'transform 180ms', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0, color: 'var(--char)' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 4 10 8 6 12"/></svg>
        ) : <span style={{ width: 14 }}></span>}
        <span style={{ fontSize: '.85rem' }}>{LEVEL_ICONS[node.type] || '📄'}</span>
        <span style={{ fontSize: '.8rem' }}>{node.name}</span>
      </div>
      {open && hasChildren && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
      {open && hasChildren && (
        <button style={s.addChildBtn}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
          Add {node.children[0]?.type || 'Child'}
        </button>
      )}
    </div>
  )
}

export default function Development() {
  const [selected, setSelected] = useState(TREE_DATA)

  return (
    <div style={{ display: 'flex', margin: '-32px -28px', height: 'calc(100vh - 64px - 48px)' }}>
      {/* Tree Panel */}
      <div style={s.treePanel}>
        <div style={s.treeHeader}>Production Hierarchy</div>
        <div style={s.treeTitleSel}>
          <select style={s.select}>
            <option>The Tunnels of Rasand</option>
            <option>The Scarlet Pimpernel</option>
          </select>
        </div>
        <div style={s.treeSearch}>
          <input type="text" placeholder="Search hierarchy…" style={s.searchInput} />
        </div>
        <div style={s.treeBody}>
          <TreeNode node={TREE_DATA} selected={selected} onSelect={setSelected} />
        </div>
      </div>

      {/* Detail Panel */}
      <div style={s.detailPanel}>
        <div style={s.breadcrumb}>The Tunnels of Rasand / <span style={{ color: 'var(--gold)' }}>{selected.type}</span></div>
        <div style={s.detailTitle}>{selected.name}</div>
        <div style={s.detailType}>{selected.type} · ProductionID: 10000001</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
          <button style={s.btnGhostSm}>✏ Edit</button>
          <button style={s.btnPrimarySm}>⚡ Create Prompt</button>
        </div>

        {/* Identity Section */}
        <div style={s.secBar}>Identity</div>
        <div style={s.grid2}>
          <div style={s.formGroup}>
            <label style={s.label}>Original Name <span style={{ color: 'var(--gold)' }}>*</span></label>
            <input style={s.input} defaultValue={selected.name} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Original Language <span style={{ color: 'var(--gold)' }}>*</span></label>
            <select style={s.select}><option>English (EN)</option></select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Aspect Ratio <span style={{ color: 'var(--gold)' }}>*</span></label>
            <select style={s.select}><option>Portrait 16:9 (PORT)</option><option>Landscape 16:9 (LAND)</option></select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Resolution <span style={{ color: 'var(--gold)' }}>*</span></label>
            <select style={s.select}><option>1080p (HD): 1920×1080</option><option>720p (HD): 1280×720</option></select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Takes (Default)</label>
            <select style={s.select}><option>Two (2)</option><option>STP</option><option>Inherit</option></select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Production Status</label>
            <select style={s.select}><option>Development WIP</option><option>Development Final</option><option>Production WIP</option></select>
          </div>
        </div>

        {/* Takes Grid */}
        <div style={s.secBar}>Takes — Shot 2: The Figure</div>
        <div style={s.egrid}>
          <div style={s.egridHdr}>
            <span style={s.egridTitle}>Takes</span>
            <span style={{ ...s.badgeChar }}>2 takes</span>
          </div>
          {/* Header row */}
          <div style={{ ...s.egridRow, background: 'var(--off-white)' }}>
            {['✓','Take #','AI Model','Status','Created','Actions'].map(h => (
              <div key={h} style={s.egridHeaderCell}>{h}</div>
            ))}
          </div>
          {/* Take 1 */}
          <div style={s.egridRow}>
            <div style={s.egridCell}><input type="radio" name="take" defaultChecked style={{ accentColor: 'var(--gold)' }} /></div>
            <div style={{ ...s.egridCell, color: 'var(--gold)' }}>Take 1</div>
            <div style={s.egridCell}>Veo 3.1</div>
            <div style={s.egridCell}><span style={{ background: '#C9924A', color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: '.65rem' }}>Approved</span></div>
            <div style={{ ...s.egridCell, color: 'var(--char)', fontSize: '.75rem' }}>Feb 22</div>
            <div style={{ ...s.egridCell, display: 'flex', gap: 6 }}>
              <button style={s.iconBtn}>▶</button>
              <button style={s.iconBtn}>✏</button>
              <button style={s.iconBtnDanger}>⊗</button>
            </div>
          </div>
          {/* Take 2 editing */}
          <div style={{ ...s.egridRow, background: 'rgba(201,146,74,.05)', borderLeft: '2px solid var(--gold)' }}>
            <div style={s.egridCell}><input type="radio" name="take" style={{ accentColor: 'var(--gold)' }} /></div>
            <div style={s.egridCell}>Take 2</div>
            <div style={s.egridCell}><select style={{ ...s.select, fontSize: '.78rem', padding: '5px 8px' }}><option>Veo 3.1</option><option>ImageFX</option></select></div>
            <div style={s.egridCell}><span style={{ background: 'var(--cream-mid)', color: 'var(--char)', padding: '3px 8px', borderRadius: 4, fontSize: '.65rem', animation: 'pulse 2s infinite' }}>Processing</span></div>
            <div style={{ ...s.egridCell, color: 'var(--char)', fontSize: '.75rem' }}>Feb 24</div>
            <div style={{ ...s.egridCell, display: 'flex', gap: 6 }}>
              <button style={s.iconBtn}>💾</button>
              <button style={s.iconBtnDanger}>✕</button>
            </div>
          </div>
          <button style={s.addRowBtn}>+ Add Take</button>
        </div>

        {/* Prompt Editor */}
        <div style={{ ...s.secBar, marginTop: 20 }}>Prompt Editor</div>
        <div style={s.grid2}>
          <div style={s.formGroup}>
            <label style={s.label}>Lighting Type</label>
            <select style={s.select}><option>Ambient Lighting</option><option>Low Key Lighting</option><option>Hard Lighting</option><option>Back Lighting</option></select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>AI Model</label>
            <select style={s.select}><option>Veo 3.1</option><option>ImageFX</option></select>
          </div>
          <div style={{ ...s.formGroup, gridColumn: 'span 2' }}>
            <label style={s.label}>Characters in Shot</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 8, background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7 }}>
              <span style={{ background: '#C9924A', color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: '.65rem' }}>Kira Voss ✕</span>
              <span style={{ background: 'var(--cream-mid)', color: 'var(--char)', padding: '3px 8px', borderRadius: 4, fontSize: '.65rem', cursor: 'pointer', border: '1px solid var(--border)' }}>+ Add Character</span>
            </div>
          </div>
          <div style={{ ...s.formGroup, gridColumn: 'span 2' }}>
            <label style={s.label}>Prompt Preview</label>
            <textarea style={s.textarea} defaultValue="A young woman (Kira Voss) with pale ivory skin, athletic build, wearing worn traveler's clothing, stands at the entrance of a vast underground tunnel. Ambient lighting with deep shadows. Low key. Portrait 16:9, 1080p HD. Cinematic. Veo 3.1." />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button style={s.btnGhostSm}>Regenerate Prompt</button>
          <button style={s.btnPrimarySm}>Save Prompt</button>
          <button style={s.btnPrimarySm}>→ Send to Production</button>
        </div>
      </div>
    </div>
  )
}

const s = {
  treePanel: { width: 260, background: 'var(--off-white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  treeHeader: { padding: '14px 14px 10px', borderBottom: '1px solid var(--border)', fontSize: '.67rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char)', background: 'var(--white)' },
  treeTitleSel: { padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--white)' },
  treeSearch: { padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--white)' },
  searchInput: { width: '100%', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--ink)', fontSize: '.78rem', outline: 'none', fontFamily: 'var(--font-body)' },
  treeBody: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  treeNode: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', cursor: 'pointer', fontSize: '.8rem', transition: 'background 120ms' },
  addChildBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px 6px 20px', fontSize: '.72rem', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', opacity: 0.7 },
  detailPanel: { flex: 1, padding: '24px 28px', overflowY: 'auto', background: 'var(--cream)' },
  breadcrumb: { fontSize: '.73rem', color: 'var(--char)', marginBottom: 16 },
  detailTitle: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--ink)', fontWeight: 300, marginBottom: 2 },
  detailType: { fontSize: '.67rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char)', marginBottom: 20 },
  secBar: { background: 'var(--off-white)', border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)', borderRadius: 6, padding: '8px 14px', margin: '20px 0 12px', fontSize: '.67rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: '.65rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char)', marginBottom: 6 },
  input: { width: '100%', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', color: 'var(--ink)', fontSize: '.85rem', fontWeight: 300, outline: 'none', fontFamily: 'var(--font-body)' },
  select: { width: '100%', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', color: 'var(--ink)', fontSize: '.85rem', fontWeight: 300, outline: 'none', fontFamily: 'var(--font-body)', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239A9188' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 },
  textarea: { width: '100%', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', color: 'var(--char)', fontSize: '.78rem', fontWeight: 300, outline: 'none', fontFamily: 'var(--font-body)', resize: 'vertical', minHeight: 100 },
  egrid: { border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginTop: 8, background: 'var(--white)' },
  egridHdr: { display: 'flex', alignItems: 'center', padding: '9px 14px', background: 'var(--off-white)', borderBottom: '1px solid var(--border)', justifyContent: 'space-between' },
  egridTitle: { fontSize: '.67rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char)' },
  egridRow: { display: 'grid', gridTemplateColumns: '40px 80px 1fr 120px 100px 90px', alignItems: 'center', borderBottom: '1px solid var(--border)', fontSize: '.8rem', background: 'var(--white)' },
  egridHeaderCell: { padding: '10px 14px', color: 'var(--char)', fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em' },
  egridCell: { padding: '10px 14px', color: 'var(--ink)' },
  badgeChar: { background: 'var(--cream-mid)', color: 'var(--char)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 4, fontSize: '.65rem' },
  iconBtn: { background: 'none', border: 'none', color: 'var(--char)', cursor: 'pointer', padding: 4, borderRadius: 4, fontSize: '.85rem' },
  iconBtnDanger: { background: 'none', border: 'none', color: 'var(--char)', cursor: 'pointer', padding: 4, borderRadius: 4, fontSize: '.85rem' },
  addRowBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', fontSize: '.78rem', color: 'var(--gold)', background: 'var(--off-white)', border: 'none', cursor: 'pointer', width: '100%', borderTop: '1px solid var(--border)' },
  btnGhostSm: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--char)', borderRadius: 7, fontSize: '.73rem', fontFamily: 'var(--font-body)', cursor: 'pointer' },
  btnPrimarySm: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: 'var(--gold)', color: 'var(--white)', border: 'none', borderRadius: 7, fontSize: '.73rem', fontFamily: 'var(--font-body)', cursor: 'pointer' },
}

FILEEOF
echo '  ✓ src/pages/Development.jsx'

cat > src/pages/Assets.jsx << 'FILEEOF'
import { useState } from 'react'

const ASSET_TYPES = ['Person', 'Animal', 'Animate Object', 'Set', 'Prop', 'Other']

function CollapsibleSection({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={cs.section}>
      <div style={{ ...cs.hdr, ...(open ? { borderBottom: '1px solid var(--border)' } : {}) }} onClick={() => setOpen(!open)}>
        <span>{title} {subtitle && <span style={{ fontSize: '.65rem', color: 'var(--char)' }}>{subtitle}</span>}</span>
        <svg style={{ transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none', color: 'var(--char)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
      </div>
      {open && <div style={cs.body}>{children}</div>}
    </div>
  )
}

function SkillDots({ label, level = 3 }) {
  return (
    <div style={cs.formGroup}>
      <label style={cs.label}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
        {[1,2,3,4,5].map(n => (
          <div key={n} style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${n <= level ? 'var(--gold)' : 'var(--border)'}`, background: n <= level ? 'var(--gold)' : 'var(--cream)', color: n <= level ? '#fff' : 'var(--char)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', cursor: 'pointer' }}>{n}</div>
        ))}
        <span style={{ fontSize: '.73rem', color: 'var(--char)', marginLeft: 4 }}>{level <= 2 ? 'Low' : level <= 3 ? 'Medium' : 'High'}</span>
      </div>
    </div>
  )
}

export default function Assets() {
  const [activeType, setActiveType] = useState('Person')

  return (
    <div>
      <div style={cs.pageHead}>
        <div>
          <h1 style={cs.h1}>Asset Creator</h1>
          <p style={cs.sub}>New Character — Kira Voss</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={cs.btnGhostSm}>← Back to Library</button>
          <button style={cs.btnPrimarySm}>Save Asset</button>
        </div>
      </div>

      <div style={cs.tabs}>
        {ASSET_TYPES.map(t => (
          <button key={t} onClick={() => setActiveType(t)} style={{ ...cs.tab, ...(t === activeType ? cs.tabActive : {}) }}>{t}</button>
        ))}
      </div>

      <div style={cs.layout}>
        <div style={{ flex: 1 }}>
          <CollapsibleSection title="A — Identity" defaultOpen={true}>
            <div style={cs.grid3}>
              <div style={cs.formGroup}><label style={cs.label}>Name <span style={{ color: 'var(--gold)' }}>*</span></label><input style={cs.input} defaultValue="Kira Voss" /></div>
              <div style={cs.formGroup}><label style={cs.label}>Instance</label><input style={cs.input} defaultValue="Young Adult" placeholder="e.g. Young, Elderly…" /></div>
              <div style={cs.formGroup}><label style={cs.label}>Character Importance</label><select style={cs.select}><option>Main</option><option>Supporting</option><option>Background</option><option>Voice-only</option></select></div>
              <div style={{ ...cs.formGroup, gridColumn: 'span 2' }}>
                <label style={cs.label}>Description</label>
                <textarea style={cs.textarea} defaultValue="A determined young archaeologist drawn into the ancient tunnels by a mysterious map. Fiercely independent, quietly brilliant." />
              </div>
              <div style={cs.formGroup}>
                <label style={cs.label}>Speaking Role</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--gold)', width: 16, height: 16 }} />
                  <label style={{ fontSize: '.83rem', color: 'var(--ink)', cursor: 'pointer' }}>Yes</label>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="B — Physical Attributes" subtitle="(Person)" defaultOpen={true}>
            <div style={cs.grid3}>
              <div style={cs.formGroup}><label style={cs.label}>Sex</label><select style={cs.select}><option>Female</option><option>Male</option><option>Other</option></select></div>
              <div style={cs.formGroup}><label style={cs.label}>Height</label><input style={cs.input} defaultValue="5ft 7in" /></div>
              <div style={cs.formGroup}><label style={cs.label}>Weight</label><input style={cs.input} defaultValue="130" /></div>
              <div style={cs.formGroup}><label style={cs.label}>Body Shape</label><select style={cs.select}><option>Athletic</option><option>Lean</option><option>Hourglass</option></select></div>
              <div style={cs.formGroup}><label style={cs.label}>Skin Tone</label><select style={cs.select}><option>Ivory</option><option>Fair/Pale</option><option>Beige</option><option>Olive</option></select></div>
              <div style={cs.formGroup}><label style={cs.label}>Eye Color</label><input style={cs.input} defaultValue="Amber" /></div>
              <div style={cs.formGroup}><label style={cs.label}>Hair Color</label><input style={cs.input} defaultValue="Dark Brown" /></div>
              <div style={cs.formGroup}><label style={cs.label}>Hair Length</label><input style={cs.input} defaultValue="Shoulder Length" /></div>
              <div style={cs.formGroup}><label style={cs.label}>Ethnicity</label><input style={cs.input} defaultValue="Mixed European" /></div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="C — Personality" subtitle="(Person)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <SkillDots label="Intelligence" level={4} />
              <SkillDots label="Charisma" level={3} />
              <SkillDots label="Wisdom" level={3} />
              <SkillDots label="Humor" level={2} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="F — File Uploads">
            <div style={cs.grid3}>
              {['Reference Image', 'Style Image', 'Set / Background'].map(label => (
                <div key={label} style={cs.formGroup}>
                  <label style={cs.label}>{label}</label>
                  <div style={cs.fileDrop}>Drop image here<br/><span style={{ fontSize: '.67rem', color: 'var(--char)' }}>JPG/PNG/GIF · max 2MB</span></div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="H — AI Prompt" defaultOpen={true}>
            <button style={{ ...cs.btnGhostSm, marginBottom: 10 }}>⚡ Auto-Generate Prompt</button>
            <textarea style={{ ...cs.textarea, minHeight: 90 }} defaultValue="Young adult woman, athletic build, ivory skin, dark brown shoulder-length hair, amber eyes, 5ft 7in, 130lbs. Determined expression. Worn traveler's clothing. High intelligence. Cinematic character portrait." />
          </CollapsibleSection>
        </div>

        {/* Image Generation Panel */}
        <div style={cs.genPanel}>
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={cs.secBar}>Image Generation</div>
            <div style={cs.formGroup}>
              <label style={cs.label}>AI Model</label>
              <select style={cs.select}><option>ImageFX</option><option>Veo 3.1</option></select>
            </div>
            <button style={{ ...cs.btnPrimarySm, width: '100%', justifyContent: 'center', padding: '8px 18px', marginBottom: 14 }}>⚡ Generate Image</button>
            <div style={cs.genGrid}>
              {['🧑‍🦱', '👩', '👩‍🦰'].map((e, i) => (
                <div key={i} style={{ ...cs.genThumb, ...(i === 0 ? { borderColor: 'var(--gold)', borderWidth: 3 } : {}) }}>{e}</div>
              ))}
              <div style={{ ...cs.genThumb, opacity: 0.4, fontSize: '1rem', color: 'var(--char)' }}>+</div>
            </div>
            <button style={{ ...cs.btnGhostSm, width: '100%', justifyContent: 'center', marginTop: 10 }}>Accept Selected</button>
            <div style={{ marginTop: 16, fontSize: '.67rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--char)', marginBottom: 6 }}>Generation History</div>
            <div style={{ fontSize: '.73rem', color: 'var(--char)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>Run 1 · Feb 24, 2026 · ImageFX</div>
            <div style={{ fontSize: '.73rem', color: 'var(--char)', padding: '6px 0' }}>Run 2 · Feb 23, 2026 · ImageFX</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const cs = {
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  h1: { fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', fontWeight: 400 },
  sub: { fontSize: '.83rem', color: 'var(--char)', marginTop: 4 },
  tabs: { display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' },
  tab: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 14px', fontSize: '.73rem', color: 'var(--char)', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  tabActive: { background: 'var(--gold)', borderColor: 'var(--gold)', color: '#fff', fontWeight: 400 },
  layout: { display: 'flex', gap: 20 },
  section: { border: '1px solid var(--border)', borderRadius: 10, marginBottom: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(26,24,16,.04)' },
  hdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'var(--white)', cursor: 'pointer', fontSize: '.78rem', fontWeight: 400, color: 'var(--char)' },
  body: { padding: 16, background: 'var(--off-white)' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: '.65rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char)', marginBottom: 6 },
  input: { width: '100%', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', color: 'var(--ink)', fontSize: '.85rem', fontWeight: 300, outline: 'none', fontFamily: 'var(--font-body)' },
  select: { width: '100%', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', color: 'var(--ink)', fontSize: '.85rem', fontWeight: 300, outline: 'none', fontFamily: 'var(--font-body)', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239A9188' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 },
  textarea: { width: '100%', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', color: 'var(--char)', fontSize: '.78rem', fontWeight: 300, outline: 'none', fontFamily: 'var(--font-body)', resize: 'vertical', minHeight: 80 },
  fileDrop: { border: '1.5px dashed rgba(201,146,74,.3)', borderRadius: 8, padding: 20, textAlign: 'center', cursor: 'pointer', fontSize: '.78rem', color: 'var(--char)', background: 'var(--cream)' },
  secBar: { background: 'var(--off-white)', border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)', borderRadius: 6, padding: '8px 14px', margin: '0 0 12px', fontSize: '.67rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char)' },
  genPanel: { width: 300, flexShrink: 0 },
  genGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 },
  genThumb: { aspectRatio: '1', borderRadius: 8, background: 'var(--cream-mid)', border: '2px solid var(--border)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', color: 'var(--char)' },
  btnGhostSm: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--char)', borderRadius: 7, fontSize: '.73rem', fontFamily: 'var(--font-body)', cursor: 'pointer' },
  btnPrimarySm: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: 'var(--gold)', color: 'var(--white)', border: 'none', borderRadius: 7, fontSize: '.73rem', fontFamily: 'var(--font-body)', cursor: 'pointer' },
}

FILEEOF
echo '  ✓ src/pages/Assets.jsx'

cat > src/pages/Admin.jsx << 'FILEEOF'
import { useState } from 'react'

const NV_GROUPS = [
  { name: 'AssetType', count: 6 },
  { name: 'ActiveStatus', count: 3 },
  { name: 'AIModels', count: 2 },
  { name: 'AspectRatio', count: 5 },
  { name: 'BodyShape', count: 13 },
  { name: 'Category', count: 41 },
  { name: 'CharacterImportance', count: 5 },
  { name: 'Currency', count: '170+' },
  { name: 'Lighting', count: 14 },
  { name: 'Language', count: 184 },
  { name: 'ProductionGroup', count: 7 },
  { name: 'ProductionStatus', count: 14 },
  { name: 'Sex', count: 5 },
  { name: 'SkillEvaluation', count: 5 },
  { name: 'SkinColor', count: 8 },
  { name: 'Takes', count: 8 },
  { name: 'TimeZone', count: '140+' },
  { name: 'VideoResolution', count: 8 },
]

const ASSET_TYPE_VALUES = [
  { id: 10000001, name: 'Person', value: 'PERSON', active: true, hidden: false },
  { id: 10000002, name: 'Animal', value: 'ANIMAL', active: true, hidden: false },
  { id: 10000003, name: 'Animate Object', value: 'ANIMATEOBJECT', active: true, hidden: false, editing: true },
  { id: 10000004, name: 'Set', value: 'SET', active: true, hidden: false },
  { id: 10000005, name: 'Prop', value: 'PROP', active: true, hidden: false },
  { id: 10000006, name: 'Other', value: 'OTHER', active: true, hidden: false },
]

const ADMIN_NAV = [
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Users & Roles' },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: 'Entitlements' },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h16M4 12h16M4 18h7"/></svg>, label: 'NVPair Editor', active: true },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, label: 'Contacts' },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, label: 'Companies' },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, label: 'Settings' },
]

export default function Admin() {
  const [activeGroup, setActiveGroup] = useState('AssetType')

  return (
    <div>
      <div style={a.pageHead}>
        <div>
          <h1 style={a.h1}>NVPair Editor</h1>
          <p style={a.sub}>Manage all picklist values across the application</p>
        </div>
      </div>

      <div style={a.layout}>
        {/* NVGroup List */}
        <div style={a.groupList}>
          <div style={a.groupListTitle}>Picklist Groups</div>
          {NV_GROUPS.map(g => (
            <div
              key={g.name}
              onClick={() => setActiveGroup(g.name)}
              style={{
                ...a.groupItem,
                ...(g.name === activeGroup ? a.groupItemActive : {}),
              }}
            >
              {g.name}
              <span style={{ float: 'right', fontSize: '.67rem', color: 'var(--char)' }}>{g.count}</span>
            </div>
          ))}
        </div>

        {/* NVPair Editable Grid */}
        <div style={{ flex: 1 }}>
          <div style={a.egrid}>
            <div style={a.egridHdr}>
              <span style={a.egridTitle}>{activeGroup} — {NV_GROUPS.find(g => g.name === activeGroup)?.count} values</span>
              <button style={a.btnGhostSm}>Save All</button>
            </div>
            {/* Header */}
            <div style={{ ...a.egridRow, background: 'var(--off-white)' }}>
              {['NVPairID', 'NVName (Display)', 'NVValue (Stored)', 'Active', 'Hidden', 'Actions'].map(h => (
                <div key={h} style={a.hdrCell}>{h}</div>
              ))}
            </div>
            {/* Rows */}
            {ASSET_TYPE_VALUES.map(row => (
              <div key={row.id} style={{ ...a.egridRow, ...(row.editing ? { background: 'rgba(201,146,74,.05)', borderLeft: '2px solid var(--gold)' } : {}) }}>
                <div style={{ ...a.cell, color: 'var(--char)', fontSize: '.75rem' }}>{row.id}</div>
                <div style={a.cell}>
                  {row.editing ? <input style={a.cellInput} defaultValue={row.name} /> : row.name}
                </div>
                <div style={{ ...a.cell, color: 'var(--char)' }}>
                  {row.editing ? <input style={a.cellInput} defaultValue={row.value} /> : row.value}
                </div>
                <div style={a.cell}><input type="checkbox" defaultChecked={row.active} style={{ accentColor: 'var(--gold)' }} /></div>
                <div style={a.cell}><input type="checkbox" defaultChecked={row.hidden} style={{ accentColor: 'var(--gold)' }} /></div>
                <div style={{ ...a.cell, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  {row.editing ? (
                    <><button style={a.iconBtn}>💾</button><button style={a.iconBtn}>✕</button></>
                  ) : (
                    <><button style={a.iconBtn}>✏</button><button style={a.iconBtn}>⊗</button></>
                  )}
                </div>
              </div>
            ))}
            <button style={a.addBtn}>+ Add NVPair Value</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const a = {
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  h1: { fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', fontWeight: 400 },
  sub: { fontSize: '.83rem', color: 'var(--char)', marginTop: 4 },
  layout: { display: 'flex', gap: 20 },
  groupList: { width: 220, flexShrink: 0 },
  groupListTitle: { fontSize: '.67rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--char)', marginBottom: 8, padding: '0 4px' },
  groupItem: { padding: '9px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '.8rem', color: 'var(--char)', marginBottom: 2, fontWeight: 300 },
  groupItemActive: { background: 'var(--gold-lite)', color: 'var(--gold)', borderLeft: '2px solid var(--gold)', fontWeight: 400 },
  egrid: { border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--white)' },
  egridHdr: { display: 'flex', alignItems: 'center', padding: '9px 14px', background: 'var(--off-white)', borderBottom: '1px solid var(--border)', justifyContent: 'space-between' },
  egridTitle: { fontSize: '.67rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--char)' },
  egridRow: { display: 'grid', gridTemplateColumns: '90px 1fr 1fr 80px 80px 100px', alignItems: 'center', borderBottom: '1px solid var(--border)', fontSize: '.8rem', background: 'var(--white)' },
  hdrCell: { padding: '10px 14px', color: 'var(--char)', fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em' },
  cell: { padding: '11px 14px', color: 'var(--ink)', fontSize: '.8rem' },
  cellInput: { background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 5, padding: '5px 8px', color: 'var(--ink)', fontSize: '.8rem', width: '100%', outline: 'none', fontFamily: 'var(--font-body)' },
  iconBtn: { background: 'none', border: 'none', color: 'var(--char)', cursor: 'pointer', padding: 4, borderRadius: 4, fontSize: '.85rem' },
  addBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', fontSize: '.78rem', color: 'var(--gold)', background: 'var(--off-white)', border: 'none', cursor: 'pointer', width: '100%', borderTop: '1px solid var(--border)' },
  btnGhostSm: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--char)', borderRadius: 7, fontSize: '.73rem', fontFamily: 'var(--font-body)', cursor: 'pointer' },
}

FILEEOF
echo '  ✓ src/pages/Admin.jsx'


echo ""
echo "✅ All 10 files deployed!"
echo "  4 components → src/components/"
echo "  6 pages → src/pages/"
echo ""
echo "Run 'npm run dev' and check localhost:5173"
