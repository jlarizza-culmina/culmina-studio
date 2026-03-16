import { useState, useEffect } from 'react'

const GOLD  = '#C9924A'
const CREAM = '#F7F2E8'
const GREEN = '#4A9C7A'
const RED   = '#C87A4A'
const MUTED = '#6A6560'
const BORDER = 'rgba(201,146,74,0.12)'
const SURFACE = '#1A1810'
const PANEL = '#12110D'

// Verdict → visual config
const VERDICT_CONFIG = {
  'Greenlight': { color: GREEN,  bg: 'rgba(74,156,122,0.12)',  icon: '✦', label: 'GO' },
  'Develop':    { color: GOLD,   bg: 'rgba(201,146,74,0.12)',  icon: '◈', label: 'DEVELOP' },
  'Conditional':{ color: '#7A9EC8', bg: 'rgba(122,158,200,0.12)', icon: '◎', label: 'CONDITIONAL' },
  'Pass':       { color: RED,    bg: 'rgba(200,122,74,0.12)',  icon: '✕', label: 'PASS' },
}

export default function ProductionReadinessReport({ title }) {
  const [report,   setReport]   = useState(null)   // parsed JSON report
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [generated,setGenerated]= useState(null)   // ISO timestamp

  // Auto-generate if score exists and no report yet
  const hasScore = title?.score !== null && title?.score !== undefined

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const verdictCfg = VERDICT_CONFIG[title.verdict] || VERDICT_CONFIG['Pass']
      const prompt = `You are Culmina AI Drama Studio's Production Readiness Analyst. Evaluate this manuscript for micro-drama production viability.

Return ONLY valid JSON — no markdown, no preamble, no backticks.

MANUSCRIPT DATA:
Title: ${title.title}
Genre: ${title.genre || 'Unknown'}
Score: ${title.score}/100
Verdict: ${title.verdict || 'Unknown'}
Platform: ${title.platform || 'Not specified'}
Recommended Episodes: ${title.episodes || 'Not specified'}
Pillar A - Narrative Strength: ${title.pillarA ?? 'N/A'}
Pillar B - Audience & Market Fit: ${title.pillarB ?? 'N/A'}
Pillar C - Production Complexity: ${title.pillarC ?? 'N/A'}
Summary: ${(title.summary || '').slice(0, 500)}

Return this exact JSON:
{
  "verdict": "GO" | "DEVELOP" | "CONDITIONAL" | "PASS",
  "headline": "One punchy sentence — the single most important thing to know about this title's production viability",
  "strengths": [
    "Strength 1 — specific to micro-drama production",
    "Strength 2",
    "Strength 3"
  ],
  "risks": [
    "Risk 1 — specific production challenge",
    "Risk 2",
    "Risk 3"
  ],
  "episodeRange": "e.g. 45–55 episodes",
  "platform": "ReelShort" | "DramaBox" | "Both" | "TikTok Series",
  "platformRationale": "One sentence explaining platform fit",
  "nextStep": "The single most important next action — specific and actionable",
  "productionNotes": "2-3 sentences on key production considerations for the AI pipeline"
}`

      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map(b => b.text || '').join('') || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setReport(parsed)
      setGenerated(new Date().toISOString())
    } catch (e) {
      setError('Report generation failed: ' + e.message)
    }
    setLoading(false)
  }

  if (!hasScore) return null

  const verdictCfg = report
    ? (VERDICT_CONFIG[report.verdict === 'GO' ? 'Greenlight' : report.verdict] || VERDICT_CONFIG['Pass'])
    : null

  return (
    <div style={{ marginTop: '24px', borderTop: `1px solid ${BORDER}`, paddingTop: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>
            Production Readiness Report
          </div>
          {generated && (
            <div style={{ fontSize: '0.62rem', color: MUTED }}>
              Generated {new Date(generated).toLocaleString()}
            </div>
          )}
        </div>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            padding: '7px 16px', borderRadius: '6px', border: 'none',
            background: loading ? 'rgba(201,146,74,0.4)' : GOLD,
            color: SURFACE, fontSize: '0.75rem', fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          {loading ? <>⟳ Analyzing…</> : report ? '↺ Re-generate' : '✦ Generate Report'}
        </button>
      </div>

      {error && (
        <div style={{ color: RED, fontSize: '0.78rem', padding: '10px', background: 'rgba(200,122,74,0.1)', borderRadius: '6px', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {!report && !loading && (
        <div style={{ color: MUTED, fontSize: '0.82rem', padding: '20px', textAlign: 'center', background: PANEL, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
          Click <strong style={{ color: GOLD }}>Generate Report</strong> for a Go/No-Go production readiness analysis.
        </div>
      )}

      {loading && (
        <div style={{ color: MUTED, fontSize: '0.82rem', padding: '20px', textAlign: 'center', background: PANEL, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
          Analyzing manuscript for production viability…
        </div>
      )}

      {report && verdictCfg && (
        <div>
          {/* Verdict banner */}
          <div style={{
            background: verdictCfg.bg, border: `1px solid ${verdictCfg.color}44`,
            borderRadius: '10px', padding: '18px 20px', marginBottom: '16px',
            display: 'flex', alignItems: 'flex-start', gap: '16px',
          }}>
            <div style={{
              fontSize: '1.5rem', color: verdictCfg.color, fontWeight: 700,
              fontFamily: 'Cormorant Garamond, serif', flexShrink: 0, lineHeight: 1,
              minWidth: '90px',
            }}>
              {verdictCfg.icon} {report.verdict}
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', color: CREAM, fontWeight: 500, lineHeight: 1.4, marginBottom: '6px' }}>
                {report.headline}
              </div>
              <div style={{ fontSize: '0.75rem', color: MUTED }}>
                {report.episodeRange && <span style={{ marginRight: '16px' }}>📺 {report.episodeRange}</span>}
                {report.platform && <span>📡 {report.platform}</span>}
              </div>
            </div>
          </div>

          {/* Strengths + Risks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '0.68rem', color: GREEN, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '10px' }}>
                Top Strengths
              </div>
              {(report.strengths || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px', fontSize: '0.78rem', color: CREAM, lineHeight: 1.45 }}>
                  <span style={{ color: GREEN, flexShrink: 0, fontWeight: 700 }}>✓</span>
                  {s}
                </div>
              ))}
            </div>
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '0.68rem', color: RED, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '10px' }}>
                Production Risks
              </div>
              {(report.risks || []).map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px', fontSize: '0.78rem', color: CREAM, lineHeight: 1.45 }}>
                  <span style={{ color: RED, flexShrink: 0, fontWeight: 700 }}>!</span>
                  {r}
                </div>
              ))}
            </div>
          </div>

          {/* Platform fit */}
          {report.platformRationale && (
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.68rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Platform Fit</div>
              <div style={{ fontSize: '0.78rem', color: CREAM }}>{report.platformRationale}</div>
            </div>
          )}

          {/* Production notes */}
          {report.productionNotes && (
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.68rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Production Notes</div>
              <div style={{ fontSize: '0.78rem', color: CREAM, lineHeight: 1.55 }}>{report.productionNotes}</div>
            </div>
          )}

          {/* Next step CTA */}
          {report.nextStep && (
            <div style={{
              background: `rgba(201,146,74,0.08)`, border: `1px solid ${GOLD}44`,
              borderRadius: '8px', padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <span style={{ color: GOLD, fontSize: '0.9rem', flexShrink: 0 }}>→</span>
              <div>
                <div style={{ fontSize: '0.68rem', color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', fontWeight: 700 }}>Next Step</div>
                <div style={{ fontSize: '0.82rem', color: CREAM }}>{report.nextStep}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
