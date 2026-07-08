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

export default function Flag({ code, size = 20 }) {
  return code === 'de' ? <FlagDE size={size} /> : <FlagPT size={size} />
}
