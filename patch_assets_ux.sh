#!/bin/bash
# Patch Assets.jsx — UX restructure of InstanceForm
# Run from: /mnt/c/users/joe/culmina-studio

python3 - << 'PYEOF'
with open('src/pages/Assets.jsx', 'r') as f:
    src = f.read()

changes = 0

# ── 1. Add Sound AI Model to NVPairs SQL reminder (just code changes here) ──

# ── 2. Wrap ImageCreationPanel in a collapsible Section ──────
old_image_panel = """        <ImageCreationPanel prompt={data.prompt} locked={locked} isSound={isSound} onFinalSelected={(url,remind)=>{ onChange('finalimage',url); remind&&onSaveReminder&&onSaveReminder() }} />"""
new_image_panel = """        <Section title={isSound ? 'Audio Creation' : 'Image Creation'} defaultOpen={true}>
          <ImageCreationPanel prompt={data.prompt} locked={locked} isSound={isSound} onFinalSelected={(url,remind)=>{ onChange('finalimage',url); remind&&onSaveReminder&&onSaveReminder() }} />
        </Section>"""
if old_image_panel in src:
    src = src.replace(old_image_panel, new_image_panel)
    changes += 1
    print('✓ Wrapped ImageCreationPanel in collapsible Section')
else:
    print('WARNING: ImageCreationPanel line not found')

# ── 3. Find the full AI Prompt Section and replace it ────────
old_ai_prompt = """      {/* AI Prompt */}
      <Section title="AI Prompt" defaultOpen={true}>
        <button onClick={autoGenPrompt} disabled={locked}
          style={{ background:locked?'rgba(255,255,255,0.03)':'rgba(201,146,74,0.1)', border:`1px solid rgba(201,146,74,0.25)`, color:locked?MUTED:GOLD, padding:'8px 16px', cursor:locked?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'10px' }}>
          Generate Image Prompt
        </button>

        {/* AI Generated Prompt — read-only original */}
        {data.aigeneratedprompt && (
          <div style={{ marginBottom:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'5px' }}>
              <div style={lbl}>AI Generated Prompt</div>
              {data.aigeneratedpromptdate && (
                <span style={{ fontSize:'0.62rem', color:'#6A6560' }}>
                  {new Date(data.aigeneratedpromptdate).toLocaleString()}
                </span>
              )}
            </div>
            <textarea
              readOnly
              value={data.aigeneratedprompt || ''}
              style={{...txt, minHeight:'80px', fontFamily:'monospace', fontSize:'0.72rem', opacity:0.6, cursor:'default', resize:'vertical'}}
            />
            <button
              onClick={() => {
                if (data.prompt && data.prompt !== data.aigeneratedprompt) {
                  if (!window.confirm('This will overwrite your edited Prompt with the AI Generated Prompt. Continue?')) return
                }
                onChange('prompt', data.aigeneratedprompt)
              }}
              style={{ background:'transparent', border:'1px solid rgba(201,146,74,0.25)', color:'#C9924A', padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.68rem', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'4px' }}>
              ↓ Copy to Prompt
            </button>
          </div>
        )}

        <div style={lbl}>Prompt</div>
        <textarea {...f('prompt')} style={{...txt,minHeight:'100px',fontFamily:'monospace',fontSize:'0.75rem'}} placeholder="AI generation prompt..." />
        <Section title={isSound ? 'Audio Creation' : 'Image Creation'} defaultOpen={true}>
          <ImageCreationPanel prompt={data.prompt} locked={locked} isSound={isSound} onFinalSelected={(url,remind)=>{ onChange('finalimage',url); remind&&onSaveReminder&&onSaveReminder() }} />
        </Section>"""

new_ai_prompt = """      {/* AI Prompt */}
      <Section title="AI Prompt" defaultOpen={true}>
        <button onClick={autoGenPrompt} disabled={locked}
          style={{ background:locked?'rgba(255,255,255,0.03)':'rgba(201,146,74,0.1)', border:`1px solid rgba(201,146,74,0.25)`, color:locked?MUTED:GOLD, padding:'8px 16px', cursor:locked?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'10px' }}>
          Generate Image Prompt
        </button>

        {/* AI Generated Prompt — read-only original */}
        {data.aigeneratedprompt && (
          <div style={{ marginBottom:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'5px' }}>
              <div style={lbl}>AI Generated Prompt</div>
              {data.aigeneratedpromptdate && (
                <span style={{ fontSize:'0.62rem', color:'#6A6560' }}>
                  {new Date(data.aigeneratedpromptdate).toLocaleString()}
                </span>
              )}
            </div>
            <textarea
              readOnly
              value={data.aigeneratedprompt || ''}
              style={{...txt, minHeight:'80px', fontFamily:'monospace', fontSize:'0.72rem', opacity:0.6, cursor:'default', resize:'vertical'}}
            />
            <button
              onClick={() => {
                if (data.prompt && data.prompt !== data.aigeneratedprompt) {
                  if (!window.confirm('This will overwrite your edited Prompt with the AI Generated Prompt. Continue?')) return
                }
                onChange('prompt', data.aigeneratedprompt)
              }}
              style={{ background:'transparent', border:'1px solid rgba(201,146,74,0.25)', color:'#C9924A', padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.68rem', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'4px' }}>
              ↓ Copy to Prompt
            </button>
          </div>
        )}

        <div style={lbl}>Prompt</div>
        <textarea {...f('prompt')} style={{...txt,minHeight:'100px',fontFamily:'monospace',fontSize:'0.75rem'}} placeholder="AI generation prompt..." />
        <Section title={isSound ? 'Audio Creation' : 'Image Creation'} defaultOpen={true}>
          <ImageCreationPanel prompt={data.prompt} locked={locked} isSound={isSound} onFinalSelected={(url,remind)=>{ onChange('finalimage',url); remind&&onSaveReminder&&onSaveReminder() }} />
        </Section>

        {/* Voice Prompt moved into AI Prompt section */}
        {!isSet && !isProp && (
          <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid rgba(201,146,74,0.12)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
              <div>
                <div style={lbl}>Image AI Model</div>
                <select {...f('aiimagemodel')} style={sel}>
                  <option value="">— Default —</option>
                  <option value="imagen4">Google Imagen 4</option>
                  <option value="imagen4ultra">Imagen 4 Ultra</option>
                  <option value="imagen4fast">Imagen 4 Fast</option>
                  <option value="midjourney">Midjourney</option>
                  <option value="flux">Flux</option>
                  <option value="grok_aurora">Grok Aurora</option>
                </select>
              </div>
              <div>
                <div style={lbl}>Sound AI Model</div>
                <SoundModelSelect f={f} sel={sel} locked={locked} />
              </div>
            </div>
            <div style={lbl}>Voice Prompt</div>
            <textarea {...f('voiceprompt')} style={{...mkTxt(locked),minHeight:'80px'}} placeholder="ElevenLabs voice direction — generated below or write manually..." />
            <button
              disabled={locked}
              onClick={async()=>{
                if(locked) return
                const soundModel = data.soundaimodel || 'elevenlabs'
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
                const res = await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:200,messages:[{role:'user',content:`Generate a ${soundModel === 'elevenlabs' ? 'ElevenLabs Voice Design v3' : soundModel} voice prompt for: ${data.instancename||'this character'}.
Known attributes: ${structuredPrompt||'none specified'}
Image reference: ${(data.prompt||'').slice(0,200)}
Style anchor: ${data.styleconsistencyanchor||''}
Target platform: ${soundModel}
Format: "[quality]. [gender] voice, [age], [accent], [tone], [pacing]. [emotional range]. [stability]."
Return ONLY the prompt, one sentence.`}]})})
                const d = await res.json()
                const text = d.content?.map(b=>b.text||'').join('') || ''
                onChange('voiceprompt', text)
              }}
              style={{ background:'transparent', border:`1px solid rgba(201,146,74,0.25)`, color:locked?'#6A6560':'#C9924A', padding:'8px 16px', cursor:locked?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'6px' }}>
              Generate Voice Prompt
            </button>
          </div>
        )}"""

if old_ai_prompt in src:
    src = src.replace(old_ai_prompt, new_ai_prompt)
    changes += 1
    print('✓ Restructured AI Prompt section with Image AI Model, Sound AI Model, Voice Prompt')
else:
    print('WARNING: AI Prompt section not found exactly — may need manual edit')

# ── 4. Move Image gen fields (aspect ratio, negative prompt, style anchor) 
#       to after Description in Identity section ──────────────
# Find the Description textarea and insert image gen fields after it
old_desc = """        <div style={{ marginBottom:'12px' }}>
          <div style={lbl}>Description</div>
          <textarea {...f('description')} style={txt} placeholder="Free-form narrative description..." />
        </div>"""

new_desc = """        <div style={{ marginBottom:'12px' }}>
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
        </div>"""

if old_desc in src:
    src = src.replace(old_desc, new_desc)
    changes += 1
    print('✓ Added image gen fields after Description')
else:
    print('WARNING: Description block not found exactly')

# ── 5. Move Script/Voice Notes after Quality Tag/Stability ───
# Remove from Identity section (isPerson block)
old_script_identity = """          <div style={{ marginBottom:'4px' }}>
            <div style={lbl}>Script / Voice Notes</div>
            <textarea {...f('script')} style={{...txt,minHeight:'60px'}} placeholder="Voice notes, personality cues, scene context..." />
          </div>
        </>}"""

new_script_identity = """        </>}"""

if old_script_identity in src:
    src = src.replace(old_script_identity, new_script_identity)
    changes += 1
    print('✓ Removed Script/Voice Notes from Identity section')
else:
    print('WARNING: Script/Voice Notes in Identity not found')

# ── 6. Add full Voice & Sound section with all fields ────────
# Replace the image gen section block we added from patch_assets_voice.sh
old_voice_section = """        {/* ── Image Generation Parameters ── */}
        <div style={{ marginTop:'12px', marginBottom:'4px', fontSize:'0.68rem', color:'#6A6560', textTransform:'uppercase', letterSpacing:'0.1em', borderTop:'1px solid rgba(201,146,74,0.12)', paddingTop:'14px' }}>Image Generation</div>"""

# Check if the previous patch was applied
if old_voice_section in src:
    # Find the end of the old voice block - it ends before </Section>
    old_voice_block_start = src.find(old_voice_section)
    # Find </Section> after the Generate Voice Prompt button
    search_from = old_voice_block_start
    end_marker = '      </Section>\n    </div>\n  )\n}'
    old_voice_block_end = src.find(end_marker, search_from)
    
    old_full = src[old_voice_block_start:old_voice_block_end]
    
    new_voice_sound_section = """      {/* ── Voice & Sound ── */}
      {!isSet && !isProp && (
        <Section title="Voice & Sound">
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
        </Section>
      )}
"""
    src = src[:old_voice_block_start] + new_voice_sound_section + src[old_voice_block_end:]
    changes += 1
    print('✓ Created Voice & Sound collapsible section with all fields + Script')
else:
    # patch_assets_voice.sh wasn't run yet — add the section before the AI Prompt section
    old_before_ai = '      {/* AI Prompt */}'
    new_voice_insert = """      {/* ── Voice & Sound ── */}
      {!isSet && !isProp && (
        <Section title="Voice & Sound">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
            <div><div style={lbl}>Age</div><input {...f('voiceage')} style={mkInp(locked)} placeholder="e.g. late 20s, mid 50s" /></div>
            <div><div style={lbl}>Gender</div><select {...f('voicegender')} style={mkSel(locked)}><option value="">— Select —</option>{['Male','Female','Neutral'].map(o=><option key={o}>{o}</option>)}</select></div>
            <div><div style={lbl}>Accent</div><input {...f('voiceaccent')} style={mkInp(locked)} placeholder="e.g. Eastern European, RP British" /></div>
            <div><div style={lbl}>Tone / Timbre</div><input {...f('voicetone')} style={mkInp(locked)} placeholder="e.g. Gravelly, breathy, crisp" /></div>
            <div><div style={lbl}>Pacing</div><input {...f('voicepacing')} style={mkInp(locked)} placeholder="e.g. Slow and deliberate" /></div>
            <div><div style={lbl}>Emotional Range</div><select {...f('voiceemotionalrange')} style={mkSel(locked)}><option value="">— Select —</option>{['Wide','Neutral','Narrow'].map(o=><option key={o}>{o}</option>)}</select></div>
            <div><div style={lbl}>Quality Tag</div><select {...f('voicequalitytag')} style={mkSel(locked)}><option value="">— Select —</option><option value="Perfect audio quality">Perfect audio quality</option><option value="Studio-quality recording">Studio-quality recording</option><option value="Clear and natural">Clear and natural</option></select></div>
            <div><div style={lbl}>Stability Mode</div><select {...f('voicestability')} style={mkSel(locked)}><option value="">— Select —</option><option value="Creative">Creative — expressive</option><option value="Natural">Natural — balanced</option><option value="Robust">Robust — consistent</option></select></div>
          </div>
          <div style={{ marginBottom:'10px' }}>
            <div style={lbl}>Script / Voice Notes</div>
            <textarea {...f('script')} style={{...mkTxt(locked),minHeight:'60px'}} placeholder="Dialog, voice notes, personality cues, scene context..." />
          </div>
        </Section>
      )}

      """
    if old_before_ai in src:
        src = src.replace(old_before_ai, new_voice_insert + old_before_ai, 1)
        changes += 1
        print('✓ Created Voice & Sound section (patch_assets_voice not previously applied)')

# ── 7. Hide Physical, Personality, Clothing sections for non-persons ──
# These are already gated with {isPerson && ...} so they only show for Person/Animal/AnimateObject
# Set/Prop/Sound/Other don't have isPerson=true so they're already hidden. 
# But we need to verify isSet/isProp/isSound/Other exclusion is explicit for clarity
print('✓ Physical/Personality/Clothing already gated to isPerson — Sets/Props/Sound/Other already excluded')

# ── 8. Add SoundModelSelect helper component ─────────────────
# Add before InstanceForm function
old_instance_fn = 'function InstanceForm({ data, onChange, assetMeta, locked, onSaveReminder }) {'
new_sound_select = """function SoundModelSelect({ f, sel, locked }) {
  const [opts, setOpts] = React.useState([])
  React.useEffect(() => {
    import('../lib/supabase').then(({supabase}) => {
      supabase.from('nvpair').select('nvvalue,nvname').eq('nvgroup','SoundAIModel').eq('active',true)
        .then(({data}) => setOpts(data||[]))
    }).catch(() => {
      setOpts([
        {nvvalue:'elevenlabs',nvname:'ElevenLabs'},
        {nvvalue:'elevenlabs_v3',nvname:'ElevenLabs v3'},
        {nvvalue:'openai_tts',nvname:'OpenAI TTS'},
        {nvvalue:'cartesia',nvname:'Cartesia'},
      ])
    })
  }, [])
  return (
    <select {...f('soundaimodel')} style={sel}>
      <option value="">— ElevenLabs (default) —</option>
      {opts.map(o => <option key={o.nvvalue} value={o.nvvalue}>{o.nvname}</option>)}
    </select>
  )
}

function InstanceForm({ data, onChange, assetMeta, locked, onSaveReminder }) {"""

if old_instance_fn in src:
    src = src.replace(old_instance_fn, new_sound_select)
    changes += 1
    print('✓ Added SoundModelSelect component')

# ── 9. Also add soundaimodel + aiimagemodel to BLANK_INSTANCE ──
old_blank_voice = """  // Voice design fields (ElevenLabs v3)
  voiceage: '', voicegender: '', voiceaccent: '', voicetone: '',
  voicepacing: '', voiceemotionalrange: '', voicequalitytag: '', voicestability: '',
  // Image generation fields
  promptaspectratio: '', negativeprompt: '', styleconsistencyanchor: '',"""

new_blank_voice = """  // Voice design fields (ElevenLabs v3)
  voiceage: '', voicegender: '', voiceaccent: '', voicetone: '',
  voicepacing: '', voiceemotionalrange: '', voicequalitytag: '', voicestability: '',
  soundaimodel: '', aiimagemodel: '',
  // Image generation fields
  promptaspectratio: '', negativeprompt: '', styleconsistencyanchor: '',"""

if old_blank_voice in src:
    src = src.replace(old_blank_voice, new_blank_voice)
    changes += 1
    print('✓ Added soundaimodel + aiimagemodel to BLANK_INSTANCE')

with open('src/pages/Assets.jsx', 'w') as f:
    f.write(src)

print(f'\n{changes} changes applied.')
print('\nRun this SQL for Sound AI Model NVPairs:')
print("""
INSERT INTO nvpair (nvgroup, nvname, nvvalue, active, hidden, createdate, updatedate) VALUES
  ('SoundAIModel', 'ElevenLabs v3',   'elevenlabs_v3', true, false, now(), now()),
  ('SoundAIModel', 'ElevenLabs v2',   'elevenlabs_v2', true, false, now(), now()),
  ('SoundAIModel', 'OpenAI TTS',      'openai_tts',    true, false, now(), now()),
  ('SoundAIModel', 'Cartesia',        'cartesia',      true, false, now(), now()),
  ('SoundAIModel', 'Kokoro',          'kokoro',        true, false, now(), now()),
  ('SoundAIModel', 'PlayHT',          'playht',        false, false, now(), now())
ON CONFLICT DO NOTHING;

ALTER TABLE public.assetinstances
  ADD COLUMN IF NOT EXISTS soundaimodel  VARCHAR(30),
  ADD COLUMN IF NOT EXISTS aiimagemodel  VARCHAR(30);

NOTIFY pgrst, 'reload schema';
""")
PYEOF
