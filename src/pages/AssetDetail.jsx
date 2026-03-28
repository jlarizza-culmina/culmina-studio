import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const GOLD='#C9924A',CHARCOAL='#5C574E',CREAM='#F7F2E8',SURFACE='#1A1810',SURFACE2='#111009'
const BORDER='rgba(201,146,74,0.12)',MUTED='#6A6560',GREEN='#4A9C7A',RED='#C84B31',BLUE='#7A9EC8'
const ASSET_TYPES=['Person','Animal','Animate Object','Set','Prop','Sound','Other']
const IMG_MODELS=['Google Imagen 4','Google Imagen 4 Ultra','Google Imagen 4 Fast','Midjourney','DALL-E 3','Flux']
const EL_MODELS=[
  {id:'eleven_multilingual_v2',label:'Multilingual v2 — Best quality'},
  {id:'eleven_flash_v2_5',label:'Flash v2.5 — Ultra-low latency'},
  {id:'eleven_turbo_v2_5',label:'Turbo v2.5 — Balanced'},
  {id:'eleven_v3',label:'Eleven v3 — Max expressiveness'},
]
const BLANK={
  instancename:'Main',description:'',characterimportance:'Lead',speakingrole:false,
  sex:'',heightft:5,heightin:6,weightlbs:140,bodyshape:'',skintone:'',ethnicity:'',
  haircolor:'',hairlength:'',eyecolor:'',scars:'',tattoos:'',piercings:'',disabilities:'',disfigurements:'',
  extmaterial:'',extcolor:'',exttexture:'',intelligence:3,humor:3,wisdom:3,charisma:3,
  clothingdescription:'',timeperiod:'',setwidthft:20,setlengthft:30,setheightft:12,
  dominantcolor:'#2A1F14',secondarycolor:'#4A3828',accentcolor:'#C9924A',
  bgimagedesc:'',bgaudiodesc:'',prompt:'',script:'',finalimage:null,
  promptaspectratio:'',negativeprompt:'',styleconsistencyanchor:'',
  aiimagemodel:'',aigeneratedprompt:'',photorealistic:true,imagedrafts:null,
  soundaimodel:'eleven_multilingual_v2',
  voiceage:'',voicegender:'',voiceaccent:'',voicetone:'',
  voicepacing:'',voiceemotionalrange:'',voicequalitytag:'',voiceprompt:'',
  voicespeed:1.0,voicestabilityscore:0.5,voicesimilarity:0.75,voicestyle:0.0,
}
const lbl={display:'block',fontSize:'0.68rem',color:CHARCOAL,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'6px'}
const mkI=(lk)=>({width:'100%',background:lk?'rgba(255,255,255,0.02)':SURFACE2,border:`1px solid ${BORDER}`,color:lk?MUTED:CREAM,padding:'9px 12px',fontFamily:'DM Sans, sans-serif',fontSize:'0.82rem',outline:'none',boxSizing:'border-box'})
const mkS=(lk)=>({...mkI(lk),cursor:lk?'default':'pointer'})
const mkT=(lk)=>({...mkI(lk),minHeight:'72px',resize:'vertical'})

function Sp({label,value,onChange,min=0,max=999,disabled=false}){
  const b={width:'28px',height:'28px',background:'rgba(255,255,255,0.06)',border:`1px solid ${BORDER}`,color:disabled?MUTED:CREAM,cursor:disabled?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'1rem'}
  return(<div>{label&&<div style={lbl}>{label}</div>}<div style={{display:'flex',alignItems:'center'}}><button style={b} onClick={()=>!disabled&&onChange(Math.max(min,value-1))}>−</button><div style={{minWidth:'44px',height:'28px',background:SURFACE2,border:`1px solid ${BORDER}`,borderLeft:'none',borderRight:'none',color:disabled?MUTED:CREAM,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem'}}>{value}</div><button style={b} onClick={()=>!disabled&&onChange(Math.min(max,value+1))}>+</button></div></div>)
}
function Stars({label,value,onChange,disabled=false}){
  return(<div style={{marginBottom:'14px',opacity:disabled?0.5:1}}><div style={lbl}>{label}</div><div style={{display:'flex',gap:'6px'}}>{[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>!disabled&&onChange(n)} style={{width:'28px',height:'28px',borderRadius:'50%',background:n<=value?GOLD:'rgba(255,255,255,0.06)',border:n<=value?'none':`1px solid rgba(201,146,74,0.2)`,cursor:disabled?'default':'pointer'}}/>))}</div></div>)
}
function Toggle({label,value,onChange,disabled=false}){
  return(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',opacity:disabled?0.5:1}}><span style={{fontSize:'0.78rem',color:CREAM}}>{label}</span><div onClick={()=>!disabled&&onChange(!value)} style={{width:'40px',height:'22px',background:value?GOLD:'rgba(255,255,255,0.08)',borderRadius:'11px',position:'relative',cursor:disabled?'default':'pointer',transition:'background 0.2s',flexShrink:0}}><div style={{position:'absolute',top:'3px',left:value?'21px':'3px',width:'16px',height:'16px',borderRadius:'50%',background:value?SURFACE:CHARCOAL,transition:'left 0.2s'}}/></div></div>)
}
function Sec({title,open:init=false,children}){
  const [open,setOpen]=useState(init)
  return(<div style={{borderBottom:`1px solid ${BORDER}`}}><button onClick={()=>setOpen(o=>!o)} style={{width:'100%',background:'none',border:'none',padding:'12px 0',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}><span style={{fontSize:'0.72rem',letterSpacing:'0.12em',textTransform:'uppercase',color:open?GOLD:CHARCOAL}}>{title}</span><span style={{color:CHARCOAL,fontSize:'0.65rem',transform:open?'rotate(90deg)':'none',transition:'transform 0.15s'}}>▶</span></button>{open&&<div style={{paddingBottom:'16px'}}>{children}</div>}</div>)
}
function Slider({label,value,onChange,min=0,max=1,step=0.05,note,disabled=false}){
  return(<div style={{marginBottom:'18px',opacity:disabled?0.5:1}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px'}}><span style={lbl}>{label}</span><span style={{fontSize:'0.8rem',color:GOLD,fontFamily:'monospace',marginBottom:'6px'}}>{typeof value==='number'?value.toFixed(2):value}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e=>!disabled&&onChange(parseFloat(e.target.value))} disabled={disabled} style={{width:'100%',accentColor:GOLD,cursor:disabled?'default':'pointer'}}/>{note&&<div style={{fontSize:'0.62rem',color:MUTED,marginTop:'4px',lineHeight:1.5}}>{note}</div>}</div>)
}

// ── Voice Library ─────────────────────────────────────────────
function VoiceLibrary({onUse,onClose,accentOptions,langOptions}){
  const [voices,setVoices]=useState([])
  const [search,setSearch]=useState("")
  const [filterGender,setFilterGender]=useState("")
  const [filterAge,setFilterAge]=useState("")
  const [filterAccent,setFilterAccent]=useState("")
  const [filterCategory,setFilterCategory]=useState("")
  const [filterLang,setFilterLang]=useState("")
  const [featured,setFeatured]=useState(false)
  const [page,setPage]=useState(0)
  const [hasMore,setHasMore]=useState(false)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")
  const [playing,setPlaying]=useState(null)
  const audioRef=useRef(null)

  async function doSearch(reset=false){
    setLoading(true);setError("")
    const pg=reset?0:page
    try{
      const body={action:"list_voices",page_size:50,page:pg}
      if(filterGender)body.gender=filterGender
      if(filterAge)body.age=filterAge
      if(filterAccent)body.accent=filterAccent
      if(filterCategory)body.category=filterCategory
      if(filterLang)body.language=filterLang
      if(search)body.search=search
      if(featured)body.featured=true
      const r=await fetch("/api/elevenlabs-proxy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
      const d=await r.json()
      if(!r.ok)throw new Error(d.error||"Error fetching voices")
      setVoices(v=>reset?d.voices:[...v,...(d.voices||[])])
      setHasMore(d.has_more||false)
      if(reset)setPage(0)
    }catch(e){setError(e.message)}
    setLoading(false)
  }

  function playPreview(v){
    if(audioRef.current){audioRef.current.pause();audioRef.current=null}
    if(playing===v.voice_id){setPlaying(null);return}
    if(!v.preview_url)return
    const a=new Audio(v.preview_url);a.onended=()=>setPlaying(null);a.play();audioRef.current=a;setPlaying(v.voice_id)
  }

  const ss={background:SURFACE2,border:"1px solid "+BORDER,color:CREAM,padding:"6px 8px",fontFamily:"DM Sans, sans-serif",fontSize:"0.72rem",outline:"none",cursor:"pointer"}

  return(
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:"460px",background:SURFACE,borderLeft:"1px solid "+BORDER,zIndex:200,display:"flex",flexDirection:"column",boxShadow:"-8px 0 32px rgba(0,0,0,0.6)"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid "+BORDER,display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
        <div style={{fontSize:"0.68rem",color:GOLD,letterSpacing:"0.14em",textTransform:"uppercase",flex:1}}>ElevenLabs Voice Library</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:"1.1rem"}}>x</button>
      </div>
      <div style={{padding:"10px 20px",borderBottom:"1px solid "+BORDER,flexShrink:0,display:"flex",flexDirection:"column",gap:"8px"}}>
        <div style={{display:"flex",gap:"8px"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch(true)} placeholder="Search name or description"
            style={{flex:1,background:SURFACE2,border:"1px solid "+BORDER,color:CREAM,padding:"7px 12px",fontFamily:"DM Sans, sans-serif",fontSize:"0.8rem",outline:"none",boxSizing:"border-box"}}/>
          <button onClick={()=>doSearch(true)} style={{background:"rgba(201,146,74,0.1)",border:"1px solid rgba(201,146,74,0.25)",color:GOLD,padding:"6px 14px",cursor:"pointer",fontFamily:"DM Sans, sans-serif",fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase"}}>Search</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
          <select value={filterGender} onChange={e=>setFilterGender(e.target.value)} style={ss}>
            <option value="">All genders</option>
            {["male","female"].map(g=><option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
          </select>
          <select value={filterAge} onChange={e=>setFilterAge(e.target.value)} style={ss}>
            <option value="">All ages</option>
            {["young","middle_aged","old"].map(a=><option key={a} value={a}>{a.replace("_"," ")}</option>)}
          </select>
          <select value={filterAccent} onChange={e=>setFilterAccent(e.target.value)} style={ss}>
            <option value="">All accents</option>
            {accentOptions.map(a=><option key={a.nvvalue} value={a.nvvalue}>{a.nvname}</option>)}
          </select>
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} style={ss}>
            <option value="">All categories</option>
            {["professional","high_quality","celebrity","generated"].map(c=><option key={c} value={c}>{c.replace("_"," ")}</option>)}
          </select>
          <select value={filterLang} onChange={e=>setFilterLang(e.target.value)} style={ss}>
            <option value="">All languages</option>
            {langOptions.map(l=><option key={l.nvvalue} value={l.nvvalue}>{l.nvname}</option>)}
          </select>
          <label style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontSize:"0.72rem",color:featured?GOLD:MUTED,padding:"6px 8px",border:"1px solid "+(featured?"rgba(201,146,74,0.25)":BORDER)}}>
            <input type="checkbox" checked={featured} onChange={e=>setFeatured(e.target.checked)} style={{accentColor:GOLD}}/>Featured only
          </label>
        </div>
        <div style={{fontSize:"0.62rem",color:MUTED}}>{voices.length>0?voices.length+" voices loaded"+(hasMore?" — more available":""):"Use filters or search, then click Search"}</div>
      </div>
      {error&&<div style={{padding:"8px 20px",background:"rgba(200,75,49,0.1)",color:RED,fontSize:"0.72rem",flexShrink:0}}>! {error}</div>}
      <div style={{flex:1,overflowY:"auto"}}>
        {loading&&voices.length===0&&<div style={{padding:"24px",color:MUTED,fontSize:"0.78rem",textAlign:"center"}}>Searching...</div>}
        {!loading&&voices.length===0&&<div style={{padding:"24px",color:MUTED,fontSize:"0.78rem",textAlign:"center",lineHeight:1.6}}>Set filters or enter a search term above,<br/>then click Search.</div>}
        {voices.map(v=>(
          <div key={v.voice_id} style={{padding:"10px 20px",borderBottom:"1px solid rgba(201,146,74,0.06)",display:"flex",alignItems:"center",gap:"8px"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(201,146,74,0.03)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"0.83rem",color:CREAM,marginBottom:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.name}</div>
              <div style={{fontSize:"0.62rem",color:MUTED,display:"flex",gap:"6px",flexWrap:"wrap"}}>
                {v.category&&<span style={{background:"rgba(122,158,200,0.12)",color:BLUE,padding:"1px 5px",borderRadius:"2px"}}>{v.category}</span>}
                {v.gender&&<span>{v.gender}</span>}
                {v.accent&&<span>- {v.accent}</span>}
                {v.age&&<span>- {v.age}</span>}
                {v.use_case&&<span>- {v.use_case.replace(/_/g," ")}</span>}
              </div>
              {v.description&&<div style={{fontSize:"0.6rem",color:MUTED,marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",opacity:0.7}}>{v.description}</div>}
            </div>
            {v.preview_url&&<button onClick={()=>playPreview(v)} style={{width:"26px",height:"26px",background:playing===v.voice_id?GOLD:"rgba(255,255,255,0.06)",border:"1px solid "+(playing===v.voice_id?GOLD:BORDER),color:playing===v.voice_id?SURFACE:CREAM,cursor:"pointer",fontSize:"0.58rem",flexShrink:0}}>{playing===v.voice_id?"stop":"play"}</button>}
            <button onClick={()=>onUse(v.voice_id,v.name)} style={{background:"rgba(201,146,74,0.1)",border:"1px solid rgba(201,146,74,0.25)",color:GOLD,padding:"4px 9px",cursor:"pointer",fontFamily:"DM Sans, sans-serif",fontSize:"0.62rem",letterSpacing:"0.08em",textTransform:"uppercase",flexShrink:0}}>Use</button>
          </div>
        ))}
        {hasMore&&<div style={{padding:"16px 20px",textAlign:"center"}}>
          <button onClick={()=>{const np=page+1;setPage(np);setTimeout(()=>doSearch(false),0)}} disabled={loading}
            style={{background:"rgba(201,146,74,0.08)",border:"1px solid rgba(201,146,74,0.2)",color:GOLD,padding:"7px 20px",cursor:"pointer",fontFamily:"DM Sans, sans-serif",fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase"}}>
            {loading?"Loading...":"Load More"}
          </button>
        </div>}
      </div>
    </div>
  )
}


// ── Voice Tab ─────────────────────────────────────────────────────────────────
function VoiceTab({data,onChange,locked,assetMeta,onVoiceIdChange,savedAssetId}){
  const [showLib,setShowLib]=useState(false)
  const [drafts,setDrafts]=useState([])
  const [numPrev,setNumPrev]=useState(1)
  const [generating,setGenerating]=useState(false)
  const [genPrompt,setGenPrompt]=useState(false)
  const [previewText,setPreviewText]=useState("Hello, my name is the character and this is a preview of my voice for this production. I am here to help tell the story.")
  const [error,setError]=useState('')
  const draftsKey=`vd_${savedAssetId}_${data.instancename||'main'}`

  useEffect(()=>{try{const s=sessionStorage.getItem(draftsKey);if(s)setDrafts(JSON.parse(s))}catch(e){}},[draftsKey])
  function saveDrafts(d){setDrafts(d);try{sessionStorage.setItem(draftsKey,JSON.stringify(d))}catch(e){}}

  const voicePromptLen=(data.voiceprompt||'').length
  const voicePromptTrunc=(data.voiceprompt||'').slice(0,1000)

  async function doGeneratePrompt(){
    setGenPrompt(true)
    const parts=[]
    if(data.voicequalitytag)parts.push(data.voicequalitytag+'.')
    const id=[data.voicegender,data.voiceage].filter(Boolean).join(' ')
    if(id)parts.push(id+' voice.')
    if(data.voiceaccent)parts.push(data.voiceaccent+' accent.')
    if(data.voicetone)parts.push(data.voicetone+' timbre.')
    if(data.voicepacing)parts.push(data.voicepacing+' pace.')
    if(data.voiceemotionalrange)parts.push(data.voiceemotionalrange+' emotional range.')
    const structured=parts.join(' ')
    try{
      const res=await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:300,messages:[{role:'user',content:`Write a concise ElevenLabs Voice Design prompt (max 900 characters) for a character named "${assetMeta.name||'Character'}".\nAttributes: ${structured||'none'}\nImage context: ${(data.prompt||'').slice(0,150)}\nReturn ONLY the prompt text, no headers or labels.`}]})})
      const d=await res.json()
      const raw=d.content?.map(b=>b.text||'').join('')||structured
      onChange('voiceprompt',raw.slice(0,1000))
    }catch(e){onChange('voiceprompt',structured.slice(0,1000))}
    setGenPrompt(false)
  }

  async function doGeneratePreviews(){
    if(!voicePromptTrunc.trim()){setError('Generate a Voice Prompt first.');return}
    setGenerating(true);setError('')
    const safeText=previewText.length>=100?previewText:previewText+'  This is a voice preview for a character in the Culmina micro-drama production series.'
    const newDrafts=[]
    for(let i=0;i<numPrev;i++){
      try{
        const r=await fetch('/api/elevenlabs-proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'design',voice_description:voicePromptTrunc,text:safeText,gender:data.voicegender?.toLowerCase()||undefined,age:data.voiceage||undefined,loudness:i*0.1,quality:1.0})})
        const d=await r.json()
        if(!r.ok)throw new Error(d.error||'Unknown error')
        newDrafts.push({id:Date.now()+i,num:drafts.length+newDrafts.length+1,generated_voice_id:d.generated_voice_id,audio_base64:d.audio_base64,audio_url:d.audio_url,snippet:voicePromptTrunc.slice(0,55),isFinal:false})
      }catch(e){setError(e.message);break}
    }
    saveDrafts([...drafts,...newDrafts])
    setGenerating(false)
  }

  async function toggleFinal(draft){
    const updated=drafts.map(d=>({...d,isFinal:d.id===draft.id?!d.isFinal:false}))
    saveDrafts(updated)
    const fin=updated.find(d=>d.isFinal)
    if(fin?.generated_voice_id){
      try{
        const r=await fetch('/api/elevenlabs-proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save_voice',generated_voice_id:fin.generated_voice_id,name:assetMeta.name||`Culmina Voice ${Date.now()}`,description:voicePromptTrunc||''})})
        const d=await r.json()
        if(r.ok&&d.voice_id)onVoiceIdChange(d.voice_id)
        else setError(d.error||'Save failed')
      }catch(e){setError(e.message)}
    }
  }

  const voiceId=assetMeta.elevenlabs_voice_id||''
  const btn={fontFamily:'DM Sans, sans-serif',fontSize:'0.72rem',letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',border:'none'}

  return(
    <div style={{padding:'24px 28px 60px'}}>
      {showLib&&<VoiceLibrary
        onUse={(id,name)=>{onVoiceIdChange(id);setShowLib(false)}}
        onClone={(id,name,desc)=>{onVoiceIdChange(id);onChange('voiceprompt',(desc||name).slice(0,1000));setShowLib(false)}}
        onClose={()=>setShowLib(false)}/>}

      {/* Model */}
      <div style={{marginBottom:'16px'}}>
        <div style={lbl}>ElevenLabs Model</div>
        <select value={data.soundaimodel||'eleven_multilingual_v2'} onChange={e=>!locked&&onChange('soundaimodel',e.target.value)} disabled={locked} style={mkS(locked)}>
          {EL_MODELS.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {/* Voice ID */}
      <div style={{marginBottom:'20px'}}>
        <div style={lbl}>Voice ID</div>
        <div style={{display:'flex',gap:'8px'}}>
          <input value={voiceId} onChange={e=>!locked&&onVoiceIdChange(e.target.value)} disabled={locked}
            style={{...mkI(locked),fontFamily:'monospace',fontSize:'0.75rem',flex:1}} placeholder="e.g. HhshGoZBpMnOFbEMBuzV"/>
          <button onClick={()=>setShowLib(s=>!s)} disabled={locked}
            style={{...btn,background:'rgba(201,146,74,0.1)',color:locked?MUTED:GOLD,padding:'9px 14px',border:`1px solid rgba(201,146,74,0.25)`,whiteSpace:'nowrap'}}>
            🔍 Browse
          </button>
          {voiceId&&(
            <button onClick={async()=>{
              try{
                const safe=previewText.length>=100?previewText:previewText+'  Voice preview for Culmina Studios character in micro-drama production.'
                const r=await fetch('/api/elevenlabs-proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',voice_id:voiceId,text:safe,stability:data.voicestabilityscore??0.5})})
                const d=await r.json()
                const src=d.url||(d.audio_base64?`data:audio/mpeg;base64,${d.audio_base64}`:null)
                if(src)new Audio(src).play();else setError(d.error||'No audio returned')
              }catch(e){setError(e.message)}
            }} style={{...btn,background:'rgba(74,156,122,0.1)',color:GREEN,padding:'9px 12px',border:`1px solid rgba(74,156,122,0.25)`,whiteSpace:'nowrap'}}>
              ▶ Test
            </button>
          )}
        </div>
      </div>

      {/* Sliders */}
      <Sec title="Voice Settings" open={true}><div style={{paddingTop:'10px'}}>
        <Slider label="Speed" value={data.voicespeed??1.0} onChange={v=>onChange('voicespeed',v)} min={0.5} max={2.0} step={0.05} disabled={locked} note="Most natural: 0.9–1.1×. Slower for complex topics, faster for routine information."/>
        <Slider label="Stability" value={data.voicestabilityscore??0.5} onChange={v=>onChange('voicestabilityscore',v)} min={0} max={1} step={0.05} disabled={locked} note="Lower (0.30–0.50): emotional, dynamic. Higher (0.60–0.85): consistent, may sound monotonous."/>
        <Slider label="Similarity" value={data.voicesimilarity??0.75} onChange={v=>onChange('voicesimilarity',v)} min={0} max={1} step={0.05} disabled={locked} note="Higher boosts clarity and consistency. Very high values may cause audio distortions."/>
        <Slider label="Style Exaggeration" value={data.voicestyle??0.0} onChange={v=>onChange('voicestyle',v)} min={0} max={1} step={0.05} disabled={locked} note="Amplifies voice style. Increases latency when above 0."/>
      </div></Sec>

      {/* Characteristics */}
      <Sec title="Voice Characteristics" open={true}><div style={{paddingTop:'10px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
          <div><div style={lbl}>Age</div><input value={data.voiceage||''} onChange={e=>!locked&&onChange('voiceage',e.target.value)} disabled={locked} style={mkI(locked)} placeholder="e.g. late 20s, mid 50s"/></div>
          <div><div style={lbl}>Gender</div><select value={data.voicegender||''} onChange={e=>!locked&&onChange('voicegender',e.target.value)} disabled={locked} style={mkS(locked)}><option value="">— Select —</option>{['Male','Female','Neutral'].map(o=><option key={o}>{o}</option>)}</select></div>
          <div><div style={lbl}>Accent</div><input value={data.voiceaccent||''} onChange={e=>!locked&&onChange('voiceaccent',e.target.value)} disabled={locked} style={mkI(locked)} placeholder="e.g. RP British, Eastern European"/></div>
          <div><div style={lbl}>Tone / Timbre</div><input value={data.voicetone||''} onChange={e=>!locked&&onChange('voicetone',e.target.value)} disabled={locked} style={mkI(locked)} placeholder="e.g. Gravelly, breathy, crisp"/></div>
          <div><div style={lbl}>Pacing</div><input value={data.voicepacing||''} onChange={e=>!locked&&onChange('voicepacing',e.target.value)} disabled={locked} style={mkI(locked)} placeholder="e.g. Slow and deliberate"/></div>
          <div><div style={lbl}>Emotional Range</div><select value={data.voiceemotionalrange||''} onChange={e=>!locked&&onChange('voiceemotionalrange',e.target.value)} disabled={locked} style={mkS(locked)}><option value="">— Select —</option>{['Wide','Neutral','Narrow'].map(o=><option key={o}>{o}</option>)}</select></div>
          <div><div style={lbl}>Quality Tag</div><select value={data.voicequalitytag||''} onChange={e=>!locked&&onChange('voicequalitytag',e.target.value)} disabled={locked} style={mkS(locked)}><option value="">— Select —</option><option value="Perfect audio quality">Perfect audio quality</option><option value="Studio-quality recording">Studio-quality recording</option><option value="Clear and natural">Clear and natural</option></select></div>
        </div>
        <div><div style={lbl}>Script / Voice Notes</div><textarea value={data.script||''} onChange={e=>!locked&&onChange('script',e.target.value)} disabled={locked} style={mkT(locked)} placeholder="Dialog, personality cues, scene context..."/></div>
      </div></Sec>

      {/* Voice Prompt */}
      <div style={{marginTop:'20px',marginBottom:'16px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
          <div style={lbl}>Voice Prompt</div>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <span style={{fontSize:'0.62rem',color:voicePromptLen>1000?RED:voicePromptLen>800?GOLD:MUTED}}>{voicePromptLen}/1000</span>
            <button onClick={doGeneratePrompt} disabled={locked||genPrompt}
              style={{background:'rgba(201,146,74,0.1)',border:`1px solid rgba(201,146,74,0.25)`,color:locked?MUTED:GOLD,padding:'5px 12px',cursor:locked?'default':'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.68rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>
              {genPrompt?'Generating…':'Generate Prompt'}
            </button>
          </div>
        </div>
        <textarea value={data.voiceprompt||''} onChange={e=>!locked&&onChange('voiceprompt',e.target.value.slice(0,1000))} disabled={locked}
          style={{...mkT(locked),minHeight:'100px',borderColor:voicePromptLen>1000?RED:BORDER}} placeholder="ElevenLabs voice design prompt — 1000 char max..."/>
        {voicePromptLen>1000&&<div style={{fontSize:'0.62rem',color:RED,marginTop:'3px'}}>Exceeds 1000 character limit — will be truncated on generate.</div>}
      </div>

      {/* Preview Text */}
      <div style={{marginBottom:'16px'}}>
        <div style={lbl}>Preview Text</div>
        <textarea value={previewText} onChange={e=>setPreviewText(e.target.value)} disabled={locked} style={{...mkT(locked),minHeight:'56px'}}/>
        <div style={{fontSize:'0.62rem',color:previewText.length>=100?GREEN:GOLD,marginTop:'3px'}}>{previewText.length}/100 min characters {previewText.length>=100?'✓':'— needs more text'}</div>
      </div>

      {/* Generate Controls */}
      <div style={{display:'flex',alignItems:'flex-end',gap:'12px',marginBottom:'16px'}}>
        <Sp label="# Previews" value={numPrev} onChange={setNumPrev} min={1} max={3} disabled={locked}/>
        <button onClick={doGeneratePreviews} disabled={generating||locked||!data.voiceprompt?.trim()}
          style={{background:generating?'rgba(201,146,74,0.4)':GOLD,border:'none',color:SURFACE,padding:'8px 20px',cursor:generating||locked||!data.voiceprompt?.trim()?'default':'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:500,opacity:!data.voiceprompt?.trim()?0.4:1}}>
          {generating?'Generating…':'Generate Voice Previews'}
        </button>
      </div>

      {error&&<div style={{padding:'8px 12px',background:'rgba(200,75,49,0.1)',border:`1px solid rgba(200,75,49,0.25)`,color:RED,fontSize:'0.75rem',marginBottom:'14px'}}>⚠ {error}</div>}

      {/* Drafts */}
      {drafts.length>0&&(
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div style={{fontSize:'0.68rem',color:CHARCOAL,letterSpacing:'0.12em',textTransform:'uppercase'}}>Voice Drafts — {drafts.length} generated</div>
            <button onClick={()=>saveDrafts([])} style={{background:'none',border:'none',color:MUTED,cursor:'pointer',fontSize:'0.65rem',letterSpacing:'0.06em',textTransform:'uppercase',fontFamily:'DM Sans, sans-serif'}}>Clear all</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            {drafts.map(draft=>{
              const src=draft.audio_url||(draft.audio_base64?`data:audio/mpeg;base64,${draft.audio_base64}`:null)
              return(
                <div key={draft.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',border:`2px solid ${draft.isFinal?GREEN:BORDER}`,background:draft.isFinal?'rgba(74,156,122,0.05)':'rgba(255,255,255,0.01)'}}>
                  <div style={{width:'26px',height:'26px',background:draft.isFinal?GREEN:'rgba(255,255,255,0.06)',border:`1px solid ${draft.isFinal?GREEN:BORDER}`,color:draft.isFinal?SURFACE:MUTED,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.68rem',fontWeight:700,flexShrink:0}}>{draft.num}</div>
                  <div style={{flex:1,minWidth:0,fontSize:'0.7rem',color:CHARCOAL,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{draft.snippet||'Voice preview'}</div>
                  {src?<audio controls src={src} style={{height:'28px',maxWidth:'170px'}} onClick={e=>e.stopPropagation()}/>:<span style={{fontSize:'0.62rem',color:MUTED}}>No audio</span>}
                  <button onClick={()=>toggleFinal(draft)} style={{background:draft.isFinal?'rgba(74,156,122,0.15)':'none',border:`1px solid ${draft.isFinal?'rgba(74,156,122,0.4)':BORDER}`,color:draft.isFinal?GREEN:CHARCOAL,padding:'4px 10px',cursor:'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.62rem',letterSpacing:'0.08em',textTransform:'uppercase',flexShrink:0}}>{draft.isFinal?'✓ Final':'Final'}</button>
                  <button onClick={()=>saveDrafts(drafts.filter(d=>d.id!==draft.id))} style={{background:'none',border:'none',color:CHARCOAL,cursor:'pointer',fontSize:'0.8rem',padding:'4px',flexShrink:0}}>🗑</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Image Tab ─────────────────────────────────────────────────────────────────
function ImageTab({data,onChange,locked,assetMeta}){
  const {assettype}=assetMeta
  const isChar=assettype==='Person',isAnimal=assettype==='Animal',isAnimObj=assettype==='Animate Object'
  const isSet=assettype==='Set',isProp=assettype==='Prop'
  const isPerson=isChar||isAnimal||isAnimObj,hasExt=isAnimObj||isProp
  function f(k){return{value:data[k]??'',onChange:e=>!locked&&onChange(k,e.target.value),disabled:locked}}
  function set(k,v){!locked&&onChange(k,v)}

  // Image drafts — persist via instance.imagedrafts JSONB
  const storedDrafts=data.imagedrafts ? (typeof data.imagedrafts==='string'?JSON.parse(data.imagedrafts):data.imagedrafts) : []
  const finalIdx=storedDrafts.findIndex(d=>d.isFinal)
  const [genImg,setGenImg]=useState(false),[imgErr,setImgErr]=useState('')
  const [numVariations,setNumVariations]=useState(3)

  function setDrafts(newDrafts){onChange('imagedrafts',JSON.stringify(newDrafts))}

  async function buildPrompt(){
    const p=[]
    if(isPerson){
      if(assetMeta.name)p.push(assetMeta.name)
      if(data.characterimportance)p.push(data.characterimportance+' character')
      if(data.sex)p.push(data.sex)
      if(isChar&&data.ethnicity)p.push(data.ethnicity)
      if(isChar&&data.skintone)p.push(data.skintone+' skin')
      if(data.heightft)p.push(`${data.heightft}ft ${data.heightin??0}in`)
      if(data.weightlbs)p.push(`${data.weightlbs}lbs`)
      if(isChar&&data.bodyshape)p.push(data.bodyshape+' build')
      if(data.haircolor)p.push(`${data.haircolor} ${data.hairlength||''} hair`.trim())
      if(data.eyecolor)p.push(data.eyecolor+' eyes')
      if(data.clothingdescription)p.push('Wearing: '+data.clothingdescription)
      if(data.scars)p.push('Scars: '+data.scars)
      if(data.tattoos)p.push('Tattoos: '+data.tattoos)
    }
    if(isSet){if(assetMeta.name)p.push(assetMeta.name);if(data.timeperiod)p.push(data.timeperiod);if(data.bgimagedesc)p.push(data.bgimagedesc);if(data.extmaterial)p.push(data.extmaterial)}
    if(data.styleconsistencyanchor)p.unshift(data.styleconsistencyanchor)
    if(data.photorealistic)p.push('photorealistic')
    p.push('Cinematic lighting. 16:9 1080p.')
    onChange('prompt',p.filter(Boolean).join(', '))
  }

  async function genImages(){
    if(!data.prompt?.trim()){setImgErr('Enter a prompt first');return}
    setGenImg(true);setImgErr('')
    const MODELS={'Google Imagen 4':'imagen-4.0-generate-001','Google Imagen 4 Ultra':'imagen-4.0-ultra-generate-001','Google Imagen 4 Fast':'imagen-4.0-fast-generate-001'}
    const mid=MODELS[data.aiimagemodel||'Google Imagen 4']||'imagen-4.0-generate-001'
    const k=import.meta.env.VITE_GOOGLE_IMAGEN_KEY
    if(!k){setImgErr('VITE_GOOGLE_IMAGEN_KEY not set');setGenImg(false);return}
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mid}:predict?key=${k}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({instances:[{prompt:data.prompt}],parameters:{sampleCount:numVariations,aspectRatio:data.promptaspectratio||'16:9',safetyFilterLevel:'block_some'}})})
      if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e?.error?.message||`API ${r.status}`)}
      const j=await r.json()
      const newDrafts=(j.predictions||[]).map((p,i)=>({id:Date.now()+i,num:storedDrafts.length+i+1,dataUrl:`data:${p.mimeType||'image/png'};base64,${p.bytesBase64Encoded}`,isFinal:false}))
      setDrafts([...storedDrafts,...newDrafts])
    }catch(e){setImgErr(e.message)}
    setGenImg(false)
  }

  function selectFinal(idx){
    const updated=storedDrafts.map((d,i)=>({...d,isFinal:i===idx}))
    setDrafts(updated)
    onChange('finalimage',storedDrafts[idx]?.dataUrl||null)
  }

  return(
    <div style={{padding:'24px 28px 60px'}}>
      <Sec title="Identity" open={true}><div style={{paddingTop:'8px'}}>
        <div style={{marginBottom:'12px'}}><div style={lbl}>Description</div><textarea {...f('description')} style={mkT(locked)} placeholder="Narrative description..."/></div>
        <div style={{marginBottom:'12px'}}><div style={lbl}>Style Consistency Anchor</div><textarea {...f('styleconsistencyanchor')} style={{...mkT(locked),minHeight:'52px'}} placeholder="Phrase prepended to every prompt for visual consistency across all generations..."/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
          <div><div style={lbl}>Aspect Ratio</div><select {...f('promptaspectratio')} style={mkS(locked)}><option value="">— Select —</option><option value="3:4">3:4 Portrait</option><option value="9:16">9:16 Vertical</option><option value="1:1">1:1 Square</option><option value="16:9">16:9 Wide</option></select></div>
          <div><div style={lbl}>Negative Prompt</div><input {...f('negativeprompt')} style={mkI(locked)} placeholder="e.g. cartoon, blur, text"/></div>
        </div>
      </div></Sec>

      {isPerson&&<Sec title="Physical Attributes"><div style={{paddingTop:'8px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
          <div><div style={lbl}>Sex</div><select {...f('sex')} style={mkS(locked)}><option value="">Select...</option>{['Female','Male','Non-binary','Other'].map(o=><option key={o}>{o}</option>)}</select></div>
          {isChar&&<div><div style={lbl}>Body Shape</div><select {...f('bodyshape')} style={mkS(locked)}><option value="">Select...</option>{['Slim','Athletic','Average','Stocky','Heavy','Petite','Curvy'].map(o=><option key={o}>{o}</option>)}</select></div>}
        </div>
        <div style={{display:'flex',gap:'16px',marginBottom:'12px',flexWrap:'wrap'}}>
          <div><div style={lbl}>Height</div><div style={{display:'flex',alignItems:'center',gap:'6px'}}><Sp value={data.heightft??5} onChange={v=>set('heightft',v)} min={1} max={30} disabled={locked}/><span style={{color:CHARCOAL,fontSize:'0.75rem'}}>ft</span><Sp value={data.heightin??6} onChange={v=>set('heightin',v)} min={0} max={11} disabled={locked}/><span style={{color:CHARCOAL,fontSize:'0.75rem'}}>in</span></div></div>
          <Sp label="Weight (lbs)" value={data.weightlbs??140} onChange={v=>set('weightlbs',v)} min={1} max={9999} disabled={locked}/>
        </div>
        {isChar&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
          <div><div style={lbl}>Skin Tone</div><select {...f('skintone')} style={mkS(locked)}><option value="">Select...</option>{['Fair','Light','Medium','Olive','Tan','Brown','Dark Brown','Deep'].map(o=><option key={o}>{o}</option>)}</select></div>
          <div><div style={lbl}>Ethnicity</div><select {...f('ethnicity')} style={mkS(locked)}><option value="">Select...</option>{['Caucasian','Hispanic','Black','Asian','Middle Eastern','South Asian','Mixed','Other'].map(o=><option key={o}>{o}</option>)}</select></div>
        </div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
          {[['Hair Color','haircolor'],['Hair Length','hairlength'],['Eye Color','eyecolor']].map(([l,k])=>(<div key={k}><div style={lbl}>{l}</div><input {...f(k)} style={mkI(locked)}/></div>))}
        </div>
        {[['Scars','scars'],['Tattoos','tattoos'],['Piercings','piercings'],['Disabilities','disabilities'],['Disfigurements','disfigurements']].map(([l,k])=>(<div key={k} style={{marginBottom:'8px'}}><div style={lbl}>{l}</div><textarea {...f(k)} style={{...mkT(locked),minHeight:'48px'}} placeholder={`Describe ${l.toLowerCase()}...`}/></div>))}
      </div></Sec>}

      {hasExt&&<Sec title="Exterior Attributes" open={isAnimObj}><div style={{paddingTop:'8px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>{[['Material','extmaterial'],['Color','extcolor'],['Texture','exttexture']].map(([l,k])=>(<div key={k}><div style={lbl}>{l}</div><input {...f(k)} style={mkI(locked)}/></div>))}</div></Sec>}

      {isPerson&&<Sec title="Personality"><div style={{paddingTop:'8px'}}>{[['Intelligence','intelligence'],['Humor','humor'],['Wisdom','wisdom'],['Charisma','charisma']].map(([l,k])=>(<Stars key={k} label={l} value={data[k]??3} onChange={v=>set(k,v)} disabled={locked}/>))}</div></Sec>}

      {isPerson&&<Sec title="Clothing"><div style={{paddingTop:'8px'}}><textarea {...f('clothingdescription')} style={mkT(locked)} placeholder="Describe clothing..."/></div></Sec>}

      {isSet&&<Sec title="Set / Environment" open={true}><div style={{paddingTop:'8px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>{[['Time Period','timeperiod'],['Material','extmaterial'],['Color','extcolor'],['Texture','exttexture']].map(([l,k])=>(<div key={k}><div style={lbl}>{l}</div><input {...f(k)} style={mkI(locked)}/></div>))}</div>
        <div style={{marginBottom:'12px'}}><div style={lbl}>Background Description</div><textarea {...f('bgimagedesc')} style={mkT(locked)}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'12px'}}>{[['Width','setwidthft'],['Length','setlengthft'],['Height','setheightft']].map(([l,k])=>(<div key={k}><div style={lbl}>{l} (ft)</div><Sp value={data[k]??20} onChange={v=>set(k,v)} min={1} max={999} disabled={locked}/></div>))}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>{[['60% Dominant','dominantcolor'],['30% Secondary','secondarycolor'],['10% Accent','accentcolor']].map(([l,k])=>(<div key={k}><div style={lbl}>{l}</div><div style={{display:'flex',gap:'6px',alignItems:'center'}}><div style={{width:'24px',height:'24px',background:data[k]||'#000',border:`1px solid ${BORDER}`}}/><input type="color" value={data[k]||'#000000'} onChange={e=>set(k,e.target.value)} style={{width:'28px',height:'24px',background:'none',border:`1px solid ${BORDER}`,padding:0,cursor:'pointer'}}/><input value={data[k]||''} onChange={e=>set(k,e.target.value)} style={{...mkI(locked),fontFamily:'monospace',fontSize:'0.7rem'}}/></div></div>))}</div>
      </div></Sec>}

      <Sec title="File Uploads"><div style={{paddingTop:'8px'}}>
        <div style={{marginBottom:'10px'}}><div style={lbl}>Reference Image</div><div style={{border:`1px dashed rgba(201,146,74,0.2)`,padding:'14px',textAlign:'center',fontSize:'0.72rem',color:CHARCOAL,cursor:locked?'default':'pointer',opacity:locked?0.4:1}}>Click to upload (JPG, PNG, WEBP)</div></div>
      </div></Sec>

      {/* AI Prompt */}
      <Sec title="AI Prompt" open={true}><div style={{paddingTop:'8px'}}>
        <div style={{display:'flex',gap:'10px',marginBottom:'12px',alignItems:'flex-end',flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:'160px'}}><div style={lbl}>Image AI Model</div><select value={data.aiimagemodel||''} onChange={e=>!locked&&onChange('aiimagemodel',e.target.value)} disabled={locked} style={mkS(locked)}><option value="">— Default (Imagen 4) —</option>{IMG_MODELS.map(m=><option key={m}>{m}</option>)}</select></div>
          <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:locked?'default':'pointer',fontSize:'0.78rem',color:CREAM,whiteSpace:'nowrap',paddingBottom:'2px'}}>
            <input type="checkbox" checked={!!data.photorealistic} onChange={e=>!locked&&onChange('photorealistic',e.target.checked)} disabled={locked} style={{accentColor:GOLD,width:'14px',height:'14px'}}/>
            Photorealistic
          </label>
          <button onClick={buildPrompt} disabled={locked} style={{background:'rgba(201,146,74,0.1)',border:`1px solid rgba(201,146,74,0.25)`,color:locked?MUTED:GOLD,padding:'9px 14px',cursor:locked?'default':'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.68rem',letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>Build Prompt</button>
        </div>

        {/* AI Generated Prompt (read-only, from Generate Assets) */}
        {data.aigeneratedprompt&&(
          <div style={{marginBottom:'12px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px'}}>
              <div style={{...lbl,marginBottom:0}}>AI Generated Prompt</div>
              <button onClick={()=>{if(data.prompt&&data.prompt!==data.aigeneratedprompt){if(!window.confirm('Overwrite your edited Prompt?'))return}onChange('prompt',data.aigeneratedprompt)}}
                style={{background:'transparent',border:`1px solid rgba(201,146,74,0.25)`,color:GOLD,padding:'3px 10px',cursor:'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.62rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>
                ↓ Copy to Prompt
              </button>
            </div>
            <textarea readOnly value={data.aigeneratedprompt||''} style={{...mkT(true),minHeight:'64px',fontFamily:'monospace',fontSize:'0.72rem',opacity:0.5,cursor:'default'}}/>
          </div>
        )}

        <div style={{marginBottom:'4px'}}><div style={lbl}>Prompt</div><textarea {...f('prompt')} style={{...mkT(locked),minHeight:'100px',fontFamily:'monospace',fontSize:'0.75rem'}}/></div>
      </div></Sec>

      {/* Image Generation */}
      <Sec title="Image Generation" open={true}><div style={{paddingTop:'8px'}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:'12px',marginBottom:'14px',flexWrap:'wrap'}}>
          <Sp label="# Variations" value={numVariations} onChange={setNumVariations} min={1} max={4} disabled={locked}/>
          <button onClick={genImages} disabled={genImg||locked} style={{background:genImg?'rgba(201,146,74,0.4)':GOLD,border:'none',color:SURFACE,padding:'9px 20px',cursor:genImg||locked?'default':'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:500}}>
            {genImg?'Generating…':'Generate Images'}
          </button>
          {storedDrafts.length>0&&<button onClick={()=>setDrafts([])} style={{background:'none',border:`1px solid ${BORDER}`,color:MUTED,padding:'9px 12px',cursor:'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.68rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>Clear All</button>}
        </div>
        {imgErr&&<div style={{padding:'7px 10px',background:'rgba(200,75,49,0.1)',border:`1px solid rgba(200,75,49,0.25)`,color:RED,fontSize:'0.75rem',marginBottom:'10px'}}>⚠ {imgErr}</div>}
        {storedDrafts.length>0&&(
          <div>
            <div style={{fontSize:'0.68rem',color:CHARCOAL,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'10px'}}>{storedDrafts.length} versions — {finalIdx>=0?`#${finalIdx+1} is Final`:'none selected as Final'}</div>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(storedDrafts.length,3)},1fr)`,gap:'8px'}}>
              {storedDrafts.map((d,i)=>(
                <div key={d.id||i}>
                  <div onClick={()=>selectFinal(i)} style={{aspectRatio:'1',background:'#000',border:`2px solid ${d.isFinal?GOLD:BORDER}`,cursor:'pointer',overflow:'hidden',position:'relative'}}>
                    {d.dataUrl?<img src={d.dataUrl} alt={`v${d.num||i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:MUTED,fontSize:'0.72rem'}}>No image</div>}
                    {d.isFinal&&<div style={{position:'absolute',top:'6px',right:'6px',background:GOLD,color:SURFACE,width:'18px',height:'18px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:700}}>✓</div>}
                    <div style={{position:'absolute',bottom:'4px',left:'6px',background:'rgba(0,0,0,0.6)',color:CREAM,fontSize:'0.58rem',padding:'1px 5px'}}>#{d.num||i+1}</div>
                  </div>
                  <div style={{display:'flex',gap:'4px',marginTop:'4px'}}>
                    <button onClick={()=>selectFinal(i)} style={{flex:1,background:d.isFinal?'rgba(201,146,74,0.12)':'none',border:`1px solid ${d.isFinal?'rgba(201,146,74,0.35)':BORDER}`,color:d.isFinal?GOLD:CHARCOAL,padding:'4px 0',cursor:'pointer',fontSize:'0.6rem',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:'DM Sans, sans-serif'}}>{d.isFinal?'✓ Final':'Select'}</button>
                    <button onClick={()=>setDrafts(storedDrafts.filter((_,j)=>j!==i))} style={{background:'none',border:`1px solid ${BORDER}`,color:MUTED,padding:'4px 7px',cursor:'pointer',fontSize:'0.7rem'}}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div></Sec>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AssetDetail(){
  const {assetId}=useParams()
  const navigate=useNavigate()
  const {endUser}=useAuth()
  const isNew=!assetId||assetId==='new'
  const [assetMeta,setAssetMeta]=useState({name:'',assettype:'Person',domain:'User Domain',aigenerated:false,royaltyeligible:false,locked:false,elevenlabs_voice_id:''})
  const [instances,setInstances]=useState([{_tempId:1,...BLANK}])
  const [activeKey,setActiveKey]=useState(1)
  const [activeTab,setActiveTab]=useState('image')
  const [saving,setSaving]=useState(false)
  const [loading,setLoading]=useState(!isNew)
  const [toast,setToast]=useState('')
  const [addingInst,setAddingInst]=useState(false)
  const [newInstName,setNewInstName]=useState('')
  const [savedAssetId,setSavedAssetId]=useState(isNew?null:parseInt(assetId))

  useEffect(()=>{
    if(isNew)return
    async function load(){
      setLoading(true)
      const {data:a}=await supabase.from('assets').select('*').eq('assetid',parseInt(assetId)).single()
      const {data:insts}=await supabase.from('assetinstances').select('*').eq('assetid',parseInt(assetId)).eq('activestatus','A').order('instanceid')
      if(a)setAssetMeta({name:a.name,assettype:a.assettype,domain:a.domain||'User Domain',aigenerated:!!a.aigenerated,royaltyeligible:!!a.royaltyeligible,locked:!!a.locked,elevenlabs_voice_id:a.elevenlabs_voice_id||''})
      if(insts?.length){setInstances(insts);setActiveKey(insts[0].instanceid)}
      setLoading(false)
    }
    load()
  },[assetId])

  const locked=assetMeta.locked
  const activeInst=instances.find(i=>(i.instanceid||i._tempId)===activeKey)||instances[0]
  function upd(k,v){setInstances(is=>is.map(i=>(i.instanceid||i._tempId)===activeKey?{...i,[k]:v}:i))}
  function toast_(m){setToast(m);setTimeout(()=>setToast(''),3000)}

  async function save(){
    if(!assetMeta.name.trim()){toast_('Asset name is required');return}
    setSaving(true)
    try{
      let aid=savedAssetId
      if(isNew||!aid){
        const {data:a,error:ae}=await supabase.from('assets').insert({name:assetMeta.name,assetname:assetMeta.name,assettype:assetMeta.assettype,domain:assetMeta.domain,aigenerated:assetMeta.aigenerated,royaltyeligible:assetMeta.royaltyeligible,locked:false,elevenlabs_voice_id:assetMeta.elevenlabs_voice_id||null,activestatus:'A',createdate:new Date().toISOString(),updatedate:new Date().toISOString(),createdby:endUser?.enduserid}).select().single()
        if(ae)throw ae;aid=a.assetid;setSavedAssetId(aid)
      }else{
        await supabase.from('assets').update({name:assetMeta.name,assetname:assetMeta.name,assettype:assetMeta.assettype,domain:assetMeta.domain,aigenerated:assetMeta.aigenerated,royaltyeligible:assetMeta.royaltyeligible,elevenlabs_voice_id:assetMeta.elevenlabs_voice_id||null,updatedate:new Date().toISOString(),updatedby:endUser?.enduserid}).eq('assetid',aid)
      }
      for(const inst of instances){
        const draftsVal=inst.imagedrafts?(typeof inst.imagedrafts==='string'?inst.imagedrafts:JSON.stringify(inst.imagedrafts)):null
        const p={assetid:aid,instancename:inst.instancename||'Main',description:inst.description||null,characterimportance:inst.characterimportance||null,speakingrole:!!inst.speakingrole,sex:inst.sex||null,heightft:inst.heightft||null,heightin:inst.heightin||null,weightlbs:inst.weightlbs||null,bodyshape:inst.bodyshape||null,skintone:inst.skintone||null,ethnicity:inst.ethnicity||null,haircolor:inst.haircolor||null,hairlength:inst.hairlength||null,eyecolor:inst.eyecolor||null,scars:inst.scars||null,tattoos:inst.tattoos||null,piercings:inst.piercings||null,disabilities:inst.disabilities||null,disfigurements:inst.disfigurements||null,extmaterial:inst.extmaterial||null,extcolor:inst.extcolor||null,exttexture:inst.exttexture||null,intelligence:inst.intelligence||3,humor:inst.humor||3,wisdom:inst.wisdom||3,charisma:inst.charisma||3,clothingdescription:inst.clothingdescription||null,timeperiod:inst.timeperiod||null,setwidthft:inst.setwidthft||null,setlengthft:inst.setlengthft||null,setheightft:inst.setheightft||null,dominantcolor:inst.dominantcolor||null,secondarycolor:inst.secondarycolor||null,accentcolor:inst.accentcolor||null,bgimagedesc:inst.bgimagedesc||null,bgaudiodesc:inst.bgaudiodesc||null,prompt:inst.prompt||null,script:inst.script||null,finalimage:inst.finalimage||null,promptaspectratio:inst.promptaspectratio||null,negativeprompt:inst.negativeprompt||null,styleconsistencyanchor:inst.styleconsistencyanchor||null,aiimagemodel:inst.aiimagemodel||null,aigeneratedprompt:inst.aigeneratedprompt||null,photorealistic:inst.photorealistic??true,imagedrafts:draftsVal,soundaimodel:inst.soundaimodel||null,voiceage:inst.voiceage||null,voicegender:inst.voicegender||null,voiceaccent:inst.voiceaccent||null,voicetone:inst.voicetone||null,voicepacing:inst.voicepacing||null,voiceemotionalrange:inst.voiceemotionalrange||null,voicequalitytag:inst.voicequalitytag||null,voiceprompt:inst.voiceprompt||null,voicespeed:inst.voicespeed??null,voicestabilityscore:inst.voicestabilityscore??null,voicesimilarity:inst.voicesimilarity??null,voicestyle:inst.voicestyle??null,activestatus:'A',updatedate:new Date().toISOString()}
        if(inst.instanceid){await supabase.from('assetinstances').update(p).eq('instanceid',inst.instanceid)}
        else{await supabase.from('assetinstances').insert({...p,createdate:new Date().toISOString()})}
      }
      toast_('Saved ✓')
    }catch(e){toast_('Error: '+e.message)}
    setSaving(false)
  }

  async function clone(){
    setSaving(true)
    const {data:a}=await supabase.from('assets').insert({name:assetMeta.name+' (Copy)',assetname:assetMeta.name+' (Copy)',assettype:assetMeta.assettype,domain:assetMeta.domain,aigenerated:assetMeta.aigenerated,royaltyeligible:assetMeta.royaltyeligible,locked:false,activestatus:'A',createdate:new Date().toISOString(),updatedate:new Date().toISOString(),createdby:endUser?.enduserid}).select().single()
    if(a){for(const inst of instances){const{instanceid,assetid,createdate,updatedate,...rest}=inst;await supabase.from('assetinstances').insert({...rest,assetid:a.assetid,createdate:new Date().toISOString(),updatedate:new Date().toISOString()})};navigate(`/assets/${a.assetid}`)}
    setSaving(false)
  }

  function addInst(){if(!newInstName.trim())return;const ni={_tempId:Date.now(),...BLANK,instancename:newInstName.trim()};setInstances(is=>[...is,ni]);setActiveKey(ni._tempId);setNewInstName('');setAddingInst(false)}
  async function delInst(inst){if(inst.instancename==='Main')return;if(inst.instanceid)await supabase.from('assetinstances').update({activestatus:'H'}).eq('instanceid',inst.instanceid);const rem=instances.filter(i=>(i.instanceid||i._tempId)!==(inst.instanceid||inst._tempId));setInstances(rem);setActiveKey(rem[0]?.instanceid||rem[0]?._tempId)}

  if(loading)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:MUTED,fontFamily:'DM Sans, sans-serif'}}>Loading…</div>

  const isSet=assetMeta.assettype==='Set',isProp=assetMeta.assettype==='Prop',showVoice=!isSet&&!isProp

  return(
    <div style={{fontFamily:'DM Sans, sans-serif',color:CREAM,background:SURFACE,minHeight:'100vh'}}>
      {toast&&<div style={{position:'fixed',top:'16px',left:'50%',transform:'translateX(-50%)',background:toast.startsWith('Error')?'rgba(200,75,49,0.95)':'rgba(74,156,122,0.95)',color:'#fff',padding:'8px 24px',fontSize:'0.78rem',zIndex:999,borderRadius:'2px',pointerEvents:'none',whiteSpace:'nowrap'}}>{toast}</div>}

      {/* Header */}
      <div style={{background:SURFACE2,borderBottom:`1px solid ${BORDER}`,padding:'0 28px',position:'sticky',top:0,zIndex:20}}>
        <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px 0',borderBottom:`1px solid ${BORDER}`}}>
          <button onClick={()=>navigate('/assets')} style={{background:'none',border:'none',color:CHARCOAL,cursor:'pointer',fontSize:'0.72rem',letterSpacing:'0.06em',textTransform:'uppercase',padding:0,flexShrink:0}}>← Assets</button>
          <div style={{width:'1px',height:'18px',background:BORDER}}/>
          {locked
            ?<div style={{fontFamily:'Cormorant Garamond, serif',fontSize:'1.5rem',fontWeight:300,color:CREAM,flex:1}}>{assetMeta.name}</div>
            :<input value={assetMeta.name} onChange={e=>setAssetMeta(m=>({...m,name:e.target.value}))} placeholder="Asset name…" style={{fontFamily:'Cormorant Garamond, serif',fontSize:'1.5rem',fontWeight:300,background:'none',border:'none',borderBottom:`1px solid rgba(201,146,74,0.2)`,color:CREAM,outline:'none',flex:1,padding:'2px 0'}}/>
          }
          {locked&&<span style={{background:'rgba(200,75,49,0.15)',color:RED,fontSize:'0.6rem',padding:'2px 8px',letterSpacing:'0.08em',textTransform:'uppercase',flexShrink:0}}>🔒 Locked</span>}
          <div style={{display:'flex',gap:'8px',flexShrink:0}}>
            {!isNew&&<button onClick={clone} disabled={saving} style={{background:'none',border:`1px solid ${BORDER}`,color:CHARCOAL,padding:'7px 14px',cursor:'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.72rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>Clone</button>}
            {!locked&&<button onClick={save} disabled={saving} style={{background:GOLD,border:'none',color:SURFACE,padding:'7px 20px',cursor:'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:500,opacity:saving?0.7:1}}>{saving?'Saving…':'Save'}</button>}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px',padding:'10px 0',borderBottom:`1px solid ${BORDER}`,flexWrap:'wrap'}}>
          <select value={assetMeta.assettype} onChange={e=>!locked&&setAssetMeta(m=>({...m,assettype:e.target.value}))} disabled={locked} style={{background:SURFACE,border:`1px solid ${BORDER}`,color:CREAM,fontFamily:'DM Sans, sans-serif',fontSize:'0.78rem',padding:'5px 10px',cursor:locked?'default':'pointer',outline:'none'}}>
            {ASSET_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
          <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
            {['Speaking Role','Non-speaking'].map((l,i)=>(
              <label key={l} style={{display:'flex',alignItems:'center',gap:'6px',cursor:locked?'default':'pointer',fontSize:'0.78rem',color:!!activeInst?.speakingrole===(i===0)?GOLD:CHARCOAL}}>
                <input type="radio" name="sr" checked={!!activeInst?.speakingrole===(i===0)} onChange={()=>!locked&&upd('speakingrole',i===0)} style={{accentColor:GOLD}}/>{l}
              </label>
            ))}
          </div>
          <div style={{display:'flex',gap:'20px',marginLeft:'auto'}}>
            <Toggle label="AI Generated" value={assetMeta.aigenerated} onChange={v=>!locked&&setAssetMeta(m=>({...m,aigenerated:v}))} disabled={locked}/>
            <Toggle label="Royalty Eligible" value={assetMeta.royaltyeligible} onChange={v=>!locked&&setAssetMeta(m=>({...m,royaltyeligible:v}))} disabled={locked}/>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',overflowX:'auto'}}>
          {instances.map(inst=>{const k=inst.instanceid||inst._tempId;return(<div key={k} style={{display:'flex',alignItems:'center'}}><button onClick={()=>setActiveKey(k)} style={{background:'none',border:'none',borderBottom:activeKey===k?`2px solid ${GOLD}`:'2px solid transparent',color:activeKey===k?GOLD:CHARCOAL,padding:'10px 16px',cursor:'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.78rem',whiteSpace:'nowrap',marginBottom:'-1px'}}>{inst.instancename}</button>{inst.instancename!=='Main'&&!locked&&<button onClick={()=>delInst(inst)} style={{background:'none',border:'none',color:CHARCOAL,cursor:'pointer',fontSize:'0.6rem',padding:'0 4px'}}>✕</button>}</div>)})}
          {!addingInst?<button onClick={()=>setAddingInst(true)} style={{background:'none',border:'none',color:CHARCOAL,padding:'10px 12px',cursor:'pointer',fontSize:'0.75rem',whiteSpace:'nowrap'}}>+ Instance</button>
            :<div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 8px'}}><input value={newInstName} onChange={e=>setNewInstName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addInst()} autoFocus placeholder="Instance name" style={{background:SURFACE,border:`1px solid ${BORDER}`,color:CREAM,padding:'4px 8px',fontFamily:'DM Sans, sans-serif',fontSize:'0.75rem',outline:'none',width:'120px'}}/><button onClick={addInst} style={{background:GOLD,border:'none',color:SURFACE,padding:'4px 10px',cursor:'pointer',fontSize:'0.7rem',fontFamily:'DM Sans, sans-serif'}}>Add</button><button onClick={()=>{setAddingInst(false);setNewInstName('')}} style={{background:'none',border:'none',color:CHARCOAL,cursor:'pointer'}}>✕</button></div>}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{background:SURFACE2,borderBottom:`1px solid ${BORDER}`,padding:'0 28px',display:'flex'}}>
        {[{id:'image',label:'Image'},...(showVoice?[{id:'voice',label:'Voice & Sound'}]:[])].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{background:'none',border:'none',borderBottom:activeTab===tab.id?`2px solid ${GOLD}`:'2px solid transparent',color:activeTab===tab.id?GOLD:CHARCOAL,padding:'12px 20px',cursor:'pointer',fontFamily:'DM Sans, sans-serif',fontSize:'0.78rem',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'-1px'}}>{tab.label}</button>
        ))}
      </div>

      {activeInst&&activeTab==='image'&&<ImageTab data={activeInst} onChange={upd} locked={locked} assetMeta={assetMeta}/>}
      {activeInst&&activeTab==='voice'&&showVoice&&<VoiceTab data={activeInst} onChange={upd} locked={locked} assetMeta={assetMeta} savedAssetId={savedAssetId}
        onVoiceIdChange={async(id)=>{
          setAssetMeta(m=>({...m,elevenlabs_voice_id:id}))
          if(savedAssetId){await supabase.from('assets').update({elevenlabs_voice_id:id,updatedate:new Date().toISOString()}).eq('assetid',savedAssetId);toast_('Voice ID saved ✓')}
        }}/>}
    </div>
  )
}
