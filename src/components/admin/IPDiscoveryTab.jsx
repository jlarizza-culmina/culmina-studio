// src/components/admin/IPDiscoveryTab.jsx
// Culmina IP Discovery Engine v7 — Admin Module
// Storage: Supabase discovery_runs + discovery_candidates
// Models: pulls Final models from scoring_models table
// Verdicts: Greenlight/Develop/Conditional/Reject on /100 normalized scale
// Rubric: v2.2 · 13 dimensions · 3 pillars · /60 raw → /100 normalized

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

// ── Brand tokens ─────────────────────────────────────────────
const GOLD     = '#C9924A'
const INK      = '#1A1810'
const CREAM    = '#F7F2E8'
const CHARCOAL = '#5C574E'
const GREEN    = '#4A9C7A'
const RED      = '#C84B31'
const BLUE     = '#7A9EC8'
const SURFACE2 = '#111009'
const BORDER   = 'rgba(201,146,74,0.12)'
const MUTED    = '#6A6560'

// ── Verdict system — matches ScoringRunner exactly ────────────
function getVerdict(normalizedScore) {
  if (normalizedScore >= 80) return { label: 'Greenlight',   color: GREEN, bg: 'rgba(74,156,122,0.12)' }
  if (normalizedScore >= 60) return { label: 'Develop',      color: GOLD,  bg: 'rgba(201,146,74,0.12)' }
  if (normalizedScore >= 40) return { label: 'Conditional',  color: BLUE,  bg: 'rgba(122,158,200,0.12)' }
  return                            { label: 'Reject',        color: RED,   bg: 'rgba(200,75,49,0.12)' }
}

// Normalize raw /60 score to /100
function normalize(raw) { return Math.round((raw / 60) * 100) }

const platformColors = { 'Cross-platform': '#4ade80', 'ReelShort': '#60a5fa', 'DramaBox': '#f59e0b' }
const tierColors     = { 'Tier 1': '#4ade80', 'Tier 2': GOLD, 'Tier 3': '#60a5fa', 'Tier 4': CHARCOAL }

// ── Rubric definition (v2.2) ──────────────────────────────────
const PILLARS = [
  {
    id: 'narrative', label: 'Pillar A — Narrative Strength', max: 40,
    criteria: [
      { key: 'cliffhanger_density',   label: 'Cliffhanger Density',      max: 8 },
      { key: 'trope_stacking',        label: 'Trope Stacking',           max: 7 },
      { key: 'emotional_escalation',  label: 'Emotional Escalation',     max: 6 },
      { key: 'status_reversal',       label: 'Status Reversal',          max: 6 },
      { key: 'visual_scene_variety',  label: 'Visual Scene Variety',     max: 5 },
      { key: 'dialogue_action_ratio', label: 'Dialogue-to-Action',       max: 4 },
      { key: 'episode_count_fit',     label: 'Episode Count Fit',        max: 4 },
    ],
  },
  {
    id: 'audience', label: 'Pillar B — Audience & Market Fit', max: 10,
    criteria: [
      { key: 'audience_alignment', label: 'Audience Alignment',       max: 5 },
      { key: 'ip_clarity',         label: 'IP Clarity',               max: 3 },
      { key: 'paywall_trigger',    label: 'Paywall Trigger Strength', max: 2 },
    ],
  },
  {
    id: 'production', label: 'Pillar C — Production Assets', max: 10,
    criteria: [
      { key: 'character_load',     label: 'Character Load',            max: 3 },
      { key: 'set_location_count', label: 'Set / Location Count',      max: 3 },
      { key: 'ai_feasibility',     label: 'AI Generation Feasibility', max: 4 },
    ],
  },
]
const ALL_CRITERIA = PILLARS.flatMap(p => p.criteria)
const MAX_RAW = 60

// ── Claude API (via /api/score proxy) ─────────────────────────
let _lastApiError = ''
const getLastApiError = () => _lastApiError

async function callClaude(prompt) {
  _lastApiError = ''
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, temperature: 0, messages: [{ role: 'user', content: prompt }] }),
    })
    clearTimeout(timeout)
    if (!res.ok) {
      const e = await res.text().catch(() => '')
      _lastApiError = `HTTP ${res.status}: ${e.slice(0, 150)}`
      return null
    }
    const data = await res.json()
    if (data.error) { _lastApiError = `API: ${data.error.message || JSON.stringify(data.error).slice(0, 150)}`; return null }
    const text = (data.content?.[0]?.text || '').trim()
    if (!text) { _lastApiError = 'Empty response'; return null }
    try { return JSON.parse(text) } catch {}
    try { const s = text.indexOf('['), e = text.lastIndexOf(']'); if (s !== -1 && e !== -1) return JSON.parse(text.slice(s, e + 1)) } catch {}
    try { const s = text.indexOf('{'), e = text.lastIndexOf('}'); if (s !== -1 && e !== -1) return JSON.parse(text.slice(s, e + 1)) } catch {}
    _lastApiError = `Parse fail: ${text.slice(0, 100)}`
    return null
  } catch (err) {
    _lastApiError = err.name === 'AbortError' ? 'Timed out (90s)' : err.message
    return null
  }
}

// ── Prompts (v2.2) ────────────────────────────────────────────
// ── Page fetch proxy ─────────────────────────────────────────────────────────
async function fetchPageText(url) {
  try {
    const res = await fetch('/api/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) { const e = await res.json().catch(() => ({})); return { error: e.error || `HTTP ${res.status}` } }
    const data = await res.json()
    return { text: data.text, url: data.url }
  } catch (err) {
    return { error: err.message }
  }
}

const BOOK_GEN_PROMPT = (type) => {
  const seed = Math.floor(Math.random() * 9000) + 1000
  const rotations = [
    'Focus on billionaire CEO romance and secret identity.',
    'Focus on dark romance, mafia, and forbidden love.',
    'Focus on enemies-to-lovers, revenge, and strong female lead.',
    'Focus on werewolf, paranormal romance, and fated mates.',
    'Focus on contract marriage, fake dating, and second chance romance.',
    'Focus on royal romance, historical forbidden love, and class divide.',
    'Focus on office romance, grumpy sunshine, and slow burn.',
    'Focus on sports romance, rivals to lovers, and redemption arcs.',
  ]
  const focus = rotations[seed % rotations.length]
  return `IP analyst for micro-drama (60s episodes, ReelShort/DramaBox, women 18-45). Seed: ${seed}.
List 10 DIFFERENT ${type === 'contemporary' ? 'contemporary (post-2000) bestselling' : 'public domain (pre-1928)'} novels for micro-drama. ${focus} Do NOT repeat titles commonly suggested — aim for variety and less obvious picks.
ONLY raw JSON array. No markdown. No text. Start [ end ]
[{"title":"X","author":"X","year":2019,"description":"1 sentence plot","genre":"Dark Romance","isbn":"","publisher":""}]`
}

const EXTRACT_FROM_URL_PROMPT = (pageText, url) =>
  `You are an IP analyst for Culmina AI Drama Studio. Extract book metadata from this web page.
Source URL: ${url}

Page content:
---
${pageText}
---

Return ONLY a JSON object with these fields. If a field cannot be determined, use null.
{
  "title": "Book title",
  "author": "Author full name",
  "year": 2019,
  "genre": "Primary genre (e.g. Dark Romance, Billionaire Romance)",
  "description": "1-2 sentence plot summary",
  "isbn": "ISBN if found, else null",
  "publisher": "Publisher if found, else null",
  "source_url": "${url}"
}
No markdown. No text. Start { end }`

const SCORE_ONE_PROMPT = (book, modelName) =>
  `Score for micro-drama adaptation (ReelShort/DramaBox, women 18-45, 60s episodes). Model: ${modelName}.
13 dimensions, 3 pillars, max 60 raw:
A-NARRATIVE(40): cliffhanger_density(8), trope_stacking(7), emotional_escalation(6), status_reversal(6), visual_scene_variety(5), dialogue_action_ratio(4), episode_count_fit(4)
B-AUDIENCE(10): audience_alignment(5), ip_clarity(3), paywall_trigger(2)
C-PRODUCTION(10): character_load(3:1-3chars=3,4-6=2,7-10=1,11+=0), set_location_count(3:2-5=3,6-10=2,11+=1), ai_feasibility(4:contemporary=4,simple-hist=3,complex-hist=2,fantasy=1)
platform_target: "Cross-platform"|"ReelShort"|"DramaBox"
genre_tier: "Tier 1"(CEO+identity+comeback)|"Tier 2"(mafia,contract,family)|"Tier 3"(werewolf,campus,historical)|"Tier 4"(interactive,scifi)
Book: "${book.title}" by ${book.author} (${book.year}), ${book.genre}
${book.description}
ONLY JSON. No text. Start { end }
{"cliffhanger_density":{"score":7,"note":"brief"},"trope_stacking":{"score":5,"note":"brief"},"emotional_escalation":{"score":5,"note":"brief"},"status_reversal":{"score":4,"note":"brief"},"visual_scene_variety":{"score":4,"note":"brief"},"dialogue_action_ratio":{"score":3,"note":"brief"},"episode_count_fit":{"score":3,"note":"brief"},"audience_alignment":{"score":4,"note":"brief"},"ip_clarity":{"score":2,"note":"brief"},"paywall_trigger":{"score":2,"note":"brief"},"character_load":{"score":3,"note":"brief"},"set_location_count":{"score":2,"note":"brief"},"ai_feasibility":{"score":4,"note":"brief"},"pillar_a":31,"pillar_b":8,"pillar_c":9,"tagline":"one line","adaptation_notes":"1-2 sentences","character_count":4,"set_count":6,"platform_target":"Cross-platform","genre_tier":"Tier 1"}
Note: verdict will be computed from normalized score. Do NOT include verdict field.`

// ── Helpers ───────────────────────────────────────────────────
function computeRawPillars(sc) {
  if (!sc) return { a: 0, b: 0, c: 0, raw: 0 }
  const s = (k) => sc[`${k}_score`] ?? sc[k]?.score ?? 0
  const a = s('cliffhanger_density') + s('trope_stacking') + s('emotional_escalation') +
            s('status_reversal') + s('visual_scene_variety') + s('dialogue_action_ratio') + s('episode_count_fit')
  const b = s('audience_alignment') + s('ip_clarity') + s('paywall_trigger')
  const c = s('character_load') + s('set_location_count') + s('ai_feasibility')
  return { a, b, c, raw: a + b + c }
}

function scoreToRow(sc) {
  const row = {}
  ALL_CRITERIA.forEach(({ key }) => {
    row[`${key}_score`] = sc[key]?.score ?? null
    row[`${key}_note`]  = sc[key]?.note  ?? null
  })
  const a = PILLARS[0].criteria.reduce((sum, { key }) => sum + (sc[key]?.score ?? 0), 0)
  const b = PILLARS[1].criteria.reduce((sum, { key }) => sum + (sc[key]?.score ?? 0), 0)
  const c = PILLARS[2].criteria.reduce((sum, { key }) => sum + (sc[key]?.score ?? 0), 0)
  const raw = a + b + c
  const norm = normalize(raw)
  const verdict = getVerdict(norm).label
  return {
    ...row,
    pillar_a_narrative:  a,
    pillar_b_audience:   b,
    pillar_c_production: c,
    overall_score:       raw,
    normalized_score:    norm,
    verdict,
    tagline:             sc.tagline          ?? null,
    adaptation_notes:    sc.adaptation_notes ?? null,
    character_count:     sc.character_count  ?? null,
    set_count:           sc.set_count        ?? null,
    platform_target:     sc.platform_target  ?? null,
    genre_tier:          sc.genre_tier       ?? null,
  }
}

function triggerDownload(content, filename, mimeType) {
  const a = document.createElement('a')
  a.href = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`
  a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

// ── Sub-components ────────────────────────────────────────────
function ScoreBar({ score, max }) {
  const pct = max > 0 ? (score / max) * 100 : 0
  const color = pct >= 80 ? GREEN : pct >= 60 ? GOLD : pct >= 40 ? BLUE : RED
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 3, background: '#2a2520', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 1s ease' }} />
      </div>
      <span style={{ fontSize: 10, color: CREAM, opacity: 0.55, minWidth: 26, textAlign: 'right' }}>{score}/{max}</span>
    </div>
  )
}

function PillarBar({ label, score, max, color }) {
  const pct = max > 0 ? (score / max) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 9, color: CREAM, opacity: 0.5, width: 55, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: '#2a2520', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{score}/{max}</span>
    </div>
  )
}

function CandidateCard({ candidate, index, onPromote }) {
  const [expanded, setExpanded] = useState(false)
  const pillars = computeRawPillars(candidate)
  const norm = candidate.normalized_score ?? normalize(pillars.raw)
  const v = getVerdict(norm)

  return (
    <div style={{ background: '#1e1a14', border: `1px solid ${v.color}55`, borderRadius: 10, padding: '14px 16px', animation: `fadeIn 0.4s ease ${Math.min(index, 12) * 0.04}s both` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: CREAM, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.3 }}>{candidate.title}</div>
          <div style={{ fontSize: 11, color: GOLD, marginTop: 2 }}>
            {candidate.author} <span style={{ color: CHARCOAL }}>· {candidate.year_published} · {candidate.genre}</span>
          </div>
        </div>
        {/* Dual score display: normalized /100 + raw /60 */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1, color: v.color }}>{norm}</div>
          <div style={{ fontSize: 8, color: CHARCOAL, textTransform: 'uppercase', letterSpacing: 1 }}>/100</div>
          <div style={{ fontSize: 9, color: CHARCOAL, marginTop: 2 }}>{pillars.raw}/{MAX_RAW} raw</div>
        </div>
      </div>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Verdict badge — Greenlight/Develop/Conditional/Reject */}
        <div style={{ padding: '2px 9px', borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: v.color, background: v.bg, border: `1px solid ${v.color}55` }}>{v.label}</div>
        {candidate.platform_target && (
          <div style={{ padding: '2px 8px', borderRadius: 4, fontSize: 8, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: platformColors[candidate.platform_target] || CREAM, background: (platformColors[candidate.platform_target] || '#666') + '18', border: `1px solid ${(platformColors[candidate.platform_target] || '#666')}44` }}>{candidate.platform_target}</div>
        )}
        {candidate.genre_tier && (
          <div style={{ padding: '2px 8px', borderRadius: 4, fontSize: 8, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: tierColors[candidate.genre_tier] || CHARCOAL, background: (tierColors[candidate.genre_tier] || '#666') + '18', border: `1px solid ${(tierColors[candidate.genre_tier] || '#666')}44` }}>{candidate.genre_tier}</div>
        )}
        {candidate.tagline && <div style={{ fontSize: 10, color: CREAM, opacity: 0.45, fontStyle: 'italic', flex: 1, lineHeight: 1.3 }}>"{candidate.tagline}"</div>}
      </div>

      <div style={{ marginTop: 10 }}>
        <PillarBar label="Narrative"  score={candidate.pillar_a_narrative  ?? pillars.a} max={40} color={GREEN} />
        <PillarBar label="Audience"   score={candidate.pillar_b_audience   ?? pillars.b} max={10} color={GOLD} />
        <PillarBar label="Production" score={candidate.pillar_c_production ?? pillars.c} max={10} color={BLUE} />
      </div>

      {(candidate.character_count != null || candidate.set_count != null) && (
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {candidate.character_count != null && <div style={{ padding: '4px 10px', background: '#12100c', borderRadius: 6, fontSize: 10 }}><span style={{ color: BLUE, fontWeight: 700 }}>{candidate.character_count}</span><span style={{ color: CHARCOAL, marginLeft: 4 }}>characters</span></div>}
          {candidate.set_count != null && <div style={{ padding: '4px 10px', background: '#12100c', borderRadius: 6, fontSize: 10 }}><span style={{ color: BLUE, fontWeight: 700 }}>{candidate.set_count}</span><span style={{ color: CHARCOAL, marginLeft: 4 }}>sets</span></div>}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            ...(candidate.source_url ? [['🔗 Source Page', candidate.source_url]] : []),
            ['Google Books', `https://www.google.com/search?q=${encodeURIComponent(candidate.title + ' ' + candidate.author)}+book`],
            ['Goodreads',    `https://www.goodreads.com/search?q=${encodeURIComponent(candidate.title + ' ' + candidate.author)}`],
            ['Amazon',       `https://www.amazon.com/s?k=${encodeURIComponent(candidate.title + ' ' + candidate.author)}`],
          ].map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: CHARCOAL, textDecoration: 'none', letterSpacing: 0.8, borderBottom: `1px solid ${CHARCOAL}55`, paddingBottom: 1 }}>{label} ↗</a>
          ))}
        </div>
        {!candidate.promoted_to_manuscript
          ? <button onClick={() => onPromote(candidate)} style={{ background: 'none', border: `1px solid ${GOLD}55`, color: GOLD, borderRadius: 6, padding: '4px 12px', fontSize: 9, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>+ Add to Manuscripts</button>
          : (
            <div>
              <div style={{ fontSize: 9, color: GREEN, letterSpacing: 0.8, marginBottom: 6 }}>✓ In Manuscripts — find the manuscript file:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  ['📚 Google Books', `https://books.google.com/books?q=${encodeURIComponent(candidate.title + ' ' + candidate.author)}`],
                  ['🛒 Amazon Kindle', `https://www.amazon.com/s?k=${encodeURIComponent(candidate.title + ' ' + candidate.author)}&rh=n%3A154606011`],
                  ['📖 Project Gutenberg', `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(candidate.title + ' ' + candidate.author)}`],
                  ['🔍 Open Library', `https://openlibrary.org/search?q=${encodeURIComponent(candidate.title + ' ' + candidate.author)}`],
                ].map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 9, color: GOLD, textDecoration: 'none', padding: '3px 8px', border: `1px solid ${GOLD}44`, borderRadius: 4, whiteSpace: 'nowrap' }}>
                    {label} ↗
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 9, color: CHARCOAL, marginTop: 5 }}>
                Download the file, then upload it in the Manuscript module → manuscript detail → Files tab.
              </div>
            </div>
          )
        }
      </div>

      <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 10, background: 'none', border: 'none', color: GOLD, fontSize: 9, cursor: 'pointer', padding: 0, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.7 }}>
        {expanded ? '▲ Hide Breakdown' : '▼ Full Breakdown (13 dimensions)'}
      </button>

      {expanded && (
        <div style={{ marginTop: 10, display: 'grid', gap: 14 }}>
          {PILLARS.map(pillar => {
            const pillarColor = pillar.id === 'narrative' ? GREEN : pillar.id === 'audience' ? GOLD : BLUE
            const pillarScore = pillar.id === 'narrative' ? (candidate.pillar_a_narrative ?? pillars.a) : pillar.id === 'audience' ? (candidate.pillar_b_audience ?? pillars.b) : (candidate.pillar_c_production ?? pillars.c)
            return (
              <div key={pillar.id}>
                <div style={{ fontSize: 10, fontWeight: 700, color: pillarColor, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #2a2520' }}>
                  {pillar.label} ({pillarScore}/{pillar.max})
                </div>
                {pillar.criteria.map(c => (
                  <div key={c.key} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, color: CREAM, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{c.label}</div>
                    <ScoreBar score={candidate[`${c.key}_score`] ?? 0} max={c.max} />
                    {candidate[`${c.key}_note`] && <div style={{ fontSize: 10, color: CHARCOAL, marginTop: 3, lineHeight: 1.4 }}>{candidate[`${c.key}_note`]}</div>}
                  </div>
                ))}
              </div>
            )
          })}
          {candidate.adaptation_notes && (
            <div style={{ padding: '8px 10px', background: '#12100c', borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: GOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Adaptation Notes</div>
              <div style={{ fontSize: 10, color: CHARCOAL, lineHeight: 1.5 }}>{candidate.adaptation_notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Score from URL panel ─────────────────────────────────────────────────────
function ScoreFromURL({ models, onCandidateScored }) {
  const [url, setUrl]         = useState('')
  const [modelId, setModelId] = useState(models[0]?.modelid ?? null)
  const [phase, setPhase]     = useState('idle')
  const [log, setLog]         = useState([])
  const [result, setResult]   = useState(null)

  useEffect(() => { if (models.length > 0 && !modelId) setModelId(models[0].modelid) }, [models])

  const addLog = (msg) => setLog(l => [...l.slice(-8), msg])

  async function handleRun() {
    if (!url.trim() || !modelId) return
    setPhase('fetching'); setLog([]); setResult(null)
    const modelName = models.find(m => m.modelid === modelId)?.modelname || 'Model'
    addLog(`🌐 Fetching page…`)

    const fetched = await fetchPageText(url.trim())
    if (fetched.error) { addLog(`✗ ${fetched.error}`); setPhase('error'); return }
    addLog(`✅ Page retrieved. Extracting metadata…`)
    setPhase('extracting')

    const extracted = await callClaude(EXTRACT_FROM_URL_PROMPT(fetched.text, url.trim()))
    if (!extracted?.title) { addLog(`✗ Could not extract book metadata`); setPhase('error'); return }
    addLog(`✅ "${extracted.title}" by ${extracted.author || 'Unknown'}. Scoring…`)
    setPhase('scoring')

    const scored = await callClaude(SCORE_ONE_PROMPT(extracted, modelName))
    if (!scored?.cliffhanger_density) { addLog(`✗ Scoring failed: ${getLastApiError()}`); setPhase('error'); return }

    const scoreRow = scoreToRow(scored)
    const ipType = (extracted.year && extracted.year < 1928) ? 'public_domain' : 'contemporary'

    const { data: candidate, error } = await supabase
      .from('discovery_candidates')
      .insert({
        title:          extracted.title,
        author:         extracted.author    ?? null,
        year_published: extracted.year      ?? null,
        genre:          extracted.genre     ?? null,
        description:    extracted.description ?? null,
        ip_type:        ipType,
        rights_status:  ipType === 'contemporary' ? 'rights_required' : 'public_domain',
        source_url:     url.trim(),
        ...scoreRow,
      })
      .select()
      .single()

    if (error) { addLog(`✗ Save failed: ${error.message}`); setPhase('error'); return }

    addLog(`✅ ${scoreRow.verdict} (${scoreRow.normalized_score}/100)`)
    setResult(candidate)
    setPhase('done')
    if (onCandidateScored) onCandidateScored(candidate)
  }

  const isBusy = ['fetching','extracting','scoring'].includes(phase)

  return (
    <div style={{ background: '#1e1a14', border: `1px solid ${GOLD}33`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: CREAM, fontFamily: "'Cormorant Garamond', serif", marginBottom: 12 }}>🔗 Score from URL</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRun()}
          placeholder="Paste any book page URL (Amazon, Goodreads, Galatea, Gutenberg…)"
          style={{ flex: 1, minWidth: 200, background: '#111009', border: `1px solid rgba(201,146,74,0.12)`, color: CREAM, padding: '8px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', borderRadius: 4 }}
        />
        <select value={modelId ?? ''} onChange={e => setModelId(parseInt(e.target.value))}
          style={{ background: '#111009', border: `1px solid rgba(201,146,74,0.12)`, color: CREAM, padding: '8px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', outline: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {models.map(m => <option key={m.modelid} value={m.modelid}>{m.modelname}</option>)}
        </select>
        <button onClick={handleRun} disabled={!url.trim() || isBusy}
          style={{ background: (!url.trim() || isBusy) ? 'rgba(201,146,74,0.3)' : GOLD, color: INK, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {phase === 'fetching' ? 'Fetching…' : phase === 'extracting' ? 'Extracting…' : phase === 'scoring' ? 'Scoring…' : '▶ Score'}
        </button>
      </div>
      {log.length > 0 && (
        <div style={{ background: '#12100c', borderRadius: 6, padding: '8px 10px', fontFamily: 'monospace', fontSize: 10, color: '#6b6057', maxHeight: 100, overflowY: 'auto', marginBottom: 8 }}>
          {log.map((l, i) => <div key={i} style={{ color: l.includes('✗') ? '#C84B31' : i === log.length - 1 ? GOLD : undefined, lineHeight: 1.5 }}>{l}</div>)}
        </div>
      )}
      {result && phase === 'done' && (
        <div style={{ padding: '8px 12px', background: 'rgba(74,156,122,0.08)', border: '1px solid rgba(74,156,122,0.3)', borderRadius: 6, fontSize: 10, color: '#4A9C7A' }}>
          ✓ "{result.title}" scored · {result.verdict} ({result.normalized_score}/100)
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 9, color: CHARCOAL }}>Works with Amazon, Goodreads, Galatea, Project Gutenberg, or any book detail page.</div>
    </div>
  )
}

// ── Score from PDFs panel ─────────────────────────────────────────────────────
// Drop up to 50 PDFs — filename = title, Claude extracts metadata + scores each

function ScoreFromPDFs({ models, onCandidateScored }) {
  const [modelId, setModelId]     = useState(models[0]?.modelid ?? null)
  const [files, setFiles]         = useState([])   // { file, status, result, error }
  const [running, setRunning]     = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const fileInputRef              = useRef(null)
  const abortRef                  = useRef(false)

  useEffect(() => { if (models.length > 0 && !modelId) setModelId(models[0].modelid) }, [models])

  // ── PDF text extraction via pdfjs ────────────────────────────────────────
  async function extractPdfText(file, maxChars = 6000) {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString()

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''
    const maxPages = Math.min(pdf.numPages, 8) // first 8 pages is enough for metadata + plot
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(' ') + '\n'
      if (text.length > maxChars) break
    }
    return text.slice(0, maxChars)
  }

  // ── Combined extract + score prompt ──────────────────────────────────────
  const EXTRACT_AND_SCORE_PROMPT = (title, pdfText, modelName) =>
    `You are an IP analyst for Culmina AI Drama Studio scoring books for micro-drama adaptation (ReelShort/DramaBox, women 18-45, 60s episodes). Model: ${modelName}.

Book title (from filename): "${title}"

First pages of the book:
---
${pdfText}
---

Step 1: Extract metadata from the text above.
Step 2: Score for micro-drama adaptation using the v2.2 rubric (13 dimensions, max 60 raw).

A-NARRATIVE(40): cliffhanger_density(8), trope_stacking(7), emotional_escalation(6), status_reversal(6), visual_scene_variety(5), dialogue_action_ratio(4), episode_count_fit(4)
B-AUDIENCE(10): audience_alignment(5), ip_clarity(3), paywall_trigger(2)
C-PRODUCTION(10): character_load(3:1-3=3,4-6=2,7-10=1,11+=0), set_location_count(3:2-5=3,6-10=2,11+=1), ai_feasibility(4:contemporary=4,simple-hist=3,complex-hist=2,fantasy=1)

platform_target: "Cross-platform"|"ReelShort"|"DramaBox"
genre_tier: "Tier 1"(CEO+identity)|"Tier 2"(mafia,contract)|"Tier 3"(werewolf,campus,historical)|"Tier 4"(scifi,interactive)

ONLY JSON. No text. Start { end }
{
  "author": "extracted author name or null",
  "year": 2019,
  "genre": "primary genre",
  "description": "1-2 sentence plot summary",
  "cliffhanger_density":{"score":7,"note":"brief"},
  "trope_stacking":{"score":5,"note":"brief"},
  "emotional_escalation":{"score":5,"note":"brief"},
  "status_reversal":{"score":4,"note":"brief"},
  "visual_scene_variety":{"score":4,"note":"brief"},
  "dialogue_action_ratio":{"score":3,"note":"brief"},
  "episode_count_fit":{"score":3,"note":"brief"},
  "audience_alignment":{"score":4,"note":"brief"},
  "ip_clarity":{"score":2,"note":"brief"},
  "paywall_trigger":{"score":2,"note":"brief"},
  "character_load":{"score":3,"note":"brief"},
  "set_location_count":{"score":2,"note":"brief"},
  "ai_feasibility":{"score":4,"note":"brief"},
  "tagline":"one line",
  "adaptation_notes":"1-2 sentences",
  "character_count":4,
  "set_count":6,
  "platform_target":"Cross-platform",
  "genre_tier":"Tier 1"
}`

  // ── File handling ─────────────────────────────────────────────────────────
  function titleFromFilename(filename) {
    return filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim()
  }

  function addFiles(newFiles) {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    const capped = pdfs.slice(0, 50 - files.length)
    setFiles(prev => [
      ...prev,
      ...capped.map(f => ({ file: f, title: titleFromFilename(f.name), status: 'queued', result: null, error: null }))
    ])
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function clearAll() {
    setFiles([])
    abortRef.current = true
  }

  // ── Run scoring ───────────────────────────────────────────────────────────
  async function handleRun() {
    if (!modelId || files.length === 0 || running) return
    abortRef.current = false
    setRunning(true)
    const modelName = models.find(m => m.modelid === modelId)?.modelname || 'Model'

    // Create a run record for this PDF batch
    const { data: runData, error: runErr } = await supabase
      .from('discovery_runs')
      .insert({
        run_type:       'contemporary',
        status:         'scoring',
        rubric_version: 'v2.2',
        modelid:        modelId,
        model_name:     modelName,
        total_count:    files.length,
      })
      .select()
      .single()

    if (runErr || !runData) {
      setRunning(false)
      return
    }

    const runId = runData.id
    if (onCandidateScored) onCandidateScored({ _runRecord: runData })

    let greenlightCount = 0, developCount = 0, conditionalCount = 0, rejectCount = 0

    for (let i = 0; i < files.length; i++) {
      if (abortRef.current) break
      if (files[i].status === 'done') continue

      // Mark as processing
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'extracting' } : f))

      try {
        // Extract PDF text
        const pdfText = await extractPdfText(files[i].file)
        if (!pdfText || pdfText.length < 100) throw new Error('Could not extract text from PDF')

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'scoring' } : f))

        // Combined extract + score call
        const result = await callClaude(EXTRACT_AND_SCORE_PROMPT(files[i].title, pdfText, modelName))
        if (!result?.cliffhanger_density) throw new Error(getLastApiError() || 'No score returned')

        const scoreRow = scoreToRow(result)
        const year = result.year ?? null
        const ipType = (year && year < 1928) ? 'public_domain' : 'contemporary'

        const { data: candidate, error: dbErr } = await supabase
          .from('discovery_candidates')
          .insert({
            run_id:         runId,
            title:          files[i].title,
            author:         result.author       ?? null,
            year_published: year,
            genre:          result.genre        ?? null,
            description:    result.description  ?? null,
            ip_type:        ipType,
            rights_status:  ipType === 'contemporary' ? 'rights_required' : 'public_domain',
            ...scoreRow,
          })
          .select()
          .single()

        if (dbErr) throw new Error(dbErr.message)

        if (scoreRow.verdict === 'Greenlight')  greenlightCount++
        if (scoreRow.verdict === 'Develop')     developCount++
        if (scoreRow.verdict === 'Conditional') conditionalCount++
        if (scoreRow.verdict === 'Reject')      rejectCount++

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done', result: candidate } : f))
        if (onCandidateScored) onCandidateScored(candidate)

      } catch (err) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: err.message } : f))
      }

      // Throttle — 1 second between calls
      await new Promise(r => setTimeout(r, 1000))
    }

    // Update run to complete
    await supabase
      .from('discovery_runs')
      .update({
        status:          'complete',
        completed_at:    new Date().toISOString(),
        strong_count:    greenlightCount,
        promising_count: developCount,
        marginal_count:  conditionalCount,
        pass_count:      rejectCount,
      })
      .eq('id', runId)

    setRunning(false)
  }

  const isBusy = running
  const queuedCount  = files.filter(f => f.status === 'queued').length
  const doneCount    = files.filter(f => f.status === 'done').length
  const errorCount   = files.filter(f => f.status === 'error').length
  const activeCount  = files.filter(f => ['extracting','scoring'].includes(f.status)).length

  const statusColor  = (s) => s === 'done' ? GREEN : s === 'error' ? RED : s === 'scoring' || s === 'extracting' ? GOLD : CHARCOAL
  const statusLabel  = (s) => s === 'done' ? '✓' : s === 'error' ? '✗' : s === 'extracting' ? '⟳ extracting' : s === 'scoring' ? '⟳ scoring' : '…'

  return (
    <div style={{ background: '#1e1a14', border: `1px solid ${GOLD}33`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: CREAM, fontFamily: "'Cormorant Garamond', serif" }}>
          📄 Score from PDFs
          <span style={{ fontSize: 9, color: CHARCOAL, fontFamily: 'DM Sans, sans-serif', fontWeight: 400, marginLeft: 8 }}>up to 50 · filename = title</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={modelId ?? ''} onChange={e => setModelId(parseInt(e.target.value))}
            style={{ background: '#111009', border: `1px solid rgba(201,146,74,0.12)`, color: CREAM, padding: '6px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', outline: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {models.map(m => <option key={m.modelid} value={m.modelid}>{m.modelname}</option>)}
          </select>
          {files.length > 0 && !running && (
            <button onClick={clearAll} style={{ background: 'none', border: `1px solid #2a2520`, color: CHARCOAL, borderRadius: 6, padding: '5px 10px', fontSize: 9, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>Clear</button>
          )}
          {running && (
            <button onClick={() => { abortRef.current = true }} style={{ background: 'none', border: `1px solid ${RED}55`, color: RED, borderRadius: 6, padding: '5px 10px', fontSize: 9, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>Stop</button>
          )}
          {files.length > 0 && !running && queuedCount > 0 && (
            <button onClick={handleRun}
              style={{ background: GOLD, color: INK, border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>
              ▶ Score {queuedCount}
            </button>
          )}
        </div>
      </div>

      {/* Drop zone */}
      {files.length < 50 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? GOLD : '#2a2520'}`,
            borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'rgba(201,146,74,0.04)' : 'transparent',
            marginBottom: files.length > 0 ? 12 : 0,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 6 }}>📄</div>
          <div style={{ fontSize: 11, color: CHARCOAL }}>Drop PDFs here or click to browse</div>
          <div style={{ fontSize: 9, color: CHARCOAL, opacity: 0.6, marginTop: 4 }}>{50 - files.length} slots remaining</div>
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" multiple style={{ display: 'none' }}
            onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
        </div>
      )}

      {/* Progress summary */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
          {[['Total', files.length, CREAM], ['Done', doneCount, GREEN], ['Errors', errorCount, RED], ['Queued', queuedCount, CHARCOAL]].map(([l, v, c]) => v > 0 && (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: c, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 8, color: CHARCOAL, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
          {running && <div style={{ fontSize: 9, color: GOLD, alignSelf: 'center' }}>Processing {activeCount > 0 ? '…' : ''}</div>}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#12100c', borderRadius: 6, border: `1px solid ${f.status === 'done' ? '#4A9C7A33' : f.status === 'error' ? '#C84B3133' : '#2a2520'}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: CREAM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                {f.result && (
                  <div style={{ fontSize: 9, color: statusColor('done'), marginTop: 2 }}>
                    {f.result.verdict} · {f.result.normalized_score}/100 · {f.result.genre || ''}
                  </div>
                )}
                {f.error && <div style={{ fontSize: 9, color: RED, marginTop: 2 }}>{f.error}</div>}
              </div>
              <div style={{ fontSize: 9, color: statusColor(f.status), flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
                {statusLabel(f.status)}
              </div>
              {!running && f.status !== 'done' && (
                <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: CHARCOAL, fontSize: 10, cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Score from PDFs panel ─────────────────────────────────────────────────────
// Drop up to 50 PDFs — filename = title, Claude extracts metadata + scores each

function ScoreFromPDFs({ models, onCandidateScored }) {
  const [modelId, setModelId]     = useState(models[0]?.modelid ?? null)
  const [files, setFiles]         = useState([])   // { file, status, result, error }
  const [running, setRunning]     = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const fileInputRef              = useRef(null)
  const abortRef                  = useRef(false)

  useEffect(() => { if (models.length > 0 && !modelId) setModelId(models[0].modelid) }, [models])

  // ── PDF text extraction via pdfjs ────────────────────────────────────────
  async function extractPdfText(file, maxChars = 6000) {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString()

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''
    const maxPages = Math.min(pdf.numPages, 8) // first 8 pages is enough for metadata + plot
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(' ') + '\n'
      if (text.length > maxChars) break
    }
    return text.slice(0, maxChars)
  }

  // ── Combined extract + score prompt ──────────────────────────────────────
  const EXTRACT_AND_SCORE_PROMPT = (title, pdfText, modelName) =>
    `You are an IP analyst for Culmina AI Drama Studio scoring books for micro-drama adaptation (ReelShort/DramaBox, women 18-45, 60s episodes). Model: ${modelName}.

Book title (from filename): "${title}"

First pages of the book:
---
${pdfText}
---

Step 1: Extract metadata from the text above.
Step 2: Score for micro-drama adaptation using the v2.2 rubric (13 dimensions, max 60 raw).

A-NARRATIVE(40): cliffhanger_density(8), trope_stacking(7), emotional_escalation(6), status_reversal(6), visual_scene_variety(5), dialogue_action_ratio(4), episode_count_fit(4)
B-AUDIENCE(10): audience_alignment(5), ip_clarity(3), paywall_trigger(2)
C-PRODUCTION(10): character_load(3:1-3=3,4-6=2,7-10=1,11+=0), set_location_count(3:2-5=3,6-10=2,11+=1), ai_feasibility(4:contemporary=4,simple-hist=3,complex-hist=2,fantasy=1)

platform_target: "Cross-platform"|"ReelShort"|"DramaBox"
genre_tier: "Tier 1"(CEO+identity)|"Tier 2"(mafia,contract)|"Tier 3"(werewolf,campus,historical)|"Tier 4"(scifi,interactive)

ONLY JSON. No text. Start { end }
{
  "author": "extracted author name or null",
  "year": 2019,
  "genre": "primary genre",
  "description": "1-2 sentence plot summary",
  "cliffhanger_density":{"score":7,"note":"brief"},
  "trope_stacking":{"score":5,"note":"brief"},
  "emotional_escalation":{"score":5,"note":"brief"},
  "status_reversal":{"score":4,"note":"brief"},
  "visual_scene_variety":{"score":4,"note":"brief"},
  "dialogue_action_ratio":{"score":3,"note":"brief"},
  "episode_count_fit":{"score":3,"note":"brief"},
  "audience_alignment":{"score":4,"note":"brief"},
  "ip_clarity":{"score":2,"note":"brief"},
  "paywall_trigger":{"score":2,"note":"brief"},
  "character_load":{"score":3,"note":"brief"},
  "set_location_count":{"score":2,"note":"brief"},
  "ai_feasibility":{"score":4,"note":"brief"},
  "tagline":"one line",
  "adaptation_notes":"1-2 sentences",
  "character_count":4,
  "set_count":6,
  "platform_target":"Cross-platform",
  "genre_tier":"Tier 1"
}`

  // ── File handling ─────────────────────────────────────────────────────────
  function titleFromFilename(filename) {
    return filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim()
  }

  function addFiles(newFiles) {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    const capped = pdfs.slice(0, 50 - files.length)
    setFiles(prev => [
      ...prev,
      ...capped.map(f => ({ file: f, title: titleFromFilename(f.name), status: 'queued', result: null, error: null }))
    ])
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function clearAll() {
    setFiles([])
    abortRef.current = true
  }

  // ── Run scoring ───────────────────────────────────────────────────────────
  async function handleRun() {
    if (!modelId || files.length === 0 || running) return
    abortRef.current = false
    setRunning(true)
    const modelName = models.find(m => m.modelid === modelId)?.modelname || 'Model'

    // Create a run record for this PDF batch
    const { data: runData, error: runErr } = await supabase
      .from('discovery_runs')
      .insert({
        run_type:       'contemporary',
        status:         'scoring',
        rubric_version: 'v2.2',
        modelid:        modelId,
        model_name:     modelName,
        total_count:    files.length,
      })
      .select()
      .single()

    if (runErr || !runData) {
      setRunning(false)
      return
    }

    const runId = runData.id
    if (onCandidateScored) onCandidateScored({ _runRecord: runData })

    let greenlightCount = 0, developCount = 0, conditionalCount = 0, rejectCount = 0

    for (let i = 0; i < files.length; i++) {
      if (abortRef.current) break
      if (files[i].status === 'done') continue

      // Mark as processing
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'extracting' } : f))

      try {
        // Extract PDF text
        const pdfText = await extractPdfText(files[i].file)
        if (!pdfText || pdfText.length < 100) throw new Error('Could not extract text from PDF')

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'scoring' } : f))

        // Combined extract + score call
        const result = await callClaude(EXTRACT_AND_SCORE_PROMPT(files[i].title, pdfText, modelName))
        if (!result?.cliffhanger_density) throw new Error(getLastApiError() || 'No score returned')

        const scoreRow = scoreToRow(result)
        const year = result.year ?? null
        const ipType = (year && year < 1928) ? 'public_domain' : 'contemporary'

        const { data: candidate, error: dbErr } = await supabase
          .from('discovery_candidates')
          .insert({
            run_id:         runId,
            title:          files[i].title,
            author:         result.author       ?? null,
            year_published: year,
            genre:          result.genre        ?? null,
            description:    result.description  ?? null,
            ip_type:        ipType,
            rights_status:  ipType === 'contemporary' ? 'rights_required' : 'public_domain',
            ...scoreRow,
          })
          .select()
          .single()

        if (dbErr) throw new Error(dbErr.message)

        if (scoreRow.verdict === 'Greenlight')  greenlightCount++
        if (scoreRow.verdict === 'Develop')     developCount++
        if (scoreRow.verdict === 'Conditional') conditionalCount++
        if (scoreRow.verdict === 'Reject')      rejectCount++

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done', result: candidate } : f))
        if (onCandidateScored) onCandidateScored(candidate)

      } catch (err) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: err.message } : f))
      }

      // Throttle — 1 second between calls
      await new Promise(r => setTimeout(r, 1000))
    }

    // Update run to complete
    await supabase
      .from('discovery_runs')
      .update({
        status:          'complete',
        completed_at:    new Date().toISOString(),
        strong_count:    greenlightCount,
        promising_count: developCount,
        marginal_count:  conditionalCount,
        pass_count:      rejectCount,
      })
      .eq('id', runId)

    setRunning(false)
  }

  const isBusy = running
  const queuedCount  = files.filter(f => f.status === 'queued').length
  const doneCount    = files.filter(f => f.status === 'done').length
  const errorCount   = files.filter(f => f.status === 'error').length
  const activeCount  = files.filter(f => ['extracting','scoring'].includes(f.status)).length

  const statusColor  = (s) => s === 'done' ? GREEN : s === 'error' ? RED : s === 'scoring' || s === 'extracting' ? GOLD : CHARCOAL
  const statusLabel  = (s) => s === 'done' ? '✓' : s === 'error' ? '✗' : s === 'extracting' ? '⟳ extracting' : s === 'scoring' ? '⟳ scoring' : '…'

  return (
    <div style={{ background: '#1e1a14', border: `1px solid ${GOLD}33`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: CREAM, fontFamily: "'Cormorant Garamond', serif" }}>
          📄 Score from PDFs
          <span style={{ fontSize: 9, color: CHARCOAL, fontFamily: 'DM Sans, sans-serif', fontWeight: 400, marginLeft: 8 }}>up to 50 · filename = title</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={modelId ?? ''} onChange={e => setModelId(parseInt(e.target.value))}
            style={{ background: '#111009', border: `1px solid rgba(201,146,74,0.12)`, color: CREAM, padding: '6px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', outline: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {models.map(m => <option key={m.modelid} value={m.modelid}>{m.modelname}</option>)}
          </select>
          {files.length > 0 && !running && (
            <button onClick={clearAll} style={{ background: 'none', border: `1px solid #2a2520`, color: CHARCOAL, borderRadius: 6, padding: '5px 10px', fontSize: 9, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>Clear</button>
          )}
          {running && (
            <button onClick={() => { abortRef.current = true }} style={{ background: 'none', border: `1px solid ${RED}55`, color: RED, borderRadius: 6, padding: '5px 10px', fontSize: 9, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>Stop</button>
          )}
          {files.length > 0 && !running && queuedCount > 0 && (
            <button onClick={handleRun}
              style={{ background: GOLD, color: INK, border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>
              ▶ Score {queuedCount}
            </button>
          )}
        </div>
      </div>

      {/* Drop zone */}
      {files.length < 50 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? GOLD : '#2a2520'}`,
            borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'rgba(201,146,74,0.04)' : 'transparent',
            marginBottom: files.length > 0 ? 12 : 0,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 6 }}>📄</div>
          <div style={{ fontSize: 11, color: CHARCOAL }}>Drop PDFs here or click to browse</div>
          <div style={{ fontSize: 9, color: CHARCOAL, opacity: 0.6, marginTop: 4 }}>{50 - files.length} slots remaining</div>
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" multiple style={{ display: 'none' }}
            onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
        </div>
      )}

      {/* Progress summary */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
          {[['Total', files.length, CREAM], ['Done', doneCount, GREEN], ['Errors', errorCount, RED], ['Queued', queuedCount, CHARCOAL]].map(([l, v, c]) => v > 0 && (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: c, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 8, color: CHARCOAL, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
          {running && <div style={{ fontSize: 9, color: GOLD, alignSelf: 'center' }}>Processing {activeCount > 0 ? '…' : ''}</div>}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#12100c', borderRadius: 6, border: `1px solid ${f.status === 'done' ? '#4A9C7A33' : f.status === 'error' ? '#C84B3133' : '#2a2520'}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: CREAM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                {f.result && (
                  <div style={{ fontSize: 9, color: statusColor('done'), marginTop: 2 }}>
                    {f.result.verdict} · {f.result.normalized_score}/100 · {f.result.genre || ''}
                  </div>
                )}
                {f.error && <div style={{ fontSize: 9, color: RED, marginTop: 2 }}>{f.error}</div>}
              </div>
              <div style={{ fontSize: 9, color: statusColor(f.status), flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
                {statusLabel(f.status)}
              </div>
              {!running && f.status !== 'done' && (
                <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: CHARCOAL, fontSize: 10, cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Run History sidebar ───────────────────────────────────────
function RunHistory({ runs, activeRunId, onSelect, onNewRun, onDelete }) {
  return (
    <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: CREAM, textTransform: 'uppercase', letterSpacing: 1.2 }}>Run History</span>
        <button onClick={onNewRun} style={{ background: GOLD, color: INK, border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 9, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.8, textTransform: 'uppercase' }}>+ New Run</button>
      </div>
      {runs.length === 0 && <div style={{ fontSize: 10, color: CHARCOAL, padding: '12px 0' }}>No runs yet.</div>}
      {runs.map(run => {
        const isActive = run.id === activeRunId
        const typeLabel = run.run_type === 'contemporary' ? 'Contemporary' : 'Public Domain'
        const dateStr = new Date(run.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const strongCount   = run.strong_count   ?? 0
        const promisingCount = run.promising_count ?? 0
        return (
          <div key={run.id} onClick={() => onSelect(run.id)}
            style={{ background: isActive ? '#252018' : '#1a1710', border: `1px solid ${isActive ? GOLD + '66' : '#2a2520'}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CREAM, fontFamily: "'Cormorant Garamond', serif" }}>{typeLabel}</div>
            {run.model_name && <div style={{ fontSize: 8, color: GOLD, marginTop: 1, opacity: 0.7 }}>{run.model_name}</div>}
            <div style={{ fontSize: 9, color: CHARCOAL, marginTop: 2 }}>{dateStr} · {run.total_count ?? '?'} titles</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {strongCount   > 0 && <div style={{ fontSize: 8, color: GREEN, fontWeight: 700 }}>{strongCount} Greenlight</div>}
              {promisingCount > 0 && <div style={{ fontSize: 8, color: GOLD,  fontWeight: 700 }}>{promisingCount} Develop</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ fontSize: 8, letterSpacing: 0.8, textTransform: 'uppercase', color: run.status === 'complete' ? GREEN : run.status === 'error' ? RED : GOLD }}>{run.status}</div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(run.id) }}
                style={{ background: 'none', border: 'none', color: CHARCOAL, fontSize: 9, cursor: 'pointer', padding: '0 2px', opacity: 0.6 }}
                title="Delete run"
              >✕</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── New Run Modal — with model selector ───────────────────────
function NewRunModal({ models, onStart, onClose }) {
  const [type, setType]       = useState('contemporary')
  const [modelId, setModelId] = useState(models[0]?.modelid ?? null)

  useEffect(() => {
    if (models.length > 0 && !modelId) setModelId(models[0].modelid)
  }, [models])

  const selectedModel = models.find(m => m.modelid === modelId)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000088', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1e1a14', border: `1px solid ${GOLD}55`, borderRadius: 14, padding: '28px 32px', width: 380 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: CREAM, fontFamily: "'Cormorant Garamond', serif", marginBottom: 6 }}>New Discovery Run</div>
        <div style={{ fontSize: 11, color: CHARCOAL, marginBottom: 20 }}>Generate and score 10 candidates using the v2.2 rubric.</div>

        {/* Model selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: '0.62rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Scoring Model</div>
          {models.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: RED, padding: '10px 14px', background: 'rgba(200,75,49,0.08)', border: '1px solid rgba(200,75,49,0.2)', borderRadius: 6 }}>
              No Final models available. Create one in Admin → Scoring Models.
            </div>
          ) : (
            <select
              value={modelId ?? ''}
              onChange={e => setModelId(parseInt(e.target.value))}
              style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              {models.map(m => (
                <option key={m.modelid} value={m.modelid}>{m.modelname}</option>
              ))}
            </select>
          )}
          {selectedModel?.modelpurpose && (
            <div style={{ fontSize: 9, color: CHARCOAL, marginTop: 5, lineHeight: 1.4 }}>{selectedModel.modelpurpose}</div>
          )}
        </div>

        {/* IP type selector */}
        <div style={{ fontSize: '0.62rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>IP Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {[['contemporary',  '📚 Contemporary IP',  'Post-2000 bestsellers · Rights required'],
            ['public_domain', '🏛 Public Domain',     'Pre-1928 classics · No rights needed'],
          ].map(([val, title, sub]) => (
            <div key={val} onClick={() => setType(val)}
              style={{ padding: '12px 14px', borderRadius: 8, border: `1px solid ${type === val ? GOLD + '88' : '#2a2520'}`, background: type === val ? '#252018' : '#12100c', cursor: 'pointer' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: CREAM }}>{title}</div>
              <div style={{ fontSize: 10, color: CHARCOAL, marginTop: 3 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: '1px solid #2a2520', color: CHARCOAL, borderRadius: 6, padding: '8px', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => onStart(type, modelId, selectedModel)}
            disabled={!modelId || models.length === 0}
            style={{ flex: 2, background: (!modelId || models.length === 0) ? 'rgba(201,146,74,0.3)' : GOLD, color: (!modelId || models.length === 0) ? MUTED : INK, border: 'none', borderRadius: 6, padding: '8px', fontSize: 11, fontWeight: 700, cursor: (!modelId || models.length === 0) ? 'not-allowed' : 'pointer' }}>
            ▶ Start Run
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Tab Component ────────────────────────────────────────
export default function IPDiscoveryTab() {
  const [models, setModels]           = useState([])
  const [runs, setRuns]               = useState([])
  const [activeRunId, setActiveRunId] = useState(null)
  const [candidates, setCandidates]   = useState([])
  const [activeRun, setActiveRun]     = useState(null)
  const [phase, setPhase]             = useState('idle')
  const [scoringIndex, setScoringIndex] = useState(-1)
  const [log, setLog]                 = useState([])
  const [showModal, setShowModal]     = useState(false)
  const [filterVerdict, setFilterVerdict] = useState('ALL')
  const abortRef = useRef(false)

  const addLog = (msg) => setLog(l => [...l.slice(-20), msg])

  useEffect(() => { loadModels(); loadRuns() }, [])

  // ── Load Final models ─────────────────────────────────────
  async function loadModels() {
    const { data } = await supabase
      .from('scoring_models')
      .select('modelid, modelname, modelpurpose, modelstatus')
      .eq('activestatus', 'A')
      .eq('modelstatus', 'Final')
      .order('modelname')
    if (data) setModels(data)
  }

  async function loadRuns() {
    const { data } = await supabase
      .from('discovery_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20)
    if (data) setRuns(data || [])
  }

  async function deleteRun(runId) {
    if (!window.confirm('Delete this run and all its candidates?')) return
    await supabase.from('discovery_candidates').delete().eq('run_id', runId)
    await supabase.from('discovery_runs').delete().eq('id', runId)
    setRuns(prev => prev.filter(r => r.id !== runId))
    if (activeRunId === runId) {
      setActiveRunId(null)
      setActiveRun(null)
      setCandidates([])
      setPhase('idle')
    }
  }

  async function selectRun(runId) {
    setActiveRunId(runId)
    const run = runs.find(r => r.id === runId)
    setActiveRun(run)
    const { data } = await supabase
      .from('discovery_candidates')
      .select('*')
      .eq('run_id', runId)
      .order('normalized_score', { ascending: false })
    setCandidates(data || [])
    setPhase('done')
    setLog([])
  }

  // ── Execute a new run ─────────────────────────────────────
  async function executeRun(type, modelId, modelObj) {
    setShowModal(false)
    abortRef.current = false
    setPhase('generating')
    setCandidates([])
    setLog([])
    const modelName = modelObj?.modelname || 'Discovery Model'
    addLog(`🎬 Starting ${type === 'contemporary' ? 'contemporary' : 'public domain'} run with ${modelName}…`)

    // Create run record
    const { data: runData, error: runErr } = await supabase
      .from('discovery_runs')
      .insert({
        run_type: type,
        status: 'generating',
        rubric_version: 'v2.2',
        modelid: modelId,
        model_name: modelName,
      })
      .select()
      .single()

    if (runErr || !runData) {
      addLog(`✗ Failed to create run: ${runErr?.message}`)
      setPhase('error')
      return
    }

    const runId = runData.id
    setActiveRunId(runId)
    setActiveRun(runData)
    setRuns(prev => [runData, ...prev])

    // Generate book list
    addLog('🤖 Asking Claude to select candidates…')
    let bookList = await callClaude(BOOK_GEN_PROMPT(type))
    if (!Array.isArray(bookList) || bookList.length === 0) {
      const e = getLastApiError()
      if (e) addLog(`  ⚠ ${e}`)
      addLog('⚠ Retrying…')
      bookList = await callClaude(BOOK_GEN_PROMPT(type))
    }
    if (!Array.isArray(bookList)) {
      await supabase.from('discovery_runs').update({ status: 'error', error_message: getLastApiError(), completed_at: new Date().toISOString() }).eq('id', runId)
      addLog(`✗ Failed to generate list: ${getLastApiError()}`)
      setPhase('error')
      return
    }

    addLog(`✅ ${bookList.length} candidates. Scoring with ${modelName}…`)
    await supabase.from('discovery_runs').update({ status: 'scoring' }).eq('id', runId)
    setPhase('scoring')

    let greenlightCount = 0, developCount = 0, conditionalCount = 0, rejectCount = 0

    for (let i = 0; i < bookList.length; i++) {
      if (abortRef.current) break
      setScoringIndex(i)
      const book = bookList[i]
      addLog(`  ↳ [${i + 1}/${bookList.length}] ${book.title}`)

      const ipType = type === 'contemporary' ? 'contemporary' : 'public_domain'
      const baseRow = {
        run_id: runId,
        title: book.title,
        author: book.author,
        year_published: book.year,
        genre: book.genre,
        description: book.description,
        isbn: book.isbn || null,
        publisher: book.publisher || null,
        ip_type: ipType,
        rights_status: ipType === 'contemporary' ? 'rights_required' : 'public_domain',
      }

      try {
        const sc = await callClaude(SCORE_ONE_PROMPT(book, modelName))
        if (sc && (sc.cliffhanger_density || sc.trope_stacking)) {
          const scoreRow = scoreToRow(sc)
          const { data: inserted } = await supabase
            .from('discovery_candidates')
            .insert({ ...baseRow, ...scoreRow })
            .select()
            .single()
          if (inserted) {
            setCandidates(prev => [...prev, inserted])
            const vLabel = scoreRow.verdict
            if (vLabel === 'Greenlight')  greenlightCount++
            if (vLabel === 'Develop')     developCount++
            if (vLabel === 'Conditional') conditionalCount++
            if (vLabel === 'Reject')      rejectCount++
            addLog(`    ✓ ${book.title} → ${vLabel} (${scoreRow.normalized_score}/100)`)
          }
        } else {
          const se = getLastApiError()
          addLog(`  ⚠ ${book.title}${se ? ': ' + se.slice(0, 80) : ' — no score'}`)
          await supabase.from('discovery_candidates').insert(baseRow)
        }
      } catch (e) {
        addLog(`  ✗ ${book.title}: ${e.message}`)
      }

      await new Promise(r => setTimeout(r, 500))
    }

    setScoringIndex(-1)

    // Update run to complete
    const { data: completedRun } = await supabase
      .from('discovery_runs')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
        total_count: bookList.length,
        strong_count:   greenlightCount,
        promising_count: developCount,
        marginal_count:  conditionalCount,
        pass_count:      rejectCount,
      })
      .eq('id', runId)
      .select()
      .single()

    if (completedRun) {
      setActiveRun(completedRun)
      setRuns(prev => prev.map(r => r.id === runId ? completedRun : r))
    }

    addLog(`✅ Done! ${greenlightCount} Greenlight · ${developCount} Develop · ${conditionalCount} Conditional · ${rejectCount} Reject`)
    setPhase('done')
    loadRuns()
  }

  // ── Promote candidate to Manuscripts ─────────────────────
  async function promoteToManuscript(candidate) {
    const norm = candidate.normalized_score ?? normalize(computeRawPillars(candidate).raw)
    const verdict = getVerdict(norm).label

    // Insert into productions table (same as Manuscript module)
    const { data: prod, error } = await supabase
      .from('productions')
      .insert({
        productiontitle:   candidate.title,
        productionstatus:  'draft',
        productiongroup:   'TITLE',
        activestatus:      'A',
        genre:             candidate.genre      ?? null,
        summary:           candidate.description ?? null,
        source_url:        candidate.source_url  ?? null,
        createdate:        new Date().toISOString(),
        updatedate:        new Date().toISOString(),
      })
      .select()
      .single()

    if (error) { alert(`Failed to add to Manuscripts: ${error.message}`); return }

    // Insert author into manuscript_authors (optional — skip if no author)
    if (candidate.author) {
      await supabase.from('manuscript_authors').insert({
        productionid: prod.productionid,
        author_name:  candidate.author,
        author_role:  'Author',
        sortorder:    1,
      })
    }

    // Mark candidate as promoted
    await supabase
      .from('discovery_candidates')
      .update({ promoted_to_manuscript: true, manuscript_id: prod.productionid })
      .eq('id', candidate.id)

    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, promoted_to_manuscript: true, manuscript_id: prod.productionid } : c))
    addLog(`✅ "${candidate.title}" added to Manuscripts`)
  }

  // ── Export CSV ────────────────────────────────────────────
  function exportCSV() {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const headers = ['title','author','year_published','genre','ip_type','verdict','normalized_score','overall_score','pillar_a_narrative','pillar_b_audience','pillar_c_production','platform_target','genre_tier','character_count','set_count','tagline','adaptation_notes',...ALL_CRITERIA.map(c => c.key + '_score')]
    const rows = [headers.join(','), ...candidates.map(c => headers.map(h => typeof c[h] === 'string' ? esc(c[h]) : c[h] ?? '').join(','))]
    triggerDownload(rows.join('\n'), `culmina-discovery-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
  }

  // ── Filtered + sorted candidates ──────────────────────────
  const verdictOrder = { Greenlight: 0, Develop: 1, Conditional: 2, Reject: 3 }
  const filtered = candidates
    .filter(c => filterVerdict === 'ALL' || c.verdict === filterVerdict)
    .sort((a, b) => (b.normalized_score ?? 0) - (a.normalized_score ?? 0))

  const VERDICT_FILTERS = [
    { id: 'ALL',         color: CREAM  },
    { id: 'Greenlight',  color: GREEN  },
    { id: 'Develop',     color: GOLD   },
    { id: 'Conditional', color: BLUE   },
    { id: 'Reject',      color: RED    },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: CREAM, minHeight: '100%' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;700&display=swap'); @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.7)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: GOLD, textTransform: 'uppercase', marginBottom: 4, opacity: 0.8 }}>Admin · IP Acquisition</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: CREAM, margin: 0 }}>IP Discovery Engine</h2>
            <div style={{ fontSize: 11, color: CHARCOAL, marginTop: 4 }}>v2.2 rubric · 13 dimensions · 3 pillars · /60 raw → /100 normalized · Greenlight / Develop / Conditional / Reject</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {candidates.length > 0 && (
              <button onClick={exportCSV} style={{ background: 'none', border: `1px solid ${GOLD}44`, color: GOLD, borderRadius: 6, padding: '7px 14px', fontSize: 10, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>↓ Export CSV</button>
            )}
            <button onClick={() => setShowModal(true)} style={{ background: GOLD, color: INK, border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>+ New Run</button>
          </div>
        </div>

        {/* Verdict legend */}
        <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
          {[['≥80','Greenlight',GREEN],['60–79','Develop',GOLD],['40–59','Conditional',BLUE],['<40','Reject',RED]].map(([range, v, c]) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
              <span style={{ fontSize: 9, color: CHARCOAL, letterSpacing: 1 }}>{range} {v}</span>
            </div>
          ))}
          <span style={{ fontSize: 9, color: CHARCOAL, opacity: 0.4 }}>· scores normalized to /100</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Run history sidebar */}
        <RunHistory runs={runs} activeRunId={activeRunId} onSelect={selectRun} onNewRun={() => setShowModal(true)} onDelete={deleteRun} />

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Active run header */}
          {activeRun && (
            <div style={{ background: '#1e1a14', border: `1px solid ${GOLD}33`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: CREAM, fontFamily: "'Cormorant Garamond', serif" }}>
                    {activeRun.run_type === 'contemporary' ? '📚 Contemporary IP' : '🏛 Public Domain'} · {new Date(activeRun.started_at).toLocaleString()}
                  </div>
                  {activeRun.model_name && <div style={{ fontSize: 10, color: GOLD, marginTop: 2, opacity: 0.8 }}>Model: {activeRun.model_name}</div>}
                  <div style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 4, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', background: phase === 'done' ? 'rgba(74,156,122,0.2)' : '#C9924A18', color: phase === 'done' ? GREEN : GOLD, border: `1px solid ${phase === 'done' ? GREEN + '44' : GOLD + '44'}` }}>
                    {phase === 'generating' ? 'Generating…' : phase === 'scoring' ? `Scoring ${scoringIndex + 1}/${candidates.length + 1}` : phase === 'done' ? 'Complete' : phase === 'error' ? 'Error' : 'Ready'}
                  </div>
                </div>
                {activeRun.total_count && (
                  <div style={{ display: 'flex', gap: 16 }}>
                    {[['Total', activeRun.total_count, CREAM], ['Greenlight', activeRun.strong_count, GREEN], ['Develop', activeRun.promising_count, GOLD]].map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{v}</div>
                        <div style={{ fontSize: 8, color: CHARCOAL, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {phase === 'scoring' && (
                <div style={{ height: 3, background: '#2a2520', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: GOLD, borderRadius: 2, width: `${(candidates.length / 10) * 100}%`, transition: 'width 0.5s ease' }} />
                </div>
              )}

              {log.length > 0 && (
                <div style={{ marginTop: 10, background: '#12100c', borderRadius: 6, padding: '8px 10px', fontFamily: 'monospace', fontSize: 10, color: '#6b6057', maxHeight: 120, overflowY: 'auto' }}>
                  {log.map((l, i) => (
                    <div key={i} style={{ color: l.includes('✗') ? RED : l.includes('⚠') ? '#f59e0b' : i === log.length - 1 ? GOLD : undefined, lineHeight: 1.5 }}>{l}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Score from URL */}
          <ScoreFromURL models={models} onCandidateScored={(c) => setCandidates(prev => [c, ...prev])} />
          <ScoreFromPDFs models={models} onCandidateScored={(c) => setCandidates(prev => [c, ...prev])} />
          <ScoreFromPDFs models={models} onCandidateScored={(c) => setCandidates(prev => [c, ...prev])} />

          {/* Filter controls */}
          {candidates.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, color: CHARCOAL, textTransform: 'uppercase', letterSpacing: 1 }}>Filter:</span>
              {VERDICT_FILTERS.map(({ id, color }) => (
                <button key={id} onClick={() => setFilterVerdict(id)}
                  style={{ background: filterVerdict === id ? color + '22' : 'none', border: `1px solid ${filterVerdict === id ? color + '88' : '#2a2520'}`, color: filterVerdict === id ? color : CHARCOAL, borderRadius: 4, padding: '3px 10px', fontSize: 9, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {id}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 9, color: CHARCOAL }}>{filtered.length} title{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Candidate cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((c, i) => (
              <CandidateCard key={c.id} candidate={c} index={i} onPromote={promoteToManuscript} />
            ))}
          </div>

          {/* Empty states */}
          {!activeRunId && phase === 'idle' && (
            <div style={{ textAlign: 'center', color: CHARCOAL, padding: '60px 20px', border: '1px dashed #2a2520', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 14, color: CREAM, fontFamily: "'Cormorant Garamond', serif", marginBottom: 8 }}>No run selected</div>
              <div style={{ fontSize: 11 }}>Start a new run or select one from the history panel.</div>
              {models.length === 0 && <div style={{ fontSize: 10, color: RED, marginTop: 12 }}>⚠ No Final scoring models found. Create one in Admin → Scoring Models first.</div>}
            </div>
          )}
        </div>
      </div>

      {/* New Run Modal */}
      {showModal && <NewRunModal models={models} onStart={executeRun} onClose={() => setShowModal(false)} />}

      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 9, color: CHARCOAL, letterSpacing: 1 }}>
        CULMINA IP DISCOVERY ENGINE · RUBRIC v2.2 · VERDICTS ALIGNED WITH MANUSCRIPT SCORING
      </div>
    </div>
  )
}
