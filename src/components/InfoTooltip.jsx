import { useState, useId } from 'react'
import { useTheme } from '../context/ThemeContext'

// Pequeno ícone (i) que explica um termo técnico. Abre ao passar o rato, ao
// focar com o teclado ou ao tocar (telemóvel) — antes só abria com o rato.
export default function InfoTooltip({ text, badge, largura = 240 }) {
  const { t } = useTheme()
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label="Explicação" aria-describedby={open ? id : undefined} aria-expanded={open}
        onClick={(e) => { e.preventDefault(); setOpen(o => !o) }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        style={{
          width: '18px', height: '18px', borderRadius: '50%', padding: 0, margin: '0 0 0 4px',
          border: `1px solid ${t.textMuted}`, color: t.textMuted, background: 'transparent',
          fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'help', lineHeight: 1, fontStyle: 'italic', fontFamily: 'Georgia, serif',
        }}>i</button>

      {open && (
        <span role="tooltip" id={id} style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)', zIndex: 200,
          background: t.highlightBg, color: t.highlightValue, borderRadius: '8px',
          padding: '9px 12px', width: `${largura}px`, maxWidth: '80vw', fontSize: '12px',
          lineHeight: 1.5, fontWeight: 500, textAlign: 'left', textTransform: 'none', letterSpacing: 'normal',
          boxShadow: '0 6px 20px rgba(0,0,0,.25)', pointerEvents: 'none', whiteSpace: 'normal',
        }}>
          {text}
          {badge && <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', fontWeight: 700, color: t.highlightLabel }}>{badge}</span>}
        </span>
      )}
    </span>
  )
}
