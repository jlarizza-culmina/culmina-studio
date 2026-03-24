/**
 * VoiceTrackPanel.jsx — Culmina Post-Production
 * Replaces the existing Voice Track panel inside EpisodeEditor in Post.jsx
 *
 * Drop at: src/components/postproduction/VoiceTrackPanel.jsx
 *
 * Integration — in Post.jsx, inside EpisodeEditor, replace:
 *   {activePanel==='voice' && ( ... existing voice content ... )}
 * with:
 *   {activePanel==='voice' && <VoiceTrackPanel episode={episode} />}
 *
 * Supabase columns used (already migrated):
 *   productions.voiceover_url        — R2/audio URL for the shot's VO
 *   productions.voiceover_text       — text used to generate VO
 *   productions.voiceover_asset_id   — which character asset was used
 *   assets.elevenlabs_voice_id       — ElevenLabs voice ID on the asset
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const GOLD    = '#C9924A'
const CHARCOAL= '#5C574E'
const CREAM   = '#F7F2E8'
const SURFACE = '#1A1810'
const BORDER  = 'rgba(201,146,74,0.12)'
const MUTED   = '#6A6560'
const GREEN   = '#4A9C7A'

// Fallback ElevenLabs voices if no assets have voice IDs configured
const FALLBACK_VOICES = [
  { label: 'Aria (Female)',   voice_id: '9BWtsMINqrJLrRacOk9x' },
  { label: 'Josh (Male)',     voice_id: 'TxGEqnHWrfWFTfGW9XjX' },
  { label: 'Rachel (Female)', voice_id: '21m00Tcm4TlvDq8ikWAM' },
  { label: 'Adam (Male)',     voice_id: 'pNInz6obpgDQGcFmaJgB' },
  { label: 'Bella (Female)',  voice_id: 'EXAVITQu4vr4xnSDxMaL' },
]

export default function VoiceTrackPanel({ episode }) {
  const [shots, setShots]           = useState([])
  const [assets, setAssets]         = useState([])   // character assets with voice IDs
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState({})   // shotId → true/false
  const [playing, setPlaying]       = useState(null) // shotId currently playing
  const [voiceMap, setVoiceMap]     = useState({})   // shotId → { text, voice_id, url, asset_id }
  const audioRefs                   = useRef({})

  // ── Load shots and character assets ──────────────────────────────────────────
  useEffect(() => {
    if (!episode?.productionid) return
    loadData()
  }, [episode?.productionid])

  async function loadData() {
    setLoading(true)

    // Shots for this episode
    const { data: shotRows } = await supabase
      .from('productions')
      .select('productionid, productiontitle, synopsis, voiceover_url, voiceover_text, voiceover_asset_id')
      .eq('productiongroup', 'SHOT')
      .eq('parentproductionid', episode.productionid)
      .eq('activestatus', 'A')
      .order('productionid')

    const shots_ = shotRows || []
    setShots(shots_)

    // Pre-populate voiceMap from saved data
    const vm = {}
    shots_.forEach(s => {
      vm[s.productionid] = {
        text:     s.voiceover_text || s.synopsis || '',
        voice_id: '',
        url:      s.voiceover_url  || null,
        asset_id: s.voiceover_asset_id || null,
      }
    })
    setVoiceMap(vm)

    // Character assets with ElevenLabs voice IDs
    const { data: assetRows } = await supabase
      .from('assets')
      .select('assetid, name, elevenlabs_voice_id')
      .eq('assettype', 'Character')
      .not('elevenlabs_voice_id', 'is', null)
      .order('name')

    setAssets(assetRows || [])

    // Restore saved voice_id from asset
    if (assetRows?.length) {
      shots_.forEach(s => {
        if (s.voiceover_asset_id) {
          const asset = assetRows.find(a => a.assetid === s.voiceover_asset_id)
          if (asset) {
            vm[s.productionid] = { ...vm[s.productionid], voice_id: asset.elevenlabs_voice_id }
          }
        }
      })
      setVoiceMap({ ...vm })
    }

    setLoading(false)
  }

  // ── Voice options: assets first, then fallbacks ───────────────────────────────
  const voiceOptions = assets.length
    ? assets.map(a => ({ label: a.name, voice_id: a.elevenlabs_voice_id, asset_id: a.assetid }))
    : FALLBACK_VOICES.map(v => ({ ...v, asset_id: null }))

  // ── Update a field in voiceMap ────────────────────────────────────────────────
  function updateVoice(shotId, field, value) {
    setVoiceMap(m => ({ ...m, [shotId]: { ...m[shotId], [field]: value } }))
  }

  // ── Generate VO for one shot ──────────────────────────────────────────────────
  async function generateVO(shot) {
    const vm = voiceMap[shot.productionid]
    if (!vm?.text?.trim()) return flash(shot.productionid, 'No text to generate from')
    if (!vm?.voice_id)     return flash(shot.productionid, 'Select a voice first')

    setGenerating(g => ({ ...g, [shot.productionid]: true }))

    try {
      const selectedOption = voiceOptions.find(v => v.voice_id === vm.voice_id)

      const res = await fetch('/api/elevenlabs-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:     vm.text,
          voice_id: vm.voice_id,
          shot_id:  shot.productionid,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      // Save URL + metadata back to the shot row
      const audioUrl = data.url || null

      await supabase.from('productions').update({
        voiceover_url:      audioUrl,
        voiceover_text:     vm.text,
        voiceover_asset_id: selectedOption?.asset_id || null,
      }).eq('productionid', shot.productionid)

      // If no R2 URL returned, proxy streamed audio directly — create blob URL
      const finalUrl = audioUrl || URL.createObjectURL(
        new Blob([await res.blob()], { type: 'audio/mpeg' })
      )

      updateVoice(shot.productionid, 'url', finalUrl)
      setShots(s => s.map(x => x.productionid === shot.productionid
        ? { ...x, voiceover_url: finalUrl } : x))

    } catch (err) {
      flash(shot.productionid, err.message)
    }

    setGenerating(g => ({ ...g, [shot.productionid]: false }))
  }

  // ── Audio playback ────────────────────────────────────────────────────────────
  function togglePlay(shotId, url) {
    if (playing === shotId) {
      audioRefs.current[shotId]?.pause()
      setPlaying(null)
      return
    }
    // Pause any currently playing
    if (playing) audioRefs.current[playing]?.pause()
    const audio = audioRefs.current[shotId]
    if (audio) { audio.src = url; audio.play(); setPlaying(shotId) }
  }

  // ── Toast per shot ────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState({})
  function flash(shotId, msg) {
    setToasts(t => ({ ...t, [shotId]: msg }))
    setTimeout(() => setToasts(t => { const n={...t}; delete n[shotId]; return n }), 3000)
  }

  // ── Styles ────────────────────────────────────────────────────────────────────
  const inp = {
    background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 3,
    color: CREAM, padding: '6px 10px', fontSize: 12,
    fontFamily: 'DM Sans, sans-serif', width: '100%', boxSizing: 'border-box',
    outline: 'none', resize: 'vertical',
  }
  const sel = { ...inp, cursor: 'pointer' }
  const lbl = {
    fontSize: 10, fontWeight: 700, color: MUTED,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
    display: 'block',
  }

  if (loading) return (
    <div style={{ padding: 32, textAlign: 'center', color: MUTED, fontSize: 13 }}>Loading shots…</div>
  )

  if (!shots.length) return (
    <div style={{ padding: 32, textAlign: 'center', color: MUTED, fontSize: 13 }}>No shots found for this episode.</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>

      {/* Asset voice warning */}
      {assets.length === 0 && (
        <div style={{ background: 'rgba(201,146,74,0.08)', border: `1px solid rgba(201,146,74,0.2)`,
          borderRadius: 3, padding: '8px 12px', fontSize: 11, color: GOLD, lineHeight: 1.5 }}>
          ⚠ No character assets have ElevenLabs voice IDs configured. Using default voices.
          Add voice IDs in Asset Creator to assign character-specific voices.
        </div>
      )}

      {/* Shot rows */}
      {shots.map((shot, i) => {
        const vm      = voiceMap[shot.productionid] || {}
        const isGen   = generating[shot.productionid]
        const hasVO   = !!vm.url
        const isPlay  = playing === shot.productionid

        return (
          <div key={shot.productionid} style={{
            border: `1px solid ${BORDER}`, borderRadius: 3,
            background: 'rgba(255,255,255,0.01)', overflow: 'hidden',
          }}>
            {/* Shot header */}
            <div style={{ padding: '8px 14px', borderBottom: `1px solid ${BORDER}`,
              background: 'rgba(201,146,74,0.03)', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: CREAM }}>
                <span style={{ color: MUTED, marginRight: 8, fontSize: 10 }}>#{i + 1}</span>
                {shot.productiontitle || `Shot ${i + 1}`}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {toasts[shot.productionid] && (
                  <span style={{ fontSize: 10, color: '#C85050' }}>{toasts[shot.productionid]}</span>
                )}
                {hasVO && (
                  <span style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>✓ VO Ready</span>
                )}
              </div>
            </div>

            {/* Shot body */}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Dialogue text */}
              <div>
                <label style={lbl}>Dialogue / VO Text</label>
                <textarea
                  value={vm.text || ''}
                  onChange={e => updateVoice(shot.productionid, 'text', e.target.value)}
                  style={{ ...inp, minHeight: 56 }}
                  placeholder="Enter dialogue or narration text…"
                />
              </div>

              {/* Voice selector + generate */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Voice</label>
                  <select style={sel} value={vm.voice_id || ''}
                    onChange={e => {
                      const opt = voiceOptions.find(v => v.voice_id === e.target.value)
                      updateVoice(shot.productionid, 'voice_id', e.target.value)
                      if (opt?.asset_id) updateVoice(shot.productionid, 'asset_id', opt.asset_id)
                    }}>
                    <option value="">— Select voice —</option>
                    {voiceOptions.map(v => (
                      <option key={v.voice_id} value={v.voice_id}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => generateVO(shot)}
                  disabled={isGen || !vm.text?.trim() || !vm.voice_id}
                  style={{
                    background: isGen ? 'rgba(201,146,74,0.3)' : GOLD,
                    color: '#1A1810', border: 'none', borderRadius: 3,
                    padding: '7px 16px', fontSize: 12, fontWeight: 700,
                    cursor: isGen ? 'wait' : 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    opacity: (!vm.text?.trim() || !vm.voice_id) ? 0.4 : 1,
                    whiteSpace: 'nowrap',
                  }}>
                  {isGen ? '⏳ Generating…' : hasVO ? '↺ Regenerate' : '▶ Generate VO'}
                </button>
              </div>

              {/* Playback */}
              {hasVO && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(74,156,122,0.06)', border: `1px solid rgba(74,156,122,0.15)`,
                  borderRadius: 3, padding: '8px 12px' }}>
                  <button
                    onClick={() => togglePlay(shot.productionid, vm.url)}
                    style={{ background: GREEN, border: 'none', borderRadius: '50%',
                      width: 28, height: 28, cursor: 'pointer', color: '#fff',
                      fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0 }}>
                    {isPlay ? '⏸' : '▶'}
                  </button>
                  <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>
                    {isPlay ? 'Playing…' : 'Voiceover ready'}
                  </span>
                  <a href={vm.url} target="_blank" rel="noreferrer" download
                    style={{ marginLeft: 'auto', fontSize: 10, color: MUTED,
                      textDecoration: 'none', fontWeight: 600 }}>
                    ↓ Download
                  </a>
                  {/* Hidden audio element */}
                  <audio
                    ref={el => { audioRefs.current[shot.productionid] = el }}
                    onEnded={() => setPlaying(null)}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
