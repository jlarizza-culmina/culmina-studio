import { useState } from 'react'

// ─── Design Tokens ────────────────────────────────────────────────────────────
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

// ─── Score Utilities ──────────────────────────────────────────────────────────
function getVerdict(score) {
  if (score >= 48) return { label: 'Greenlight', color: GREEN,  bg: 'rgba(74,156,122,0.15)' }
  if (score >= 36) return { label: 'Develop',    color: GOLD,   bg: 'rgba(201,146,74,0.15)' }
  if (score >= 24) return { label: 'Conditional',color: BLUE,   bg: 'rgba(122,158,200,0.15)' }
  return                   { label: 'Pass',       color: RED,    bg: 'rgba(200,75,49,0.15)' }
}

function ScoreBadge({ score }) {
  const v = getVerdict(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', border: `2px solid ${v.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 700, color: v.color }}>
        {score}
      </div>
      <span style={{ background: v.bg, color: v.color, padding: '3px 9px',
        fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 2 }}>
        {v.label}
      </span>
    </div>
  )
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TITLES = [
  {
    id: 1, title: 'The Tunnels of Rasand', genre: 'Sci-Fi Romance',
    tropes: ['Hidden Identity', 'Bodyguard', 'Forbidden Love'],
    status: 'complete', episodes: 70, score: 52, platform: 'ReelShort',
    version: 1, language: 'English', agreement: true, created: '2026-01-10',
    pillarA: 34, pillarB: 10, pillarC: 8,
    dimensions: {
      cliffhanger: 7, tropeStacking: 6, emotionalEscalation: 5, statusReversal: 5,
      visualVariety: 5, dialogueRatio: 3, episodeCountFit: 3,
      audienceAlignment: 4, ipClarity: 3, paywallTrigger: 2,
      characterLoad: 3, locationCount: 3, aiFeasibility: 4
    }
  },
  {
    id: 2, title: 'The Scarlet Pimpernel', genre: 'Historical Romance',
    tropes: ['Hidden Identity', 'Aristocracy', 'Revenge'],
    status: 'complete', episodes: 55, score: 41, platform: 'Cross-Platform',
    version: 1, language: 'English', agreement: false, created: '2026-01-18',
    pillarA: 28, pillarB: 7, pillarC: 6,
    dimensions: {
      cliffhanger: 6, tropeStacking: 5, emotionalEscalation: 5, statusReversal: 5,
      visualVariety: 4, dialogueRatio: 2, episodeCountFit: 1,
      audienceAlignment: 3, ipClarity: 3, paywallTrigger: 1,
      characterLoad: 3, locationCount: 2, aiFeasibility: 1
    }
  },
  {
    id: 3, title: 'Draft Novel v3', genre: 'CEO Romance',
    tropes: ['Billionaire', 'Contract Marriage'],
    status: 'processing', episodes: null, score: null, platform: null,
    version: 3, language: 'English', agreement: true, created: '2026-02-20',
    pillarA: null, pillarB: null, pillarC: null, dimensions: null
  },
  {
    id: 4, title: 'La Novela Oscura', genre: 'Dark Romance',
    tropes: ['Mafia', 'Forced Proximity'],
    status: 'error', episodes: null, score: null, platform: null,
    version: 1, language: 'Spanish', agreement: false, created: '2026-02-25',
    pillarA: null, pillarB: null, pillarC: null, dimensions: null
  },
]

const STATUS_CONFIG = {
  complete:   { color: GREEN,  label: 'Scored'      },
  processing: { color: GOLD,   label: 'Processing'  },
  uploaded:   { color: BLUE,   label: 'Uploaded'    },
  error:      { color: RED,    label: 'Error'       },
}

const TROPE_COLORS = [
  'rgba(201,146,74,0.18)', 'rgba(122,158,200,0.18)', 'rgba(74,156,122,0.18)',
  'rgba(180,120,200,0.18)', 'rgba(200,120,100,0.18)',
]

// ─── Titles Grid ──────────────────────────────────────────────────────────────
function TitleCard({ title, onClick }) {
  const [hover, setHover] = useState(false)
  const sc = STATUS_CONFIG[title.status] || STATUS_CONFIG.uploaded
  const initials = title.title.split(' ').slice(0, 2).map(w => w[0]).join('')

  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? '#221E18' : SURFACE, border: `1px solid ${hover ? GOLD : BORDER}`,
        cursor: 'pointer', transition: 'all 0.2s', borderRadius: 4, overflow: 'hidden',
        display: 'flex', flexDirection: 'column' }}>

      {/* Cover Art */}
      <div style={{ height: 130, background: `linear-gradient(160deg, #1E1A14, #0D0B08)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.8rem', color: 'rgba(201,146,74,0.25)',
          fontWeight: 700, letterSpacing: 2 }}>{initials}</div>
        {/* Status chip */}
        <div style={{ position: 'absolute', top: 10, right: 10,
          background: `${sc.color}22`, border: `1px solid ${sc.color}44`,
          color: sc.color, padding: '2px 8px', fontSize: '0.62rem',
          letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 2 }}>
          {sc.label}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem',
            color: CREAM, fontWeight: 400, lineHeight: 1.3, marginBottom: 3 }}>{title.title}</div>
          <div style={{ fontSize: '0.7rem', color: MUTED, letterSpacing: '0.06em' }}>{title.genre}</div>
        </div>

        {/* Tropes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {title.tropes.map((t, i) => (
            <span key={t} style={{ background: TROPE_COLORS[i % TROPE_COLORS.length],
              color: CREAM, fontSize: '0.62rem', padding: '2px 7px', borderRadius: 2,
              letterSpacing: '0.04em' }}>{t}</span>
          ))}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
          {title.score !== null ? (
            <ScoreBadge score={title.score} />
          ) : (
            <span style={{ fontSize: '0.7rem', color: MUTED }}>
              {title.status === 'processing' ? 'Scoring…' : 'Not scored'}
            </span>
          )}
          {title.episodes && (
            <span style={{ fontSize: '0.7rem', color: CHARCOAL }}>{title.episodes} eps</span>
          )}
        </div>
      </div>
    </div>
  )
}

function TitlesGrid({ onNewManuscript, onOpenTitle }) {
  const [search, setSearch] = useState('')
  const filtered = MOCK_TITLES.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.genre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem',
            color: CREAM, fontWeight: 300, margin: 0, letterSpacing: 1 }}>Manuscripts</h1>
          <p style={{ color: MUTED, fontSize: '0.78rem', margin: '6px 0 0', letterSpacing: '0.04em' }}>
            {MOCK_TITLES.length} titles · {MOCK_TITLES.filter(t => t.score !== null).length} scored
          </p>
        </div>
        <button onClick={onNewManuscript}
          style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '10px 20px',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600, borderRadius: 2,
            transition: 'opacity 0.15s' }}>
          + New Manuscript
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search titles, genres…"
          style={{ background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM,
            padding: '9px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem',
            outline: 'none', width: 280, borderRadius: 2 }} />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {filtered.map(title => (
          <TitleCard key={title.id} title={title} onClick={() => onOpenTitle(title)} />
        ))}
        {/* Add New tile */}
        <div onClick={onNewManuscript}
          style={{ background: 'transparent', border: `1px dashed ${BORDER}`,
            borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', minHeight: 280, gap: 10,
            opacity: 0.6, transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${CHARCOAL}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: CHARCOAL, fontSize: '1.4rem' }}>+</div>
          <span style={{ color: CHARCOAL, fontSize: '0.72rem', letterSpacing: '0.08em',
            textTransform: 'uppercase' }}>Add Manuscript</span>
        </div>
      </div>
    </div>
  )
}

// ─── Import Wizard ────────────────────────────────────────────────────────────
const STEPS = ['Upload', 'Rights', 'Processing', 'Score Report']

const SCORING_DIMENSIONS = [
  // Pillar A
  { key: 'cliffhanger',         pillar: 'A', label: 'Cliffhanger Density',      max: 8, hint: '≥1 per 1,500 words' },
  { key: 'tropeStacking',       pillar: 'A', label: 'Trope Stacking',           max: 7, hint: '3+ proven tropes' },
  { key: 'emotionalEscalation', pillar: 'A', label: 'Emotional Escalation',     max: 6, hint: 'Humiliation → grit → triumph' },
  { key: 'statusReversal',      pillar: 'A', label: 'Status Reversal Potential',max: 6, hint: 'Dismissed → vindicated' },
  { key: 'visualVariety',       pillar: 'A', label: 'Visual Scene Variety',     max: 5, hint: '6+ distinct locations' },
  { key: 'dialogueRatio',       pillar: 'A', label: 'Dialogue-to-Action Ratio', max: 4, hint: 'Action-forward narrative' },
  { key: 'episodeCountFit',     pillar: 'A', label: 'Episode Count Fit',        max: 4, hint: '50–80 episodes target' },
  // Pillar B
  { key: 'audienceAlignment',   pillar: 'B', label: 'Audience Alignment',       max: 5, hint: 'Women 20–35, proven prefs' },
  { key: 'ipClarity',           pillar: 'B', label: 'IP Clarity',               max: 3, hint: 'Sole rights or public domain' },
  { key: 'paywallTrigger',      pillar: 'B', label: 'Paywall Trigger Strength', max: 2, hint: 'Hook at ep 8–12' },
  // Pillar C
  { key: 'characterLoad',       pillar: 'C', label: 'Character Load',           max: 3, hint: '3–5 named = ideal' },
  { key: 'locationCount',       pillar: 'C', label: 'Set / Location Count',     max: 3, hint: '4–8 locations = ideal' },
  { key: 'aiFeasibility',       pillar: 'C', label: 'AI Generation Feasibility',max: 4, hint: 'Contemporary = 4, Fantasy = 1' },
]

const PILLAR_INFO = {
  A: { label: 'Narrative Strength',       max: 40, color: GOLD },
  B: { label: 'Audience & Market Fit',    max: 10, color: BLUE },
  C: { label: 'Production Complexity',    max: 10, color: GREEN },
}

function DimensionRow({ dim, score }) {
  const pct = score !== undefined ? (score / dim.max) * 100 : 0
  const color = pct >= 75 ? GREEN : pct >= 50 ? GOLD : pct >= 25 ? BLUE : RED

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
      borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: CREAM, fontSize: '0.78rem' }}>{dim.label}</div>
        <div style={{ color: MUTED, fontSize: '0.65rem', marginTop: 2 }}>{dim.hint}</div>
      </div>
      {/* Bar */}
      <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2,
          transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ width: 32, textAlign: 'right', fontFamily: 'Cormorant Garamond, serif',
        fontSize: '0.9rem', color, flexShrink: 0 }}>
        {score !== undefined ? `${score}` : '—'}
        <span style={{ color: MUTED, fontSize: '0.65rem' }}>/{dim.max}</span>
      </div>
    </div>
  )
}

function ScoreReport({ title, onClose }) {
  const dims = title.dimensions
  const v = getVerdict(title.score)
  const pillarAScore = title.pillarA
  const pillarBScore = title.pillarB
  const pillarCScore = title.pillarC

  return (
    <div style={{ padding: '0 28px 28px' }}>
      {/* Hero Score */}
      <div style={{ textAlign: 'center', padding: '28px 0 24px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '4rem', color: v.color,
          fontWeight: 700, lineHeight: 1 }}>{title.score}</div>
        <div style={{ color: MUTED, fontSize: '0.7rem', letterSpacing: '0.1em', marginTop: 4 }}>OUT OF 60</div>
        <div style={{ display: 'inline-block', background: v.bg, color: v.color,
          padding: '5px 14px', borderRadius: 2, fontSize: '0.72rem', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginTop: 10, fontWeight: 600 }}>{v.label}</div>
        {title.platform && (
          <div style={{ color: CHARCOAL, fontSize: '0.7rem', marginTop: 8 }}>
            Recommended platform: <span style={{ color: CREAM }}>{title.platform}</span>
          </div>
        )}
      </div>

      {/* Pillar Summary Bars */}
      <div style={{ display: 'flex', gap: 12, padding: '20px 0', borderBottom: `1px solid ${BORDER}` }}>
        {Object.entries(PILLAR_INFO).map(([key, info]) => {
          const ps = key === 'A' ? pillarAScore : key === 'B' ? pillarBScore : pillarCScore
          const pct = ps !== null ? (ps / info.max) * 100 : 0
          return (
            <div key={key} style={{ flex: 1, background: '#1E1A14', border: `1px solid ${BORDER}`,
              borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.62rem', color: MUTED, letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 6 }}>Pillar {key}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
                color: info.color, fontWeight: 700 }}>{ps}<span style={{ color: MUTED, fontSize: '0.8rem' }}>/{info.max}</span></div>
              <div style={{ fontSize: '0.65rem', color: CHARCOAL, marginBottom: 8 }}>{info.label}</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: info.color, borderRadius: 2 }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Dimensions by Pillar */}
      {['A', 'B', 'C'].map(pillar => (
        <div key={pillar} style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.75rem',
              color: PILLAR_INFO[pillar].color, letterSpacing: '0.14em', textTransform: 'uppercase',
              fontWeight: 600 }}>Pillar {pillar} — {PILLAR_INFO[pillar].label}</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>
          {SCORING_DIMENSIONS.filter(d => d.pillar === pillar).map(dim => (
            <DimensionRow key={dim.key} dim={dim} score={dims?.[dim.key]} />
          ))}
        </div>
      ))}

      {/* Threshold Guide */}
      <div style={{ marginTop: 24, padding: 16, background: '#1A1810',
        border: `1px solid ${BORDER}`, borderRadius: 4 }}>
        <div style={{ fontSize: '0.65rem', color: MUTED, letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 10 }}>Score Thresholds (v2.2)</div>
        {[
          { range: '48–60', label: 'Greenlight', color: GREEN, desc: 'Immediate pipeline' },
          { range: '36–47', label: 'Develop',    color: GOLD,  desc: 'Trope injection / restructure' },
          { range: '24–35', label: 'Conditional',color: BLUE,  desc: 'Evaluate cost vs. narrative' },
          { range: '<24',   label: 'Pass',        color: RED,   desc: 'Not suited for micro-drama' },
        ].map(t => (
          <div key={t.range} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
            <span style={{ width: 36, color: t.color, fontSize: '0.7rem', fontWeight: 600 }}>{t.range}</span>
            <span style={{ width: 70, color: t.color, fontSize: '0.68rem', letterSpacing: '0.06em',
              textTransform: 'uppercase' }}>{t.label}</span>
            <span style={{ color: CHARCOAL, fontSize: '0.68rem' }}>{t.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={onClose}
          style={{ flex: 1, background: GOLD, border: 'none', color: '#1A1810', padding: '11px',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', borderRadius: 2 }}>
          Open in Writers Room →
        </button>
        <button onClick={onClose}
          style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL,
            padding: '11px 18px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
            cursor: 'pointer', borderRadius: 2 }}>
          Close
        </button>
      </div>
    </div>
  )
}

// ─── Import Wizard ────────────────────────────────────────────────────────────
function ImportWizard({ onClose, onComplete }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', version: '1', language: 'English', url: '',
    fee: '', royaltyRate: '', signDate: '', publicDomain: false,
  })
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState(0)
  const [done, setDone] = useState(false)

  const PROCESSING_STAGES = [
    'Uploading manuscript…',
    'Extracting text & structure…',
    'Identifying narrative dimensions…',
    'Scoring all 13 dimensions (v2.2)…',
    'Generating score report…',
    'Complete',
  ]

  const MOCK_RESULT = {
    id: 99, title: form.name || 'Untitled', genre: 'CEO Romance',
    tropes: ['Billionaire', 'Hidden Identity', 'Forced Proximity'],
    status: 'complete', episodes: 62, score: 49, platform: 'Cross-Platform',
    version: parseInt(form.version), language: form.language,
    agreement: !!form.signDate || form.publicDomain, created: new Date().toISOString().split('T')[0],
    pillarA: 34, pillarB: 9, pillarC: 6,
    dimensions: {
      cliffhanger: 7, tropeStacking: 6, emotionalEscalation: 6, statusReversal: 5,
      visualVariety: 4, dialogueRatio: 3, episodeCountFit: 3,
      audienceAlignment: 4, ipClarity: 3, paywallTrigger: 2,
      characterLoad: 2, locationCount: 2, aiFeasibility: 2
    }
  }

  function handleFileDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer?.files[0] || e.target.files[0]
    if (f) { setFile(f); setForm(fm => ({ ...fm, name: f.name.replace(/\.[^.]+$/, '') })) }
  }

  async function handleBeginProcessing() {
    setProcessing(true)
    for (let i = 0; i < PROCESSING_STAGES.length; i++) {
      await new Promise(r => setTimeout(r, 950))
      setProcessingStage(i)
    }
    setDone(true)
  }

  const lbl = { display: 'block', fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.12em',
    textTransform: 'uppercase', marginBottom: 6 }
  const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM,
    padding: '10px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.83rem',
    outline: 'none', boxSizing: 'border-box', borderRadius: 2 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, width: 640,
        maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', borderRadius: 4 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.55rem',
              color: CREAM, fontWeight: 300, margin: 0 }}>Import Manuscript</h2>
            <p style={{ color: MUTED, fontSize: '0.7rem', margin: '4px 0 0', letterSpacing: '0.04em' }}>
              AI-powered 4-step scoring pipeline · v2.2
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none',
            color: MUTED, cursor: 'pointer', fontSize: '1.2rem', padding: 4 }}>✕</button>
        </div>

        {/* Step Indicators */}
        <div style={{ padding: '14px 28px', borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center',
              flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: i < step ? GREEN : i === step ? GOLD : 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', color: i <= step ? '#1A1810' : CHARCOAL, fontWeight: 700 }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.72rem', color: i === step ? CREAM : MUTED,
                  letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? GREEN : BORDER,
                  margin: '0 12px', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div style={{ padding: '24px 28px' }}>

          {/* STEP 1 — Upload */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Drop Zone */}
              <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop}
                style={{ border: `1px dashed ${dragOver ? GOLD : BORDER}`, borderRadius: 4,
                  padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? 'rgba(201,146,74,0.05)' : 'transparent', transition: 'all 0.2s' }}
                onClick={() => document.getElementById('ms-file-input').click()}>
                <input id="ms-file-input" type="file" accept=".pdf,.doc,.docx,.txt,.epub"
                  style={{ display: 'none' }} onChange={handleFileDrop} />
                {file ? (
                  <div>
                    <div style={{ color: GREEN, fontSize: '1.3rem', marginBottom: 6 }}>✓</div>
                    <div style={{ color: CREAM, fontSize: '0.83rem' }}>{file.name}</div>
                    <div style={{ color: MUTED, fontSize: '0.7rem', marginTop: 3 }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: CHARCOAL, fontSize: '1.8rem', marginBottom: 8 }}>↑</div>
                    <div style={{ color: CREAM, fontSize: '0.83rem', marginBottom: 4 }}>Drop manuscript file or click to browse</div>
                    <div style={{ color: MUTED, fontSize: '0.68rem' }}>PDF · DOCX · TXT · EPUB · max 50 MB</div>
                  </div>
                )}
              </div>

              <div>
                <label style={lbl}>Manuscript Name</label>
                <input style={inp} value={form.name} placeholder="Title of the work"
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Version</label>
                  <input style={inp} value={form.version} type="number" min="1"
                    onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={lbl}>Original Language</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Chinese'].map(l => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>Source URL (optional)</label>
                <input style={inp} value={form.url} placeholder="e.g. Project Gutenberg link"
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              </div>

              <button onClick={() => setStep(1)} disabled={!form.name}
                style={{ background: form.name ? GOLD : 'rgba(201,146,74,0.3)', border: 'none',
                  color: form.name ? '#1A1810' : MUTED, padding: '12px', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontWeight: 700, cursor: form.name ? 'pointer' : 'not-allowed', borderRadius: 2 }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 2 — Rights */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                padding: '12px 14px', border: `1px solid ${form.publicDomain ? GREEN : BORDER}`,
                borderRadius: 4, background: form.publicDomain ? 'rgba(74,156,122,0.08)' : 'transparent',
                transition: 'all 0.2s' }}>
                <input type="checkbox" checked={form.publicDomain}
                  onChange={e => setForm(f => ({ ...f, publicDomain: e.target.checked }))}
                  style={{ accentColor: GREEN }} />
                <div>
                  <div style={{ color: CREAM, fontSize: '0.83rem' }}>Public domain / royalty-free</div>
                  <div style={{ color: MUTED, fontSize: '0.7rem', marginTop: 2 }}>
                    Skip rights fields — auto-scores IP Clarity: 3
                  </div>
                </div>
              </label>

              {!form.publicDomain && (
                <>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <label style={lbl}>One-time Licensing Fee ($)</label>
                      <input style={inp} value={form.fee} type="number" placeholder="0.00"
                        onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={lbl}>Royalty Rate (%)</label>
                      <input style={inp} value={form.royaltyRate} type="number" placeholder="0–100"
                        onChange={e => setForm(f => ({ ...f, royaltyRate: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>Agreement Sign Date</label>
                    <input style={inp} value={form.signDate} type="date"
                      onChange={e => setForm(f => ({ ...f, signDate: e.target.value }))} />
                  </div>

                  <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 4, padding: '18px',
                    textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ color: CHARCOAL, fontSize: '0.78rem' }}>Drop signed agreement PDF</div>
                    <div style={{ color: MUTED, fontSize: '0.68rem', marginTop: 4 }}>PDF · max 10 MB</div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setStep(0)}
                  style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL,
                    padding: '11px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
                    cursor: 'pointer', borderRadius: 2 }}>← Back</button>
                <button onClick={() => setStep(2)}
                  style={{ flex: 1, background: GOLD, border: 'none', color: '#1A1810',
                    padding: '11px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
                    letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                    cursor: 'pointer', borderRadius: 2 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Processing */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Confirm Summary */}
              {!processing && (
                <div style={{ background: '#1A1810', border: `1px solid ${BORDER}`,
                  borderRadius: 4, padding: 16 }}>
                  <div style={{ fontSize: '0.65rem', color: MUTED, letterSpacing: '0.1em',
                    textTransform: 'uppercase', marginBottom: 12 }}>Confirm Details</div>
                  {[
                    ['Title', form.name],
                    ['Version', `v${form.version}`],
                    ['Language', form.language],
                    ['Rights', form.publicDomain ? 'Public Domain' : form.signDate ? `Agreement signed ${form.signDate}` : 'Agreement pending'],
                    ['Source URL', form.url || '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 10, padding: '5px 0',
                      borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ width: 90, color: MUTED, fontSize: '0.72rem', flexShrink: 0 }}>{k}</span>
                      <span style={{ color: CREAM, fontSize: '0.78rem' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pipeline Info */}
              {!processing && (
                <div style={{ background: '#1A1810', border: `1px solid ${BORDER}`, borderRadius: 4, padding: 16 }}>
                  <div style={{ fontSize: '0.65rem', color: MUTED, letterSpacing: '0.1em',
                    textTransform: 'uppercase', marginBottom: 10 }}>AI Scoring Pipeline (v2.2)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      ['Pillar A', '7 dimensions · Narrative Strength · /40'],
                      ['Pillar B', '3 dimensions · Market Fit · /10'],
                      ['Pillar C', '3 dimensions · Prod. Complexity · /10'],
                      ['Total', '13 dimensions · Max score 60'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: '8px 10px', background: '#111009', borderRadius: 2 }}>
                        <div style={{ color: GOLD, fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em' }}>{k}</div>
                        <div style={{ color: CHARCOAL, fontSize: '0.65rem', marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Animation */}
              {processing && (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  {PROCESSING_STAGES.map((stage, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 0', opacity: i <= processingStage ? 1 : 0.25,
                      transition: 'opacity 0.4s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: i < processingStage ? GREEN : i === processingStage ? GOLD : 'transparent',
                        border: `1px solid ${i < processingStage ? GREEN : i === processingStage ? GOLD : BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', color: '#1A1810' }}>
                        {i < processingStage ? '✓' : i === processingStage && !done ? '·' : i < PROCESSING_STAGES.length - 1 ? '' : done ? '✓' : ''}
                      </div>
                      <span style={{ color: i === processingStage ? CREAM : MUTED, fontSize: '0.78rem',
                        textAlign: 'left' }}>{stage}</span>
                    </div>
                  ))}

                  {/* Progress bar */}
                  {!done && (
                    <div style={{ marginTop: 16, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ width: `${(processingStage / (PROCESSING_STAGES.length - 1)) * 100}%`,
                        height: '100%', background: GOLD, borderRadius: 2, transition: 'width 0.6s ease' }} />
                    </div>
                  )}

                  {done && (
                    <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(74,156,122,0.12)',
                      border: `1px solid rgba(74,156,122,0.3)`, borderRadius: 4, textAlign: 'left' }}>
                      <div style={{ color: GREEN, fontSize: '0.83rem', fontWeight: 600 }}>
                        ✓ Processing complete
                      </div>
                      <div style={{ color: CHARCOAL, fontSize: '0.72rem', marginTop: 4 }}>
                        62 episodes identified · Adaptation Score: <span style={{ color: GREEN }}>49/60 — Greenlight</span>
                      </div>
                      <button onClick={() => setStep(3)}
                        style={{ marginTop: 12, background: GOLD, border: 'none', color: '#1A1810',
                          padding: '9px 18px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem',
                          letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                          cursor: 'pointer', borderRadius: 2 }}>View Score Report →</button>
                    </div>
                  )}
                </div>
              )}

              {!processing && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(1)}
                    style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL,
                      padding: '11px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
                      cursor: 'pointer', borderRadius: 2 }}>← Back</button>
                  <button onClick={handleBeginProcessing}
                    style={{ flex: 1, background: GOLD, border: 'none', color: '#1A1810',
                      padding: '11px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
                      letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                      cursor: 'pointer', borderRadius: 2 }}>Begin AI Processing →</button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Score Report */}
          {step === 3 && (
            <ScoreReport title={MOCK_RESULT} onClose={() => { onComplete(MOCK_RESULT); onClose() }} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Title Detail Drawer ──────────────────────────────────────────────────────
function TitleDetailDrawer({ title, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, width: 620,
        maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', borderRadius: 4 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ background: STATUS_CONFIG[title.status]?.color + '22',
                border: `1px solid ${STATUS_CONFIG[title.status]?.color}44`,
                color: STATUS_CONFIG[title.status]?.color, padding: '2px 8px',
                fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 2 }}>
                {STATUS_CONFIG[title.status]?.label}
              </span>
              {title.platform && (
                <span style={{ color: CHARCOAL, fontSize: '0.68rem' }}>{title.platform}</span>
              )}
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem',
              color: CREAM, fontWeight: 300, margin: 0 }}>{title.title}</h2>
            <p style={{ color: MUTED, fontSize: '0.72rem', margin: '4px 0 0' }}>
              {title.genre} · v{title.version} · {title.language}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none',
            color: MUTED, cursor: 'pointer', fontSize: '1.2rem', padding: 4 }}>✕</button>
        </div>

        {title.score !== null ? (
          <ScoreReport title={title} onClose={onClose} />
        ) : (
          <div style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ color: MUTED, fontSize: '0.83rem', marginBottom: 20 }}>
              {title.status === 'error'
                ? 'Processing failed. Please retry or re-import this manuscript.'
                : 'This manuscript has not been scored yet.'}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={onClose}
                style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '10px 20px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', borderRadius: 2 }}>
                {title.status === 'error' ? 'Retry Processing' : 'Run Scoring'}
              </button>
              <button onClick={onClose}
                style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL,
                  padding: '10px 18px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
                  cursor: 'pointer', borderRadius: 2 }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function Manuscript() {
  const [showWizard, setShowWizard] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [titles, setTitles] = useState(MOCK_TITLES)

  function handleComplete(newTitle) {
    setTitles(t => [newTitle, ...t])
  }

  return (
    <div style={{ minHeight: '100vh', background: SURFACE2,
      fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      <TitlesGrid
        onNewManuscript={() => setShowWizard(true)}
        onOpenTitle={title => setSelectedTitle(title)}
      />

      {showWizard && (
        <ImportWizard
          onClose={() => setShowWizard(false)}
          onComplete={(t) => { handleComplete(t); setShowWizard(false) }}
        />
      )}

      {selectedTitle && (
        <TitleDetailDrawer
          title={selectedTitle}
          onClose={() => setSelectedTitle(null)}
        />
      )}
    </div>
  )
}
