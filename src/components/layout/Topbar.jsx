import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n/translations'

const titleKeys = {
  '/contabilidade/caixa':        'nav_caixa',
  '/contabilidade/precificacao': 'nav_preco',
  '/contabilidade/clientes':     'nav_clients',
  '/contabilidade/obrigacoes':   'nav_obligations',
}

function useNow() {
  // Re-render every minute so the clock stays fresh
  const [now, setNow] = React.useState(new Date())
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

// Format: "Atualizado a 19/05/2026 às 22:14"  |  "Stand: 19.05.2026, 22:14 Uhr"
function formatUpdated(date, lang) {
  const dd   = String(date.getDate()).padStart(2, '0')
  const mm   = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const hh   = String(date.getHours()).padStart(2, '0')
  const min  = String(date.getMinutes()).padStart(2, '0')

  if (lang === 'de') {
    return `Stand: ${dd}.${mm}.${yyyy}, ${hh}:${min} Uhr`
  }
  return `Atualizado a ${dd}/${mm}/${yyyy} às ${hh}:${min}`
}

import React from 'react'

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const { lang }     = useLang()
  const now          = useNow()
  const titleKey     = titleKeys[pathname] || 'nav_caixa'

  return (
    <div style={{
      background: '#fff', padding: '0 28px', height: '62px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid #dde8de', position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 2px 8px rgba(0,0,0,.04)',
    }}>
      <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--green)', margin: 0 }}>
        {t(lang, titleKey)}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          🔄 {formatUpdated(now, lang)}
        </span>
        <div style={{
          width: '34px', height: '34px', borderRadius: '8px',
          border: '1px solid #dde8de', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', fontSize: '17px',
          background: '#fff', position: 'relative',
        }}>
          🔔
          <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', background: '#e53e3e', borderRadius: '50%', border: '2px solid #fff' }} />
        </div>
        <button
          onClick={() => navigate('/contabilidade/caixa')}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', background: 'var(--gold)', color: 'var(--green)' }}
        >
          {lang === 'de' ? '+ Neue Buchung' : '+ Nova Entrada'}
        </button>
      </div>
    </div>
  )
}
