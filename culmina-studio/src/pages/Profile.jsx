import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'

const lbl = { display: 'block', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }
const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }
const sectionHdr = { fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}` }

function PersonalInfoTab({ endUser }) {
  const [form, setForm] = useState({
    firstname: '', middlename: '', lastname: '', nickname: '',
    prefix: '', suffix: '',
    primemailaddress: '', secemailaddress: '',
    mobilephonenumber: '', secphonenumber: '',
    address1: '', city: '', state: '', postalcode: '', country: '',
    imdbprofile: '', linkedinprofile: '',
    designations: '',
  })
  const [designationInput, setDesignationInput] = useState('')
  const [designationOptions, setDesignationOptions] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [iconPreview, setIconPreview] = useState(null)
  const iconRef = useRef()

  useEffect(() => {
    async function loadContact() {
      const contactid = endUser?.contactid || endUser?.contacts?.contactid
      if (!contactid) return
      const { data: c, error } = await supabase.from('contacts').select('*').eq('contactid', contactid).single()
      console.log('loadContact:', c, error)
      if (!c) return
      setForm({
        firstname:         c.firstname         || '',
        middlename:        c.middlename        || '',
        lastname:          c.lastname          || '',
        nickname:          c.nickname          || '',
        prefix:            c.prefix            || '',
        suffix:            c.suffix            || '',
        primemailaddress:  c.primemailaddress  || '',
        secemailaddress:   c.secemailaddress   || '',
        mobilephonenumber: c.mobilephonenumber || '',
        secphonenumber:    c.secphonenumber    || '',
        address1:          c.address1          || '',
        city:              c.city              || '',
        state:             c.state             || '',
        postalcode:        c.postalcode        || '',
        country:           c.country           || '',
        imdbprofile:       c.imdbprofile       || '',
        linkedinprofile:   c.linkedinprofile   || '',
        designations:      c.designations      || '',
      })
      if (c.profileicon) setIconPreview(c.profileicon)
    }
    loadContact()
    supabase.from('nvpair').select('nvname, nvvalue').eq('nvgroup', 'Designation').eq('active', true).eq('hidden', false).order('nvname')
      .then(({ data }) => { if (data) setDesignationOptions(data) })
  }, [endUser])

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function designationList() {
    return form.designations ? form.designations.split(',').map(s => s.trim()).filter(Boolean) : []
  }

  function addDesignation() {
    const val = designationInput.trim()
    console.log('addDesignation val:', val)
    if (!val) return
    setForm(f => {
      const list = f.designations ? f.designations.split(',').map(s => s.trim()).filter(Boolean) : []
      if (list.includes(val)) return f
      return { ...f, designations: [...list, val].join(', ') }
    })
    setDesignationInput('')
  }

  function removeDesignation(d) {
    setForm(f => ({ ...f, designations: designationList().filter(x => x !== d).join(', ') }))
  }

  function handleIconChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setIconPreview(ev.target.result); setForm(f => ({ ...f, profileicon: ev.target.result })) }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    const contactid = endUser?.contactid || endUser?.contacts?.contactid
    console.log('handleSave contactid:', contactid)
    if (!contactid) { alert('No contactid found — check console'); return }
    setSaving(true)
    const update = { ...form, updatedate: new Date().toISOString() }
    if (iconPreview) update.profileicon = iconPreview
    const { data, error } = await supabase.from('contacts').update(update).eq('contactid', contactid).select()
    console.log('save result:', data, error)
    if (error) { alert('Save error: ' + error.message); setSaving(false); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: '720px' }}>

      <div style={{ marginBottom: '32px' }}>
        <div style={sectionHdr}>Name</div>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 1fr 80px', gap: '12px', marginBottom: '12px' }}>
          <div><label style={lbl}>Prefix</label><input value={form.prefix} onChange={set('prefix')} style={inp} /></div>
          <div><label style={lbl}>First Name</label><input value={form.firstname} onChange={set('firstname')} style={inp} /></div>
          <div><label style={lbl}>Middle</label><input value={form.middlename} onChange={set('middlename')} style={inp} /></div>
          <div><label style={lbl}>Last Name</label><input value={form.lastname} onChange={set('lastname')} style={inp} /></div>
          <div><label style={lbl}>Suffix</label><input value={form.suffix} onChange={set('suffix')} style={inp} /></div>
        </div>
        <div style={{ maxWidth: '240px' }}>
          <label style={lbl}>Nickname / Display Name</label>
          <input value={form.nickname} onChange={set('nickname')} style={inp} />
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={sectionHdr}>Designations & Certifications</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {designationList().map(d => (
            <span key={d} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(92,87,78,0.3)', color: CHARCOAL, padding: '4px 10px', fontSize: '0.72rem', letterSpacing: '0.08em', border: `1px solid rgba(92,87,78,0.4)` }}>
              {d}
              <button onClick={() => removeDesignation(d)} style={{ background: 'none', border: 'none', color: CHARCOAL, cursor: 'pointer', padding: 0, fontSize: '0.9rem', lineHeight: 1 }}>x</button>
            </span>
          ))}
          {designationList().length === 0 && <span style={{ fontSize: '0.75rem', color: MUTED }}>No designations added</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '360px' }}>
          <select value={designationInput} onChange={e => setDesignationInput(e.target.value)}
            style={{ ...inp, marginBottom: 0, flex: 1, cursor: 'pointer' }}>
            <option value="">Select designation...</option>
            {designationOptions.filter(o => !designationList().includes(o.nvname)).map(o => (
              <option key={o.nvvalue} value={o.nvname}>{o.nvname}</option>
            ))}
          </select>
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); addDesignation() }}
            type="button"
            style={{ background: 'rgba(201,146,74,0.1)', border: `1px solid ${BORDER}`, color: GOLD, padding: '0 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            + Add
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={sectionHdr}>Profile Icon</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(201,146,74,0.15)', border: `2px solid rgba(201,146,74,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {iconPreview
              ? <img src={iconPreview} alt="icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: GOLD }}>
                  {[form.firstname, form.lastname].map(n => n?.[0] || '').join('').toUpperCase() || '??'}
                </span>}
          </div>
          <div>
            <input ref={iconRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIconChange} />
            <button onClick={() => iconRef.current.click()}
              style={{ background: 'rgba(201,146,74,0.08)', border: `1px solid ${BORDER}`, color: GOLD, padding: '8px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', marginRight: '10px' }}>
              Upload Image
            </button>
            {iconPreview && (
              <button onClick={() => { setIconPreview(null); setForm(f => ({ ...f, profileicon: '' })) }}
                style={{ background: 'none', border: 'none', color: CHARCOAL, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem' }}>
                Remove
              </button>
            )}
            <div style={{ fontSize: '0.7rem', color: MUTED, marginTop: '6px' }}>JPG, PNG</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={sectionHdr}>Contact Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><label style={lbl}>Primary Email</label><input value={form.primemailaddress} onChange={set('primemailaddress')} style={inp} /></div>
          <div><label style={lbl}>Secondary Email</label><input value={form.secemailaddress} onChange={set('secemailaddress')} style={inp} /></div>
          <div><label style={lbl}>Mobile Phone</label><input value={form.mobilephonenumber} onChange={set('mobilephonenumber')} style={inp} /></div>
          <div><label style={lbl}>Secondary Phone</label><input value={form.secphonenumber} onChange={set('secphonenumber')} style={inp} /></div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={sectionHdr}>Address</div>
        <div style={{ marginBottom: '12px' }}>
          <label style={lbl}>Address</label>
          <input value={form.address1} onChange={set('address1')} style={inp} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 1fr', gap: '12px' }}>
          <div><label style={lbl}>City</label><input value={form.city} onChange={set('city')} style={inp} /></div>
          <div><label style={lbl}>State</label><input value={form.state} onChange={set('state')} style={inp} /></div>
          <div><label style={lbl}>Postal</label><input value={form.postalcode} onChange={set('postalcode')} style={inp} /></div>
          <div><label style={lbl}>Country</label><input value={form.country} onChange={set('country')} style={inp} /></div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={sectionHdr}>Social & Professional</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><label style={lbl}>IMDB Profile URL</label><input value={form.imdbprofile} onChange={set('imdbprofile')} style={inp} placeholder="https://" /></div>
          <div><label style={lbl}>LinkedIn URL</label><input value={form.linkedinprofile} onChange={set('linkedinprofile')} style={inp} placeholder="https://" /></div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ background: saved ? '#4A9C7A' : GOLD, border: 'none', color: '#1A1810', padding: '11px 32px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
        {saving ? 'Saving...' : saved ? 'Saved v' : 'Save Changes'}
      </button>
    </div>
  )
}

function SecurityTab() {
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [mfaEnabled, setMfaEnabled] = useState(false)

  function pwStrength(pw) {
    if (!pw) return { label: '', color: 'transparent', pct: 0 }
    if (pw.length < 6)  return { label: 'Weak',     color: '#C84B31', pct: 25  }
    if (pw.length < 10) return { label: 'Moderate', color: GOLD,      pct: 60  }
    return { label: 'Strong', color: '#4A9C7A', pct: 100 }
  }
  const strength = pwStrength(pwForm.next)

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={sectionHdr}>Change Password</div>
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
      <div>
        <div style={sectionHdr}>Multi-Factor Authentication</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: SURFACE2, border: `1px solid ${BORDER}` }}>
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
    </div>
  )
}

function ProductionsTab({ endUser }) {
  const [productions, setProductions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!endUser?.enduserid) return
      setLoading(true)
      const { data } = await supabase
        .from('endusers2roles')
        .select('*, roles(rolename), productions(productiontitle, productionstatus, createdate)')
        .eq('enduserid', endUser.enduserid)
      if (data) setProductions(data)
      setLoading(false)
    }
    load()
  }, [endUser])

  return (
    <div>
      <div style={{ border: `1px solid ${BORDER}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
              {['Title','Role','Status','Since',''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: MUTED, fontSize: '0.82rem' }}>Loading...</td></tr>
            ) : productions.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: MUTED, fontSize: '0.82rem' }}>No productions assigned.</td></tr>
            ) : productions.map((p, i) => (
              <tr key={p.endusers2roleid} style={{ borderBottom: i < productions.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <td style={{ padding: '13px 16px', color: CREAM, fontSize: '0.83rem' }}>{p.productions?.productiontitle || '--'}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ background: 'rgba(201,146,74,0.15)', color: GOLD, padding: '2px 8px', fontSize: '0.68rem', borderRadius: '2px' }}>{p.roles?.rolename || '--'}</span>
                </td>
                <td style={{ padding: '13px 16px', fontSize: '0.78rem', color: '#4A9C7A' }}>{p.productions?.productionstatus?.replace(/_/g,' ') || '--'}</td>
                <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{p.createdate ? new Date(p.createdate).toLocaleDateString() : '--'}</td>
                <td style={{ padding: '13px 16px' }}>
                  <a href="/development" style={{ color: GOLD, textDecoration: 'none', fontSize: '0.72rem' }}>Open →</a>
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

  const designations = endUser?.contacts?.designations
    ? endUser.contacts.designations.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const iconSrc = endUser?.contacts?.profileicon

  const tabs = [
    { id: 'personal',    label: 'Personal Info' },
    { id: 'security',    label: 'Security' },
    { id: 'productions', label: 'My Productions' },
  ]

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', paddingBottom: '32px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(201,146,74,0.15)', border: `2px solid rgba(201,146,74,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {iconSrc
            ? <img src={iconSrc} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: GOLD }}>{initials}</span>}
        </div>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: '0 0 8px' }}>{displayName || 'User'}</h1>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {designations.length > 0
              ? designations.map(d => (
                  <span key={d} style={{ background: 'rgba(92,87,78,0.3)', color: CHARCOAL, padding: '3px 10px', fontSize: '0.68rem', letterSpacing: '0.08em', border: `1px solid rgba(92,87,78,0.4)` }}>{d}</span>
                ))
              : <span style={{ fontSize: '0.72rem', color: MUTED }}>Add designations in Personal Info</span>}
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
      {activeTab === 'productions' && <ProductionsTab endUser={endUser} />}
    </div>
  )
}
