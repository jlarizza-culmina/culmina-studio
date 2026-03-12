#!/bin/bash
# Culmina Studio — React Foundation Setup
# Run from project root: bash setup-culmina.sh

set -e

echo "🎬 Setting up Culmina Studio React app..."

# ─── Directory structure ───
mkdir -p src/lib src/components src/pages src/assets

# ─── Supabase client ───
cat > src/lib/supabase.js << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
EOF

# ─── Theme tokens (from prototype) ───
cat > src/theme.css << 'EOF'
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

:root {
  --gold:      #C9924A;
  --gold-lite: rgba(201,146,74,.12);
  --gold-rim:  rgba(201,146,74,.30);
  --ink:       #1A1810;
  --char:      #5C574E;
  --cream:     #F7F2E8;
  --cream-mid: #EDE8DC;
  --cream-dk:  #E2DBCF;
  --white:     #FFFFFF;
  --off-white: #FAFAF7;
  --green:     #3A7D44;
  --red:       #C84B31;
  --border:    rgba(26,24,16,.10);
  --shadow:    0 1px 3px rgba(26,24,16,.06);
  --shadow-lg: 0 4px 12px rgba(26,24,16,.08);
  --font-display: 'Cormorant Garamond', serif;
  --font-body:    'Jost', sans-serif;
  --radius:    10px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-body);
  background: var(--cream);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}

button { cursor: pointer; font-family: var(--font-body); }
input, select, textarea { font-family: var(--font-body); }
EOF

# ─── App Shell (sidebar + layout) ───
cat > src/components/AppShell.jsx << 'JSXEOF'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/dashboard',    icon: '⊞', label: 'Dashboard' },
  { to: '/manuscripts',  icon: '📖', label: 'Manuscripts' },
  { to: '/assets',       icon: '🎨', label: 'Assets' },
  { to: '/development',  icon: '✍️', label: 'Development' },
  { to: '/production',   icon: '🎬', label: 'Production' },
  { to: '/post',         icon: '🎧', label: 'Post Production' },
  { to: '/distribution', icon: '📡', label: 'Distribution' },
  { to: '/finances',     icon: '💰', label: 'Finances' },
  { to: '/admin',        icon: '⚙️', label: 'Admin' },
]

export default function AppShell() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandA}>A</span>
          <span style={styles.brandI}>I</span>
          <span style={styles.brandText}>Culmina</span>
        </div>

        <nav style={styles.nav}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              style={({ isActive }) => ({
                ...styles.navItem,
                background: isActive ? 'var(--gold-lite)' : 'transparent',
                color: isActive ? 'var(--gold)' : 'var(--char)',
                fontWeight: isActive ? 500 : 300,
              })}
            >
              <span style={{ fontSize: '1rem', width: 24, textAlign: 'center' }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleSignOut} style={styles.signOut}>Sign Out</button>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: 230,
    background: 'var(--white)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 2,
    padding: '0 20px 24px',
    borderBottom: '1px solid var(--border)',
    marginBottom: 16,
  },
  brandA: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 500,
    color: 'var(--gold)',
  },
  brandI: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 400,
    color: 'var(--char)',
  },
  brandText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 400,
    color: 'var(--char)',
    marginLeft: 6,
    letterSpacing: '0.03em',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 10px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: '0.82rem',
    transition: 'all .15s',
  },
  signOut: {
    margin: '16px 20px 0',
    padding: '8px 0',
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--char)',
    fontSize: '0.78rem',
    fontWeight: 300,
  },
  main: {
    flex: 1,
    padding: 32,
    overflowY: 'auto',
    background: 'var(--cream)',
  },
}
JSXEOF

# ─── Login Page ───
cat > src/pages/Login.jsx << 'JSXEOF'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 500, color: 'var(--gold)' }}>A</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, color: 'var(--char)' }}>I</span>
        </div>
        <h1 style={styles.title}>Culmina AI Drama Studio</h1>
        <p style={styles.sub}>Sign in to your account</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <label style={{ ...styles.label, marginTop: 14 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--cream)',
  },
  card: {
    width: 380,
    background: 'var(--white)',
    borderRadius: 'var(--radius)',
    padding: '40px 36px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)',
    textAlign: 'center',
  },
  brand: { marginBottom: 8 },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    fontWeight: 400,
    color: 'var(--ink)',
  },
  sub: {
    fontSize: '0.82rem',
    color: 'var(--char)',
    marginTop: 4,
    marginBottom: 28,
  },
  form: { textAlign: 'left' },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 400,
    color: 'var(--char)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: '0.88rem',
    background: 'var(--cream-mid)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  error: {
    color: 'var(--red)',
    fontSize: '0.8rem',
    marginTop: 10,
  },
  btn: {
    width: '100%',
    marginTop: 22,
    padding: '11px',
    background: 'var(--gold)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.88rem',
    fontWeight: 400,
    fontFamily: 'var(--font-body)',
  },
}
JSXEOF

# ─── Dashboard ───
cat > src/pages/Dashboard.jsx << 'JSXEOF'
import { useNavigate } from 'react-router-dom'

const MODULES = [
  { icon: '📖', name: 'Manuscript Import', desc: 'Upload and AI-process source manuscripts to seed your production hierarchy.', to: '/manuscripts' },
  { icon: '🎨', name: 'Asset Creator', desc: 'Database of characters, sets, props and animated objects — AI image generation included.', to: '/assets' },
  { icon: '✍️', name: 'Development', desc: 'Build the Title→Arc→Act→Episode→Shot hierarchy and craft your AI prompts.', to: '/development' },
  { icon: '🎬', name: 'Production Studio', desc: 'Generate video takes with Veo 3.1, approve shots, and assemble episodes.', to: '/production' },
  { icon: '🎧', name: 'Post Production', desc: 'Add voice tracks, closed captions, and export finalized episodes to Cloudflare R2.', to: '/post' },
  { icon: '📡', name: 'Distribution', desc: 'Release episodes to ReelShort, TikTok, YouTube. Track views and revenue.', to: '/distribution' },
  { icon: '💰', name: 'Finances', desc: 'Budget, expenses, revenue tracking, royalty management and payee payments.', to: '/finances' },
  { icon: '⚙️', name: 'Admin', desc: 'User management, roles, entitlements, picklist editor, system settings.', to: '/admin' },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div>
      <div style={styles.head}>
        <div>
          <h1 style={styles.h1}>Dashboard</h1>
          <p style={styles.sub}>Welcome back to Culmina AI Drama Studio</p>
        </div>
      </div>

      <div style={styles.grid}>
        {MODULES.map(m => (
          <div key={m.name} onClick={() => navigate(m.to)} style={styles.tile}>
            <div style={styles.tileIcon}>{m.icon}</div>
            <div style={styles.tileName}>{m.name}</div>
            <div style={styles.tileDesc}>{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  h1: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 400,
    color: 'var(--ink)',
    lineHeight: 1.1,
  },
  sub: {
    fontSize: '0.83rem',
    color: 'var(--char)',
    marginTop: 4,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  tile: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '22px 20px',
    cursor: 'pointer',
    transition: 'box-shadow .15s, border-color .15s',
    boxShadow: 'var(--shadow)',
  },
  tileIcon: { fontSize: '1.6rem', marginBottom: 10 },
  tileName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 500,
    color: 'var(--ink)',
    marginBottom: 6,
  },
  tileDesc: {
    fontSize: '0.78rem',
    color: 'var(--char)',
    lineHeight: 1.45,
    fontWeight: 300,
  },
}
JSXEOF

# ─── Placeholder pages ───
for page in Development Assets Production Post Distribution Finances Admin; do
  route=$(echo "$page" | tr '[:upper:]' '[:lower:]')
  cat > "src/pages/${page}.jsx" << JSXEOF
export default function ${page}() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.1 }}>${page}</h1>
          <p style={{ fontSize: '0.83rem', color: 'var(--char)', marginTop: 4 }}>Module under construction</p>
        </div>
      </div>
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: 'var(--shadow)',
      }}>
        <p style={{ fontSize: '2.4rem', marginBottom: 12 }}>🚧</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--ink)' }}>Coming Soon</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--char)', marginTop: 6 }}>This module is being built out — check back soon.</p>
      </div>
    </div>
  )
}
JSXEOF
done

# Rename Post.jsx route-friendly
# (already created as Post.jsx, maps to /post)

# ─── Marketing Home ───
cat > src/pages/Home.jsx << 'JSXEOF'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={styles.wrapper}>
      <nav style={styles.topNav}>
        <div style={styles.navBrand}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 500, color: 'var(--gold)' }}>A</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--char)' }}>I</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--char)', marginLeft: 6 }}>Culmina</span>
        </div>
        <button onClick={() => navigate('/login')} style={styles.signInBtn}>Sign In</button>
      </nav>

      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>AI-Powered<br/>Micro-Drama Studio</h1>
        <p style={styles.heroSub}>
          Transform author manuscripts into binge-worthy 60–90 second episodes
          for ReelShort, TikTok, YouTube Shorts, and beyond.
        </p>
        <button onClick={() => navigate('/login')} style={styles.ctaBtn}>Get Started</button>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: 'var(--cream)',
  },
  topNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--white)',
  },
  navBrand: { display: 'flex', alignItems: 'baseline', gap: 2 },
  signInBtn: {
    padding: '7px 20px',
    background: 'var(--gold)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.82rem',
  },
  hero: {
    maxWidth: 640,
    margin: '120px auto',
    textAlign: 'center',
    padding: '0 24px',
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '3rem',
    fontWeight: 400,
    color: 'var(--ink)',
    lineHeight: 1.15,
  },
  heroSub: {
    fontSize: '1rem',
    color: 'var(--char)',
    marginTop: 16,
    lineHeight: 1.6,
    fontWeight: 300,
  },
  ctaBtn: {
    marginTop: 32,
    padding: '13px 36px',
    background: 'var(--gold)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.95rem',
    fontWeight: 400,
  },
}
JSXEOF

# ─── App.jsx (router) ───
cat > src/App.jsx << 'JSXEOF'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Manuscript from './pages/Manuscript'
import Assets from './pages/Assets'
import Development from './pages/Development'
import Production from './pages/Production'
import Post from './pages/Post'
import Distribution from './pages/Distribution'
import Finances from './pages/Finances'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Authenticated shell */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/manuscripts" element={<Manuscript />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/development" element={<Development />} />
        <Route path="/production" element={<Production />} />
        <Route path="/post" element={<Post />} />
        <Route path="/distribution" element={<Distribution />} />
        <Route path="/finances" element={<Finances />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
JSXEOF

# ─── main.jsx ───
cat > src/main.jsx << 'JSXEOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './theme.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
JSXEOF

# ─── Remove old boilerplate CSS ───
rm -f src/App.css src/index.css

# ─── .env template ───
if [ ! -f .env ]; then
  cat > .env << 'EOF'
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
EOF
  echo "📝 Created .env — fill in your Supabase credentials"
fi

echo ""
echo "✅ Foundation complete!"
echo ""
echo "Files created:"
echo "  src/lib/supabase.js      — Supabase client"
echo "  src/theme.css            — Design tokens"
echo "  src/components/AppShell.jsx — Sidebar + layout"
echo "  src/pages/Home.jsx       — Marketing landing"
echo "  src/pages/Login.jsx      — Auth page"
echo "  src/pages/Dashboard.jsx  — Module hub"
echo "  src/pages/Development.jsx"
echo "  src/pages/Assets.jsx"
echo "  src/pages/Production.jsx"
echo "  src/pages/Post.jsx"
echo "  src/pages/Distribution.jsx"
echo "  src/pages/Finances.jsx"
echo "  src/pages/Admin.jsx"
echo "  src/App.jsx              — Router"
echo "  src/main.jsx             — Entry point"
echo "  .env                     — Supabase config (fill in)"
echo ""
echo "Next: fill in .env, then run 'npm run dev'"
