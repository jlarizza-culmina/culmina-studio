import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'

const MOCK_USERS = [
  { id: 1, login: 'admin@culminastudio.com', name: 'Joe Larizza',    roles: ['SysAdmin'], status: 'A', mfa: true,  lastLogin: '2h ago' },
  { id: 2, login: 'sarah@culminastudio.com', name: 'Sarah Chen',     roles: ['Producer'], status: 'A', mfa: true,  lastLogin: '1d ago' },
  { id: 3, login: 'mike@example.com',        name: 'Mike Torres',    roles: ['Author'],   status: 'A', mfa: false, lastLogin: '3d ago' },
  { id: 4, login: 'anna@example.com',        name: 'Anna Williams',  roles: ['Viewer'],   status: 'H', mfa: false, lastLogin: '2w ago' },
]

const MOCK_ROLES = [
  { id: 1, name: 'SysAdmin',  group: 'Administration', active: true },
  { id: 2, name: 'Producer',  group: 'Production',     active: true },
  { id: 3, name: 'Author',    group: 'Content',        active: true },
  { id: 4, name: 'Viewer',    group: 'Content',        active: true },
]

const MOCK_NVGROUPS = [
  { group: 'ActiveStatus',      count: 4  },
  { group: 'AIModel',           count: 6  },
  { group: 'AssetType',         count: 6  },
  { group: 'Genre',             count: 12 },
  { group: 'Lighting',          count: 14 },
  { group: 'ManuscriptStatus',  count: 5  },
  { group: 'Platform',          count: 5  },
  { group: 'ProductionStatus',  count: 7  },
  { group: 'TimeZone',          count: 38 },
]

const MOCK_NVPAIRS = {
  AIModel: [
    { name: 'Veo 2',       value: 'veo2',      active: true  },
    { name: 'Veo 3',       value: 'veo3',      active: true  },
    { name: 'Sora',        value: 'sora',      active: true  },
    { name: 'Runway Gen-3',value: 'runway3',   active: true  },
    { name: 'Kling',       value: 'kling',     active: true  },
    { name: 'Pika 2',      value: 'pika2',     active: false },
  ],
  Lighting: [
    { name: 'Natural Light',      value: 'natural',     active: true },
    { name: 'Key Light',          value: 'key',         active: true },
    { name: 'High Key',           value: 'highkey',     active: true },
    { name: 'Low Key',            value: 'lowkey',      active: true },
    { name: 'Three-Point',        value: 'threepoint',  active: true },
    { name: 'Rembrandt',          value: 'rembrandt',   active: true },
    { name: 'Butterfly',          value: 'butterfly',   active: true },
    { name: 'Split',              value: 'split',       active: true },
    { name: 'Rim/Back',           value: 'rim',         active: true },
    { name: 'Practical',          value: 'practical',   active: true },
    { name: 'Golden Hour',        value: 'goldenhour',  active: true },
    { name: 'Blue Hour',          value: 'bluehour',    active: true },
    { name: 'Motivated',          value: 'motivated',   active: true },
    { name: 'Cinematic Contrast', value: 'cinematic',   active: true },
  ],
}

const SYSTEM_STATUS = [
  { label: 'Supabase',          status: 'connected', detail: 'culmina-studio.supabase.co' },
  { label: 'Google Cloud',      status: 'connected', detail: 'culmina-studio-prod' },
  { label: 'Cloudflare R2',     status: 'warning',   detail: 'Credentials need refresh' },
  { label: 'Vercel Deployment', status: 'connected', detail: 'culminastudio.com' },
]

function StatusDot({ status }) {
  const colors = { connected: '#4A9C7A', warning: '#C9924A', error: '#C84B31', inactive: CHARCOAL }
  return <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[status] || CHARCOAL, flexShrink: 0 }} />
}

function UsersTab() {
  const [users, setUsers] = useState(MOCK_USERS)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{users.length} Users</div>
        <button style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          + New User
        </button>
      </div>
      <div style={{ border: `1px solid ${BORDER}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
              {['Name', 'Login', 'Roles', 'Status', 'MFA', 'Last Login', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? `1px solid ${BORDER}` : 'none', opacity: u.status === 'H' ? 0.5 : 1 }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(201,146,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: GOLD, flexShrink: 0 }}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontSize: '0.83rem', color: CREAM }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{u.login}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {u.roles.map(r => (
                      <span key={r} style={{ background: r === 'SysAdmin' ? 'rgba(201,146,74,0.15)' : 'rgba(255,255,255,0.06)', color: r === 'SysAdmin' ? GOLD : CHARCOAL, padding: '2px 8px', fontSize: '0.68rem', letterSpacing: '0.06em', borderRadius: '2px' }}>{r}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: '0.72rem', color: u.status === 'A' ? '#4A9C7A' : CHARCOAL }}>{u.status === 'A' ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: '0.72rem', color: u.mfa ? '#4A9C7A' : '#C84B31' }}>{u.mfa ? 'Enabled' : 'Disabled'}</span>
                </td>
                <td style={{ padding: '13px 16px', color: MUTED, fontSize: '0.78rem' }}>{u.lastLogin}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setSelectedUser(u); setShowModal(true) }} style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Roles</button>
                    <button style={{ background: 'none', border: 'none', color: CHARCOAL, fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Edit</button>
                    {u.status === 'A' && <button style={{ background: 'none', border: 'none', color: '#C84B31', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Deactivate</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: '32px', width: '480px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: CREAM, marginBottom: '6px', fontWeight: 300 }}>Manage Roles</h3>
            <div style={{ fontSize: '0.78rem', color: CHARCOAL, marginBottom: '24px' }}>{selectedUser.name}</div>
            <div style={{ border: `1px solid ${BORDER}`, marginBottom: '16px' }}>
              {['The Tunnels of Rasand'].map((title, i) => (
                <div key={title} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < 0 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ fontSize: '0.82rem', color: CREAM }}>{title}</span>
                  <select style={{ background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '6px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', outline: 'none' }}>
                    {MOCK_ROLES.map(r => <option key={r.id}>{r.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button style={{ background: 'none', border: `1px dashed rgba(201,146,74,0.3)`, color: GOLD, padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', width: '100%', marginBottom: '20px' }}>
              + Add Title Access
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '9px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>Save</button>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '9px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NVPairTab() {
  const [expanded, setExpanded] = useState(null)
  const [pairs, setPairs] = useState(MOCK_NVPAIRS)
  const [editingRow, setEditingRow] = useState(null)

  function toggleGroup(group) { setExpanded(e => e === group ? null : group) }

  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Picklist Groups</div>
      <div style={{ border: `1px solid ${BORDER}` }}>
        {MOCK_NVGROUPS.map((g, i) => (
          <div key={g.group}>
            <div onClick={() => toggleGroup(g.group)}
              style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: `1px solid ${BORDER}`, background: expanded === g.group ? 'rgba(201,146,74,0.04)' : 'transparent', transition: 'background 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: MUTED, fontSize: '0.65rem', transition: 'transform 0.15s', display: 'inline-block', transform: expanded === g.group ? 'rotate(90deg)' : 'none' }}>▶</span>
                <span style={{ fontSize: '0.85rem', color: CREAM }}>{g.group}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: CHARCOAL }}>{g.count} entries</span>
                <span style={{ color: GOLD, fontSize: '0.72rem' }}>Edit</span>
              </div>
            </div>
            {expanded === g.group && pairs[g.group] && (
              <div style={{ background: SURFACE2, borderBottom: `1px solid ${BORDER}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['NV Name', 'NV Value', 'Active', ''].map(h => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pairs[g.group].map((p, pi) => (
                      <tr key={pi} style={{ borderBottom: pi < pairs[g.group].length - 1 ? `1px solid rgba(201,146,74,0.06)` : 'none', opacity: p.active ? 1 : 0.4 }}>
                        <td style={{ padding: '9px 16px', color: CREAM, fontSize: '0.8rem' }}>{p.name}</td>
                        <td style={{ padding: '9px 16px', color: CHARCOAL, fontSize: '0.78rem', fontFamily: 'monospace' }}>{p.value}</td>
                        <td style={{ padding: '9px 16px' }}>
                          <span style={{ fontSize: '0.7rem', color: p.active ? '#4A9C7A' : CHARCOAL }}>{p.active ? 'Active' : 'Hidden'}</span>
                        </td>
                        <td style={{ padding: '9px 16px' }}>
                          <button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>Edit</button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4} style={{ padding: '8px 16px' }}>
                        <button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0, opacity: 0.7 }}>+ Add Entry</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
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
          {['Development', 'Staging', 'Production'].map(env => (
            <div key={env} style={{ padding: '8px 16px', border: `1px solid ${env === 'Development' ? GOLD : BORDER}`, background: env === 'Development' ? 'rgba(201,146,74,0.08)' : 'transparent' }}>
              <span style={{ fontSize: '0.75rem', color: env === 'Development' ? GOLD : CHARCOAL, letterSpacing: '0.08em' }}>{env}</span>
              {env === 'Development' && <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: GOLD }}>●</span>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>System Settings</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Default AI Model', value: 'Veo 2', type: 'select' },
            { label: 'GCS Bucket', value: 'culmina-studio-production', type: 'text' },
            { label: 'R2 Bucket', value: 'culmina-prod-r2', type: 'text' },
            { label: 'Max Variations per Take', value: '5', type: 'number' },
          ].map(({ label, value, type }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>
              <input type={type} defaultValue={value}
                style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' }} />
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
    { id: 'users',   label: 'Users' },
    { id: 'roles',   label: 'Roles & Entitlements' },
    { id: 'nvpair',  label: 'NVPair Editor' },
    { id: 'system',  label: 'System Settings' },
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
      {activeTab === 'roles'  && (
        <div style={{ border: `1px solid ${BORDER}`, padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2px' }}>
            {MOCK_ROLES.map(r => (
              <div key={r.id} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '18px 20px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: CREAM, marginBottom: '6px' }}>{r.name}</div>
                <div style={{ fontSize: '0.72rem', color: CHARCOAL, marginBottom: '12px' }}>{r.group}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', color: r.active ? '#4A9C7A' : CHARCOAL }}>{r.active ? 'Active' : 'Inactive'}</span>
                  <button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>Edit</button>
                </div>
              </div>
            ))}
            <div style={{ background: 'rgba(201,146,74,0.03)', border: `1px dashed rgba(201,146,74,0.2)`, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: GOLD, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
              + New Role
            </div>
          </div>
        </div>
      )}
      {activeTab === 'nvpair' && <NVPairTab />}
      {activeTab === 'system' && <SystemTab />}
    </div>
  )
}
