import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useFiscalAlerts } from '../hooks/useFiscalAlerts'

// Sino de notificações de obrigações fiscais (vencidas / a vencer).
// Aparece apenas quando há alertas. Clicar num item abre Obrigações Fiscais.
export default function FiscalBell() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { alerts, count } = useFiscalAlerts(14)
  const [open, setOpen] = useState(false)

  if (count === 0) return null

  const L = lang === 'de'
    ? { title: 'Steuertermine', overdue: 'überfällig', today: 'heute', inDays: (d) => `in ${d} Tagen`, all: 'Alle ansehen →' }
    : lang === 'en'
    ? { title: 'Tax deadlines', overdue: 'overdue', today: 'today', inDays: (d) => `in ${d} days`, all: 'View all →' }
    : { title: 'Prazos fiscais', overdue: 'em atraso', today: 'hoje', inDays: (d) => `em ${d} dias`, all: 'Ver todas →' }

  const when = (d) => d < 0 ? `${Math.abs(d)} ${lang === 'de' ? 'Tage' : lang === 'en' ? 'days' : 'dias'} ${L.overdue}` : d === 0 ? L.today : L.inDays(d)

  const go = () => { setOpen(false); navigate('/contabilidade/obrigacoes') }

  return (
    <div style={{ position: 'fixed', zIndex: 85, top: isMobile ? 'calc(env(safe-area-inset-top) + 12px)' : '20px', right: isMobile ? '12px' : '22px' }}>
      <button onClick={() => setOpen(o => !o)} aria-label={L.title} style={{
        position: 'relative', width: '42px', height: '42px', borderRadius: '11px', cursor: 'pointer',
        border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(0,0,0,.14)',
      }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        <span style={{ position: 'absolute', top: '-5px', right: '-5px', minWidth: '18px', height: '18px', padding: '0 4px', borderRadius: '20px', background: '#e53e3e', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />
          <div style={{ position: 'absolute', top: '50px', right: 0, width: isMobile ? '82vw' : '340px', maxHeight: '60vh', overflowY: 'auto', background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,.22)' }}>
            <div style={{ padding: '13px 16px', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px' }}>🔔</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: t.heading }}>{L.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#e53e3e' }}>{count}</span>
            </div>
            {alerts.map(a => (
              <div key={a.id} onClick={go} style={{ padding: '12px 16px', borderBottom: `1px solid ${t.rowBorder || t.cardBorder}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: t.heading, lineHeight: 1.35 }}>{a.obligation_type}</div>
                <div style={{ fontSize: '11px', color: a.days < 0 ? '#991b1b' : a.days <= 3 ? '#e53e3e' : t.textMuted, fontWeight: 600 }}>
                  {a.deadline.split('-').reverse().join('/')} · {when(a.days)}
                </div>
              </div>
            ))}
            <div onClick={go} style={{ padding: '11px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: t.accent, cursor: 'pointer' }}>{L.all}</div>
          </div>
        </>
      )}
    </div>
  )
}
