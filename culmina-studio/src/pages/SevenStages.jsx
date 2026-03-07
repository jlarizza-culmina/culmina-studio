import { useState } from 'react'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'

const STAGES = [
  {
    num: '01',
    title: 'Development',
    icon: '📄',
    overview: 'The foundation of every production. Development covers acquiring rights to source material, evaluating project viability, defining the creative vision, and preparing the story for adaptation.',
    activities: [
      'Identify and acquire source IP or original concept',
      'Evaluate commercial viability and target audience',
      'Define the narrative arc and episode structure',
      'Negotiate author agreements and rights',
      'Create the initial story bible',
    ],
    modules: [{ name: 'Manuscript Import', path: '/manuscript', desc: 'Import and AI-process your source material' }, { name: 'Development', path: '/development', desc: 'Build your production hierarchy' }],
  },
  {
    num: '02',
    title: 'Financing',
    icon: '💰',
    overview: 'Securing the financial foundation for your production. This stage covers budgeting, investment planning, cost modeling across AI and hybrid production approaches, and royalty structures.',
    activities: [
      'Build a production budget (AI-only vs hybrid)',
      'Model revenue projections by platform',
      'Structure author royalty agreements',
      'Plan cash flow across production phases',
      'Identify distribution revenue streams',
    ],
    modules: [{ name: 'Finances', path: '/finances', desc: 'Budget, expenses, revenue, and royalties' }],
  },
  {
    num: '03',
    title: 'Pre-Production',
    icon: '🎨',
    overview: 'The planning phase that sets up every aspect of production for success. Characters are designed, sets are described, scripts are structured, and all creative assets are prepared before a single frame is generated.',
    activities: [
      'Create character reference sheets and visual descriptions',
      'Design set environments and color palettes',
      'Write episode scripts and shot-level prompts',
      'Assign AI voices to characters',
      'Define lighting and cinematography style',
    ],
    modules: [{ name: 'Asset Creator', path: '/assets', desc: 'Build your character and set library' }, { name: 'Development', path: '/development', desc: 'Script episodes down to shot level' }],
  },
  {
    num: '04',
    title: 'Production',
    icon: '🎬',
    overview: 'Generating the actual video content using AI models. Shot prompts are sent to Veo, Sora, or Runway, takes are reviewed and approved, and shots are assembled into episodes.',
    activities: [
      'Submit shot prompts to AI video models',
      'Review and approve generated takes',
      'Reject and re-queue failed or off-spec takes',
      'Assemble approved shots into episode timelines',
      'Export assembled episodes to Post Production',
    ],
    modules: [{ name: 'Production Studio', path: '/production', desc: 'Generate takes and assemble episodes' }],
  },
  {
    num: '05',
    title: 'Post-Production',
    icon: '🎵',
    overview: 'Polishing the assembled episodes into distribution-ready content. Voice tracks are assigned, closed captions are generated and edited, and final episodes are exported to Cloudflare R2.',
    activities: [
      'Assign AI voice actors per shot',
      'Auto-generate and edit closed captions',
      'Review pacing and shot transitions',
      'Export in platform-specific formats (MP4, MOV)',
      'Upload to Cloudflare R2 distribution bucket',
    ],
    modules: [{ name: 'Post Production', path: '/post', desc: 'Voice, captions, and final export' }],
  },
  {
    num: '06',
    title: 'Marketing',
    icon: '📣',
    overview: 'Building awareness for your micro-drama series before and after launch. This stage covers content strategy, platform-specific promotional tactics, creator outreach, and audience growth.',
    activities: [
      'Create short-form teaser clips for TikTok and Reels',
      'Build a release cadence strategy per platform',
      'Develop series thumbnail and cover art',
      'Engage micro-drama communities and book clubs',
      'Run paid promotion on target platforms',
    ],
    modules: [],
    note: 'Marketing tools are planned for a future release of Culmina.',
  },
  {
    num: '07',
    title: 'Distribution',
    icon: '🌍',
    overview: 'Getting your series in front of audiences on the right platforms. Culmina supports release management across ReelShort, TikTok, YouTube, Tubi, and Pluto TV with integrated KPI tracking.',
    activities: [
      'Configure platform credentials and channel settings',
      'Schedule episode releases across platforms',
      'Track views, revenue, and engagement per platform',
      'Manage royalty payouts to authors',
      'Optimize release strategy based on performance data',
    ],
    modules: [{ name: 'Distribution', path: '/distribution', desc: 'Platform management and release tracking' }],
  },
]

export default function SevenStages() {
  const [active, setActive] = useState(0)
  const [viewed, setViewed] = useState(new Set([0]))
  const stage = STAGES[active]

  function goTo(i) {
    setActive(i)
    setViewed(v => new Set([...v, i]))
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM, display: 'flex', gap: '0', minHeight: '70vh' }}>
      {/* Left nav */}
      <div style={{ width: '220px', flexShrink: 0, borderRight: `1px solid ${BORDER}`, marginRight: '40px', paddingRight: '0' }}>
        <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>The 7 Stages</div>
        {STAGES.map((s, i) => (
          <button key={s.num} onClick={() => goTo(i)}
            style={{ width: '100%', background: 'none', border: 'none', borderLeft: active === i ? `2px solid ${GOLD}` : '2px solid transparent', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: active === i ? GOLD : CHARCOAL, fontWeight: 300, minWidth: '24px' }}>{s.num}</span>
            <span style={{ fontSize: '0.8rem', color: active === i ? CREAM : CHARCOAL, flex: 1 }}>{s.title}</span>
            {viewed.has(i) && <span style={{ fontSize: '0.6rem', color: active === i ? GOLD : 'rgba(201,146,74,0.4)' }}>✓</span>}
          </button>
        ))}
        <div style={{ marginTop: '20px', padding: '12px 16px', background: SURFACE2, border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Progress</div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
            <div style={{ height: '100%', background: GOLD, borderRadius: '2px', width: `${(viewed.size / 7) * 100}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: CHARCOAL, marginTop: '6px' }}>{viewed.size} of 7 viewed</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', color: 'rgba(201,146,74,0.2)', fontWeight: 300, lineHeight: 1 }}>{stage.num}</div>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', color: CREAM, margin: '0 0 6px', fontWeight: 300 }}>{stage.title}</h1>
            <div style={{ fontSize: '0.72rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Stage {parseInt(stage.num)} of 7</div>
          </div>
        </div>

        <p style={{ fontSize: '0.92rem', color: MUTED, lineHeight: 1.75, marginBottom: '32px', maxWidth: '680px' }}>{stage.overview}</p>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Key Activities</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stage.activities.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(201,146,74,0.1)', border: `1px solid rgba(201,146,74,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: GOLD, flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                <span style={{ fontSize: '0.85rem', color: CREAM, lineHeight: 1.5 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Culmina Modules for This Stage</div>
          {stage.modules.length > 0 ? (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {stage.modules.map(m => (
                <a key={m.name} href={m.path}
                  style={{ background: SURFACE2, border: `1px solid rgba(201,146,74,0.2)`, padding: '14px 18px', textDecoration: 'none', display: 'block', minWidth: '180px', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,146,74,0.2)'}>
                  <div style={{ fontSize: '0.85rem', color: GOLD, marginBottom: '4px' }}>{m.name} →</div>
                  <div style={{ fontSize: '0.72rem', color: CHARCOAL }}>{m.desc}</div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ padding: '16px', background: SURFACE2, border: `1px solid ${BORDER}`, fontSize: '0.82rem', color: CHARCOAL }}>
              {stage.note || 'No linked module in this release.'}
            </div>
          )}
        </div>

        {/* Prev / Next */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '24px', borderTop: `1px solid ${BORDER}` }}>
          <button onClick={() => active > 0 && goTo(active - 1)} disabled={active === 0}
            style={{ background: 'none', border: `1px solid ${BORDER}`, color: active === 0 ? CHARCOAL : CREAM, padding: '9px 20px', cursor: active === 0 ? 'default' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', opacity: active === 0 ? 0.4 : 1 }}>
            ← Previous
          </button>
          <button onClick={() => active < 6 && goTo(active + 1)} disabled={active === 6}
            style={{ background: active === 6 ? 'none' : GOLD, border: `1px solid ${active === 6 ? BORDER : 'transparent'}`, color: active === 6 ? CHARCOAL : '#1A1810', padding: '9px 24px', cursor: active === 6 ? 'default' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', fontWeight: active === 6 ? 400 : 500, opacity: active === 6 ? 0.4 : 1 }}>
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
