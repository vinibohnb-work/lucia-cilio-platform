import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useSidebar } from '../../context/SidebarContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { t } from '../../i18n/translations'

const titleKeys = {
  '/contabilidade/dashboard':    'nav_dash',
  '/contabilidade/caixa':        'nav_caixa',
  '/contabilidade/catalogo':     'nav_catalogo',
  '/contabilidade/precificacao': 'nav_preco',
  '/contabilidade/clientes':     'nav_clients',
  '/contabilidade/obrigacoes':   'nav_obligations',
}

function useNow() {
  const [now, setNow] = React.useState(new Date())
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatUpdated(date, lang) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return lang === 'de'
    ? `Stand: ${dd}.${mm}.${yyyy}, ${hh}:${min} Uhr`
    : `Atualizado a ${dd}/${mm}/${yyyy} às ${hh}:${min}`
}

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const { lang }     = useLang()
  const { setMobileOpen } = useSidebar()
  const isMobile     = useIsMobile()
  const now          = useNow()
  const titleKey     = titleKeys[pathname] || 'nav_dash'

  return (
    <div style={{
      background: '#fff', padding: isMobile ? '0 14px' : '0 28px',
      height: 'calc(60px + env(safe-area-inset-top))',
      paddingTop: 'env(safe-area-inset-top)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid #dde8de', position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 2px 8px rgba(0,0,0,.04)', gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            style={{
              width: '38px', height: '38px', borderRadius: '9px', border: '1px solid #dde8de',
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '18px', color: 'var(--green)', flexShrink: 0, lineHeight: 1,
            }}
          >
            ☰
          </button>
        )}
        <h1 style={{ fontSize: isMobile ? '16px' : '19px', fontWeight: 800, color: 'var(--green)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t(lang, titleKey)}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px', flexShrink: 0 }}>
        {/* Data só em ecrã largo */}
        {!isMobile && (
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>🔄 {formatUpdated(now, lang)}</span>
        )}
        {/* Botão Nova Entrada: texto no desktop, ícone "+" no mobile */}
        <button
          onClick={() => navigate('/contabilidade/caixa?new=1')}
          aria-label={lang === 'de' ? 'Neue Buchung' : 'Nova Entrada'}
          style={{
            padding: isMobile ? '0' : '9px 16px',
            width: isMobile ? '38px' : 'auto', height: isMobile ? '38px' : 'auto',
            borderRadius: isMobile ? '9px' : '8px', fontSize: isMobile ? '20px' : '12px',
            fontWeight: 700, cursor: 'pointer', border: 'none',
            background: 'var(--gold)', color: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1,
          }}
        >
          {isMobile ? '+' : (lang === 'de' ? '+ Neue Buchung' : '+ Nova Entrada')}
        </button>
      </div>
    </div>
  )
}
