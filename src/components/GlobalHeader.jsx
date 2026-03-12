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

