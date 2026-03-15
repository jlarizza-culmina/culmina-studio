#!/bin/bash
# Patch Assets.jsx — rename button + add Voice Prompt field
# Run from: /mnt/c/users/joe/culmina-studio

FILE="src/pages/Assets.jsx"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found. Run from culmina-studio root."
  exit 1
fi

# 1. Rename "Auto-Generate Prompt" button to "Generate Image Prompt"
sed -i 's/Auto-Generate Prompt/Generate Image Prompt/g' "$FILE"
echo "✓ Renamed button to 'Generate Image Prompt'"

# 2. Add voiceprompt field to BLANK_INSTANCE if not already there
if grep -q 'voiceprompt' "$FILE"; then
  echo "✓ voiceprompt field already exists in BLANK_INSTANCE"
else
  # Add voiceprompt to BLANK_INSTANCE object — find the closing of BLANK_INSTANCE
  sed -i "s/const BLANK_INSTANCE = {/const BLANK_INSTANCE = {\n  voiceprompt: '',/" "$FILE"
  echo "✓ Added voiceprompt to BLANK_INSTANCE"
fi

# 3. Add Voice Prompt textarea + Generate Voice Prompt button after the existing prompt textarea + ImageCreationPanel block
# We look for the line with ImageCreationPanel and insert after it
python3 - << 'PYEOF'
import re

with open('src/pages/Assets.jsx', 'r') as f:
    src = f.read()

# The target line to insert after — the ImageCreationPanel usage
target = "        <ImageCreationPanel prompt={data.prompt} locked={locked} isSound={isSound} onFinalSelected={(url,remind)=>{ onChange('finalimage',url); remind&&onSaveReminder&&onSaveReminder() }} />"

# Check it exists
if target not in src:
    # Try simpler version without onSaveReminder
    target = "        <ImageCreationPanel prompt={data.prompt} locked={locked} isSound={isSound} onFinalSelected={url=>onChange('finalimage',url)} />"

if target not in src:
    print("WARNING: Could not find ImageCreationPanel line. Manual insertion needed.")
    print("Add this block after the ImageCreationPanel line in InstanceForm:")
    print("""
        <div style={lbl}>Voice Prompt</div>
        <textarea {...f('voiceprompt')} style={{...txt,minHeight:'80px'}} placeholder="ElevenLabs voice direction: tone, accent, pace, emotional quality..." />
        <button
          disabled={locked}
          onClick={async()=>{
            if(locked) return
            const res = await fetch('/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:`Generate ElevenLabs voice prompt for character: ${data.instancename || 'this character'}. Description: ${data.prompt||''}. Provide: tone, accent, speaking pace, emotional quality, style notes. 2-3 sentences max.`}]})})
            const d = await res.json()
            const text = d.content?.map(b=>b.text||'').join('') || ''
            onChange('voiceprompt', text)
          }}
          style={{ background:'transparent', border:`1px solid rgba(201,146,74,0.25)`, color:locked?'#6A6560':'#C9924A', padding:'8px 16px', cursor:locked?'default':'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'6px' }}>
          Generate Voice Prompt
        </button>
""")
else:
    insertion = """
        <div style={lbl}>Voice Prompt</div>
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

    src = src.replace(target, target + insertion)
    with open('src/pages/Assets.jsx', 'w') as f:
        f.write(src)
    print("✓ Added Voice Prompt textarea and Generate Voice Prompt button")

PYEOF

echo ""
echo "Patch complete. Check src/pages/Assets.jsx for changes."
echo "Also run this SQL in Supabase if voiceprompt column is missing:"
echo ""
echo "  ALTER TABLE public.assetinstances ADD COLUMN IF NOT EXISTS voiceprompt TEXT;"
echo "  NOTIFY pgrst, 'reload schema';"
