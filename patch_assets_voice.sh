#!/bin/bash
# Patch Assets.jsx — add voice + image generation fields to InstanceForm
# Run from: /mnt/c/users/joe/culmina-studio

python3 - << 'PYEOF'
with open('src/pages/Assets.jsx', 'r') as f:
    src = f.read()

# ── 1. Extend BLANK_INSTANCE ──────────────────────────────────
old_blank = """const BLANK_INSTANCE = {
  voiceprompt: '',
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
}"""

new_blank = """const BLANK_INSTANCE = {
  voiceprompt: '',
  // Voice design fields (ElevenLabs v3)
  voiceage: '', voicegender: '', voiceaccent: '', voicetone: '',
  voicepacing: '', voiceemotionalrange: '', voicequalitytag: '', voicestability: '',
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
}"""

if old_blank in src:
    src = src.replace(old_blank, new_blank)
    print('✓ Extended BLANK_INSTANCE')
else:
    print('WARNING: BLANK_INSTANCE pattern not found — check manually')

# ── 2. Replace the Voice Prompt section with full voice design fields ──
old_voice = """        <div style={lbl}>Voice Prompt</div>
        <textarea {...f('voiceprompt')} style={{...txt,minHeight:'80px'}} placeholder="ElevenLabs voice direction: tone, accent, pace, emotional quality..." />
        <button
          disabled={locked}
          onClick={async()=>{
            if(locked) return
            const res = await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:`Generate ElevenLabs voice prompt for: ${data.instancename||'this character'}. Based on image prompt: ${(data.prompt||'').slice(0,300)}. Provide: tone, accent, speaking pace, emotional quality, style notes. 2-3 sentences, concise and actionable.`}]})})
            const d = await res.json()
            const text = d.content?.map(b=>b.text||'').join('') || ''
            onChange('voiceprompt', text)
          }}
          style={{ background:'transparent', border:`1px solid rgba(201,146,74,0.25)`, color:locked?'#6A6560':'#C9924A', padding:'8px 16px', cursor:locked?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'6px' }}>
          Generate Voice Prompt
        </button>"""

new_voice = """        {/* ── Image Generation Parameters ── */}
        <div style={{ marginTop:'12px', marginBottom:'4px', fontSize:'0.68rem', color:'#6A6560', textTransform:'uppercase', letterSpacing:'0.1em', borderTop:'1px solid rgba(201,146,74,0.12)', paddingTop:'14px' }}>Image Generation</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
          <div>
            <div style={lbl}>Aspect Ratio</div>
            <select {...f('promptaspectratio')} style={{...mkSel(locked)}}>
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
          <textarea {...f('styleconsistencyanchor')} style={{...mkTxt(locked),minHeight:'56px'}} placeholder="Phrase reused across ALL instances of this character e.g. 'always wearing olive patrol uniform, small scar above left eye'" />
          <div style={{ fontSize:'0.65rem', color:'#6A6560', marginTop:'3px' }}>Prepended to every image prompt for this character to maintain visual consistency across generations.</div>
        </div>

        {/* ── Voice Design ── */}
        <div style={{ marginTop:'12px', marginBottom:'4px', fontSize:'0.68rem', color:'#6A6560', textTransform:'uppercase', letterSpacing:'0.1em', borderTop:'1px solid rgba(201,146,74,0.12)', paddingTop:'14px' }}>Voice Design (ElevenLabs)</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
          <div>
            <div style={lbl}>Age</div>
            <input {...f('voiceage')} style={mkInp(locked)} placeholder="e.g. late 20s, mid 50s" />
          </div>
          <div>
            <div style={lbl}>Gender</div>
            <select {...f('voicegender')} style={mkSel(locked)}>
              <option value="">— Select —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Neutral">Neutral</option>
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
              <option value="Wide">Wide</option>
              <option value="Neutral">Neutral</option>
              <option value="Narrow">Narrow</option>
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
              <option value="Creative">Creative — expressive, variable</option>
              <option value="Natural">Natural — balanced</option>
              <option value="Robust">Robust — consistent, stable</option>
            </select>
          </div>
        </div>

        <div style={lbl}>Voice Prompt</div>
        <textarea {...f('voiceprompt')} style={{...mkTxt(locked),minHeight:'80px'}} placeholder="ElevenLabs voice direction — generated below or write manually..." />
        <button
          disabled={locked}
          onClick={async()=>{
            if(locked) return
            // Build structured ElevenLabs prompt from fields
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

            // If we have enough fields, use them directly; otherwise call Claude
            if(parts.length >= 4) {
              onChange('voiceprompt', structuredPrompt)
              return
            }
            // Fall back to Claude for enrichment
            const res = await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:200,messages:[{role:'user',content:`Generate an ElevenLabs Voice Design v3 prompt for: ${data.instancename||'this character'}.
Known attributes: ${structuredPrompt || 'none specified'}
Image reference: ${(data.prompt||'').slice(0,200)}
Style anchor: ${data.styleconsistencyanchor||''}
Format: "[quality tag]. [gender] voice, [age], [accent] accent, [tone] timbre, [pacing] pace, [emotional range] emotional range. [stability] delivery."
Return ONLY the prompt, one sentence, no preamble.`}]})})
            const d = await res.json()
            const text = d.content?.map(b=>b.text||'').join('') || ''
            onChange('voiceprompt', text)
          }}
          style={{ background:'transparent', border:`1px solid rgba(201,146,74,0.25)`, color:locked?'#6A6560':'#C9924A', padding:'8px 16px', cursor:locked?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'6px' }}>
          Generate Voice Prompt
        </button>"""

if old_voice in src:
    src = src.replace(old_voice, new_voice)
    print('✓ Replaced Voice section with full voice + image fields')
else:
    print('WARNING: Voice section pattern not found — check manually')
    print('Looking for partial match...')
    if 'Generate Voice Prompt' in src:
        print('  "Generate Voice Prompt" button found — pattern may have slight differences')

with open('src/pages/Assets.jsx', 'w') as f:
    f.write(src)

print('\nPatch complete.')
print('\nAlso run this SQL in Supabase to ensure all columns exist:')
print("""
ALTER TABLE public.assetinstances
  ADD COLUMN IF NOT EXISTS voiceage             VARCHAR(20),
  ADD COLUMN IF NOT EXISTS voicegender          VARCHAR(10),
  ADD COLUMN IF NOT EXISTS voiceaccent          VARCHAR(50),
  ADD COLUMN IF NOT EXISTS voicetone            VARCHAR(50),
  ADD COLUMN IF NOT EXISTS voicepacing          VARCHAR(30),
  ADD COLUMN IF NOT EXISTS voiceemotionalrange  VARCHAR(20),
  ADD COLUMN IF NOT EXISTS voicequalitytag      VARCHAR(30),
  ADD COLUMN IF NOT EXISTS voicestability       VARCHAR(10),
  ADD COLUMN IF NOT EXISTS promptaspectratio    VARCHAR(15),
  ADD COLUMN IF NOT EXISTS negativeprompt       TEXT,
  ADD COLUMN IF NOT EXISTS styleconsistencyanchor TEXT;

NOTIFY pgrst, 'reload schema';
""")
PYEOF
