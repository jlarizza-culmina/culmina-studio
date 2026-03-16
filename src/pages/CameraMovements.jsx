import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GOLD     = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM    = '#F7F2E8'
const SURFACE2 = '#111009'
const BORDER   = 'rgba(201,146,74,0.12)'
const MUTED    = '#6A6560'
const BLUE     = '#7A9EC8'
const GREEN    = '#4A9C7A'

const SOURCE_COLORS = { runway: GOLD, veo: GREEN, both: CHARCOAL }
const SOURCE_LABELS = { runway: 'Runway', veo: 'Veo', both: 'Runway + Veo' }

const SECTIONS = [
  { label: 'Rotational',   keys: ['pan_left','pan_right','tilt_up','tilt_down','whip_pan','roll'] },
  { label: 'Physical',     keys: ['dolly_in','dolly_out','truck_left','truck_right','crane_up','crane_down','horizontal','vertical'] },
  { label: 'Optical',      keys: ['zoom_in','zoom_out'] },
  { label: 'Specialized',  keys: ['static','handheld','tracking','arc','aerial','fpv'] },
]

export default function CameraMovements() {
  const [movements, setMovements] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('camera_movements')
      .select('*')
      .eq('activestatus', 'A')
      .order('sortorder')
      .then(({ data }) => { setMovements(data || []); setLoading(false) })
  }, [])

  const byValue = {}
  movements.forEach(m => { byValue[m.nvvalue] = m })

  // Group movements by section, fallback to flat list if DB values differ
  const getSectionItems = (keys) => keys.map(k => byValue[k]).filter(Boolean)
  const allSectionKeys = SECTIONS.flatMap(s => s.keys)
  const ungrouped = movements.filter(m => !allSectionKeys.includes(m.nvvalue))

  const numStr = (n) => String(n).padStart(2, '0')

  return (
    <div style={{
      background: SURFACE2, minHeight: '100vh', color: CREAM,
      fontFamily: "'DM Sans', sans-serif", padding: '40px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 600, color: CREAM, margin: '0 0 6px' }}>
          Camera Movements
        </h1>
        <p style={{ fontSize: '0.82rem', color: MUTED, margin: '0 0 16px' }}>
          Reference guide to the {movements.length} camera movements used in Culmina AI Drama Studio.
        </p>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {Object.entries(SOURCE_LABELS).map(([k, l]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SOURCE_COLORS[k], flexShrink: 0 }} />
              <span style={{ color: MUTED }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: MUTED, fontSize: '0.85rem' }}>Loading…</div>
      ) : (
        <>
          {SECTIONS.map(section => {
            const items = getSectionItems(section.keys)
            if (!items.length) return null
            return (
              <div key={section.label} style={{ marginBottom: '32px' }}>
                <div style={{
                  fontSize: '0.68rem', color: MUTED, textTransform: 'uppercase',
                  letterSpacing: '0.12em', fontWeight: 600, marginBottom: '14px',
                  paddingBottom: '8px', borderBottom: `1px solid ${BORDER}`,
                }}>
                  {section.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                  {items.map(m => <MovementCard key={m.movementid} m={m} />)}
                </div>
              </div>
            )
          })}

          {/* Any DB entries not in sections */}
          {ungrouped.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '0.68rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '14px', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}` }}>
                Other
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                {ungrouped.map(m => <MovementCard key={m.movementid} m={m} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MovementCard({ m }) {
  const SOURCE_COLORS = { runway: GOLD, veo: GREEN, both: CHARCOAL }
  const SOURCE_LABELS = { runway: 'Runway', veo: 'Veo', both: 'Runway + Veo' }
  const srcColor = SOURCE_COLORS[m.source] || MUTED
  const srcLabel = SOURCE_LABELS[m.source] || m.source

  return (
    <div style={{
      background: '#0E0D0A',
      border: `1px solid ${BORDER}`,
      borderRadius: '8px',
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: MUTED, letterSpacing: '0.1em', marginBottom: '3px' }}>
            {String(m.sortorder).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: CREAM, marginBottom: '2px' }}>
            {m.name}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: MUTED }}>
            {m.nvvalue}
          </div>
        </div>
        <div style={{
          fontSize: '0.62rem', fontWeight: 600, color: srcColor,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '2px 8px', borderRadius: '3px',
          border: `1px solid ${srcColor}33`,
          flexShrink: 0, marginTop: '2px',
        }}>
          {srcLabel}
        </div>
      </div>

      {m.description && (
        <p style={{ fontSize: '0.78rem', color: '#8A8580', lineHeight: 1.55, margin: '0 0 10px' }}>
          {m.description}
        </p>
      )}

      {m.promptsnippet && (
        <div style={{
          fontFamily: 'monospace', fontSize: '0.68rem', color: '#7A9060',
          background: '#0A0908', border: `1px solid ${BORDER}`,
          borderRadius: '4px', padding: '6px 10px', lineHeight: 1.4,
        }}>
          {m.promptsnippet}
        </div>
      )}
    </div>
  )
}
