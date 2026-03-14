import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ScoringModelsTab from '../components/ScoringModelsTab'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'

const SYSTEM_STATUS = [
  { label: 'Supabase',          status: 'connected', detail: 'culmina-studio.supabase.co' },
  { label: 'Google Cloud',      status: 'connected', detail: 'culmina-studio-prod' },
  { label: 'Cloudflare R2',     status: 'warning',   detail: 'Credentials need refresh' },
  { label: 'Vercel Deployment', status: 'connected', detail: 'culminastudio.com' },
]

const lbl = { display: 'block', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }
const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', marginBottom: '14px' }

function StatusDot({ status }) {
  const colors = { connected: '#4A9C7A', warning: '#C9924A', error: '#C84B31' }
  return <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[status] || CHARCOAL, flexShrink: 0 }} />
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: '32px', width: '480px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: CREAM, marginBottom: '24px', fontWeight: 300 }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers]         = useState([])
  const [roles, setRoles]         = useState([])
  const [titles, setTitles]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showRoles, setShowRoles] = useState(false)
  const [showAdd, setShowAdd]     = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userRoles, setUserRoles] = useState([])
  const [newUser, setNewUser]     = useState({ email: '', firstname: '', lastname: '' })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: eu }, { data: ro }, { data: ti }] = await Promise.all([
      supabase.from('endusers').select('*, contacts(firstname, lastname, primemailaddress)').eq('activestatus', 'A').order('createdate'),
      supabase.from('roles').select('*').eq('active', true).order('rolename'),
      supabase.from('productions').select('productionid, productiontitle').eq('productiongroup', 'TITLE').eq('activestatus', 'A'),
    ])
    if (eu) setUsers(eu)
    if (ro) setRoles(ro)
    if (ti) setTitles(ti)
    setLoading(false)
  }

  async function openRoles(user) {
    setSelectedUser(user)
    const { data } = await supabase.from('endusers2roles')
      .select('*, roles(rolename), productions(productiontitle)')
      .eq('enduserid', user.enduserid)
    setUserRoles(data || [])
    setShowRoles(true)
  }

  async function handleDeactivate(user) {
    if (!confirm(`Deactivate ${displayName(user)}?`)) return
    await supabase.from('endusers').update({ activestatus: 'H', updatedate: new Date().toISOString() }).eq('enduserid', user.enduserid)
    loadAll()
  }

  async function handleAddUser() {
    if (!newUser.email || !newUser.firstname) { setError('Email and first name are required.'); return }
    setSaving(true); setError(null)
    try {
      // Create contact first
      const { data: contact, error: ce } = await supabase.from('contacts').insert({
        firstname: newUser.firstname, lastname: newUser.lastname,
        primemailaddress: newUser.email, activestatus: 'A',
        createdate: new Date().toISOString(), updatedate: new Date().toISOString()
      }).select().single()
      if (ce) throw ce

      // Create enduser
      const { error: ee } = await supabase.from('endusers').insert({
        contactid: contact.contactid, loginname: newUser.email,
        emailaddress: newUser.email, activestatus: 'A',
        createdate: new Date().toISOString(), updatedate: new Date().toISOString()
      })
      if (ee) throw ee

      setShowAdd(false)
      setNewUser({ email: '', firstname: '', lastname: '' })
      loadAll()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  function displayName(u) {
    if (!u.contacts) return u.loginname || u.emailaddress
    const c = u.contacts
    return [c.firstname, c.lastname].filter(Boolean).join(' ') || u.loginname
  }
  function initials(u) {
    return displayName(u).split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{users.length} Users</div>
        <button onClick={() => { setShowAdd(true); setError(null) }}
          style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          + New User
        </button>
      </div>

      <div style={{ border: `1px solid ${BORDER}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
              {['Name','Login','Status','Last Updated','Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: MUTED, fontSize: '0.82rem' }}>Loading...</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.enduserid} style={{ borderBottom: i < users.length - 1 ? `1px solid ${BORDER}` : 'none', opacity: u.activestatus === 'H' ? 0.5 : 1 }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(201,146,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: GOLD, flexShrink: 0 }}>
                      {initials(u)}
                    </div>
                    <span style={{ fontSize: '0.83rem', color: CREAM }}>{displayName(u)}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{u.loginname || u.emailaddress}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: '0.72rem', color: u.activestatus === 'A' ? '#4A9C7A' : CHARCOAL }}>{u.activestatus === 'A' ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={{ padding: '13px 16px', color: MUTED, fontSize: '0.78rem' }}>
                  {u.updatedate ? new Date(u.updatedate).toLocaleDateString() : '--'}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openRoles(u)} style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Roles</button>
                    {u.activestatus === 'A' && (
                      <button onClick={() => handleDeactivate(u)} style={{ background: 'none', border: 'none', color: '#C84B31', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Deactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <Modal title="New User" onClose={() => setShowAdd(false)}>
          {error && <div style={{ background: 'rgba(200,75,49,0.1)', border: '1px solid rgba(200,75,49,0.3)', color: '#C84B31', padding: '10px 14px', fontSize: '0.78rem', marginBottom: '16px' }}>{error}</div>}
          <label style={lbl}>First Name *</label>
          <input value={newUser.firstname} onChange={e => setNewUser(u => ({...u, firstname: e.target.value}))} style={inp} placeholder="First name" />
          <label style={lbl}>Last Name</label>
          <input value={newUser.lastname} onChange={e => setNewUser(u => ({...u, lastname: e.target.value}))} style={inp} placeholder="Last name" />
          <label style={lbl}>Email / Login *</label>
          <input value={newUser.email} onChange={e => setNewUser(u => ({...u, email: e.target.value}))} style={inp} placeholder="email@example.com" />
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button onClick={handleAddUser} disabled={saving}
              style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '9px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create User'}
            </button>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '9px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem' }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Roles Modal */}
      {showRoles && selectedUser && (
        <Modal title="Manage Roles" onClose={() => setShowRoles(false)}>
          <div style={{ fontSize: '0.78rem', color: CHARCOAL, marginBottom: '20px', marginTop: '-16px' }}>{displayName(selectedUser)}</div>
          <div style={{ border: `1px solid ${BORDER}`, marginBottom: '20px' }}>
            {titles.length === 0 ? (
              <div style={{ padding: '16px', color: MUTED, fontSize: '0.78rem', textAlign: 'center' }}>No titles available</div>
            ) : titles.map((t, i) => {
              const existing = userRoles.find(r => r.productionid === t.productionid)
              return (
                <div key={t.productionid} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < titles.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ fontSize: '0.82rem', color: CREAM }}>{t.productiontitle}</span>
                  <select defaultValue={existing?.roleid || ''}
                    style={{ background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '6px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', outline: 'none', cursor: 'pointer' }}>
                    <option value="">No Access</option>
                    {roles.map(r => <option key={r.roleid} value={r.roleid}>{r.rolename}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
          <button onClick={() => setShowRoles(false)}
            style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '9px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            Close
          </button>
        </Modal>
      )}
    </div>
  )
}

function NVPairTab() {
  const [groups, setGroups]     = useState([])
  const [expanded, setExpanded] = useState(null)
  const [pairs, setPairs]       = useState({})
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(null)
  const [adding, setAdding]     = useState(null)
  const [newPair, setNewPair]   = useState({ nvname: '', nvvalue: '' })

  useEffect(() => { loadGroups() }, [])

  async function loadGroups() {
    setLoading(true)
    const { data } = await supabase.from('nvpair').select('nvgroup').eq('hidden', false)
    if (data) {
      const grouped = data.reduce((acc, r) => { acc[r.nvgroup] = (acc[r.nvgroup] || 0) + 1; return acc }, {})
      setGroups(Object.entries(grouped).map(([group, count]) => ({ group, count })).sort((a,b) => a.group.localeCompare(b.group)))
    }
    setLoading(false)
  }

  async function loadPairs(group) {
    const { data } = await supabase.from('nvpair').select('*').eq('nvgroup', group).eq('hidden', false).order('nvname')
    if (data) setPairs(p => ({ ...p, [group]: data }))
  }

  async function toggleExpand(group) {
    if (expanded === group) { setExpanded(null); return }
    await loadPairs(group)
    setExpanded(group)
  }

  async function handleToggleActive(pair) {
    await supabase.from('nvpair').update({ active: !pair.active, updatedate: new Date().toISOString() }).eq('nvpairid', pair.nvpairid)
    setPairs(p => ({ ...p, [pair.nvgroup]: p[pair.nvgroup].map(x => x.nvpairid === pair.nvpairid ? {...x, active: !x.active} : x) }))
  }

  async function handleSaveEdit(pair, newName, newValue) {
    await supabase.from('nvpair').update({ nvname: newName, nvvalue: newValue, updatedate: new Date().toISOString() }).eq('nvpairid', pair.nvpairid)
    setPairs(p => ({ ...p, [pair.nvgroup]: p[pair.nvgroup].map(x => x.nvpairid === pair.nvpairid ? {...x, nvname: newName, nvvalue: newValue} : x) }))
    setEditing(null)
  }

  async function handleAddPair(group) {
    if (!newPair.nvname || !newPair.nvvalue) return
    const { data } = await supabase.from('nvpair').insert({
      nvgroup: group, nvname: newPair.nvname, nvvalue: newPair.nvvalue,
      active: true, hidden: false, createdate: new Date().toISOString(), updatedate: new Date().toISOString()
    }).select().single()
    if (data) {
      setPairs(p => ({ ...p, [group]: [...(p[group] || []), data] }))
      setGroups(g => g.map(x => x.group === group ? {...x, count: x.count + 1} : x))
    }
    setAdding(null)
    setNewPair({ nvname: '', nvvalue: '' })
  }

  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Picklist Groups</div>
      {loading ? (
        <div style={{ color: MUTED, fontSize: '0.82rem' }}>Loading...</div>
      ) : (
        <div style={{ border: `1px solid ${BORDER}` }}>
          {groups.map((g, i) => (
            <div key={g.group}>
              <div onClick={() => toggleExpand(g.group)}
                style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: `1px solid ${BORDER}`, background: expanded === g.group ? 'rgba(201,146,74,0.04)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: MUTED, fontSize: '0.65rem', display: 'inline-block', transform: expanded === g.group ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
                  <span style={{ fontSize: '0.85rem', color: CREAM }}>{g.group}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: CHARCOAL }}>{g.count} entries</span>
              </div>
              {expanded === g.group && (
                <div style={{ background: SURFACE2, borderBottom: i < groups.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {['NV Name','NV Value','Active',''].map(h => (
                          <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(pairs[g.group] || []).map((p, pi) => (
                        <tr key={p.nvpairid} style={{ borderBottom: `1px solid rgba(201,146,74,0.06)`, opacity: p.active ? 1 : 0.45 }}>
                          <td style={{ padding: '9px 16px' }}>
                            {editing === p.nvpairid
                              ? <input defaultValue={p.nvname} id={`name-${p.nvpairid}`} style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: CREAM, padding: '4px 8px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', outline: 'none', width: '140px' }} />
                              : <span style={{ fontSize: '0.8rem', color: CREAM }}>{p.nvname}</span>}
                          </td>
                          <td style={{ padding: '9px 16px' }}>
                            {editing === p.nvpairid
                              ? <input defaultValue={p.nvvalue} id={`val-${p.nvpairid}`} style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: CREAM, padding: '4px 8px', fontFamily: 'monospace', fontSize: '0.75rem', outline: 'none', width: '120px' }} />
                              : <span style={{ fontSize: '0.78rem', color: CHARCOAL, fontFamily: 'monospace' }}>{p.nvvalue}</span>}
                          </td>
                          <td style={{ padding: '9px 16px' }}>
                            <button onClick={() => handleToggleActive(p)} style={{ background: 'none', border: 'none', color: p.active ? '#4A9C7A' : CHARCOAL, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>
                              {p.active ? 'Active' : 'Hidden'}
                            </button>
                          </td>
                          <td style={{ padding: '9px 16px' }}>
                            {editing === p.nvpairid ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleSaveEdit(p, document.getElementById(`name-${p.nvpairid}`).value, document.getElementById(`val-${p.nvpairid}`).value)}
                                  style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>Save</button>
                                <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: CHARCOAL, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setEditing(p.nvpairid)} style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>Edit</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Add new row */}
                      {adding === g.group ? (
                        <tr style={{ background: 'rgba(201,146,74,0.04)' }}>
                          <td style={{ padding: '9px 16px' }}>
                            <input value={newPair.nvname} onChange={e => setNewPair(p => ({...p, nvname: e.target.value}))}
                              placeholder="Display name" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: CREAM, padding: '4px 8px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', outline: 'none', width: '140px' }} />
                          </td>
                          <td style={{ padding: '9px 16px' }}>
                            <input value={newPair.nvvalue} onChange={e => setNewPair(p => ({...p, nvvalue: e.target.value}))}
                              placeholder="value_key" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: CREAM, padding: '4px 8px', fontFamily: 'monospace', fontSize: '0.75rem', outline: 'none', width: '120px' }} />
                          </td>
                          <td style={{ padding: '9px 16px', color: '#4A9C7A', fontSize: '0.7rem' }}>Active</td>
                          <td style={{ padding: '9px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleAddPair(g.group)} style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>Add</button>
                              <button onClick={() => { setAdding(null); setNewPair({ nvname: '', nvvalue: '' }) }} style={{ background: 'none', border: 'none', color: CHARCOAL, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ padding: '8px 16px' }}>
                            <button onClick={() => setAdding(g.group)} style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0, opacity: 0.7 }}>+ Add Entry</button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RolesTab() {
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newRole, setNewRole] = useState({ rolename: '' })
  const [saving, setSaving]   = useState(false)

  useEffect(() => { loadRoles() }, [])

  async function loadRoles() {
    setLoading(true)
    const { data } = await supabase.from('roles').select('*').order('rolename')
    if (data) setRoles(data)
    setLoading(false)
  }

  async function handleAddRole() {
    if (!newRole.rolename.trim()) return
    setSaving(true)
    const { data } = await supabase.from('roles').insert({
      rolename: newRole.rolename, active: true, hidden: false,
      createdate: new Date().toISOString(), updatedate: new Date().toISOString()
    }).select().single()
    if (data) setRoles(r => [...r, data])
    setShowAdd(false)
    setNewRole({ rolename: '' })
    setSaving(false)
  }

  return (
    <div>
      <div style={{ border: `1px solid ${BORDER}`, padding: '24px' }}>
        {loading ? (
          <div style={{ color: MUTED, fontSize: '0.82rem' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2px' }}>
            {roles.map(r => (
              <div key={r.roleid} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '18px 20px' }}>
                <div style={{ fontFamily: 'Cormorant Garamath, serif', fontSize: '1.05rem', color: CREAM, marginBottom: '6px' }}>{r.rolename}</div>
                <div style={{ fontSize: '0.7rem', color: r.active ? '#4A9C7A' : CHARCOAL }}>{r.active ? 'Active' : 'Inactive'}</div>
              </div>
            ))}
            <div onClick={() => setShowAdd(true)}
              style={{ background: 'rgba(201,146,74,0.03)', border: `1px dashed rgba(201,146,74,0.2)`, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: GOLD, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
              + New Role
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="New Role" onClose={() => setShowAdd(false)}>
          <label style={lbl}>Role Name *</label>
          <input value={newRole.rolename} onChange={e => setNewRole({ rolename: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleAddRole()}
            autoFocus style={inp} placeholder="e.g. Editor, Director" />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleAddRole} disabled={saving}
              style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '9px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
              {saving ? 'Creating...' : 'Create Role'}
            </button>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '9px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem' }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SystemTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Service Status</div>
        <div style={{ border: `1px solid ${BORDER}` }}>
          {SYSTEM_STATUS.map((s, i) => (
            <div key={s.label} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < SYSTEM_STATUS.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusDot status={s.status} />
                <span style={{ fontSize: '0.83rem', color: CREAM }}>{s.label}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: s.status === 'warning' ? GOLD : CHARCOAL }}>{s.detail}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', marginTop: '28px' }}>Environment</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Development','Staging','Production'].map(env => (
            <div key={env} style={{ padding: '8px 16px', border: `1px solid ${env === 'Development' ? GOLD : BORDER}`, background: env === 'Development' ? 'rgba(201,146,74,0.08)' : 'transparent' }}>
              <span style={{ fontSize: '0.75rem', color: env === 'Development' ? GOLD : CHARCOAL }}>{env}</span>
              {env === 'Development' && <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: GOLD }}>●</span>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>System Settings</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[['Default AI Model','Veo 2'],['GCS Bucket','culmina-studio-production'],['R2 Bucket','culmina-prod-r2'],['Max Variations per Take','5']].map(([label, value]) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>
              <input defaultValue={value} style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' }} />
            </div>
          ))}
          <button style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '9px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, alignSelf: 'flex-start', marginTop: '8px' }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users')
  const tabs = [
    { id: 'users',  label: 'Users' },
    { id: 'roles',  label: 'Roles' },
    { id: 'scoring', label: 'Scoring Models' },
    { id: 'nvpair', label: 'NVPair Editor' },
    { id: 'system', label: 'System Settings' },
]

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: 0 }}>Admin</h1>
        <span style={{ background: 'rgba(201,146,74,0.15)', color: GOLD, padding: '4px 12px', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '2px' }}>SysAdmin</span>
      </div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '28px' }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ background: 'none', border: 'none', borderBottom: activeTab === id ? `2px solid ${GOLD}` : '2px solid transparent', color: activeTab === id ? GOLD : CHARCOAL, padding: '10px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
            {label}
          </button>
        ))}
      </div>
      {activeTab === 'users'  && <UsersTab />}
      {activeTab === 'roles'  && <RolesTab />}
      {activeTab === 'nvpair' && <NVPairTab />}
      {activeTab === 'system' && <SystemTab />}
      {activeTab === 'scoring' && <ScoringModelsTab />}
    </div>
  )
}
