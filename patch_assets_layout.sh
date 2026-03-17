#!/bin/bash
# Patch Assets.jsx — fix AI Prompt section layout and ordering
# Run from: /mnt/c/users/joe/culmina-studio

python3 - << 'PYEOF'
with open('src/pages/Assets.jsx', 'r') as f:
    src = f.read()

changes = 0

# ── 1. Replace the messy AI Prompt section content with clean layout ──
# The current AI Prompt section starts with the Generate Image Prompt button
# and ends before the Voice & Sound section

old_ai_section = """      {/* AI Prompt */}
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

new_ai_section = """      {/* AI Prompt */}
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
                  const res = await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:200,messages:[{role:'user',content:`Generate a ${soundModel.includes('elevenlabs') ? 'ElevenLabs Voice Design v3' : soundModel} voice prompt for: ${data.instancename||'this character'}.\nKnown attributes: ${structuredPrompt||'none'}\nImage reference: ${(data.prompt||'').slice(0,200)}\nStyle anchor: ${data.styleconsistencyanchor||''}\nReturn ONLY the prompt, one concise sentence.`}]})})
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
        )}"""

if old_ai_section in src:
    src = src.replace(old_ai_section, new_ai_section)
    changes += 1
    print('✓ Rebuilt AI Prompt section with clean layout')
else:
    print('WARNING: AI Prompt section not matched exactly')

# ── 2. Fix Voice & Sound section — move it ABOVE AI Prompt ──
# Find the Voice & Sound section and the AI Prompt section, then swap their order
# Voice & Sound currently appears AFTER the AI Prompt closing </Section>
# We need it BEFORE

# Find where Voice & Sound section starts (after </Section> closing AI Prompt)
vs_marker = '      {/* ── Voice & Sound ── */}'
ai_marker = '      {/* AI Prompt */}'

if vs_marker in src and ai_marker in src:
    # Extract Voice & Sound block
    vs_start = src.find(vs_marker)
    # Find the end — it's a {!isSet && !isProp && (<Section ...>...</Section>)} block
    # Count braces from vs_start to find the closing
    depth = 0
    vs_end = vs_start
    found_open = False
    for i, ch in enumerate(src[vs_start:], vs_start):
        if ch == '{': depth += 1; found_open = True
        if ch == '}': depth -= 1
        if found_open and depth == 0:
            vs_end = i + 1
            break

    voice_sound_block = src[vs_start:vs_end]
    
    # Remove Voice & Sound from its current position
    src_without_vs = src[:vs_start].rstrip() + '\n' + src[vs_end:]
    
    # Insert before AI Prompt
    ai_pos = src_without_vs.find(ai_marker)
    src = src_without_vs[:ai_pos] + voice_sound_block + '\n\n' + src_without_vs[ai_pos:]
    changes += 1
    print('✓ Moved Voice & Sound section above AI Prompt')

# ── 3. Gate Physical/Personality/Clothing to Person ONLY (already isPerson gated)
# Verify they're already correctly gated — they should be
phys_check = '{isPerson && (\n        <Section title="Physical Attributes">'
pers_check = '{isPerson && (\n        <Section title="Personality">'
cloth_check = '{isPerson && (\n        <Section title="Clothing">'

for check, name in [(phys_check,'Physical'),(pers_check,'Personality'),(cloth_check,'Clothing')]:
    if check in src:
        print(f'✓ {name} already gated to isPerson — Sets/Props/Sound/Other excluded')
    else:
        # Try alternate spacing
        alt = check.replace('\n        ', '\n      ')
        if alt in src:
            print(f'✓ {name} already gated to isPerson (alt spacing)')
        else:
            print(f'  NOTE: {name} section — verify isPerson gating manually')

with open('src/pages/Assets.jsx', 'w') as f:
    f.write(src)

print(f'\n{changes} changes applied successfully.')
PYEOF
