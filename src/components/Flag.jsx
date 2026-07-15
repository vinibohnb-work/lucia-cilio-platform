// Bandeiras em SVG (renderizam em qualquer SO, incl. Windows, onde os emojis
// de bandeira degradam para as letras do código — ex.: "PT", "DE").

export function FlagPT({ size = 20 }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 20 14" style={{ borderRadius: '2px', display: 'block', boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,.15)' }}>
      <rect width="20" height="14" fill="#DA291C" />
      <rect width="8" height="14" fill="#046A38" />
      <circle cx="8" cy="7" r="2.5" fill="#FFE900" stroke="#fff" strokeWidth="0.5" />
      <circle cx="8" cy="7" r="1.1" fill="#DA291C" />
    </svg>
  )
}

export function FlagDE({ size = 20 }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 20 14" style={{ borderRadius: '2px', display: 'block', boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,.15)' }}>
      <rect width="20" height="4.667" y="0"     fill="#000000" />
      <rect width="20" height="4.667" y="4.667" fill="#DD0000" />
      <rect width="20" height="4.667" y="9.334" fill="#FFCE00" />
    </svg>
  )
}

export function FlagEN({ size = 20 }) {
  // Union Jack simplificado, recortado à moldura 20×14.
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 60 42" style={{ borderRadius: '2px', display: 'block', boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,.15)' }}>
      <clipPath id="uk-clip"><rect width="60" height="42" rx="2" /></clipPath>
      <g clipPath="url(#uk-clip)">
        <rect width="60" height="42" fill="#012169" />
        {/* diagonais brancas (St Andrew + St Patrick) */}
        <path d="M0,0 L60,42 M60,0 L0,42" stroke="#fff" strokeWidth="8" />
        {/* diagonais vermelhas (St Patrick) */}
        <path d="M0,0 L60,42 M60,0 L0,42" stroke="#C8102E" strokeWidth="3" />
        {/* cruz branca (St George) */}
        <path d="M30,0 V42 M0,21 H60" stroke="#fff" strokeWidth="12" />
        {/* cruz vermelha */}
        <path d="M30,0 V42 M0,21 H60" stroke="#C8102E" strokeWidth="7" />
      </g>
    </svg>
  )
}

export default function Flag({ code, size = 20 }) {
  if (code === 'de') return <FlagDE size={size} />
  if (code === 'en') return <FlagEN size={size} />
  return <FlagPT size={size} />
}
