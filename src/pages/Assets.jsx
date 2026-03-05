import { useState } from 'react'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'
const GREEN = '#4A9C7A'

const MOCK_ASSETS = [
  { id: 1, type: 'Character', name: 'Clara Voss',      instance: 'Young',      importance: 'Lead',       aiGenerated: true,  sex: 'Female', timePeriod: null },
  { id: 2, type: 'Character', name: 'Lord Ashford',    instance: 'Elderly',    importance: 'Supporting', aiGenerated: false, sex: 'Male',   timePeriod: null },
  { id: 3, type: 'Character', name: 'The Stranger',    instance: 'Battle-worn',importance: 'Supporting', aiGenerated: true,  sex: 'Male',   timePeriod: null },
  { id: 4, type: 'Set',       name: 'Tunnel Entrance', instance: 'Night',      importance: null,         aiGenerated: true,  sex: null,     timePeriod: 'Victorian' },
  { id: 5, type: 'Set',       name: 'Village Square',  instance: 'Day',        importance: null,         aiGenerated: false, sex: null,     timePeriod: 'Victorian' },
  { id: 6, type: 'Character', name: 'Marta',           instance: 'Middle-aged',importance: 'Background', aiGenerated: false, sex: 'Female', timePeriod: null },
]

const TYPE_COLORS = {
  Character: { bg: 'rgba(201,146,74,0.15)', color: GOLD },
  Set:       { bg: 'rgba(122,158,200,0.15)', color: '#7A9EC8' },
  Prop:      { bg: 'rgba(92,87,78,0.3)',     color: CHARCOAL },
  Sound:     { bg: 'rgba(74,156,122,0.15)',  color: GREEN },
}

function StarRating({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: n <= value ? GOLD : 'rgba(255,255,255,0.06)', border: n <= value ? 'none' : '1px solid rgba(201,146,74,0.2)', cursor: 'pointer', transition: 'all 0.15s' }} />
        ))}
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontSize: '0.82rem', color: CREAM }}>{label}</span>
      <div onClick={() => onChange(!value)}
        style={{ width: '40px', height: '22px', background: value ? GOLD : 'rgba(255,255,255,0.08)', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '3px', left: value ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: value ? '#1A1810' : CHARCOAL, transition: 'left 0.2s' }} />
      </div>
    </div>
  )
}

function Section({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '0' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: CREAM }}>
        <span style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: open ? GOLD : CHARCOAL }}>{title}</span>
        <span style={{ color: CHARCOAL, fontSize: '0.7rem', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
      </button>
      {open && <div style={{ padding: '4px 20px 20px' }}>{children}</div>}
    </div>
  )
}

function AssetForm({ asset, onClose, onSave }) {
  const isNew = !asset?.id
  const [form, setForm] = useState({
    type: asset?.type || 'Character',
    name: asset?.name || '',
    instance: asset?.instance || '',
    description: '',
    importance: asset?.importance || 'Lead',
    speaking: false,
    sex: asset?.sex || '',
    height: '', weight: '', bodyShape: '', skinTone: '', ethnicity: '',
    hairColor: '', hairLength: '', eyeColor: '',
    scars: '', tattoos: '', clothing: '',
    intelligence: 3, humor: 2, wisdom: 4, charisma: 3,
    timePeriod: asset?.timePeriod || '',
    extMaterial: '', extColor: '', extTexture: '',
    dominantColor: '#2A1F14', secondaryColor: '#4A3828', accentColor: '#C9924A',
    bgImageDesc: '', bgAudioDesc: '',
    royaltyEligible: false, publicDomain: false, culminaDomain: true, aiGenerated: asset?.aiGenerated || false,
    prompt: '', script: '',
  })
  const [showGenPanel, setShowGenPanel] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const isChar = form.type === 'Character'
  const isSet  = form.type === 'Set'

  const lbl = { display: 'block', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }
  const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' }
  const sel = { ...inp, cursor: 'pointer' }
  const txt = { ...inp, minHeight: '80px', resize: 'vertical' }

  function f(key) { return { value: form[key], onChange: e => setForm(fm => ({...fm, [key]: e.target.value})) } }

  function autoGenPrompt() {
    const parts = []
    if (isChar) {
      if (form.name) parts.push(form.name)
      if (form.instance) parts.push(form.instance)
      if (form.sex) parts.push(form.sex)
      if (form.ethnicity) parts.push(form.ethnicity)
      if (form.skinTone) parts.push(`${form.skinTone} skin`)
      if (form.hairColor) parts.push(`${form.hairColor} ${form.hairLength} hair`)
      if (form.eyeColor) parts.push(`${form.eyeColor} eyes`)
      if (form.clothing) parts.push(`wearing: ${form.clothing}`)
    }
    if (isSet) {
      if (form.name) parts.push(form.name)
      if (form.timePeriod) parts.push(form.timePeriod)
      if (form.extMaterial) parts.push(form.extMaterial)
      if (form.bgImageDesc) parts.push(form.bgImageDesc)
    }
    parts.push('Cinematic lighting. 16:9 1080p. Photorealistic.')
    setForm(fm => ({...fm, prompt: parts.join(', ')}))
  }

  async function handleGenerate() {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 2000))
    setGenerating(false); setGenerated(true)
  }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '680px', background: SURFACE, borderLeft: `1px solid ${BORDER}`, zIndex: 500, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: CREAM, margin: 0, fontWeight: 300 }}>{isNew ? 'New Asset' : form.name}</h2>
          {!isNew && <div style={{ fontSize: '0.72rem', color: CHARCOAL, marginTop: '2px' }}>{form.type} · {form.instance}</div>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowGenPanel(p => !p)}
            style={{ background: showGenPanel ? 'rgba(201,146,74,0.15)' : 'none', border: `1px solid ${BORDER}`, color: GOLD, padding: '7px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Generate Image
          </button>
          <button onClick={onClose}
            style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '7px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            Save
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflowY: 'hidden' }}>
        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* A — Identity */}
          <Section title="A — Identity" defaultOpen={true}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Asset Type</label>
                <select {...f('type')} style={sel}>
                  {['Character','Set','Prop','Sound'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Instance</label>
                <input {...f('instance')} style={inp} placeholder="Young, Elderly..." />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Name *</label>
              <input {...f('name')} style={inp} placeholder="Asset name" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Description</label>
              <textarea {...f('description')} style={txt} placeholder="Free-form narrative description..." />
            </div>
            {isChar && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>Character Importance</label>
                  <select {...f('importance')} style={sel}>
                    {['Lead','Supporting','Background','Cameo'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div style={{ paddingTop: '22px' }}>
                  <Toggle label="Speaking Role" value={form.speaking} onChange={v => setForm(fm => ({...fm, speaking: v}))} />
                </div>
              </div>
            )}
          </Section>

          {/* B — Physical */}
          {isChar && (
            <Section title="B — Physical Attributes">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[['Sex',['Female','Male','Non-binary'],'sex'],['Body Shape',['Slim','Athletic','Average','Stocky','Heavy'],'bodyShape']].map(([label, opts, key]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <select {...f(key)} style={sel}><option value="">Select...</option>{opts.map(o => <option key={o}>{o}</option>)}</select>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[['Height','height','5ft 6in'],['Weight (lbs)','weight','130']].map(([label, key, ph]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <input {...f(key)} style={inp} placeholder={ph} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[['Skin Tone',['Fair','Light','Medium','Olive','Tan','Brown','Dark Brown','Deep'],'skinTone'],['Ethnicity',['Caucasian','Hispanic','Black','Asian','Middle Eastern','Mixed','Other'],'ethnicity']].map(([label, opts, key]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <select {...f(key)} style={sel}><option value="">Select...</option>{opts.map(o => <option key={o}>{o}</option>)}</select>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[['Hair Color','hairColor','Brown'],['Hair Length','hairLength','Long'],['Eye Color','eyeColor','Hazel']].map(([label, key, ph]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <input {...f(key)} style={inp} placeholder={ph} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* C — Personality */}
          {isChar && (
            <Section title="C — Personality">
              <StarRating label="Intelligence" value={form.intelligence} onChange={v => setForm(fm => ({...fm, intelligence: v}))} />
              <StarRating label="Humor"        value={form.humor}        onChange={v => setForm(fm => ({...fm, humor: v}))} />
              <StarRating label="Wisdom"       value={form.wisdom}       onChange={v => setForm(fm => ({...fm, wisdom: v}))} />
              <StarRating label="Charisma"     value={form.charisma}     onChange={v => setForm(fm => ({...fm, charisma: v}))} />
            </Section>
          )}

          {/* D — Set/Environment */}
          {isSet && (
            <Section title="D — Set / Environment" defaultOpen={true}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[['Time Period','timePeriod','Victorian'],['Exterior Material','extMaterial','Stone'],['Exterior Color','extColor','Grey'],['Exterior Texture','extTexture','Rough']].map(([label, key, ph]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <input {...f(key)} style={inp} placeholder={ph} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Color Palette</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[['60% Dominant','dominantColor'],['30% Secondary','secondaryColor'],['10% Accent','accentColor']].map(([label, key]) => (
                    <div key={key}>
                      <label style={lbl}>{label}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', background: form[key], border: `1px solid ${BORDER}`, flexShrink: 0 }} />
                        <input type="color" value={form[key]} onChange={e => setForm(fm => ({...fm, [key]: e.target.value}))}
                          style={{ width: '40px', height: '32px', background: 'none', border: `1px solid ${BORDER}`, cursor: 'pointer', padding: 0 }} />
                        <input value={form[key]} onChange={e => setForm(fm => ({...fm, [key]: e.target.value}))} style={{...inp, fontFamily: 'monospace', fontSize: '0.75rem'}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Background Image Description</label>
                <textarea {...f('bgImageDesc')} style={txt} placeholder="Describe the background environment..." />
              </div>
              <div>
                <label style={lbl}>Background Audio Description</label>
                <textarea {...f('bgAudioDesc')} style={{...txt, minHeight: '60px'}} placeholder="Ambient sounds, music mood..." />
              </div>
            </Section>
          )}

          {/* E — Clothing */}
          {isChar && (
            <Section title="E — Clothing">
              <label style={lbl}>Clothing Description</label>
              <textarea {...f('clothing')} style={txt} placeholder="Describe what the character wears..." />
            </Section>
          )}

          {/* F — File Uploads */}
          <Section title="F — File Uploads">
            {['Reference Image','Set / Background Image','Style Image'].map(label => (
              <div key={label} style={{ marginBottom: '14px' }}>
                <label style={lbl}>{label}</label>
                <div style={{ border: `1px dashed rgba(201,146,74,0.2)`, padding: '16px', textAlign: 'center', cursor: 'pointer', fontSize: '0.75rem', color: CHARCOAL }}>
                  Click to upload or drag & drop
                </div>
              </div>
            ))}
          </Section>

          {/* G — Rights */}
          <Section title="G — Rights & Attribution">
            <Toggle label="Royalty Eligible"      value={form.royaltyEligible} onChange={v => setForm(fm => ({...fm, royaltyEligible: v}))} />
            <Toggle label="Public Domain"          value={form.publicDomain}    onChange={v => setForm(fm => ({...fm, publicDomain: v}))} />
            <Toggle label="Culmina Original"       value={form.culminaDomain}   onChange={v => setForm(fm => ({...fm, culminaDomain: v}))} />
            <Toggle label="AI Generated"           value={form.aiGenerated}     onChange={v => setForm(fm => ({...fm, aiGenerated: v}))} />
          </Section>

          {/* H — AI Prompt */}
          <Section title="H — AI Prompt">
            <div style={{ marginBottom: '14px' }}>
              <button onClick={autoGenPrompt}
                style={{ background: 'rgba(201,146,74,0.1)', border: `1px solid rgba(201,146,74,0.25)`, color: GOLD, padding: '8px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Auto-Generate Prompt
              </button>
              <label style={lbl}>Prompt</label>
              <textarea {...f('prompt')} style={{...txt, minHeight: '100px', fontFamily: 'monospace', fontSize: '0.75rem'}} placeholder="AI generation prompt..." />
            </div>
            <div>
              <label style={lbl}>Script / Voice Notes</label>
              <textarea {...f('script')} style={txt} placeholder="Voice or scene script..." />
            </div>
          </Section>
        </div>

        {/* Image Generation Panel */}
        {showGenPanel && (
          <div style={{ width: '280px', borderLeft: `1px solid ${BORDER}`, background: SURFACE2, overflowY: 'auto', flexShrink: 0, padding: '20px 16px' }}>
            <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Image Generation</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{...lbl, marginBottom: '6px'}}>AI Model</label>
              <select style={{ width: '100%', background: SURFACE, border: `1px solid ${BORDER}`, color: CREAM, padding: '8px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', outline: 'none', cursor: 'pointer' }}>
                {['Google ImageFX','Google Wisk','Midjourney','DALL-E 3','Stable Diffusion'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Prompt Preview</label>
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: '10px', fontSize: '0.72rem', color: CHARCOAL, lineHeight: 1.5, minHeight: '60px' }}>
                {form.prompt || 'Auto-generate prompt first...'}
              </div>
            </div>
            <button onClick={handleGenerate} disabled={generating}
              style={{ width: '100%', background: GOLD, border: 'none', color: '#1A1810', padding: '10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '16px', opacity: generating ? 0.7 : 1 }}>
              {generating ? 'Generating...' : 'Generate'}
            </button>
            {generated && (
              <div>
                <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Result</div>
                <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, #1a1208 0%, #2a1f14 50%, #1a1208 100%)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <div style={{ textAlign: 'center', opacity: 0.4 }}>
                    <div style={{ fontSize: '2rem' }}>🎨</div>
                    <div style={{ fontSize: '0.65rem', color: CHARCOAL }}>Generated Image</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={{ flex: 1, background: GREEN, border: 'none', color: '#fff', padding: '7px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Accept</button>
                  <button onClick={handleGenerate} style={{ flex: 1, background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '7px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem' }}>Regenerate</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Assets() {
  const [viewMode, setViewMode] = useState('grid')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [assets, setAssets] = useState(MOCK_ASSETS)

  const filtered = assets.filter(a => typeFilter === 'All' || a.type === typeFilter)

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: 0 }}>Asset Library</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setSelectedAsset(null); setShowForm(true) }}
            style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '9px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            + New Asset
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {['All','Character','Set','Prop','Sound'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ background: typeFilter === t ? 'rgba(201,146,74,0.12)' : 'none', border: `1px solid ${typeFilter === t ? 'rgba(201,146,74,0.3)' : BORDER}`, color: typeFilter === t ? GOLD : CHARCOAL, padding: '6px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.06em', transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {['grid','list'].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              style={{ background: viewMode === m ? 'rgba(201,146,74,0.12)' : 'none', border: `1px solid ${viewMode === m ? 'rgba(201,146,74,0.3)' : BORDER}`, color: viewMode === m ? GOLD : CHARCOAL, padding: '6px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem' }}>
              {m === 'grid' ? '⊞' : '≡'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {filtered.map(asset => {
            const tc = TYPE_COLORS[asset.type] || TYPE_COLORS.Prop
            return (
              <div key={asset.id}
                style={{ background: SURFACE2, border: `1px solid ${BORDER}`, cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,146,74,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                onClick={() => { setSelectedAsset(asset); setShowForm(true) }}>
                <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, #111009 0%, #1a1208 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ fontSize: '2.5rem', opacity: 0.25 }}>{asset.type === 'Character' ? '👤' : '🏛'}</div>
                  {asset.aiGenerated && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(201,146,74,0.2)', color: GOLD, fontSize: '0.6rem', padding: '2px 6px', letterSpacing: '0.08em' }}>AI</div>
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.88rem', color: CREAM, marginBottom: '4px' }}>{asset.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ background: tc.bg, color: tc.color, padding: '2px 8px', fontSize: '0.65rem', letterSpacing: '0.06em', borderRadius: '2px' }}>{asset.type}</span>
                    {asset.instance && <span style={{ fontSize: '0.68rem', color: MUTED }}>{asset.instance}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div style={{ border: `1px solid ${BORDER}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
                {['','Name','Type','Instance','Sex / Period','AI Generated','Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset, i) => {
                const tc = TYPE_COLORS[asset.type] || TYPE_COLORS.Prop
                return (
                  <tr key={asset.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}
                    onClick={() => { setSelectedAsset(asset); setShowForm(true) }}>
                    <td style={{ padding: '12px 16px', width: '48px' }}>
                      <div style={{ width: '40px', height: '40px', background: SURFACE2, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', opacity: 0.4 }}>
                        {asset.type === 'Character' ? '👤' : '🏛'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: CREAM, fontSize: '0.85rem' }}>{asset.name}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ background: tc.bg, color: tc.color, padding: '2px 8px', fontSize: '0.65rem', letterSpacing: '0.06em', borderRadius: '2px' }}>{asset.type}</span></td>
                    <td style={{ padding: '12px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{asset.instance || '--'}</td>
                    <td style={{ padding: '12px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{asset.sex || asset.timePeriod || '--'}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '0.75rem', color: asset.aiGenerated ? GOLD : CHARCOAL }}>{asset.aiGenerated ? 'Yes' : 'No'}</span></td>
                    <td style={{ padding: '12px 16px' }}><button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Edit</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 499 }} onClick={() => setShowForm(false)} />
          <AssetForm asset={selectedAsset} onClose={() => setShowForm(false)} onSave={() => setShowForm(false)} />
        </>
      )}
    </div>
  )
}
