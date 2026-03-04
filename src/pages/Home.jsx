import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const GOLD = '#C9924A'
const INK = '#1A1810'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const NEARBLACK = '#0F0E0B'

const modules = [
  { icon: '📄', name: 'Manuscript Import',   desc: 'Upload and parse any manuscript into structured production-ready scenes.' },
  { icon: '🎨', name: 'Asset Creator',        desc: 'Generate character references, sets, and visual assets with AI.' },
  { icon: '✍️', name: 'Development',          desc: 'Build your Title → Arc → Act → Episode → Shot hierarchy.' },
  { icon: '🎬', name: 'Production Studio',    desc: 'Prompt Google Veo to generate cinematic shots at scale.' },
  { icon: '🎞️', name: 'Post Production',      desc: 'Voice, captions, sound design, and final export.' },
  { icon: '📡', name: 'Distribution',         desc: 'Publish to ReelShort, TikTok, YouTube, Tubi, and Pluto TV.' },
  { icon: '💰', name: 'Finances',             desc: 'Budgets, royalties, and author revenue share in one place.' },
  { icon: '⚙️', name: 'Admin',                desc: 'Users, roles, entitlements, and platform configuration.' },
]

const stats = [
  { value: '70%',  label: 'Author Revenue Share' },
  { value: '60+',  label: 'Episodes Per Series' },
  { value: '5',    label: 'Distribution Platforms' },
  { value: '10x',  label: 'Faster Than Traditional' },
]

export default function Home() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: NEARBLACK, color: CREAM, fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 48px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(15,14,11,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(201,146,74,0.15)' : '1px solid transparent',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: GOLD, letterSpacing: '0.04em' }}>Culmina</span>
          <span style={{ fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.18em', textTransform: 'uppercase' }}>AI Drama Studio</span>
        </div>
        <button onClick={() => navigate('/login')}
          onMouseEnter={e => { e.target.style.background = GOLD; e.target.style.color = INK }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = GOLD }}
          style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, padding: '8px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s ease' }}>
          Sign In
        </button>
      </nav>

      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '120px 48px 80px', textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 60%, rgba(201,146,74,0.07) 0%, transparent 70%)',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease', position: 'relative'
      }}>
        <div style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginBottom: '24px', opacity: 0.8 }}>The Future of Story</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: 300, lineHeight: 1.05, color: CREAM, margin: '0 0 8px' }}>Your Manuscript.</h1>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: 300, lineHeight: 1.05, color: GOLD, margin: '0 0 40px', fontStyle: 'italic' }}>A Global Series.</h1>
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#9A9590', maxWidth: '560px', lineHeight: 1.75, marginBottom: '52px', fontWeight: 300 }}>
          Culmina transforms author manuscripts into AI-produced micro-drama series — distributed across the world's fastest-growing streaming platforms.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
            style={{ background: GOLD, border: 'none', color: INK, padding: '14px 40px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            Enter Studio
          </button>
          <button
            onMouseEnter={e => { e.target.style.borderColor = GOLD; e.target.style.color = CREAM }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(201,146,74,0.3)'; e.target.style.color = '#9A9590' }}
            style={{ background: 'transparent', border: '1px solid rgba(201,146,74,0.3)', color: '#9A9590', padding: '14px 40px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s ease' }}>
            Learn More
          </button>
        </div>
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom, #C9924A, transparent)', margin: '0 auto' }} />
        </div>
      </section>

      <section style={{
        padding: '80px 48px', borderTop: '1px solid rgba(201,146,74,0.12)', borderBottom: '1px solid rgba(201,146,74,0.12)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '48px', textAlign: 'center',
        background: 'rgba(201,146,74,0.03)'
      }}>
        {stats.map(({ value, label }) => (
          <div key={label}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3.5rem', color: GOLD, fontWeight: 300, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '8px' }}>{label}</div>
          </div>
        ))}
      </section>

      <section style={{ padding: '120px 48px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginBottom: '16px' }}>The Platform</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: CREAM, margin: 0 }}>
            From Page to Screen,<br /><em style={{ color: GOLD }}>End to End</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2px' }}>
          {modules.map(({ icon, name, desc }) => (
            <div key={name}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,146,74,0.06)'; e.currentTarget.style.borderColor = 'rgba(201,146,74,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,24,16,0.6)'; e.currentTarget.style.borderColor = 'rgba(201,146,74,0.08)' }}
              style={{ padding: '36px 28px', background: 'rgba(26,24,16,0.6)', border: '1px solid rgba(201,146,74,0.08)', transition: 'all 0.25s ease', cursor: 'default' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '16px' }}>{icon}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: CREAM, marginBottom: '10px' }}>{name}</div>
              <div style={{ fontSize: '0.8rem', color: CHARCOAL, lineHeight: 1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '120px 48px', background: 'rgba(201,146,74,0.04)', borderTop: '1px solid rgba(201,146,74,0.12)', borderBottom: '1px solid rgba(201,146,74,0.12)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginBottom: '16px' }}>For Authors</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 300, color: CREAM, marginBottom: '32px' }}>
            Your Story Deserves<br /><em style={{ color: GOLD }}>a Bigger Stage</em>
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#9A9590', lineHeight: 1.85, marginBottom: '48px', fontWeight: 300 }}>
            Submit your manuscript and we handle everything — script adaptation, AI production, platform distribution, and royalty payments. You keep creative credit and earn 70% of revenue.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', textAlign: 'left' }}>
            {[
              { step: '01', title: 'Submit', desc: 'Upload your manuscript and licensing terms.' },
              { step: '02', title: 'Produce', desc: 'We adapt and produce your series using AI.' },
              { step: '03', title: 'Earn', desc: '70% revenue share paid monthly.' },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', color: 'rgba(201,146,74,0.3)', lineHeight: 1 }}>{step}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: CREAM, margin: '8px 0' }}>{title}</div>
                <div style={{ fontSize: '0.82rem', color: CHARCOAL, lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '140px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 300, color: CREAM, marginBottom: '24px' }}>
          Ready to Begin<br /><em style={{ color: GOLD }}>Production?</em>
        </h2>
        <p style={{ color: CHARCOAL, marginBottom: '48px', fontSize: '1rem' }}>Sign in to access the Culmina AI Drama Studio.</p>
        <button onClick={() => navigate('/login')}
          onMouseEnter={e => e.target.style.opacity = '0.85'}
          onMouseLeave={e => e.target.style.opacity = '1'}
          style={{ background: GOLD, border: 'none', color: INK, padding: '16px 56px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
          Enter Studio
        </button>
      </section>

      <footer style={{ borderTop: '1px solid rgba(201,146,74,0.12)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', color: GOLD, fontSize: '1.1rem' }}>Culmina</span>
        <div style={{ display: 'flex', gap: '32px' }}>
          <a href="/lighting" style={{ color: CHARCOAL, textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '0.08em' }}>Lighting Guide</a>
          <a href="/7stages" style={{ color: CHARCOAL, textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '0.08em' }}>7 Stages</a>
        </div>
        <span style={{ color: CHARCOAL, fontSize: '0.72rem' }}>2026 Culmina AI Drama Studio</span>
      </footer>

      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${NEARBLACK}; } ::-webkit-scrollbar-thumb { background: ${CHARCOAL}; }`}</style>
    </div>
  )
}
