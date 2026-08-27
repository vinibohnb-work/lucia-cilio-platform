import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'

// Esqueleto de carregamento — substitui o "A carregar…" solto que 12 páginas
// mostravam (achado do QA de 13/08: ecrã vazio a convidar a agir sobre nada).
// Desenha a forma do que vem a seguir: cabeçalho, uma fila de cartões e uma
// lista. A animação respeita quem pediu menos movimento (ver index.css).

export default function EsqueletoPagina({ cartoes = 4, linhas = 5 }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const barra = (w, h, extra = {}) => (
    <div className="lc-esqueleto" style={{ width: w, height: h, borderRadius: '7px', background: t.trackBg, ...extra }} />
  )
  return (
    <div style={{ width: '100%' }} aria-busy="true" aria-live="polite">
      <div style={{ marginBottom: '20px' }}>
        {barra('90px', '10px', { marginBottom: '10px' })}
        {barra(isMobile ? '65%' : '260px', '30px')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : `repeat(${cartoes},1fr)`, gap: isMobile ? '10px' : '14px', marginBottom: '20px' }}>
        {Array.from({ length: cartoes }).map((_, i) => (
          <div key={i} style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '14px', padding: '18px 20px' }}>
            {barra('70%', '20px', { marginBottom: '9px' })}
            {barra('45%', '9px')}
          </div>
        ))}
      </div>
      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '14px', padding: '18px 20px' }}>
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: i === linhas - 1 ? 0 : '14px' }}>
            {barra('72px', '11px', { flex: 'none' })}
            {barra('100%', '11px', { flex: 1 })}
            {barra('84px', '11px', { flex: 'none' })}
          </div>
        ))}
      </div>
    </div>
  )
}
