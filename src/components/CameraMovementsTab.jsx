import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD    = '#C9924A'
const CREAM   = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2= '#12110D'
const BORDER  = 'rgba(201,146,74,0.12)'
const MUTED   = '#6A6560'
const GREEN   = '#4A9C7A'
const RED     = '#C87A4A'
const BLUE    = '#7A9EC8'

const inp = {
  background: '#2A2820', border: `1px solid ${BORDER}`, color: CREAM,
  padding: '5px 8px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem',
  outline: 'none', borderRadius: '4px',
}
const btn = (variant = 'ghost') => ({
  padding: variant === 'primary' ? '6px 14px' : '5px 10px',
  borderRadius: '5px',
  border: variant === 'primary' ? 'none' : `1px solid ${BORDER}`,
  background: variant === 'primary' ? GOLD : 'transparent',
  color: variant === 'primary' ? SURFACE : CREAM,
  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
})

const SOURCE_COLORS = { runway: GOLD, veo: GREEN, both: BLUE }
const SOURCE_LABELS = { runway: 'Runway', veo: 'Veo', both: 'Both' }

const BLANK = {
  name: '', nvvalue: '', description: '', promptsnippet: '', source: 'both', sortorder: 99,
}

export default function CameraMovementsTab() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [editForm,setEditForm]= useState({})
  const [adding,  setAdding]  = useState(false)
  const [addForm, setAddForm] = useState({ ...BLANK })
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [filter,  setFilter]  = useState('all')  // 'all' | 'runway' | 'veo' | 'both'

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('camera_movements').select('*').order('sortorder')
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleEdit = (row) => { setEditing(row.movementid); setEditForm({ ...row }) }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('camera_movements')
      .update({ ...editForm, updatedate: new Date().toISOString() })
      .eq('movementid', editing)
    if (error) { alert('Save failed: ' + error.message) }
    else { showToast('Saved'); setEditing(null) }
    await load()
    setSaving(false)
  }

  const handleToggle = async (row) => {
    await supabase.from('camera_movements')
      .update({ activestatus: row.activestatus === 'A' ? 'I' : 'A', updatedate: new Date().toISOString() })
      .eq('movementid', row.movementid)
    await load()
  }

  const handleAdd = async () => {
    if (!addForm.name || !addForm.nvvalue) { alert('Name and code are required'); return }
    setSaving(true)
    const { error } = await supabase.from('camera_movements').insert([{ ...addForm, activestatus: 'A' }])
    if (error) { alert('Add failed: ' + error.message) }
    else { showToast('Added'); setAdding(false); setAddForm({ ...BLANK }) }
    await load()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this camera movement?')) return
    await supabase.from('camera_movements').delete().eq('movementid', id)
    await load()
  }

  const F = ({ label, k, form, setForm, textarea, mono, select, options, width }) => (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{label}</div>
      {select ? (
        <select value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
          style={{ ...inp, width: width || '140px' }}>
          {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : textarea ? (
        <textarea value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
          rows={2} style={{ ...inp, width: width || '100%', resize: 'vertical', fontFamily: mono ? 'monospace' : 'DM Sans, sans-serif', boxSizing: 'border-box' }} />
      ) : (
        <input value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
          style={{ ...inp, width: width || '200px', fontFamily: mono ? 'monospace' : 'DM Sans, sans-serif' }} />
      )}
    </div>
  )

  const sourceOptions = [{ v: 'both', l: 'Both (Runway + Veo)' }, { v: 'runway', l: 'Runway only' }, { v: 'veo', l: 'Veo only' }]

  const filtered = filter === 'all' ? rows : rows.filter(r => r.source === filter)

  return (
    <div style={{ color: CREAM, fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem' }}>
      {toast && (
        <div style={{ background: GREEN, color: '#fff', padding: '8px 16px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.78rem' }}>{toast}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['all', 'All'], ['both', 'Both'], ['runway', 'Runway'], ['veo', 'Veo']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              ...btn(), fontSize: '0.68rem', padding: '3px 10px',
              borderColor: filter === k ? GOLD : BORDER,
              color: filter === k ? GOLD : CREAM,
            }}>{l} {k === 'all' ? `(${rows.length})` : `(${rows.filter(r => r.source === k).length})`}</button>
          ))}
        </div>
        <button style={btn('primary')} onClick={() => setAdding(a => !a)}>
          {adding ? 'Cancel' : '+ Add Movement'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.7rem', color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontWeight: 600 }}>New Camera Movement</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 60px', gap: '12px', marginBottom: '8px' }}>
            <F label="Name" k="name" form={addForm} setForm={setAddForm} />
            <F label="Code (nvvalue)" k="nvvalue" form={addForm} setForm={setAddForm} mono />
            <F label="Platform" k="source" form={addForm} setForm={setAddForm} select options={sourceOptions} width="130px" />
            <F label="Sort" k="sortorder" form={addForm} setForm={setAddForm} width="50px" />
          </div>
          <F label="Description" k="description" form={addForm} setForm={setAddForm} textarea width="100%" />
          <F label="Prompt snippet (injected into video prompt)" k="promptsnippet" form={addForm} setForm={setAddForm} textarea mono width="100%" />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button style={btn('primary')} onClick={handleAdd} disabled={saving}>{saving ? 'Saving…' : 'Add'}</button>
            <button style={btn()} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ color: MUTED, padding: '20px 0' }}>Loading…</div>
      ) : (
        <div>
          {filtered.map((row, i) => (
            <div key={row.movementid} style={{
              background: editing === row.movementid ? '#1E1C14' : i % 2 === 0 ? SURFACE : SURFACE2,
              border: editing === row.movementid ? `1px solid ${GOLD}44` : `1px solid ${BORDER}`,
              borderRadius: '6px', marginBottom: '6px', padding: '12px 14px',
              opacity: row.activestatus === 'A' ? 1 : 0.45,
            }}>
              {editing === row.movementid ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 60px', gap: '12px', marginBottom: '8px' }}>
                    <F label="Name" k="name" form={editForm} setForm={setEditForm} />
                    <F label="Code" k="nvvalue" form={editForm} setForm={setEditForm} mono />
                    <F label="Platform" k="source" form={editForm} setForm={setEditForm} select options={sourceOptions} width="130px" />
                    <F label="Sort" k="sortorder" form={editForm} setForm={setEditForm} width="50px" />
                  </div>
                  <F label="Description" k="description" form={editForm} setForm={setEditForm} textarea width="100%" />
                  <F label="Prompt snippet" k="promptsnippet" form={editForm} setForm={setEditForm} textarea mono width="100%" />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button style={btn('primary')} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                    <button style={btn()} onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '24px', textAlign: 'center', color: MUTED, fontSize: '0.68rem', paddingTop: '2px', flexShrink: 0 }}>{row.sortorder}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: CREAM }}>{row.name}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: MUTED }}>{row.nvvalue}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: SOURCE_COLORS[row.source] || MUTED, letterSpacing: '0.05em' }}>
                        {SOURCE_LABELS[row.source] || row.source}
                      </span>
                    </div>
                    {row.description && <div style={{ fontSize: '0.72rem', color: MUTED, marginBottom: '3px', lineHeight: 1.4 }}>{row.description}</div>}
                    {row.promptsnippet && (
                      <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#7A8060', background: '#12110D', padding: '3px 7px', borderRadius: '3px', marginTop: '4px', display: 'inline-block' }}>
                        {row.promptsnippet}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => handleEdit(row)} style={{ ...btn(), fontSize: '0.68rem', padding: '3px 8px' }}>Edit</button>
                    <button onClick={() => handleToggle(row)} style={{ ...btn(), fontSize: '0.68rem', padding: '3px 8px', color: row.activestatus === 'A' ? RED : GREEN }}>
                      {row.activestatus === 'A' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(row.movementid)} style={{ ...btn(), fontSize: '0.68rem', padding: '3px 8px', color: RED }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: MUTED, padding: '16px 0', fontSize: '0.78rem' }}>No movements found.</div>}
        </div>
      )}
    </div>
  )
}
