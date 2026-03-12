export default function CulminaLogo({ height = 36 }) {
  return (
    <svg viewBox="0 0 110 162" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height }}>
      <path d="M 6,55 A 49,49 0 0,1 104,55" stroke="#3A3630" strokeWidth="2" fill="none" strokeLinecap="square"/>
      <line x1="6" y1="55" x2="6" y2="118" stroke="#3A3630" strokeWidth="2" strokeLinecap="square"/>
      <line x1="104" y1="55" x2="104" y2="118" stroke="#3A3630" strokeWidth="2" strokeLinecap="square"/>
      <line x1="6" y1="108" x2="55" y2="7" stroke="#C9924A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="104" y1="108" x2="55" y2="7" stroke="#C9924A" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="30" y1="63" x2="80" y2="63" stroke="#C9924A" strokeWidth="1" strokeLinecap="round"/>
      <line x1="42" y1="36" x2="68" y2="36" stroke="#5C574E" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="55" y1="36" x2="55" y2="118" stroke="#5C574E" strokeWidth="1.8"/>
    </svg>
  )
}

export function CulminaLogoHero({ height = 100 }) {
  return (
    <svg viewBox="0 0 110 162" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height, filter: 'drop-shadow(0 4px 16px rgba(201,146,74,.18))' }}>
      <path d="M 6,55 A 49,49 0 0,1 104,55" stroke="rgba(92,87,78,.25)" strokeWidth="2.5" fill="none" strokeLinecap="square"/>
      <line x1="6" y1="55" x2="6" y2="118" stroke="rgba(92,87,78,.25)" strokeWidth="2.5" strokeLinecap="square"/>
      <line x1="104" y1="55" x2="104" y2="118" stroke="rgba(92,87,78,.25)" strokeWidth="2.5" strokeLinecap="square"/>
      <line x1="6" y1="108" x2="55" y2="7" stroke="#C9924A" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="104" y1="108" x2="55" y2="7" stroke="#C9924A" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="30" y1="63" x2="80" y2="63" stroke="#C9924A" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="42" y1="36" x2="68" y2="36" stroke="#5C574E" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="55" y1="36" x2="55" y2="118" stroke="#5C574E" strokeWidth="2.5"/>
    </svg>
  )
}

