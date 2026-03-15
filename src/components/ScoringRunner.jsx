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
const PILLAR_COLORS = { A: GOLD, B: BLUE, C: GREEN }

function getVerdict(score) {
  if (score >= 80) return { label: 'Greenlight', color: GREEN, bg: 'rgba(74,156,122,0.12)' }
  if (score >= 60) return { label: 'Develop',    color: GOLD,  bg: 'rgba(201,146,74,0.12)' }
  if (score >= 40) return { label: 'Conditional',color: BLUE,  bg: 'rgba(122,158,200,0.12)' }
  return                   { label: 'Reject',     color: RED,   bg: 'rgba(200,75,49,0.12)' }
}

const SOURCE_OPTIONS = [
  { value: 'excerpt',         label: 'Excerpt',           icon: '📋', warn: null },
  { value: 'summary',         label: 'Summary',           icon: '📝', warn: null },
  { value: 'extract',         label: 'Generated Extract', icon: '✂️', warn: null },
  { value: 'full_manuscript', label: 'Full Manuscript',    icon: '📖', warn: 'Most expensive and slowest option. Use only when excerpt/summary scoring is insufficient.' },
]
const CONFIDENCE_LABELS = ['', 'Low', 'Moderate', 'Good', 'High', 'Very High']
const lbl = { display: 'block', fontSize: '0.62rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }
const inp = (extra) => ({ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', borderRadius: 2, ...extra })

function buildPrompt(dims, text, modelName) {
  const instructions = dims.sort((a, b) => a.pillar.localeCompare(b.pillar) || (a.sortorder || 0) - (b.sortorder || 0))
    .map(d => {
      let s = `- "${d.dimensionname}" (Pillar ${d.pillar}, max ${d.maxvalue})`
      if (d.whatitmeasures) s += `\n  Measures: ${d.whatitmeasures}`
      if (d.scoringguide) s += `\n  Guide: ${d.scoringguide}`
      return s
    }).join('\n')

  const dimNames = dims.map(d => `"${d.dimensionname}": <0-${d.maxvalue}>`).join(', ')

  return `You are Culmina AI Drama Studio's IP Suitability Classifier using "${modelName}".
Evaluate text for micro-drama adaptation. Score each dimension from 0 to its max value.

DIMENSIONS:
${instructions}

Sum of all max values = 100. Respond ONLY with valid JSON, no markdown:
{
  "scores": {${dimNames}},
  "verdict": "Greenlight|Develop|Conditional|Reject",
  "total": <sum of all scores>,
  "platform": "ReelShort|DramaBox|Cross-Platform|TikTok",
  "episodes": <estimated episode count>,
  "rationale": {<same dimension names as keys>: "<one sentence reason>"},
  "top_strength": "<brief>",
  "top_risk": "<brief>"
}

TEXT TO EVALUATE:
---
${text}
---`
}

function DimRow({ dim, aiScore, userScore, rationale, onUserChange, editable }) {
  const pc = PILLAR_COLORS[dim.pillar] || GOLD
  const aiPct = aiScore != null ? (aiScore / dim.maxvalue) * 100 : 0
  const bar = aiPct >= 75 ? GREEN : aiPct >= 50 ? GOLD : aiPct >= 25 ? BLUE : RED
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${pc}18`, border: `1px solid ${pc}44`, color: pc, fontSize: '0.58rem', fontWeight: 700, flexShrink: 0 }}>{dim.pillar}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', color: CREAM, marginBottom: 3 }}>{dim.dimensionname}</div>
        <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
          <div style={{ width: `${aiPct}%`, height: '100%', background: bar, borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
        {rationale && <div style={{ fontSize: '0.62rem', color: MUTED, marginTop: 3, lineHeight: 1.3 }}>{rationale}</div>}
      </div>
      <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '0.55rem', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>AI</div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: aiScore != null ? bar : MUTED, fontWeight: 700 }}>{aiScore ?? '—'}<span style={{ color: MUTED, fontSize: '0.6rem' }}>/{dim.maxvalue}</span></div>
      </div>
      <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '0.55rem', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Yours</div>
        {editable ? (
          <input type="number" min={0} max={dim.maxvalue} value={userScore ?? ''}
            onChange={e => { const v = e.target.value === '' ? null : Math.min(parseInt(e.target.value) || 0, dim.maxvalue); onUserChange(v) }}
            style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '4px 6px', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', outline: 'none', borderRadius: 2 }} />
        ) : (
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: userScore != null ? CREAM : MUTED, fontWeight: 700 }}>{userScore ?? '—'}<span style={{ color: MUTED, fontSize: '0.6rem' }}>/{dim.maxvalue}</span></div>
        )}
      </div>
    </div>
  )
}

export default function ScoringRunner({ title, onScored }) {
  const { endUser } = useAuth()
  const [models, setModels] = useState([])
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [selectedSource, setSelectedSource] = useState('excerpt')
  const [dimensions, setDimensions] = useState([])
  const [loadingModels, setLoadingModels] = useState(true)
  const [running, setRunning] = useState(false)
  const [runStage, setRunStage] = useState('')
  const [runError, setRunError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [userScores, setUserScores] = useState({})
  const [confidence, setConfidence] = useState(null)
  const [useForTraining, setUseForTraining] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [userSaved, setUserSaved] = useState(false)
  const [existingScore, setExistingScore] = useState(null)
  const [existingUserScore, setExistingUserScore] = useState(null)

  useEffect(() => { loadModels(); loadExisting() }, [title.id])
  useEffect(() => {
    if (!selectedModelId) { setDimensions([]); return }
    supabase.from('scoring_dimensions').select('*').eq('modelid', selectedModelId).eq('activestatus', 'A').order('pillar').order('sortorder')
      .then(({ data }) => { if (data) setDimensions(data) })
  }, [selectedModelId])

  async function loadModels() {
    setLoadingModels(true)
    const { data } = await supabase.from('scoring_models').select('modelid, modelname, modelpurpose, modelstatus').eq('activestatus', 'A').eq('modelstatus', 'Final').order('modelname')
    if (data) setModels(data)
    setLoadingModels(false)
  }

  async function loadExisting() {
    const { data: scores } = await supabase.from('manuscript_scores').select('*').eq('productionid', title.id).order('createdate', { ascending: false }).limit(1)
    if (scores?.length > 0) {
      setExistingScore(scores[0])
      setSelectedModelId(scores[0].modelid)
      setAiResult({ scores: scores[0].dimension_scores || {}, total: scores[0].total_score, verdict: scores[0].verdict, pillarTotals: { A: scores[0].pillar_a, B: scores[0].pillar_b, C: scores[0].pillar_c }, platform: scores[0].platform, episodes: scores[0].episodes })
      const { data: us } = await supabase.from('manuscript_user_scores').select('*').eq('scoreid', scores[0].scoreid).limit(1)
      if (us?.length > 0) { setExistingUserScore(us[0]); setUserScores(us[0].user_dimension_scores || {}); setConfidence(us[0].confidence); setUseForTraining(us[0].use_for_training || false); setUserSaved(true) }
    }
  }

  function getSourceText() {
    switch (selectedSource) {
      case 'excerpt': return title.excerpt || ''
      case 'summary': return title.summary || ''
      case 'extract': return title.generated_extract || ''
      case 'full_manuscript': return title._fullText || title.full_text || ''
      default: return ''
    }
  }
  function srcAvailable(s) {
    switch (s) {
      case 'excerpt': return !!(title.excerpt)
      case 'summary': return !!(title.summary)
      case 'extract': return !!(title.generated_extract)
      case 'full_manuscript': return !!(title._fullText || title.full_text || title.hasManuscript)
      default: return false
    }
  }

  async function handleRun() {
    if (!selectedModelId) { setRunError('Select a model'); return }
    const text = getSourceText()
    if (!text) {
      if (selectedSource === 'full_manuscript' && title.hasManuscript) {
        setRunError('Manuscript file exists in R2 but text has not been extracted. Go to the Manuscript tab, click "Extract Text" on the file, then return here.')
      } else {
        setRunError(`No ${selectedSource.replace('_', ' ')} text available. Go to the Manuscript tab and paste content first.`)
      }
      return
    }
    if (!dimensions.length) { setRunError('Model has no dimensions'); return }
    const model = models.find(m => m.modelid === selectedModelId)
    setRunning(true); setRunError(''); setRunStage('Building prompt…')
    try {
      const prompt = buildPrompt(dimensions, text, model?.modelname || 'Custom')
      setRunStage('Calling AI…')
      // Use server-side proxy to avoid CORS — works both locally (Vite proxy) and on Vercel (serverless function)
      const apiUrl = import.meta.env.DEV ? '/api/score' : '/api/score'
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_tokens: 2000 }),
      })
      const data = await res.json()
      const raw = (data.content?.map(c => c.text || '').join('') || '').replace(/```json|```/g, '').trim()
      setRunStage('Parsing…')
      const parsed = JSON.parse(raw)
      const rawScores = parsed.scores || {}
      const dimScores = {}
      let total = 0; const pt = { A: 0, B: 0, C: 0 }
      const rationale = parsed.rationale || {}
      const mappedRationale = {}

      for (const dim of dimensions) {
        const id = String(dim.dimensionid)
        // Claude returns dimension names as keys — match by name
        const score = rawScores[dim.dimensionname] ?? rawScores[id] ?? null
        if (score != null) {
          const capped = Math.min(Number(score), dim.maxvalue)
          dimScores[id] = capped
          total += capped
          pt[dim.pillar] = (pt[dim.pillar] || 0) + capped
        }
        // Map rationale by name to ID
        const r = rationale[dim.dimensionname] || rationale[id] || ''
        if (r) mappedRationale[id] = r
      }
      const verdict = getVerdict(total).label
      const result = { scores: dimScores, total, verdict, pillarTotals: pt, platform: parsed.platform || 'Cross-Platform', episodes: parsed.episodes, rationale: mappedRationale, top_strength: parsed.top_strength, top_risk: parsed.top_risk }
      setAiResult(result)
      setRunStage('Saving…')
      const { data: row } = await supabase.from('manuscript_scores').insert({
        productionid: title.id, modelid: selectedModelId, source_type: selectedSource,
        total_score: total, verdict, platform: result.platform, episodes: result.episodes,
        pillar_a: pt.A || 0, pillar_b: pt.B || 0, pillar_c: pt.C || 0,
        dimension_scores: dimScores, ai_model_used: 'claude-sonnet-4-20250514',
        run_by: endUser?.enduserid, run_at: new Date().toISOString(), rubric_version: 'v3',
      }).select().single()
      if (row) setExistingScore(row)
      await supabase.from('productions').update({ productionstatus: 'complete', updatedate: new Date().toISOString() }).eq('productionid', title.id)
      setUserScores({}); setUserSaved(false); setExistingUserScore(null)
      if (onScored) onScored()
    } catch (e) { setRunError('Scoring failed: ' + e.message) }
    setRunning(false); setRunStage('')
  }

  async function handleSaveUser() {
    if (!existingScore && !dimensions.length) return
    setSavingUser(true)
    const ut = dimensions.reduce((s, d) => s + (userScores[String(d.dimensionid)] || 0), 0)
    const uv = getVerdict(ut).label
    try {
      // If no AI score exists yet, create a placeholder score record for user-only scores
      let scoreId = existingScore?.scoreid
      if (!scoreId) {
        const { data: newRow } = await supabase.from('manuscript_scores').insert({
          productionid: title.id, modelid: selectedModelId, source_type: 'manual',
          total_score: 0, verdict: 'Pending', rubric_version: 'v3',
          run_by: endUser?.enduserid, run_at: new Date().toISOString(),
        }).select().single()
        if (newRow) { scoreId = newRow.scoreid; setExistingScore(newRow) }
      }
      if (!scoreId) throw new Error('Could not create score record')

      if (existingUserScore?.userscoreid) {
        await supabase.from('manuscript_user_scores').update({
          user_dimension_scores: userScores, user_total: ut, user_verdict: uv,
          confidence, use_for_training: useForTraining,
          scored_by: endUser?.enduserid, scored_at: new Date().toISOString(), updatedate: new Date().toISOString(),
        }).eq('userscoreid', existingUserScore.userscoreid)
      } else {
        const { data } = await supabase.from('manuscript_user_scores').insert({
          scoreid: scoreId, productionid: title.id,
          user_dimension_scores: userScores, user_total: ut, user_verdict: uv,
          confidence, use_for_training: useForTraining,
          scored_by: endUser?.enduserid, scored_at: new Date().toISOString(),
        }).select().single()
        if (data) setExistingUserScore(data)
      }
      setUserSaved(true)
    } catch (e) { setRunError('Save failed: ' + e.message) }
    setSavingUser(false)
  }

  const hasAI = !!aiResult
  const hasUserScoresEntered = Object.values(userScores).some(v => v != null)
  const userTotal = dimensions.reduce((s, d) => s + (userScores[String(d.dimensionid)] || 0), 0)
  const userV = userTotal > 0 ? getVerdict(userTotal) : null

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Setup row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={lbl}>Scoring Model</div>
          <select style={inp({ cursor: 'pointer' })} value={selectedModelId || ''} onChange={e => setSelectedModelId(e.target.value ? parseInt(e.target.value) : null)}>
            <option value="">Select a model…</option>
            {models.map(m => <option key={m.modelid} value={m.modelid}>{m.modelname}</option>)}
          </select>
          {models.length === 0 && !loadingModels && <div style={{ fontSize: '0.68rem', color: RED, marginTop: 4 }}>No Final models. Create one in Admin → Scoring Models.</div>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={lbl}>Score Against</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {SOURCE_OPTIONS.map(opt => {
              const avail = srcAvailable(opt.value); const sel = selectedSource === opt.value
              return (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', border: `1px solid ${sel ? GOLD : BORDER}`, background: sel ? 'rgba(201,146,74,0.06)' : 'transparent', borderRadius: 3, cursor: avail ? 'pointer' : 'not-allowed', opacity: avail ? 1 : 0.4, transition: 'all 0.15s' }}>
                  <input type="radio" name="src" value={opt.value} checked={sel} disabled={!avail} onChange={() => setSelectedSource(opt.value)} style={{ accentColor: GOLD }} />
                  <span style={{ fontSize: '0.75rem', color: sel ? CREAM : CHARCOAL }}>{opt.icon} {opt.label}</span>
                  {!avail && <span style={{ fontSize: '0.58rem', color: MUTED, marginLeft: 'auto' }}>No data</span>}
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {selectedSource === 'full_manuscript' && <div style={{ padding: '10px 16px', background: 'rgba(200,75,49,0.08)', border: '1px solid rgba(200,75,49,0.2)', borderRadius: 4, marginBottom: 20, fontSize: '0.72rem', color: RED }}>⚠️ {SOURCE_OPTIONS[3].warn}</div>}

      {/* Run + metadata */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 }}>
        <button onClick={handleRun} disabled={running || !selectedModelId}
          style={{ background: running || !selectedModelId ? 'rgba(201,146,74,0.3)' : GOLD, border: 'none', color: running || !selectedModelId ? MUTED : '#1A1810', padding: '11px 28px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: running || !selectedModelId ? 'not-allowed' : 'pointer', borderRadius: 2 }}>
          {running ? (runStage || 'Running…') : hasAI ? 'Re-run Scoring' : 'Run AI Scoring'}
        </button>
        {runError && <span style={{ fontSize: '0.72rem', color: RED }}>{runError}</span>}
        {existingScore?.run_at && !running && <span style={{ fontSize: '0.65rem', color: MUTED }}>Last run: {new Date(existingScore.run_at).toLocaleString()}{existingScore.source_type ? ` · ${existingScore.source_type.replace('_', ' ')}` : ''}</span>}
      </div>

      {/* ── Results / Manual Entry ── */}
      {(hasAI || (dimensions.length > 0 && selectedModelId)) && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, padding: '16px 18px', borderRadius: 6, background: hasAI ? getVerdict(aiResult.total).bg : 'rgba(255,255,255,0.02)', border: `1px solid ${hasAI ? getVerdict(aiResult.total).color + '33' : BORDER}` }}>
              <div style={{ fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>AI Score</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: hasAI ? getVerdict(aiResult.total).color : MUTED }}>{hasAI ? aiResult.total : '—'}<span style={{ color: MUTED, fontSize: '1rem' }}>/100</span></div>
              {hasAI && <div style={{ fontSize: '0.68rem', color: getVerdict(aiResult.total).color, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>{aiResult.verdict}</div>}
            </div>
            <div style={{ flex: 1, padding: '16px 18px', borderRadius: 6, background: hasUserScoresEntered ? (userV?.bg || 'transparent') : 'rgba(255,255,255,0.02)', border: `1px solid ${hasUserScoresEntered ? (userV?.color || BORDER) + '33' : BORDER}` }}>
              <div style={{ fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Your Score</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: hasUserScoresEntered ? userV?.color : MUTED }}>{hasUserScoresEntered ? userTotal : '—'}<span style={{ color: MUTED, fontSize: '1rem' }}>/100</span></div>
              {hasUserScoresEntered && userV && <div style={{ fontSize: '0.68rem', color: userV.color, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>{userV.label}</div>}
            </div>
            {['A', 'B', 'C'].map(p => {
              const aiP = hasAI ? (aiResult.pillarTotals?.[p] || 0) : 0
              const maxP = dimensions.filter(d => d.pillar === p).reduce((s, d) => s + d.maxvalue, 0)
              return (
                <div key={p} style={{ flex: 1, padding: '16px 18px', borderRadius: 6, background: `${PILLAR_COLORS[p]}08`, border: `1px solid ${PILLAR_COLORS[p]}20` }}>
                  <div style={{ fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Pillar {p}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 700, color: PILLAR_COLORS[p] }}>{aiP}<span style={{ color: MUTED, fontSize: '0.8rem' }}>/{maxP}</span></div>
                </div>
              )
            })}
          </div>

          {/* Strength / Risk */}
          {hasAI && (aiResult.top_strength || aiResult.top_risk) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {aiResult.top_strength && <div style={{ flex: 1, background: SURFACE, border: `1px solid ${GREEN}33`, borderRadius: 4, padding: '12px 16px', borderLeft: `3px solid ${GREEN}` }}><div style={{ fontSize: '0.6rem', color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Top Strength</div><div style={{ fontSize: '0.75rem', color: CHARCOAL, lineHeight: 1.4 }}>{aiResult.top_strength}</div></div>}
              {aiResult.top_risk && <div style={{ flex: 1, background: SURFACE, border: `1px solid ${RED}33`, borderRadius: 4, padding: '12px 16px', borderLeft: `3px solid ${RED}` }}><div style={{ fontSize: '0.6rem', color: RED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Top Risk</div><div style={{ fontSize: '0.75rem', color: CHARCOAL, lineHeight: 1.4 }}>{aiResult.top_risk}</div></div>}
            </div>
          )}

          {/* Dimension rows */}
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(201,146,74,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>Dimensions ({dimensions.length})</span>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.6rem', color: MUTED }}><span style={{ width: 50, textAlign: 'center' }}>AI</span><span style={{ width: 60, textAlign: 'center' }}>Yours</span></div>
            </div>
            <div style={{ padding: '0 16px' }}>
              {['A', 'B', 'C'].map(pillar => {
                const pDims = dimensions.filter(d => d.pillar === pillar).sort((a, b) => (a.sortorder || 0) - (b.sortorder || 0))
                if (!pDims.length) return null
                return (
                  <div key={pillar}>
                    <div style={{ padding: '10px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.65rem', color: PILLAR_COLORS[pillar], letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Pillar {pillar} — {pDims[0]?.pillarname || ''}</span>
                      <div style={{ flex: 1, height: 1, background: BORDER }} />
                    </div>
                    {pDims.map(dim => (
                      <DimRow key={dim.dimensionid} dim={dim}
                        aiScore={hasAI ? (aiResult.scores?.[String(dim.dimensionid)] ?? null) : null}
                        userScore={userScores[String(dim.dimensionid)] ?? null}
                        rationale={hasAI ? (aiResult.rationale?.[String(dim.dimensionid)] || aiResult.rationale?.[dim.dimensionname] || '') : ''}
                        onUserChange={v => setUserScores(s => ({ ...s, [String(dim.dimensionid)]: v }))}
                        editable={true} />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* User assessment controls */}
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: 20, background: 'rgba(255,255,255,0.01)', marginBottom: 20 }}>
            <div style={{ fontSize: '0.65rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Your Assessment</div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={lbl}>Confidence (1–5)</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setConfidence(n)} style={{ flex: 1, padding: '8px 4px', border: `1px solid ${confidence === n ? GOLD : BORDER}`, background: confidence === n ? 'rgba(201,146,74,0.12)' : 'transparent', color: confidence === n ? GOLD : MUTED, cursor: 'pointer', borderRadius: 2, fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', fontWeight: confidence === n ? 600 : 400 }}>{n}</button>
                  ))}
                </div>
                {confidence && <div style={{ fontSize: '0.6rem', color: CHARCOAL, marginTop: 4, textAlign: 'center' }}>{CONFIDENCE_LABELS[confidence]}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={lbl}>Use for Model Training</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', border: `1px solid ${useForTraining ? GREEN : BORDER}`, background: useForTraining ? 'rgba(74,156,122,0.06)' : 'transparent', borderRadius: 3 }}>
                  <div onClick={e => { e.preventDefault(); setUseForTraining(v => !v) }} style={{ width: 36, height: 20, borderRadius: 10, position: 'relative', background: useForTraining ? GREEN : 'rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 3, left: useForTraining ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: useForTraining ? SURFACE : CHARCOAL, transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: useForTraining ? GREEN : MUTED }}>{useForTraining ? 'Yes' : 'No'}</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handleSaveUser} disabled={savingUser || !hasUserScoresEntered}
                style={{ background: savingUser || !hasUserScoresEntered ? 'rgba(201,146,74,0.3)' : GOLD, border: 'none', color: savingUser || !hasUserScoresEntered ? MUTED : '#1A1810', padding: '10px 24px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: savingUser || !hasUserScoresEntered ? 'not-allowed' : 'pointer', borderRadius: 2 }}>
                {savingUser ? 'Saving…' : userSaved ? 'Update My Scores' : 'Save My Scores'}
              </button>
              {userSaved && existingUserScore?.scored_at && <span style={{ fontSize: '0.65rem', color: GREEN }}>✓ Saved {new Date(existingUserScore.scored_at).toLocaleString()}{existingUserScore.confidence ? ` · Confidence: ${existingUserScore.confidence}/5` : ''}</span>}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!hasAI && (!dimensions.length || !selectedModelId) && !running && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED }}>
          <div style={{ fontSize: '2rem', opacity: 0.2, marginBottom: 12 }}>◈</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: CHARCOAL, marginBottom: 6 }}>Select a model to begin</div>
          <div style={{ fontSize: '0.78rem' }}>Run AI scoring or enter your own scores manually.</div>
        </div>
      )}
    </div>
  )
}
