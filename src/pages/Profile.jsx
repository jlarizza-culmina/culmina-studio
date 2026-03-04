import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'

const BADGES = ['p.g.a.', 'DGA', 'SAG-AFTRA', 'WGA']

const MOCK_SESSIONS = [
  { id: 1, ip: '192.168.1.1',   device: 'Chrome / Windows 11',  lastActive: 'Now',    current: true },
  { id: 2, ip: '74.125.44.21',  device: 'Safari / iPhone 15',   lastActive: '2h ago', current: false },
  { id: 3, ip: '98.12.55.100',  device: 'Chrome / macOS 14',    lastActive: '3d ago', current: false },
]

const MOCK_PRODUCTIONS = [
  { id: 1, title: 'The Tunnels of Rasand', role: 'SysAdmin', status: 'Active', startDate: '2026-01-01' },
]

function PersonalInfoTab({ endUser }) {
  const [form, setForm] = useState({
    firstname: '', middlename: '', lastname: '', nickname: '',
    prefix: '', suffix: '',
    primemailaddress: '', secondaryemail: '',
    mobilephone: '', secondaryphone: '',
    address1: '', city: '', stateprovince: '', postalcode: '', country: '',
    imdburl: '', linkedinurl: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (endUser?.contacts) {
      const c = endUser.contacts
      setForm({
        firstname: c.firstname || '', middlename: c.middlename || '',
        lastname: c.lastname || '', nickname: c.nickname || '',
        prefix: c.prefix || '', suffix: c.suffix || '',
        primemailaddress: c.primemailaddress || '', secondaryemail: c.secondaryemail || '',
        mobilephone: c.mobilephone || '', secondaryphone: c.secondaryphone || '',
        address1: c.address1 || '', city: c.city || '',
        stateprovince: c.stateprovince || '', postalcode: c.postalcode || '',
        country: c.country || '', imdburl: c.imdburl || '', linkedinurl: c.linkedinurl || '',
      })
    }
  }, [endUser])

  async function handleSave() {
    setSaving(true)
    if (endUser?.contacts?.contactid) {
      await supabase.from('contacts').update({ ...form, updatedate: new Date().toISOString() }).eq('contactid', endUser.contacts.contactid)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const lbl = { display: 'block', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }
  const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.83rem', outline: 'none' }

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}` }}>{title}</div>
      {children}
    </div>
  )

  return (
    <div style={{ maxWidth: '720px' }}>
      <Section title="Name">
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 1fr 80px', gap: '12px', marginBottom: '12px' }}>
          {[['Prefix','prefix'],['First Name','firstname'],['Middle','middlename'],['Last Name','lastname'],['Suffix','suffix']].map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} style={inp} />
            </div>
          ))}
        </div>
        <div style={{ maxWidth: '240px' }}>
          <label style={lbl}>Nickname / Display Name</label>
          <input value={form.nickname} onChange={e => setForm(f => ({...f, nickname: e.target.value}))} style={inp} />
        </div>
      </Section>

      <Section title="Contact Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[['Primary Email','primemailaddress'],['Secondary Email','secondaryemail'],['Mobile Phone','mobilephone'],['Secondary Phone','secondaryphone']].map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} style={inp} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Address">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={lbl}>Address</label>
            <input value={form.address1} onChange={e => setForm(f => ({...f, address1: e.target.value}))} style={inp} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 1fr', gap: '12px' }}>
          {[['City','city'],['State','stateprovince'],['Postal','postalcode'],['Country','country']].map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} style={inp} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Social & Professional">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[['IMDB Profile URL','imdburl'],['LinkedIn URL','linkedinurl']].map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} style={inp} placeholder="https://" />
            </div>
          ))}
        </div>
      </Section>

      <button onClick={handleSave} disabled={saving}
        style={{ background: saved ? '#4A9C7A' : GOLD, border: 'none', color: '#1A1810', padding: '11px 32px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, transition: 'background 0.2s' }}>
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
      </button>
    </div>
  )
}

function SecurityTab() {
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [mfaEnabled, setMfaEnabled] = useState(true)
  const [sessions, setSessions] = useState(MOCK_SESSIONS)

  function pwStrength(pw) {
    if (!pw) return { label: '', color: 'transparent', pct: 0 }
    if (pw.length < 6) return { label: 'Weak', color: '#C84B31', pct: 25 }
    if (pw.length < 10) return { label: 'Moderate', color: GOLD, pct: 60 }
    return { label: 'Strong', color: '#4A9C7A', pct: 100 }
  }

  const strength = pwStrength(pwForm.next)
  const lbl = { display: 'block', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }
  const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.83rem', outline: 'none' }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}` }}>Change Password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[['Current Password','current'],['New Password','next'],['Confirm New Password','confirm']].map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input type="password" value={pwForm[key]} onChange={e => setPwForm(f => ({...f, [key]: e.target.value}))} style={inp} placeholder="••••••••" />
            </div>
          ))}
          {pwForm.next && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.68rem', color: CHARCOAL }}>Password Strength</span>
                <span style={{ fontSize: '0.68rem', color: strength.color }}>{strength.label}</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: '2px', transition: 'all 0.3s' }} />
              </div>
            </div>
          )}
          <button style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '10px 28px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, alignSelf: 'flex-start' }}>
            Update Password
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}` }}>Multi-Factor Authentication</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: SURFACE2, border: `1px solid ${BORDER}`, marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: CREAM, marginBottom: '4px' }}>MFA {mfaEnabled ? 'Enabled' : 'Disabled'}</div>
            <div style={{ fontSize: '0.75rem', color: CHARCOAL }}>Adds an extra layer of security to your account</div>
          </div>
          <div onClick={() => setMfaEnabled(e => !e)}
            style={{ width: '44px', height: '24px', background: mfaEnabled ? GOLD : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: '3px', left: mfaEnabled ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: mfaEnabled ? '#1A1810' : CHARCOAL, transition: 'left 0.2s' }} />
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}` }}>Active Sessions</div>
        <div style={{ border: `1px solid ${BORDER}` }}>
          {sessions.map((s, i) => (
            <div key={s.id} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < sessions.length - 1 ? `1px solid ${BORDER}` : 'none', background: s.current ? 'rgba(201,146,74,0.04)' : 'transparent' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.82rem', color: CREAM }}>{s.device}</span>
                  {s.current && <span style={{ background: 'rgba(74,156,122,0.15)', color: '#4A9C7A', padding: '2px 8px', fontSize: '0.65rem', letterSpacing: '0.08em', borderRadius: '2px' }}>Current</span>}
                </div>
                <div style={{ fontSize: '0.72rem', color: CHARCOAL }}>{s.ip} · Last active: {s.lastActive}</div>
              </div>
              {!s.current && (
                <button onClick={() => setSessions(ss => ss.filter(x => x.id !== s.id))}
                  style={{ background: 'none', border: `1px solid rgba(200,75,49,0.3)`, color: '#C84B31', padding: '5px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.06em' }}>
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductionsTab() {
  return (
    <div>
      <div style={{ border: `1px solid ${BORDER}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
              {['Title', 'Role', 'Status', 'Start Date', ''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_PRODUCTIONS.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < MOCK_PRODUCTIONS.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <td style={{ padding: '13px 16px', color: CREAM, fontSize: '0.83rem' }}>{p.title}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ background: 'rgba(201,146,74,0.15)', color: GOLD, padding: '2px 8px', fontSize: '0.68rem', borderRadius: '2px' }}>{p.role}</span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#4A9C7A' }}>{p.status}</span>
                </td>
                <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{p.startDate}</td>
                <td style={{ padding: '13px 16px' }}>
                  <a href="/development" style={{ color: GOLD, textDecoration: 'none', fontSize: '0.72rem' }}>Open in Development →</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Profile() {
  const { endUser, displayName } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')

  const initials = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'JL'

  const tabs = [
    { id: 'personal',    label: 'Personal Info' },
    { id: 'security',    label: 'Security' },
    { id: 'productions', label: 'My Productions' },
  ]

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', paddingBottom: '32px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(201,146,74,0.15)', border: `2px solid rgba(201,146,74,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: GOLD }}>
            {initials}
          </div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, cursor: 'pointer', transition: 'opacity 0.2s', fontSize: '0.6rem', color: CREAM, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
            Upload
          </div>
        </div>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: '0 0 6px' }}>{displayName || 'User'}</h1>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {BADGES.map(b => (
              <span key={b} style={{ background: 'rgba(92,87,78,0.3)', color: CHARCOAL, padding: '3px 10px', fontSize: '0.68rem', letterSpacing: '0.08em', border: `1px solid rgba(92,87,78,0.4)` }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '32px' }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ background: 'none', border: 'none', borderBottom: activeTab === id ? `2px solid ${GOLD}` : '2px solid transparent', color: activeTab === id ? GOLD : CHARCOAL, padding: '10px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'personal'    && <PersonalInfoTab endUser={endUser} />}
      {activeTab === 'security'    && <SecurityTab />}
      {activeTab === 'productions' && <ProductionsTab />}
    </div>
  )
}
