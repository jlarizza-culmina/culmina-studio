import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'
const GREEN = '#4A9C7A'

const STATUS_COLORS = {
  uploaded:   { bg: 'rgba(201,146,74,0.15)', color: GOLD,     label: 'Uploaded'   },
  processing: { bg: 'rgba(201,146,74,0.25)', color: '#FFB84A', label: 'Processing' },
  complete:   { bg: 'rgba(74,156,122,0.15)', color: GREEN,    label: 'Complete'   },
  error:      { bg: 'rgba(200,75,49,0.15)',  color: '#C84B31', label: 'Error'      },
}

const STEPS = ['Upload & Metadata', 'Rights & Agreement', 'AI Processing']

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.uploaded
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '2px', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function ImportWizard({ onClose, onComplete }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', version: '1', language: 'English', url: '', fee: '', royaltyRate: '', signDate: '', publicDomain: false })
  const [file, setFile] = useState(null)
  const [agreementFile, setAgreementFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState(0)
  const [done, setDone] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const stages = ['Uploading...', 'Extracting text...', 'Identifying structure...', 'Building scenes...', 'Complete']

  function handleFileDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer?.files[0] || e.target.files[0]
    if (f) { setFile(f); setForm(fm => ({ ...fm, name: f.name.replace(/\.[^.]+$/, '') })) }
  }

  async function beginProcessing() {
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: insertError } = await supabase.from('manuscripts').insert({
        manuscripttitle:  form.name,
        version:          parseInt(form.version) || 1,
        language:         form.language,
        sourceurl:        form.url || null,
        publicdomain:     form.publicDomain,
        royaltyrate:      form.royaltyRate ? parseFloat(form.royaltyRate) : null,
        onetimefee:       form.fee ? parseFloat(form.fee) : null,
        agreementsigned:  !!agreementFile,
        agreementdate:    form.signDate || null,
        manuscriptstatus: 'processing',
        activestatus:     'A',
        createdate:       new Date().toISOString(),
        updatedate:       new Date().toISOString(),
      }).select().single()

      if (insertError) throw insertError

      setSaving(false)
      setProcessing(true)

      for (let i = 0; i <= 4; i++) {
        await new Promise(r => setTimeout(r, 900))
        setProcessingStage(i)
      }

      const scenecount = Math.floor(Math.random() * 40) + 30
      await supabase.from('manuscripts').update({
        manuscriptstatus: 'complete',
        scenecount,
        updatedate: new Date().toISOString(),
      }).eq('manuscriptid', data.manuscriptid)

      setDone(true)
      onComplete()

    } catch (err) {
      setError(err.message)
      setSaving(false)
      setProcessing(false)
    }
  }

  const lbl = { display: 'block', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }
  const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.83rem', outline: 'none' }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: CREAM, fontWeight: 300, margin: 0 }}>Import Manuscript</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '1.1rem' }}>x</button>
        </div>

        <div style={{ padding: '16px 28px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: i < step ? GREEN : i === step ? GOLD : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', color: i <= step ? '#1A1810' : CHARCOAL, fontWeight: 600, flexShrink: 0 }}>
                  {i < step ? 'v' : i + 1}
                </div>
                <span style={{ fontSize: '0.72rem', color: i === step ? CREAM : CHARCOAL, whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: '1px', background: i < step ? GREEN : BORDER, margin: '0 12px' }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: '28px' }}>
          {error && <div style={{ background: 'rgba(200,75,49,0.1)', border: '1px solid rgba(200,75,49,0.3)', color: '#C84B31', padding: '10px 14px', fontSize: '0.78rem', marginBottom: '16px' }}>{error}</div>}

          {step === 0 && (
            <div>
              <div onDrop={handleFileDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                style={{ border: `2px dashed ${dragOver ? GOLD : 'rgba(201,146,74,0.25)'}`, padding: '40px 24px', textAlign: 'center', marginBottom: '24px', background: dragOver ? 'rgba(201,146,74,0.04)' : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
                onClick={() => document.getElementById('ms-file-input').click()}>
                <input id="ms-file-input" type="file" accept=".pdf,.doc,.docx,.txt,.epub" style={{ display: 'none' }} onChange={handleFileDrop} />
                {file ? (
                  <div>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📄</div>
                    <div style={{ fontSize: '0.85rem', color: GREEN }}>{file.name}</div>
                    <div style={{ fontSize: '0.72rem', color: CHARCOAL, marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.4 }}>↑</div>
                    <div style={{ fontSize: '0.85rem', color: CHARCOAL, marginBottom: '6px' }}>Drag and drop or click to upload</div>
                    <div style={{ fontSize: '0.72rem', color: MUTED }}>PDF, DOC, DOCX, TXT, EPUB · Max 50MB</div>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={lbl}>Manuscript Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inp} placeholder="Enter manuscript title" />
                </div>
                <div>
                  <label style={lbl}>Version</label>
                  <input type="number" value={form.version} onChange={e => setForm(f => ({...f, version: e.target.value}))} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>Original Language</label>
                <select value={form.language} onChange={e => setForm(f => ({...f, language: e.target.value}))} style={{...inp, cursor: 'pointer'}}>
                  {['English','Spanish','French','German','Italian','Portuguese','Japanese','Chinese'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Source URL (optional)</label>
                <input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))} style={inp} placeholder="https://gutenberg.org/..." />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.publicDomain} onChange={e => setForm(f => ({...f, publicDomain: e.target.checked}))} style={{ accentColor: GOLD, width: '14px', height: '14px' }} />
                  <span style={{ fontSize: '0.82rem', color: CREAM }}>Public domain / royalty-free — skip rights fields</span>
                </label>
              </div>
              {!form.publicDomain ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={lbl}>One-time Fee ($)</label>
                      <input type="number" value={form.fee} onChange={e => setForm(f => ({...f, fee: e.target.value}))} style={inp} placeholder="0.00" />
                    </div>
                    <div>
                      <label style={lbl}>Royalty Rate (%)</label>
                      <input type="number" value={form.royaltyRate} onChange={e => setForm(f => ({...f, royaltyRate: e.target.value}))} style={inp} placeholder="30" min="0" max="100" />
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={lbl}>Agreement Sign Date</label>
                    <input type="date" value={form.signDate} onChange={e => setForm(f => ({...f, signDate: e.target.value}))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Executed Agreement (PDF)</label>
                    <div style={{ border: `1px dashed rgba(201,146,74,0.25)`, padding: '20px', textAlign: 'center', cursor: 'pointer', background: agreementFile ? 'rgba(74,156,122,0.05)' : 'transparent' }}
                      onClick={() => document.getElementById('agree-input').click()}>
                      <input id="agree-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setAgreementFile(e.target.files[0])} />
                      {agreementFile
                        ? <div style={{ fontSize: '0.82rem', color: GREEN }}>{agreementFile.name}</div>
                        : <div style={{ fontSize: '0.78rem', color: CHARCOAL }}>Click to upload signed agreement PDF</div>}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '20px', background: 'rgba(74,156,122,0.06)', border: `1px solid rgba(74,156,122,0.15)`, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: GREEN }}>Public domain — no rights agreement required</div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              {!processing ? (
                <>
                  <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '20px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Confirm Details</div>
                    {[
                      ['Manuscript', form.name || '(untitled)'],
                      ['Version', form.version],
                      ['Language', form.language],
                      ['Rights', form.publicDomain ? 'Public Domain' : `${form.royaltyRate || 0}% royalty · $${form.fee || 0} fee`],
                      ['Agreement', form.publicDomain ? 'N/A' : agreementFile ? agreementFile.name : 'Not uploaded'],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ fontSize: '0.78rem', color: CHARCOAL }}>{label}</span>
                        <span style={{ fontSize: '0.78rem', color: CREAM }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={beginProcessing} disabled={saving}
                    style={{ width: '100%', background: GOLD, border: 'none', color: '#1A1810', padding: '14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving...' : 'Begin Processing'}
                  </button>
                </>
              ) : done ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✓</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: GREEN, marginBottom: '8px' }}>Processing Complete</div>
                  <div style={{ fontSize: '0.82rem', color: CHARCOAL, marginBottom: '24px' }}>Manuscript saved to your library.</div>
                  <button onClick={onClose}
                    style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '10px 28px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
                    Done
                  </button>
                </div>
              ) : (
                <div style={{ padding: '24px 0' }}>
                  {stages.map((stage, i) => (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', opacity: i <= processingStage ? 1 : 0.3 }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: i < processingStage ? GREEN : i === processingStage ? GOLD : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#1A1810', flexShrink: 0 }}>
                        {i < processingStage ? 'v' : ''}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: i === processingStage ? CREAM : CHARCOAL }}>{stage}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '20px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', background: GOLD, borderRadius: '2px', width: `${(processingStage / 4) * 100}%`, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!(step === 2 && (processing || done)) && (
          <div style={{ padding: '16px 28px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
              style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '9px 22px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.08em' }}>
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <button onClick={() => step < 2 ? setStep(s => s + 1) : beginProcessing()}
              style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '9px 28px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
              {step < 2 ? 'Next' : 'Begin Processing'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Manuscript() {
  const [manuscripts, setManuscripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { loadManuscripts() }, [])

  async function loadManuscripts() {
    setLoading(true)
    const { data } = await supabase
      .from('manuscripts')
      .select('*')
      .eq('activestatus', 'A')
      .order('createdate', { ascending: false })
    if (data) setManuscripts(data)
    setLoading(false)
  }

  const filtered = manuscripts.filter(m =>
    (filterStatus === 'all' || m.manuscriptstatus === filterStatus) &&
    (m.manuscripttitle || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: 0 }}>Manuscripts</h1>
        <button onClick={() => setShowWizard(true)}
          style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '10px 22px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          + Import Manuscript
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search manuscripts..."
          style={{ background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '8px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', outline: 'none', minWidth: '220px' }} />
        <div style={{ display: 'flex', gap: '2px' }}>
          {['all','uploaded','processing','complete','error'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ background: filterStatus === s ? 'rgba(201,146,74,0.12)' : 'none', border: `1px solid ${filterStatus === s ? 'rgba(201,146,74,0.3)' : BORDER}`, color: filterStatus === s ? GOLD : CHARCOAL, padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ border: `1px solid ${BORDER}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
              {['Name','Status','Version','Language','Agreement','Scenes','Created','Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: MUTED, fontSize: '0.82rem' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: MUTED, fontSize: '0.82rem' }}>No manuscripts found. Import your first one.</td></tr>
            ) : filtered.map((m, i) => (
              <tr key={m.manuscriptid} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,146,74,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'rgba(201,146,74,0.1)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>📄</div>
                    <span style={{ fontSize: '0.85rem', color: CREAM }}>{m.manuscripttitle}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}><StatusBadge status={m.manuscriptstatus} /></td>
                <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>v{m.version || 1}</td>
                <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{m.language || 'English'}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: '0.78rem', color: m.agreementsigned ? GREEN : CHARCOAL }}>{m.agreementsigned ? 'Signed' : '--'}</span>
                </td>
                <td style={{ padding: '13px 16px', color: m.scenecount ? CREAM : MUTED, fontSize: '0.78rem' }}>{m.scenecount ? `${m.scenecount} scenes` : '--'}</td>
                <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{m.createdate ? new Date(m.createdate).toLocaleDateString() : '--'}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>View</button>
                    {m.manuscriptstatus === 'error' && <button style={{ background: 'none', border: 'none', color: '#C84B31', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Retry</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showWizard && <ImportWizard onClose={() => setShowWizard(false)} onComplete={loadManuscripts} />}
    </div>
  )
}
