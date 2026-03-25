import { useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const GOLD    = '#C9924A'
const CHARCOAL= '#5C574E'
const CREAM   = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2= '#111009'
const BORDER  = 'rgba(201,146,74,0.12)'
const MUTED   = '#6A6560'
const GREEN   = '#4A9C7A'
const RED     = '#C84B31'
const BLUE    = '#7A9EC8'

const DOMAIN_OPTIONS = ['Public Domain','Culmina Original','User Domain','Title Domain']
const DOMAIN_COLORS  = {
  'Public Domain':    { bg:'rgba(122,158,200,0.15)', color:BLUE },
  'Culmina Original': { bg:'rgba(74,156,122,0.15)',  color:GREEN },
  'User Domain':      { bg:'rgba(201,146,74,0.15)',  color:GOLD },
  'Title Domain':     { bg:'rgba(92,87,78,0.3)',     color:CHARCOAL },
}
const TYPE_COLORS = {
  Character:        { bg:'rgba(201,146,74,0.15)',  color:GOLD },
  Animal:           { bg:'rgba(201,146,74,0.1)',   color:'#D4A96A' },
  'Animate Object': { bg:'rgba(122,158,200,0.15)', color:BLUE },
  Set:              { bg:'rgba(74,156,122,0.15)',  color:GREEN },
  Prop:             { bg:'rgba(92,87,78,0.3)',     color:CHARCOAL },
  Sound:            { bg:'rgba(150,100,200,0.15)', color:'#A87AC8' },
  Other:            { bg:'rgba(92,87,78,0.2)',     color:MUTED },
}
const ASSET_TYPES = ['Person','Animal','Animate Object','Set','Prop','Sound','Other']
const IMAGE_AI_MODELS = ['Google Imagen 4','Google Imagen 4 Ultra','Google Imagen 4 Fast','Midjourney','DALL-E 3','Stable Diffusion','Flux']
const AUDIO_AI_MODELS = ['ElevenLabs','Suno','Udio','Mubert','Adobe Podcast','Bark','MusicGen']

const BLANK_INSTANCE = {
  voiceprompt: '',
  // Voice design fields (ElevenLabs v3)
  voiceage: '', voicegender: '', voiceaccent: '', voicetone: '',
  voicepacing: '', voiceemotionalrange: '', voicequalitytag: '', voicestability: '',
  soundaimodel: '', aiimagemodel: '',
  // Image generation fields
  promptaspectratio: '', negativeprompt: '', styleconsistencyanchor: '',
  // Core instance fields
  instancename:'Main', description:'', characterimportance:'Lead', speakingrole:false,
  sex:'', heightft:5, heightin:6, weightlbs:140, bodyshape:'', skintone:'', ethnicity:'',
  haircolor:'', hairlength:'', eyecolor:'',
  scars:'', tattoos:'', piercings:'', disabilities:'', disfigurements:'',
  extmaterial:'', extcolor:'', exttexture:'',
  intelligence:3, humor:3, wisdom:3, charisma:3,
  clothingdescription:'', timeperiod:'',
  setwidthft:20, setlengthft:30, setheightft:12,
  dominantcolor:'#2A1F14', secondarycolor:'#4A3828', accentcolor:'#C9924A',
  bgimagedesc:'', bgaudiodesc:'', prompt:'', script:'', finalimage:null,
}

const lbl = { display:'block', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'6px' }
const mkInp = (lk) => ({ width:'100%', background:lk?'rgba(255,255,255,0.02)':SURFACE2, border:`1px solid ${BORDER}`, color:lk?MUTED:CREAM, padding:'9px 12px', fontFamily:'DM Sans, sans-serif', fontSize:'0.82rem', outline:'none', boxSizing:'border-box' })
const mkSel = (lk) => ({ ...mkInp(lk), cursor:lk?'default':'pointer' })
const mkTxt = (lk) => ({ ...mkInp(lk), minHeight:'72px', resize:'vertical' })
function iconFor(t) { return t==='Person'?'👤':t==='Animal'?'🐾':t==='Animate Object'?'🤖':t==='Set'?'🏛':t==='Prop'?'🎭':t==='Sound'?'🔊':'📦' }

function Spinner({ label, value, onChange, min=0, max=999, disabled=false }) {
  const btn = { width:'28px', height:'28px', background:'rgba(255,255,255,0.06)', border:`1px solid ${BORDER}`, color:disabled?MUTED:CREAM, cursor:disabled?'default':'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, userSelect:'none' }
  return (
    <div>
      {label && <div style={lbl}>{label}</div>}
      <div style={{ display:'flex', alignItems:'center' }}>
        <button style={btn} onClick={()=>!disabled&&onChange(Math.max(min,value-1))}>−</button>
        <div style={{ minWidth:'44px', height:'28px', background:SURFACE2, border:`1px solid ${BORDER}`, borderLeft:'none', borderRight:'none', color:disabled?MUTED:CREAM, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem' }}>{value}</div>
        <button style={btn} onClick={()=>!disabled&&onChange(Math.min(max,value+1))}>+</button>
      </div>
    </div>
  )
}

function StarRating({ label, value, onChange, disabled=false }) {
  return (
    <div style={{ marginBottom:'14px', opacity:disabled?0.5:1 }}>
      <div style={lbl}>{label}</div>
      <div style={{ display:'flex', gap:'6px' }}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>!disabled&&onChange(n)}
            style={{ width:'28px', height:'28px', borderRadius:'50%', background:n<=value?GOLD:'rgba(255,255,255,0.06)', border:n<=value?'none':`1px solid rgba(201,146,74,0.2)`, cursor:disabled?'default':'pointer', transition:'all 0.15s' }} />
        ))}
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange, disabled=false }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', opacity:disabled?0.5:1 }}>
      <span style={{ fontSize:'0.82rem', color:CREAM }}>{label}</span>
      <div onClick={()=>!disabled&&onChange(!value)}
        style={{ width:'40px', height:'22px', background:value?GOLD:'rgba(255,255,255,0.08)', borderRadius:'11px', position:'relative', cursor:disabled?'default':'pointer', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:'3px', left:value?'21px':'3px', width:'16px', height:'16px', borderRadius:'50%', background:value?'#1A1810':CHARCOAL, transition:'left 0.2s' }} />
      </div>
    </div>
  )
}

function Section({ title, defaultOpen=false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom:`1px solid ${BORDER}` }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ width:'100%', background:'none', border:'none', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
        <span style={{ fontSize:'0.75rem', letterSpacing:'0.12em', textTransform:'uppercase', color:open?GOLD:CHARCOAL }}>{title}</span>
        <span style={{ color:CHARCOAL, fontSize:'0.7rem', transform:open?'rotate(90deg)':'none', transition:'transform 0.15s' }}>▶</span>
      </button>
      {open && <div style={{ padding:'4px 20px 20px' }}>{children}</div>}
    </div>
  )
}

function UploadZone({ label, locked, accept }) {
  return (
    <div style={{ marginBottom:'14px' }}>
      <div style={lbl}>{label}</div>
      <div style={{ border:`1px dashed rgba(201,146,74,0.2)`, padding:'16px', textAlign:'center', cursor:locked?'default':'pointer', fontSize:'0.75rem', color:CHARCOAL, opacity:locked?0.4:1 }}>
        Click to upload or drag & drop{accept?' ('+accept+')':''}
      </div>
    </div>
  )
}

function ImageCreationPanel({ prompt, locked, isSound, onFinalSelected, assetid, data }) {
  const modelList = isSound ? AUDIO_AI_MODELS : IMAGE_AI_MODELS
  const [model,      setModel]      = useState(modelList[0])
  const [variations, setVariations] = useState(isSound?1:3)
  const [generating, setGenerating] = useState(false)
  const [drafts,     setDrafts]     = useState([])   // { id, dataUrl, b64 }
  const [finalIdx,   setFinalIdx]   = useState(null)
  const [error,      setError]      = useState('')
  const sel = { width:'100%', background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, padding:'8px 10px', fontFamily:'DM Sans, sans-serif', fontSize:'0.8rem', outline:'none', cursor:'pointer', boxSizing:'border-box' }

  useEffect(()=>{ setModel(modelList[0]); setDrafts([]); setFinalIdx(null); setError('') },[isSound])

  async function handleCreate() {
    setGenerating(true); setFinalIdx(null); setError('')
    try {
      const IMAGEN_MODELS = {'Google Imagen 4':'imagen-4.0-generate-001','Google Imagen 4 Ultra':'imagen-4.0-ultra-generate-001','Google Imagen 4 Fast':'imagen-4.0-fast-generate-001'}
        const imagenModelId = IMAGEN_MODELS[model]
        if(!isSound && imagenModelId) {
        const apiKey = import.meta.env.VITE_GOOGLE_IMAGEN_KEY
        if(!apiKey) throw new Error('VITE_GOOGLE_IMAGEN_KEY not set in .env.local')
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${imagenModelId}:predict?key=${apiKey}`,
          {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({
              instances:[{ prompt: prompt||'Photorealistic character portrait. Cinematic lighting. 16:9 1080p.' }],
              parameters:{ sampleCount: variations, aspectRatio:'16:9', safetyFilterLevel:'block_some' }
            })
          }
        )
        if(!res.ok) {
          const err = await res.json().catch(()=>({}))
          throw new Error(err?.error?.message || `API error ${res.status}`)
        }
        const json = await res.json()
        const images = (json.predictions||[]).map((p,i)=>({
          id: Date.now()+i,
          dataUrl: `data:${p.mimeType||'image/png'};base64,${p.bytesBase64Encoded}`,
          b64: p.bytesBase64Encoded,
          mime: p.mimeType||'image/png'
        }))
        if(!images.length) throw new Error('No images returned — prompt may have been filtered')
        setDrafts(images)
      } else if (isSound) {
        // ElevenLabs voice generation — N variations
        const voiceData = data || {}
        const voiceId = voiceData.elevenlabs_voice_id || voiceData.voiceprompt || prompt
        if (!voiceId) throw new Error('No ElevenLabs Voice ID or Voice Prompt set. Fill in the Voice & Sound section first.')
        const text = voiceData.script || prompt || `${voiceData.instancename || 'Character'} voice sample.`
        const stabilitySteps = [0.5, 0.35, 0.65, 0.2, 0.8, 0.45]
        const audioDrafts = []
        for (let i = 0; i < variations; i++) {
          const res = await fetch('/api/elevenlabs-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              voice_id: voiceId,
              stability: stabilitySteps[i % stabilitySteps.length],
              shot_id: `asset_${assetid || Date.now()}_v${i}`,
            }),
          })
          const result = await res.json()
          if (!res.ok) throw new Error(result.error || `ElevenLabs error on variation ${i+1}`)
          audioDrafts.push({
            id: Date.now() + i,
            audioUrl: result.url || null,
            label: `Variation ${i + 1}`,
            stability: stabilitySteps[i % stabilitySteps.length],
          })
        }
        setDrafts(audioDrafts)
      } else {
        // Placeholder for other image models (Midjourney, etc.)
        await new Promise(r=>setTimeout(r,1400))
        setDrafts(Array.from({length:variations},(_,i)=>({
          id:Date.now()+i, dataUrl:null, b64:null, seed:Math.random()
        })))
      }
    } catch(e) { setError(e.message) }
    setGenerating(false)
  }

  function selectFinal(i) {
    setFinalIdx(i)
    onFinalSelected&&onFinalSelected(drafts[i].dataUrl||`stub_${drafts[i].id}`, true)
  }

  function mockGradient(seed) { const h=Math.floor((seed||0.5)*300+20); return `linear-gradient(135deg,hsl(${h},28%,7%) 0%,hsl(${h+40},22%,14%) 50%,hsl(${h},18%,7%) 100%)` }

  return (
    <div style={{ background:'rgba(201,146,74,0.03)', border:`1px solid rgba(201,146,74,0.1)`, padding:'16px', marginTop:'12px' }}>
      <div style={{ fontSize:'0.68rem', color:GOLD, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'16px' }}>{isSound?'Audio Creation':'Image Creation'}</div>
      <div style={{ marginBottom:'14px' }}>
        <div style={lbl}>AI Model</div>
        <select value={model} onChange={e=>setModel(e.target.value)} style={sel} disabled={locked}>
          {modelList.map(m=><option key={m}>{m}</option>)}
        </select>
      </div>
      {!isSound && (
        <div style={{ display:'flex', alignItems:'flex-end', gap:'16px', marginBottom:'16px', flexWrap:'wrap' }}>
          <Spinner label="# of Variations" value={variations} onChange={setVariations} min={1} max={6} disabled={locked} />
          <button onClick={handleCreate} disabled={generating||locked}
            style={{ background:locked?'rgba(255,255,255,0.04)':generating?'rgba(201,146,74,0.5)':GOLD, border:'none', color:locked?MUTED:'#1A1810', padding:'8px 18px', cursor:locked||generating?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>
            {generating?'Creating...':locked?'🔒 Locked':'Create Image Drafts'}
          </button>
        </div>
      )}
      {isSound && (
        <button onClick={handleCreate} disabled={generating||locked}
          style={{ background:locked?'rgba(255,255,255,0.04)':generating?'rgba(201,146,74,0.5)':GOLD, border:'none', color:locked?MUTED:'#1A1810', padding:'8px 18px', cursor:locked||generating?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, marginBottom:'16px' }}>
          {generating?'Generating...':locked?'🔒 Locked':'Generate Audio'}
        </button>
      )}
      {locked && <div style={{ fontSize:'0.72rem', color:CHARCOAL, fontStyle:'italic' }}>Asset is locked. Clone to create an editable copy.</div>}
      {isSound && drafts.length>0 && (
        <div style={{ marginTop:'12px' }}>
          <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' }}>Select Final Voice</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {drafts.map((d,i)=>(
              <div key={d.id} onClick={()=>selectFinal(i)}
                style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 14px',
                  border:`2px solid ${finalIdx===i?GOLD:BORDER}`, borderRadius:3,
                  cursor:'pointer', background:finalIdx===i?'rgba(201,146,74,0.06)':'rgba(255,255,255,0.01)',
                  transition:'border-color 0.15s' }}>
                <span style={{ fontSize:12, color:finalIdx===i?GOLD:CHARCOAL, fontWeight:700 }}>
                  {finalIdx===i?'✓':'○'}
                </span>
                <span style={{ fontSize:'0.78rem', color:CREAM, flex:1 }}>{d.label}</span>
                <span style={{ fontSize:'0.68rem', color:MUTED }}>stability {d.stability}</span>
                {d.audioUrl && (
                  <audio controls src={d.audioUrl}
                    style={{ height:28, maxWidth:180 }}
                    onClick={e=>e.stopPropagation()} />
                )}
                {!d.audioUrl && <span style={{ fontSize:'0.68rem', color:MUTED }}>No URL — R2 not configured</span>}
              </div>
            ))}
          </div>
          {finalIdx!==null && (
            <button onClick={()=>onFinalSelected&&onFinalSelected(drafts[finalIdx].audioUrl, true)}
              style={{ marginTop:'10px', background:GOLD, border:'none', color:'#1A1810',
                padding:'7px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif',
                fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>
              Save as Final Voice
            </button>
          )}
        </div>
      )}
      {error && <div style={{ marginTop:'8px', padding:'8px 12px', background:'rgba(200,75,49,0.1)', border:'1px solid rgba(200,75,49,0.25)', color:RED, fontSize:'0.75rem', lineHeight:1.4 }}>⚠ {error}</div>}
      {!isSound && drafts.length>0 && (
        <div>
          <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' }}>Select Final Image</div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(drafts.length,3)},1fr)`, gap:'8px' }}>
            {drafts.map((d,i)=>(
              <div key={d.id}>
                <div onClick={()=>selectFinal(i)} style={{ aspectRatio:'1', background:d.dataUrl?'#000':mockGradient(d.seed), border:`2px solid ${finalIdx===i?GOLD:BORDER}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', transition:'border-color 0.15s', overflow:'hidden' }}>
                  {d.dataUrl
                    ? <img src={d.dataUrl} alt={`Variation ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    : <div style={{ opacity:0.15, fontSize:'1.8rem' }}>🎨</div>
                  }
                  {finalIdx===i && <div style={{ position:'absolute', top:'6px', right:'6px', background:GOLD, color:'#1A1810', width:'18px', height:'18px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, zIndex:2 }}>✓</div>}
                  {!d.dataUrl && <div style={{ position:'absolute', bottom:'4px', left:'50%', transform:'translateX(-50%)', fontSize:'0.6rem', color:MUTED, whiteSpace:'nowrap' }}>Variation {i+1}</div>}
                </div>
                <button onClick={()=>selectFinal(i)}
                  style={{ width:'100%', marginTop:'4px', background:finalIdx===i?'rgba(201,146,74,0.12)':'none', border:`1px solid ${finalIdx===i?'rgba(201,146,74,0.35)':BORDER}`, color:finalIdx===i?GOLD:CHARCOAL, padding:'5px 0', cursor:'pointer', fontSize:'0.63rem', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'DM Sans, sans-serif' }}>
                  {finalIdx===i?'✓ Final':'Select Final'}
                </button>
              </div>
            ))}
          </div>
          {finalIdx!==null && (
            <div style={{ marginTop:'10px', display:'flex', justifyContent:'flex-end', gap:'8px', alignItems:'center' }}>
              <span style={{ fontSize:'0.72rem', color:GREEN }}>✓ Variation {finalIdx+1} selected as final</span>
              <button onClick={handleCreate} disabled={generating} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.68rem' }}>Re-run</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SoundModelSelect({ f, sel }) {
  const [opts, setOpts] = useState([])
  useEffect(() => {
    supabase.from('nvpair').select('nvvalue,nvname')
      .eq('nvgroup','SoundAIModel').eq('active',true)
      .then(({data}) => setOpts(data && data.length ? data : [
        {nvvalue:'elevenlabs_v3',nvname:'ElevenLabs v3'},
        {nvvalue:'elevenlabs_v2',nvname:'ElevenLabs v2'},
        {nvvalue:'openai_tts',nvname:'OpenAI TTS'},
        {nvvalue:'cartesia',nvname:'Cartesia'},
      ]))
  }, [])
  return (
    <select {...f('soundaimodel')} style={sel}>
      <option value="">— ElevenLabs (default) —</option>
      {opts.map(o => <option key={o.nvvalue} value={o.nvvalue}>{o.nvname}</option>)}
    </select>
  )
}

function InstanceForm({ data, onChange, assetMeta, locked, onSaveReminder, onVoiceIdSaved }) {
  const { assettype } = assetMeta
  const inp = mkInp(locked); const sel = mkSel(locked); const txt = mkTxt(locked)
  const isChar   = assettype==='Person'
  const isAnimal = assettype==='Animal'
  const isAnimObj= assettype==='Animate Object'
  const isSet    = assettype==='Set'
  const isProp   = assettype==='Prop'
  const isSound  = assettype==='Sound'
  const isPerson = isChar||isAnimal||isAnimObj
  const hasExterior = isAnimObj||isProp

  function f(key) { return { value:data[key]??'', onChange:e=>!locked&&onChange(key,e.target.value), disabled:locked } }
  function set(key,val) { !locked&&onChange(key,val) }

  function autoGenPrompt() {
    const parts=[]
    if(isPerson) {
      if(assetMeta.name)    parts.push(assetMeta.name)
      if(data.characterimportance) parts.push(data.characterimportance+' character')
      if(data.sex)          parts.push(data.sex)
      if(isChar&&data.ethnicity) parts.push(data.ethnicity)
      if(isChar&&data.skintone)  parts.push(`${data.skintone} skin`)
      if(data.heightft)     parts.push(`${data.heightft}ft ${data.heightin??0}in`)
      if(data.weightlbs)    parts.push(`${data.weightlbs}lbs`)
      if(isChar&&data.bodyshape) parts.push(`${data.bodyshape} build`)
      if(data.haircolor)    parts.push(`${data.haircolor} ${data.hairlength||''} hair`.trim())
      if(data.eyecolor)     parts.push(`${data.eyecolor} eyes`)
      if(data.extmaterial)  parts.push(data.extmaterial)
      if(data.scars)        parts.push(`Scars: ${data.scars}`)
      if(data.tattoos)      parts.push(`Tattoos: ${data.tattoos}`)
      if(data.piercings)    parts.push(`Piercings: ${data.piercings}`)
      if(data.clothingdescription) parts.push(`Wearing: ${data.clothingdescription}`)
      if(data.script)       parts.push(`Voice: ${data.script}`)
    }
    if(isSet) {
      if(assetMeta.name)   parts.push(assetMeta.name)
      if(data.timeperiod)  parts.push(data.timeperiod)
      if(data.extmaterial) parts.push(data.extmaterial)
      if(data.bgimagedesc) parts.push(data.bgimagedesc)
    }
    if(isSound) { if(assetMeta.name) parts.push(assetMeta.name); if(data.script) parts.push(data.script) }
    if(!isSound) parts.push('Cinematic lighting. 16:9 1080p. Photorealistic.')
    onChange('prompt',parts.join(', '))
  }

  return (
    <div>
      {/* Identity */}
      <Section title="Identity" defaultOpen={true}>
        {/* Name — prominent labeled field */}
        <div style={{ marginBottom:'16px', padding:'12px 16px', background:'rgba(201,146,74,0.04)', border:`1px solid rgba(201,146,74,0.1)` }}>
          <div style={{ fontSize:'0.68rem', color:GOLD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'6px' }}>Asset Name *</div>
          {locked
            ? <div style={{ color:CREAM, fontSize:'1rem', fontFamily:'Cormorant Garamond, serif', fontWeight:300 }}>{assetMeta.name||'—'}</div>
            : <input value={assetMeta.name} onChange={e=>assetMeta.onNameChange(e.target.value)}
                style={{ ...inp, fontSize:'1rem', fontFamily:'Cormorant Garamond, serif', fontWeight:300 }} placeholder="Enter asset name..." />
          }
        </div>

        <div style={{ marginBottom:'12px' }}>
          <div style={lbl}>Description</div>
          <textarea {...f('description')} style={txt} placeholder="Free-form narrative description..." />
        </div>

        {/* Image gen params — all asset types */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
          <div>
            <div style={lbl}>Aspect Ratio</div>
            <select {...f('promptaspectratio')} style={sel}>
              <option value="">— Select —</option>
              <option value="3:4">3:4 — Portrait (Imagen)</option>
              <option value="9:16">9:16 — Vertical (Action)</option>
              <option value="1:1">1:1 — Square</option>
              <option value="16:9">16:9 — Wide</option>
            </select>
          </div>
          <div>
            <div style={lbl}>Negative Prompt</div>
            <input {...f('negativeprompt')} style={mkInp(locked)} placeholder="e.g. cartoon, blur, text" />
          </div>
        </div>
        <div style={{ marginBottom:'10px' }}>
          <div style={lbl}>Style Consistency Anchor</div>
          <textarea {...f('styleconsistencyanchor')} style={{...mkTxt(locked),minHeight:'56px'}} placeholder="Phrase reused across ALL instances e.g. 'always wearing olive uniform, scar above left eye'" />
          <div style={{ fontSize:'0.65rem', color:'#6A6560', marginTop:'3px' }}>Prepended to every image prompt for this asset to maintain visual consistency across generations.</div>
        </div>

        {isPerson && <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <div style={lbl}>Character Importance</div>
              <select {...f('characterimportance')} style={sel}>
                {['Lead','Supporting','Background','Cameo'].map(i=><option key={i}>{i}</option>)}
              </select>
            </div>
            <div style={{ paddingTop:'22px' }}>
              <Toggle label="Speaking Role" value={!!data.speakingrole} onChange={v=>set('speakingrole',v)} disabled={locked} />
            </div>
          </div>
        </>}

        {isSound && (
          <div style={{ marginBottom:'4px' }}>
            <div style={lbl}>Script / Sound Description</div>
            <textarea {...f('script')} style={{...txt,minHeight:'60px'}} placeholder="Describe the sound, music mood, or spoken content..." />
          </div>
        )}

        {(isSet||isProp||assettype==='Other') && (
          <div style={{ marginBottom:'4px' }}>
            <div style={lbl}>Notes</div>
            <textarea {...f('script')} style={{...txt,minHeight:'60px'}} placeholder="Additional context or notes..." />
          </div>
        )}
      </Section>

      {/* Physical Attributes — Character, Animal, Animate Object */}
      {isPerson && (
        <Section title="Physical Attributes">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
            <div>
              <div style={lbl}>Sex</div>
              <select {...f('sex')} style={sel}>
                <option value="">Select...</option>
                {['Female','Male','Non-binary','Other'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            {isChar && (
              <div>
                <div style={lbl}>Body Shape</div>
                <select {...f('bodyshape')} style={sel}>
                  <option value="">Select...</option>
                  {['Slim','Athletic','Average','Stocky','Heavy','Petite','Curvy'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
            <div>
              <div style={lbl}>Height</div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Spinner value={data.heightft??5} onChange={v=>set('heightft',v)} min={1} max={30} disabled={locked} />
                <span style={{ color:CHARCOAL, fontSize:'0.75rem' }}>ft</span>
                <Spinner value={data.heightin??6} onChange={v=>set('heightin',v)} min={0} max={11} disabled={locked} />
                <span style={{ color:CHARCOAL, fontSize:'0.75rem' }}>in</span>
              </div>
            </div>
            <Spinner label="Weight (lbs)" value={data.weightlbs??140} onChange={v=>set('weightlbs',v)} min={1} max={9999} disabled={locked} />
          </div>
          {isChar && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
              <div>
                <div style={lbl}>Skin Tone</div>
                <select {...f('skintone')} style={sel}>
                  <option value="">Select...</option>
                  {['Fair','Light','Medium','Olive','Tan','Brown','Dark Brown','Deep'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div style={lbl}>Ethnicity</div>
                <select {...f('ethnicity')} style={sel}>
                  <option value="">Select...</option>
                  {['Caucasian','Hispanic','Black','Asian','Middle Eastern','South Asian','Mixed','Other'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'16px' }}>
            {[['Hair Color','haircolor','Brown'],['Hair Length','hairlength','Long'],['Eye Color','eyecolor','Hazel']].map(([label,key,ph])=>(
              <div key={key}><div style={lbl}>{label}</div><input {...f(key)} style={inp} placeholder={ph} /></div>
            ))}
          </div>
          {[['Scars','scars'],['Tattoos','tattoos'],['Piercings','piercings'],['Disabilities','disabilities'],['Disfigurements','disfigurements']].map(([label,key])=>(
            <div key={key} style={{ marginBottom:'10px' }}>
              <div style={lbl}>{label}</div>
              <textarea {...f(key)} style={{...txt,minHeight:'52px'}} placeholder={`Describe ${label.toLowerCase()}, or leave blank for none...`} />
            </div>
          ))}
        </Section>
      )}

      {/* Exterior Attributes — Animate Object + Prop */}
      {hasExterior && (
        <Section title="Exterior Attributes" defaultOpen={isAnimObj}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            {[['Exterior Material','extmaterial','Metal / Wood'],['Exterior Color','extcolor','Silver'],['Exterior Texture','exttexture','Smooth']].map(([label,key,ph])=>(
              <div key={key}><div style={lbl}>{label}</div><input {...f(key)} style={inp} placeholder={ph} /></div>
            ))}
          </div>
          {isAnimObj && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
              {[['Hair / Filament Color','haircolor',''],['Hair / Filament Length','hairlength',''],['Eye / Lens Color','eyecolor','']].map(([label,key,ph])=>(
                <div key={key}><div style={lbl}>{label}</div><input {...f(key)} style={inp} placeholder={ph} /></div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Prop Dimensions (ft + in) */}
      {isProp && (
        <Section title="Dimensions">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' }}>
            {[['Width','widthft','widthin'],['Length','lengthft','lengthin'],['Height','propheightft','propheightin']].map(([label,ftKey,inKey])=>(
              <div key={label}>
                <div style={lbl}>{label}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <Spinner value={data[ftKey]??1} onChange={v=>set(ftKey,v)} min={0} max={999} disabled={locked} />
                  <span style={{ color:CHARCOAL, fontSize:'0.75rem' }}>ft</span>
                  <Spinner value={data[inKey]??0} onChange={v=>set(inKey,v)} min={0} max={11} disabled={locked} />
                  <span style={{ color:CHARCOAL, fontSize:'0.75rem' }}>in</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Personality — Person-like */}
      {isPerson && (
        <Section title="Personality">
          {[['Intelligence','intelligence'],['Humor','humor'],['Wisdom','wisdom'],['Charisma','charisma']].map(([label,key])=>(
            <StarRating key={key} label={label} value={data[key]??3} onChange={v=>set(key,v)} disabled={locked} />
          ))}
        </Section>
      )}

      {/* Clothing — Person-like */}
      {isPerson && (
        <Section title="Clothing">
          <div style={lbl}>Clothing Description</div>
          <textarea {...f('clothingdescription')} style={txt} placeholder="Describe what the character wears..." />
        </Section>
      )}

      {/* Set / Environment */}
      {isSet && (
        <Section title="Set / Environment" defaultOpen={true}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
            {[['Time Period','timeperiod','Victorian'],['Exterior Material','extmaterial','Stone'],['Exterior Color','extcolor','Grey'],['Exterior Texture','exttexture','Rough']].map(([label,key,ph])=>(
              <div key={key}><div style={lbl}>{label}</div><input {...f(key)} style={inp} placeholder={ph} /></div>
            ))}
          </div>
          {/* Set dimensions in feet */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' }}>Dimensions</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' }}>
              {[['Width','setwidthft'],['Length','setlengthft'],['Height','setheightft']].map(([label,key])=>(
                <div key={key}>
                  <div style={lbl}>{label}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <Spinner value={data[key]??20} onChange={v=>set(key,v)} min={1} max={999} disabled={locked} />
                    <span style={{ color:CHARCOAL, fontSize:'0.75rem' }}>ft</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Color palette */}
          <div style={{ marginBottom:'14px' }}>
            <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' }}>Color Palette</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
              {[['60% Dominant','dominantcolor'],['30% Secondary','secondarycolor'],['10% Accent','accentcolor']].map(([label,key])=>(
                <div key={key}>
                  <div style={lbl}>{label}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <div style={{ width:'28px', height:'28px', background:data[key]||'#000', border:`1px solid ${BORDER}`, flexShrink:0 }} />
                    <input type="color" value={data[key]||'#000000'} onChange={e=>set(key,e.target.value)} style={{ width:'32px', height:'28px', background:'none', border:`1px solid ${BORDER}`, cursor:locked?'default':'pointer', padding:0 }} />
                    <input value={data[key]||''} onChange={e=>set(key,e.target.value)} style={{...inp,fontFamily:'monospace',fontSize:'0.72rem',flex:1}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:'12px' }}><div style={lbl}>Background Image Description</div><textarea {...f('bgimagedesc')} style={txt} placeholder="Describe the background environment..." /></div>
          <div><div style={lbl}>Background Audio Description</div><textarea {...f('bgaudiodesc')} style={{...txt,minHeight:'60px'}} placeholder="Ambient sounds, music mood..." /></div>
        </Section>
      )}

      {/* File Uploads — all types */}
      <Section title="File Uploads">
        {!isSound && <UploadZone label="Reference Image" locked={locked} accept="JPG, PNG, WEBP" />}
        {isSet     && <UploadZone label="Set / Background Image" locked={locked} accept="JPG, PNG, WEBP" />}
        {!isSound  && <UploadZone label="Style Image" locked={locked} accept="JPG, PNG, WEBP" />}
        <UploadZone label="Audio File" locked={locked} accept="MP3, WAV, M4A, OGG" />
      </Section>

      {/* ── Voice & Sound ── */}

      {!isSet && !isProp && (
                <Section title="Voice & Sound" defaultOpen={true}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
            <div>
              <div style={lbl}>Age</div>
              <input {...f('voiceage')} style={mkInp(locked)} placeholder="e.g. late 20s, mid 50s" />
            </div>
            <div>
              <div style={lbl}>Gender</div>
              <select {...f('voicegender')} style={mkSel(locked)}>
                <option value="">— Select —</option>
                {['Male','Female','Neutral'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div style={lbl}>Accent</div>
              <input {...f('voiceaccent')} style={mkInp(locked)} placeholder="e.g. Eastern European, RP British" />
            </div>
            <div>
              <div style={lbl}>Tone / Timbre</div>
              <input {...f('voicetone')} style={mkInp(locked)} placeholder="e.g. Gravelly, breathy, crisp" />
            </div>
            <div>
              <div style={lbl}>Pacing</div>
              <input {...f('voicepacing')} style={mkInp(locked)} placeholder="e.g. Slow and deliberate" />
            </div>
            <div>
              <div style={lbl}>Emotional Range</div>
              <select {...f('voiceemotionalrange')} style={mkSel(locked)}>
                <option value="">— Select —</option>
                {['Wide','Neutral','Narrow'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div style={lbl}>Quality Tag</div>
              <select {...f('voicequalitytag')} style={mkSel(locked)}>
                <option value="">— Select —</option>
                <option value="Perfect audio quality">Perfect audio quality</option>
                <option value="Studio-quality recording">Studio-quality recording</option>
                <option value="Clear and natural">Clear and natural</option>
              </select>
            </div>
            <div>
              <div style={lbl}>Stability Mode</div>
              <select {...f('voicestability')} style={mkSel(locked)}>
                <option value="">— Select —</option>
                <option value="Creative">Creative — expressive</option>
                <option value="Natural">Natural — balanced</option>
                <option value="Robust">Robust — consistent</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom:'10px' }}>
            <div style={lbl}>Script / Voice Notes</div>
            <textarea {...f('script')} style={{...mkTxt(locked),minHeight:'60px'}} placeholder="Dialog, voice notes, personality cues, scene context..." />
          </div>
          {/* Voice generation for non-Sound character assets */}
          {!isSound && (
            <div style={{ marginTop:'4px' }}>
              <div style={{ fontSize:'0.68rem', color:GOLD, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'10px' }}>Voice Creation</div>
              <ImageCreationPanel
                prompt={data.voiceprompt}
                locked={locked}
                isSound={true}
                assetid={assetMeta?.assetid}
                data={data}
                onFinalSelected={(url, remind) => {
                  onVoiceIdSaved && onVoiceIdSaved(url)
                  remind && onSaveReminder && onSaveReminder()
                }}
              />
            </div>
          )}
        </Section>
      )}

            {/* AI Prompt */}
      <Section title="AI Prompt" defaultOpen={true}>

        {/* Row 1: Image AI Model + Generate Image Prompt button */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', marginBottom:'12px' }}>
          <div style={{ flex:1 }}>
            <div style={lbl}>Image AI Model</div>
            <select {...f('aiimagemodel')} style={sel}>
              <option value="">— Default (Imagen 4) —</option>
              <option value="imagen4">Google Imagen 4</option>
              <option value="imagen4ultra">Imagen 4 Ultra</option>
              <option value="imagen4fast">Imagen 4 Fast (Draft)</option>
              <option value="midjourney">Midjourney</option>
              <option value="flux">Flux</option>
              <option value="grok_aurora">Grok Aurora</option>
            </select>
          </div>
          <button onClick={autoGenPrompt} disabled={locked}
            style={{ background:locked?'rgba(255,255,255,0.03)':'rgba(201,146,74,0.1)', border:`1px solid rgba(201,146,74,0.25)`, color:locked?MUTED:GOLD, padding:'9px 16px', cursor:locked?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap', flexShrink:0 }}>
            Generate Image Prompt
          </button>
        </div>

        {/* AI Generated Prompt — read-only original */}
        {data.aigeneratedprompt && (
          <div style={{ marginBottom:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'5px' }}>
              <div style={lbl}>AI Generated Prompt</div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                {data.aigeneratedpromptdate && <span style={{ fontSize:'0.62rem', color:'#6A6560' }}>{new Date(data.aigeneratedpromptdate).toLocaleString()}</span>}
                <button onClick={() => { if(data.prompt && data.prompt !== data.aigeneratedprompt){ if(!window.confirm('Overwrite your edited Prompt?')) return } onChange('prompt', data.aigeneratedprompt) }}
                  style={{ background:'transparent', border:'1px solid rgba(201,146,74,0.25)', color:'#C9924A', padding:'3px 10px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.65rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  ↓ Copy to Prompt
                </button>
              </div>
            </div>
            <textarea readOnly value={data.aigeneratedprompt||''} style={{...txt, minHeight:'70px', fontFamily:'monospace', fontSize:'0.72rem', opacity:0.55, cursor:'default'}} />
          </div>
        )}

        {/* Row 2: Prompt text box */}
        <div style={{ marginBottom:'12px' }}>
          <div style={lbl}>Prompt</div>
          <textarea {...f('prompt')} style={{...txt,minHeight:'100px',fontFamily:'monospace',fontSize:'0.75rem'}} placeholder="AI image/video generation prompt..." />
        </div>

        {/* Image Creation collapsible */}
        <Section title={isSound ? 'Audio Creation' : 'Image Creation'} defaultOpen={true}>
          <ImageCreationPanel prompt={data.prompt} locked={locked} isSound={isSound} onFinalSelected={(url,remind)=>{ onChange('finalimage',url); remind&&onSaveReminder&&onSaveReminder() }} />
        </Section>

        {/* Row 3: Voice AI Model + Generate Voice Prompt button */}
        {!isSet && !isProp && (
          <>
            <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', marginTop:'14px', marginBottom:'8px' }}>
              <div style={{ flex:1 }}>
                <div style={lbl}>Voice AI Model</div>
                <SoundModelSelect f={f} sel={sel} locked={locked} />
              </div>
              <button
                disabled={locked}
                onClick={async()=>{
                  if(locked) return
                  const soundModel = data.soundaimodel || 'elevenlabs_v3'
                  const parts = []
                  if(data.voicequalitytag) parts.push(data.voicequalitytag + '.')
                  const identity = [data.voicegender, data.voiceage].filter(Boolean).join(' ')
                  if(identity) parts.push(identity + ' voice.')
                  if(data.voiceaccent) parts.push(data.voiceaccent + ' accent.')
                  if(data.voicetone) parts.push(data.voicetone + ' timbre.')
                  if(data.voicepacing) parts.push(data.voicepacing + ' pace.')
                  if(data.voiceemotionalrange) parts.push(data.voiceemotionalrange + ' emotional range.')
                  if(data.voicestability) parts.push(data.voicestability + ' delivery style.')
                  const structuredPrompt = parts.join(' ')
                  if(parts.length >= 4) { onChange('voiceprompt', structuredPrompt); return }
                  const res = await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:200,messages:[{role:'user',content:`Generate a ${soundModel.includes('elevenlabs') ? 'ElevenLabs Voice Design v3' : soundModel} voice prompt for: ${data.instancename||'this character'}.
Known attributes: ${structuredPrompt||'none'}
Image reference: ${(data.prompt||'').slice(0,200)}
Style anchor: ${data.styleconsistencyanchor||''}
Return ONLY the prompt, one concise sentence.`}]})})
                  const d = await res.json()
                  onChange('voiceprompt', d.content?.map(b=>b.text||'').join('')||'')
                }}
                style={{ background:locked?'rgba(255,255,255,0.03)':'rgba(201,146,74,0.1)', border:`1px solid rgba(201,146,74,0.25)`, color:locked?MUTED:GOLD, padding:'9px 16px', cursor:locked?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap', flexShrink:0 }}>
                Generate Voice Prompt
              </button>
            </div>

            {/* Row 4: Voice Prompt text box */}
            <div style={{ marginBottom:'6px' }}>
              <div style={lbl}>Voice Prompt</div>
              <textarea {...f('voiceprompt')} style={{...txt,minHeight:'80px'}} placeholder="ElevenLabs/TTS voice direction — generated above or write manually..." />
            </div>
          </>
        )}


      </Section>
    </div>
  )
}

function AssetForm({ assetId, onClose, onSaved, onCloned }) {
  const { endUser } = useAuth()
  const [savedAssetId, setSavedAssetId] = useState(assetId)
  const isNew = !savedAssetId
  const [assetMeta, setAssetMeta] = useState({ name:'', assettype:'Person', domain:'User Domain', aigenerated:false, royaltyeligible:false, locked:false })
  const [instances, setInstances] = useState([{ _tempId:1, ...BLANK_INSTANCE }])
  const [activeKey, setActiveKey] = useState(1)
  const [addingInst,  setAddingInst]  = useState(false)
  const [newInstName, setNewInstName] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [toast,   setToast]   = useState('')

  useEffect(()=>{
    if(!assetId) return
    async function load() {
      setLoading(true)
      const { data:a }     = await supabase.from('assets').select('*').eq('assetid',assetId).single()
      const { data:insts } = await supabase.from('assetinstances').select('*').eq('assetid',assetId).eq('activestatus','A').order('instanceid')
      if(a) setAssetMeta({ name:a.name, assettype:a.assettype, domain:a.domain||'User Domain', aigenerated:!!a.aigenerated, royaltyeligible:!!a.royaltyeligible, locked:!!a.locked, elevenlabs_voice_id:a.elevenlabs_voice_id||'' })
      if(insts&&insts.length>0) { setInstances(insts); setActiveKey(insts[0].instanceid) }
      setLoading(false)
    }
    load()
  },[assetId])

  const locked = assetMeta.locked
  const activeInst = instances.find(i=>(i.instanceid||i._tempId)===activeKey)||instances[0]
  function updateActiveInst(key,val) { setInstances(is=>is.map(i=>(i.instanceid||i._tempId)===activeKey?{...i,[key]:val}:i)) }
  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''),3000) }

  async function handleSave() {
    if(!assetMeta.name.trim()) { showToast('Asset name is required'); return }
    setSaving(true)
    try {
      let aid = savedAssetId
      if(isNew) {
        const { data:a, error:ae } = await supabase.from('assets').insert({
          name:assetMeta.name, assetname:assetMeta.name, assettype:assetMeta.assettype, domain:assetMeta.domain,
          aigenerated:assetMeta.aigenerated, royaltyeligible:assetMeta.royaltyeligible,
          locked:false, activestatus:'A', createdate:new Date().toISOString(), updatedate:new Date().toISOString(),
          createdby:endUser?.enduserid
        }).select().single()
        if(ae) throw ae
        aid = a.assetid
      } else {
        await supabase.from('assets').update({
          name:assetMeta.name, assetname:assetMeta.name, assettype:assetMeta.assettype, domain:assetMeta.domain,
          aigenerated:assetMeta.aigenerated, royaltyeligible:assetMeta.royaltyeligible,
          elevenlabs_voice_id:assetMeta.elevenlabs_voice_id||null,
          updatedate:new Date().toISOString(), updatedby:endUser?.enduserid
        }).eq('assetid',aid)
      }
      for(const inst of instances) {
        const payload = {
          assetid:aid, instancename:inst.instancename||'Main',
          description:inst.description||null, characterimportance:inst.characterimportance||null,
          speakingrole:!!inst.speakingrole, sex:inst.sex||null,
          heightft:inst.heightft||null, heightin:inst.heightin||null, weightlbs:inst.weightlbs||null,
          bodyshape:inst.bodyshape||null, skintone:inst.skintone||null, ethnicity:inst.ethnicity||null,
          haircolor:inst.haircolor||null, hairlength:inst.hairlength||null, eyecolor:inst.eyecolor||null,
          scars:inst.scars||null, tattoos:inst.tattoos||null, piercings:inst.piercings||null,
          disabilities:inst.disabilities||null, disfigurements:inst.disfigurements||null,
          extmaterial:inst.extmaterial||null, extcolor:inst.extcolor||null, exttexture:inst.exttexture||null,
          intelligence:inst.intelligence||3, humor:inst.humor||3, wisdom:inst.wisdom||3, charisma:inst.charisma||3,
          clothingdescription:inst.clothingdescription||null, timeperiod:inst.timeperiod||null,
          setwidthft:inst.setwidthft||null, setlengthft:inst.setlengthft||null, setheightft:inst.setheightft||null,
          dominantcolor:inst.dominantcolor||null, secondarycolor:inst.secondarycolor||null, accentcolor:inst.accentcolor||null,
          bgimagedesc:inst.bgimagedesc||null, bgaudiodesc:inst.bgaudiodesc||null,
          prompt:inst.prompt||null, script:inst.script||null, finalimage:inst.finalimage||null,
          activestatus:'A', updatedate:new Date().toISOString(),
        }
        if(inst.instanceid) {
          await supabase.from('assetinstances').update(payload).eq('instanceid',inst.instanceid)
        } else {
          await supabase.from('assetinstances').insert({...payload, createdate:new Date().toISOString()})
        }
      }
      setSavedAssetId(aid)
      showToast('Saved ✓'); onSaved&&onSaved(aid)
    } catch(e) { showToast(`Error: ${e.message}`) }
    setSaving(false)
  }

  async function handleClone() {
    setSaving(true)
    const { data:a } = await supabase.from('assets').insert({
      name:`${assetMeta.name} (Copy)`, assetname:`${assetMeta.name} (Copy)`, assettype:assetMeta.assettype, domain:assetMeta.domain,
      aigenerated:assetMeta.aigenerated, royaltyeligible:assetMeta.royaltyeligible,
      locked:false, activestatus:'A', createdate:new Date().toISOString(), updatedate:new Date().toISOString(),
      createdby:endUser?.enduserid
    }).select().single()
    if(a) {
      for(const inst of instances) {
        const { instanceid, assetid, createdate, updatedate, ...rest } = inst
        await supabase.from('assetinstances').insert({...rest, assetid:a.assetid, createdate:new Date().toISOString(), updatedate:new Date().toISOString()})
      }
      onCloned&&onCloned(a.assetid)
    }
    setSaving(false)
  }

  async function deleteInstance(inst) {
    if(inst.instancename==='Main') return
    if(inst.instanceid) await supabase.from('assetinstances').update({activestatus:'H'}).eq('instanceid',inst.instanceid)
    const remaining=instances.filter(i=>(i.instanceid||i._tempId)!==(inst.instanceid||inst._tempId))
    setInstances(remaining); setActiveKey(remaining[0]?.instanceid||remaining[0]?._tempId)
  }

  function addInstance() {
    if(!newInstName.trim()) return
    const ni={_tempId:Date.now(),...BLANK_INSTANCE,instancename:newInstName.trim()}
    setInstances(is=>[...is,ni]); setActiveKey(ni._tempId); setNewInstName(''); setAddingInst(false)
  }

  const assetMetaPlus = { ...assetMeta, onNameChange:(v)=>setAssetMeta(m=>({...m,name:v})) }

  if(loading) return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'700px', background:SURFACE, borderLeft:`1px solid ${BORDER}`, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', color:MUTED }}>Loading...</div>
  )

  return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'700px', background:SURFACE, borderLeft:`1px solid ${BORDER}`, zIndex:500, display:'flex', flexDirection:'column' }}>
      {toast && (
        <div style={{ position:'absolute', top:'12px', left:'50%', transform:'translateX(-50%)', background:toast.startsWith('Error')?'rgba(200,75,49,0.9)':'rgba(74,156,122,0.9)', color:'#fff', padding:'8px 20px', fontSize:'0.78rem', zIndex:10, whiteSpace:'nowrap', borderRadius:'2px', pointerEvents:'none' }}>{toast}</div>
      )}
      {/* Header */}
      <div style={{ padding:'14px 24px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <select value={assetMeta.assettype} onChange={e=>!locked&&setAssetMeta(m=>({...m,assettype:e.target.value}))} disabled={locked}
            style={{ background:SURFACE2, border:`1px solid ${BORDER}`, color:CREAM, fontFamily:'DM Sans, sans-serif', fontSize:'0.78rem', cursor:locked?'default':'pointer', outline:'none', padding:'5px 10px' }}>
            {ASSET_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
          <select value={assetMeta.domain} onChange={e=>!locked&&setAssetMeta(m=>({...m,domain:e.target.value}))} disabled={locked}
            style={{ background:SURFACE2, border:`1px solid ${BORDER}`, color:CHARCOAL, fontFamily:'DM Sans, sans-serif', fontSize:'0.78rem', cursor:locked?'default':'pointer', outline:'none', padding:'5px 10px' }}>
            {DOMAIN_OPTIONS.map(d=><option key={d}>{d}</option>)}
          </select>
          {locked&&<span style={{ background:'rgba(200,75,49,0.15)', color:RED, fontSize:'0.62rem', padding:'2px 8px', letterSpacing:'0.08em', textTransform:'uppercase' }}>🔒 Locked</span>}
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {!isNew&&<button onClick={handleClone} disabled={saving} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'7px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>Clone</button>}
          {!locked&&<button onClick={handleSave} disabled={saving} style={{ background:GOLD, border:'none', color:'#1A1810', padding:'7px 20px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, opacity:saving?0.7:1 }}>{saving?'Saving...':'Save'}</button>}
          <button onClick={onClose} style={{ background:'none', border:'none', color:MUTED, cursor:'pointer', fontSize:'1rem' }}>✕</button>
        </div>
      </div>
      {/* Toggles */}
      <div style={{ padding:'6px 24px', borderBottom:`1px solid ${BORDER}`, display:'flex', gap:'32px', background:SURFACE2, flexShrink:0 }}>
        <Toggle label="AI Generated"     value={assetMeta.aigenerated}     onChange={v=>!locked&&setAssetMeta(m=>({...m,aigenerated:v}))}     disabled={locked} />
        <Toggle label="Royalty Eligible" value={assetMeta.royaltyeligible} onChange={v=>!locked&&setAssetMeta(m=>({...m,royaltyeligible:v}))} disabled={locked} />
      </div>
      {/* Instance tabs */}
      <div style={{ borderBottom:`1px solid ${BORDER}`, background:SURFACE2, flexShrink:0, padding:'0 20px', display:'flex', alignItems:'center', overflowX:'auto' }}>
        {instances.map(inst=>{
          const key=inst.instanceid||inst._tempId
          return (
            <div key={key} style={{ display:'flex', alignItems:'center' }}>
              <button onClick={()=>setActiveKey(key)}
                style={{ background:'none', border:'none', borderBottom:activeKey===key?`2px solid ${GOLD}`:'2px solid transparent', color:activeKey===key?GOLD:CHARCOAL, padding:'10px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.78rem', whiteSpace:'nowrap', marginBottom:'-1px' }}>
                {inst.instancename}
              </button>
              {inst.instancename!=='Main'&&!locked&&(
                <button onClick={()=>deleteInstance(inst)} title="Delete" style={{ background:'none', border:'none', color:CHARCOAL, cursor:'pointer', fontSize:'0.6rem', padding:'0 4px 0 0', marginTop:'2px' }}>✕</button>
              )}
            </div>
          )
        })}
        {!addingInst
          ? <button onClick={()=>setAddingInst(true)} style={{ background:'none', border:'none', color:CHARCOAL, padding:'10px 12px', cursor:'pointer', fontSize:'0.75rem', whiteSpace:'nowrap' }}>+ Add Instance</button>
          : <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 8px' }}>
              <input value={newInstName} onChange={e=>setNewInstName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addInstance()} placeholder="Instance name" autoFocus
                style={{ background:SURFACE, border:`1px solid ${BORDER}`, color:CREAM, padding:'4px 8px', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', outline:'none', width:'120px' }} />
              <button onClick={addInstance} style={{ background:GOLD, border:'none', color:'#1A1810', padding:'4px 10px', cursor:'pointer', fontSize:'0.7rem', fontFamily:'DM Sans, sans-serif' }}>Add</button>
              <button onClick={()=>{setAddingInst(false);setNewInstName('')}} style={{ background:'none', border:'none', color:CHARCOAL, cursor:'pointer', fontSize:'0.8rem' }}>✕</button>
            </div>
        }
      </div>
      {/* Body */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {activeInst&&(
          <InstanceForm key={activeInst.instanceid||activeInst._tempId} data={activeInst} onChange={updateActiveInst} assetMeta={assetMetaPlus} locked={locked} onSaveReminder={()=>showToast('Image selected — hit Save to keep it ✓')} onVoiceIdSaved={(url)=>setAssetMeta(m=>({...m,elevenlabs_voice_id:url}))} />
        )}
      </div>
    </div>
  )
}

export default function Assets() {
  
const [viewMode,     setViewMode]     = useState('grid')
  const [typeFilter,   setTypeFilter]   = useState('All')
  const [domainFilter, setDomainFilter] = useState('All')
  const [prodFilter,   setProdFilter]   = useState('all')
  const [titles,       setTitles]       = useState([])
  const [prodAssetIds, setProdAssetIds] = useState(null)
  const [assets,       setAssets]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [openAssetId,  setOpenAssetId]  = useState(null)
  const [showForm,     setShowForm]     = useState(false)
  // Auto-open asset from URL param (navigated from Development module)
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const assetid = searchParams.get('assetid')
    if (assetid) {
      setOpenAssetId(Number(assetid))
      setShowForm(true)
      setSearchParams({}, { replace: true })
    }
  }, [])


  useEffect(()=>{ loadAssets() },[])

  async function loadAssets() {
    setLoading(true)
    const { data } = await supabase.from('assets').select('*, assetinstances(instanceid,instancename,finalimage)').eq('activestatus','A').order('name')
    if(data) setAssets(data)
    setLoading(false)
  }

  useEffect(() => {
    supabase.from('productions').select('productionid,productiontitle,productionstatus')
      .eq('productiongroup','TITLE').eq('activestatus','A').order('productiontitle')
      .then(({ data }) => setTitles((data || []).filter(t => t.productionstatus && t.productionstatus !== '')))
  }, [])

  async function handleProdFilter(titleId) {
    setProdFilter(titleId)
    if (titleId === 'all') { setProdAssetIds(null); return }
    const { data } = await supabase.from('assets')
      .select('assetid').eq('titleproductionid', parseInt(titleId)).eq('activestatus','A')
    setProdAssetIds(data ? data.map(r => r.assetid) : [])
  }

  function openNew()    { setOpenAssetId(null); setShowForm(true) }
  function openEdit(id) { setOpenAssetId(id);   setShowForm(true) }
  function closeForm()  { setShowForm(false);   setOpenAssetId(null) }
  function handleSaved()    { loadAssets() }
  function handleCloned(id) { loadAssets(); setOpenAssetId(id) }

  const filtered = assets.filter(a=>
    (typeFilter==='All'   || a.assettype===typeFilter) &&
    (domainFilter==='All' || a.domain===domainFilter)  &&
    (prodAssetIds===null  || prodAssetIds.includes(a.assetid))
  )

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif', color:CREAM }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', fontWeight:300, color:CREAM, margin:0 }}>Asset Library</h1>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <select value={prodFilter} onChange={e=>handleProdFilter(e.target.value)}
            style={{ background:SURFACE, border:`1px solid ${BORDER}`, color:CREAM, padding:'7px 14px', fontFamily:'DM Sans, sans-serif', fontSize:'0.8rem', outline:'none', cursor:'pointer' }}>
            <option value="all">All Productions</option>
            {titles.map(t=><option key={t.productionid} value={t.productionid}>{t.productiontitle}</option>)}
          </select>
          <button onClick={openNew} style={{ background:GOLD, border:'none', color:'#1A1810', padding:'9px 20px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>+ New Asset</button>
        </div>
      </div>
      {/* Filters */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div style={{ display:'flex', gap:'2px', flexWrap:'wrap', alignItems:'center' }}>
          <button onClick={()=>setTypeFilter('All')} style={{ background:typeFilter==='All'?'rgba(201,146,74,0.12)':'none', border:`1px solid ${typeFilter==='All'?'rgba(201,146,74,0.3)':BORDER}`, color:typeFilter==='All'?GOLD:CHARCOAL, padding:'6px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem' }}>All</button>
          {ASSET_TYPES.map(t=>(
            <button key={t} onClick={()=>setTypeFilter(t)} style={{ background:typeFilter===t?'rgba(201,146,74,0.12)':'none', border:`1px solid ${typeFilter===t?'rgba(201,146,74,0.3)':BORDER}`, color:typeFilter===t?GOLD:CHARCOAL, padding:'6px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem' }}>{t}</button>
          ))}
          <div style={{ width:'1px', background:BORDER, margin:'0 4px', height:'24px' }} />
          {['All',...DOMAIN_OPTIONS].map(d=>(
            <button key={d} onClick={()=>setDomainFilter(d)} style={{ background:domainFilter===d?'rgba(122,158,200,0.1)':'none', border:`1px solid ${domainFilter===d?'rgba(122,158,200,0.3)':BORDER}`, color:domainFilter===d?BLUE:CHARCOAL, padding:'6px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem' }}>
              {d==='All'?'All Domains':d.replace(' Domain','')}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'2px' }}>
          {['grid','list'].map(m=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{ background:viewMode===m?'rgba(201,146,74,0.12)':'none', border:`1px solid ${viewMode===m?'rgba(201,146,74,0.3)':BORDER}`, color:viewMode===m?GOLD:CHARCOAL, padding:'6px 12px', cursor:'pointer', fontSize:'0.72rem' }}>
              {m==='grid'?'⊞':'≡'}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ color:MUTED, padding:'40px', textAlign:'center', fontSize:'0.82rem' }}>Loading assets...</div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:MUTED }}>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', marginBottom:'8px' }}>No assets yet</div>
          <div style={{ fontSize:'0.82rem' }}>Click + New Asset to get started.</div>
        </div>
      ) : viewMode==='grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'12px' }}>
          {filtered.map(asset=>{
            const tc=TYPE_COLORS[asset.assettype]||TYPE_COLORS.Other
            const dc=DOMAIN_COLORS[asset.domain]||DOMAIN_COLORS['User Domain']
            const instCount=asset.assetinstances?.length||0
            return (
              <div key={asset.assetid} style={{ background:SURFACE2, border:`1px solid ${BORDER}`, cursor:'pointer', overflow:'hidden', transition:'border-color 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(201,146,74,0.35)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}
                onClick={()=>openEdit(asset.assetid)}>
                <div style={{ aspectRatio:'1', background:'linear-gradient(135deg,#111009 0%,#1a1208 100%)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                  {asset.assetinstances?.[0]?.finalimage
                    ? <img src={asset.assetinstances[0].finalimage} alt={asset.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    : <div style={{ fontSize:'2.5rem', opacity:0.2 }}>{iconFor(asset.assettype)}</div>
                  }
                  {asset.locked&&<div style={{ position:'absolute', top:'8px', left:'8px', background:'rgba(200,75,49,0.2)', color:RED, fontSize:'0.58rem', padding:'2px 6px' }}>🔒</div>}
                  {asset.aigenerated&&<div style={{ position:'absolute', top:'8px', right:'8px', background:'rgba(201,146,74,0.2)', color:GOLD, fontSize:'0.6rem', padding:'2px 6px' }}>AI</div>}
                  {instCount>1&&<div style={{ position:'absolute', bottom:'6px', right:'6px', background:'rgba(0,0,0,0.55)', color:CREAM, fontSize:'0.6rem', padding:'2px 7px' }}>{instCount}×</div>}
                </div>
                <div style={{ padding:'12px' }}>
                  <div style={{ fontSize:'0.88rem', color:CREAM, marginBottom:'6px' }}>{asset.name}</div>
                  <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                    <span style={{ background:tc.bg, color:tc.color, padding:'2px 7px', fontSize:'0.6rem', borderRadius:'2px' }}>{asset.assettype}</span>
                    <span style={{ background:dc.bg, color:dc.color, padding:'2px 7px', fontSize:'0.6rem', borderRadius:'2px' }}>{(asset.domain||'').replace(' Domain','')}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ border:`1px solid ${BORDER}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BORDER}`, background:SURFACE2 }}>
                {['','Name','Type','Domain','Instances','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset,i)=>{
                const tc=TYPE_COLORS[asset.assettype]||TYPE_COLORS.Other
                const dc=DOMAIN_COLORS[asset.domain]||DOMAIN_COLORS['User Domain']
                return (
                  <tr key={asset.assetid} style={{ borderBottom:i<filtered.length-1?`1px solid ${BORDER}`:'none', cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(201,146,74,0.02)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    onClick={()=>openEdit(asset.assetid)}>
                    <td style={{ padding:'12px 16px', width:'48px' }}><div style={{ width:'40px', height:'40px', background:SURFACE2, border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', opacity:0.35 }}>{iconFor(asset.assettype)}</div></td>
                    <td style={{ padding:'12px 16px', color:CREAM, fontSize:'0.85rem' }}>
                      <div>{asset.name}</div>
                      {asset.aigenerated&&<div style={{ fontSize:'0.63rem', color:GOLD, marginTop:'2px' }}>AI Generated</div>}
                    </td>
                    <td style={{ padding:'12px 16px' }}><span style={{ background:tc.bg, color:tc.color, padding:'2px 8px', fontSize:'0.63rem', borderRadius:'2px' }}>{asset.assettype}</span></td>
                    <td style={{ padding:'12px 16px' }}><span style={{ background:dc.bg, color:dc.color, padding:'2px 8px', fontSize:'0.63rem', borderRadius:'2px' }}>{asset.domain}</span></td>
                    <td style={{ padding:'12px 16px', color:CHARCOAL, fontSize:'0.78rem' }}>{asset.assetinstances?.length||0}</td>
                    <td style={{ padding:'12px 16px' }}>
                      {asset.locked
                        ? <span style={{ background:'rgba(200,75,49,0.15)', color:RED, padding:'2px 8px', fontSize:'0.62rem' }}>Locked</span>
                        : <span style={{ background:'rgba(74,156,122,0.15)', color:GREEN, padding:'2px 8px', fontSize:'0.62rem' }}>Editable</span>}
                    </td>
                    <td style={{ padding:'12px 16px' }} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>openEdit(asset.assetid)} style={{ background:'none', border:'none', color:GOLD, fontSize:'0.72rem', cursor:'pointer', padding:0 }}>Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:499 }} onClick={closeForm} />
          <AssetForm assetId={openAssetId} onClose={closeForm} onSaved={handleSaved} onCloned={handleCloned} />
        </>
      )}
    </div>
  )
}
