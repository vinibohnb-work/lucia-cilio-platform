import { useState } from 'react'

// Pequeno ícone (ⓘ) que mostra uma explicação ao passar o rato.
export default function InfoTooltip({ text, badge }) {
  const [open, setOpen] = useState(false)

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span style={{
        width: '15px', height: '15px', borderRadius: '50%',
        border: '1px solid #94a3b8', color: '#64748b',
        fontSize: '10px', fontWeight: 800, display: 'flex',
        alignItems: 'center', justifyContent: 'center', cursor: 'help',
        lineHeight: 1, fontStyle: 'italic', fontFamily: 'Georgia, serif',
      }}>
        i
      </span>

      {open && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)', zIndex: 200,
          background: '#0d3b20', color: '#fff', borderRadius: '8px',
          padding: '9px 12px', width: '220px', fontSize: '11px',
          lineHeight: 1.5, fontWeight: 500, textAlign: 'left',
          boxShadow: '0 6px 20px rgba(0,0,0,.25)', pointerEvents: 'none',
        }}>
          {text}
          {badge && (
            <span style={{ display: 'block', marginTop: '6px', fontSize: '10px', fontWeight: 700, color: '#c9a84c' }}>
              {badge}
            </span>
          )}
          {/* seta */}
          <span style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            borderWidth: '5px', borderStyle: 'solid',
            borderColor: '#0d3b20 transparent transparent transparent',
          }} />
        </span>
      )}
    </span>
  )
}
