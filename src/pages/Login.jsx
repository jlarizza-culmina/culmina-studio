import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GOLD = '#C9924A'
const INK = '#1A1810'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const NEARBLACK = '#0F0E0B'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', background: NEARBLACK, fontFamily: 'DM Sans, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* LEFT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px',
        background: 'linear-gradient(135deg, rgba(201,146,74,0.07) 0%, transparent 60%)',
        borderRight: '1px solid rgba(201,146,74,0.12)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-15%', width: '500px', height: '500px', borderRadius: '50%', border: '1px solid rgba(201,146,74,0.06)' }} />
        <div style={{ position: 'absolute', top: '-5%', right: '-5%', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(201,146,74,0.09)' }} />

        <Link to="/" style={{ textDecoration: 'none', marginBottom: '64px', display: 'inline-block' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: GOLD }}>Culmina</div>
          <div style={{ fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '2px' }}>AI Drama Studio</div>
        </Link>

        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 3vw, 3.2rem)', fontWeight: 300, color: CREAM, lineHeight: 1.2, marginBottom: '24px' }}>
          Where Stories<br /><em style={{ color: GOLD }}>Become Series</em>
        </h2>
        <p style={{ color: CHARCOAL, fontSize: '0.9rem', lineHeight: 1.8, maxWidth: '400px', fontWeight: 300 }}>
          The full-stack AI production platform for turning author manuscripts into micro-drama series — distributed globally.
        </p>

        <div style={{ marginTop: '64px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[{ n: '9', label: 'Production Modules' }, { n: '5', label: 'Distribution Platforms' }, { n: '70%', label: 'Author Revenue Share' }].map(({ n, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: GOLD, minWidth: '52px' }}>{n}</div>
              <div style={{ fontSize: '0.78rem', color: CHARCOAL, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ width: '480px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 48px', background: '#111009', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, marginBottom: '8px' }}>Sign In</h1>
        <p style={{ color: CHARCOAL, fontSize: '0.82rem', marginBottom: '40px' }}>Enter your credentials to access the studio</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
              placeholder="you@example.com" required
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${focused === 'email' ? GOLD : 'rgba(201,146,74,0.2)'}`, color: CREAM, padding: '13px 16px', fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', transition: 'border-color 0.2s' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
              placeholder="••••••••" required
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${focused === 'password' ? GOLD : 'rgba(201,146,74,0.2)'}`, color: CREAM, padding: '13px 16px', fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', transition: 'border-color 0.2s' }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(220,50,50,0.08)', border: '1px solid rgba(220,50,50,0.25)', color: '#E07070', padding: '12px 16px', fontSize: '0.82rem' }}>{error}</div>
          )}

          <button type="submit" disabled={loading}
            onMouseEnter={e => { if (!loading) e.target.style.opacity = '0.85' }}
            onMouseLeave={e => e.target.style.opacity = '1'}
            style={{ background: loading ? 'rgba(201,146,74,0.5)' : GOLD, border: 'none', color: INK, padding: '14px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, marginTop: '8px' }}>
            {loading ? 'Signing In...' : 'Enter Studio'}
          </button>
        </form>

        <div style={{ marginTop: '40px', paddingTop: '28px', borderTop: '1px solid rgba(201,146,74,0.1)' }}>
          <Link to="/" style={{ color: CHARCOAL, textDecoration: 'none', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>←</span> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
