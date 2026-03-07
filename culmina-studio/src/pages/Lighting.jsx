const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'

const LIGHTING_TYPES = [
  {
    num: 1,
    name: 'Natural Lighting',
    value: 'natural',
    description: 'Refers to the use and modification of light available at the location where filming occurs. One of the most used techniques in the industry today. Relies on sunlight, moonlight, or ambient environmental light.',
    mood: 'Authentic, grounded, realistic',
    use: 'Documentaries, outdoor scenes, day-in-the-life drama',
  },
  {
    num: 2,
    name: 'Key Lighting',
    value: 'key',
    description: 'The primary and most intense lighting source for main scenes. Illuminates the form of the main actor. Placed close to camera to avoid flat, featureless light. Always the primary source in three-point lighting setup.',
    mood: 'Focused, dramatic, clear',
    use: 'Interviews, hero shots, dialogue scenes',
  },
  {
    num: 3,
    name: 'High Key Lighting',
    value: 'highkey',
    description: 'Reduces the lighting ratio in the scene. Dominated by white tones from bright lights with minimal shadows. Conveys hopeful or optimistic mood. Often used in pop music videos and upbeat content.',
    mood: 'Hopeful, cheerful, optimistic',
    use: 'Comedy, romance, musical sequences',
  },
  {
    num: 4,
    name: 'Low Key Lighting',
    value: 'lowkey',
    description: 'Uses hard light sources to encase scenes in shadow. Creates strong contrast and blackness. Used in noir, thriller, and ominous scenes to draw attention to specific subjects.',
    mood: 'Ominous, mysterious, tense',
    use: 'Thriller, noir, horror, villain scenes',
  },
  {
    num: 5,
    name: 'Fill Lighting',
    value: 'fill',
    description: 'Cancels out shadows created by the key light. Always placed on the opposite side of the key light. Softer than key light; does not create its own shadows.',
    mood: 'Balanced, natural, even',
    use: 'Standard dialogue, product shots, balanced portraits',
  },
  {
    num: 6,
    name: 'Back Lighting',
    value: 'back',
    description: 'Placed behind the subject at an elevated angle. Separates characters from the background, giving depth and three-dimensionality. The sun is a natural backlight source.',
    mood: 'Ethereal, dramatic, dimensional',
    use: 'Silhouettes, separation shots, romantic scenes',
  },
  {
    num: 7,
    name: 'Three-Point Lighting',
    value: 'threepoint',
    description: 'The industry-standard method using key light, fill light, and backlight together. Controls shadows and separates subjects from backgrounds. Each light faces the subject from front, back, and sideways.',
    mood: 'Professional, versatile, controlled',
    use: 'Standard production default, interviews, drama',
  },
  {
    num: 8,
    name: 'Practical Lighting',
    value: 'practical',
    description: 'Uses light sources visible within the scene — lamps, televisions, candles. Added by set designers to light faces and corners. Color temperatures of all practicals must match.',
    mood: 'Intimate, naturalistic, immersive',
    use: 'Interior scenes, period drama, intimate moments',
  },
  {
    num: 9,
    name: 'Hard Lighting',
    value: 'hard',
    description: 'Harsh direct beam from a light source creating strong shadows and harsh lines. Creates highlights and silhouettes. Can be controlled with flags or diffusers.',
    mood: 'Harsh, stark, confrontational',
    use: 'Action, conflict, interrogation scenes',
  },
  {
    num: 10,
    name: 'Soft Lighting',
    value: 'soft',
    description: 'Eliminates shadows and creates subtle shades. Used to add youth to an actor face. Can function as a fill light. No strict definition — more aesthetic than technical.',
    mood: 'Gentle, flattering, warm',
    use: 'Beauty shots, romance, flashback sequences',
  },
  {
    num: 11,
    name: 'Bounce Lighting',
    value: 'bounce',
    description: 'Bounces light off a whiteboard or white card to indirectly illuminate subjects. Creates a larger area of evenly spread soft lighting. Can create fill, top, side, and backlighting simultaneously.',
    mood: 'Even, soft, diffused',
    use: 'Outdoor fill, portrait work, product shots',
  },
  {
    num: 12,
    name: 'Ambient Lighting',
    value: 'ambient',
    description: 'Existing sunlight, overhead light, or lamplight that seeps into the set. Videographers must account for ambient light especially outdoors. Changes throughout the day during long shoots.',
    mood: 'Organic, unpredictable, environmental',
    use: 'Documentary, run-and-gun, location shoots',
  },
  {
    num: 13,
    name: 'Motivated Lighting',
    value: 'motivated',
    description: 'Light designed to appear as if it comes from a source within the scene — sun, moon, streetlights. Uses bounces or flags to create the effect while making actors appear natural.',
    mood: 'Believable, story-driven, contextual',
    use: 'Narrative drama, period pieces, realistic interiors',
  },
  {
    num: 14,
    name: 'Side Lighting',
    value: 'side',
    description: 'Light entering from the sides to highlight the subject. Provides mood and drama, especially in film noir. Requires strong contrast; low-key style accentuates subject contours.',
    mood: 'Dramatic, sculptural, mysterious',
    use: 'Noir, character studies, dramatic reveals',
  },
]

export default function Lighting() {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: '0 0 8px' }}>Lighting Descriptions</h1>
        <p style={{ fontSize: '0.85rem', color: MUTED, margin: 0 }}>Reference guide to the 14 cinematic lighting types used in Culmina AI Drama Studio.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1px', background: BORDER }}>
        {LIGHTING_TYPES.map(lt => (
          <div key={lt.num} style={{ background: '#0e0c09', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'rgba(201,146,74,0.3)', fontWeight: 300, lineHeight: 1, minWidth: '28px' }}>{String(lt.num).padStart(2, '0')}</div>
              <div>
                <div style={{ fontSize: '0.92rem', color: CREAM, marginBottom: '2px' }}>{lt.name}</div>
                <div style={{ fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.08em', fontFamily: 'monospace' }}>{lt.value}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: MUTED, lineHeight: 1.65, margin: '0 0 14px' }}>{lt.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.63rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: '36px', paddingTop: '1px' }}>Mood</span>
                <span style={{ fontSize: '0.75rem', color: GOLD }}>{lt.mood}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.63rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: '36px', paddingTop: '1px' }}>Use</span>
                <span style={{ fontSize: '0.75rem', color: CHARCOAL }}>{lt.use}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
