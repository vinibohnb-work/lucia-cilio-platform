import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useSidebar } from '../../context/SidebarContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { t as translate } from '../../i18n/translations'
import { getCompanySettings } from '../../lib/companySettings'
import Flag from '../Flag'

// ── Ícones (stroke = currentColor) ─────────────────────────────────────────
const Icon = ({ d, size = 17, sw = 1.7, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} style={{ flexShrink: 0 }}>
    {children || <path d={d} />}
  </svg>
)
const IconPainel = () => <Icon><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Icon>
const IconCaixa = () => <Icon><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M8 8h8M8 12h5"/></Icon>
const IconCatalogo = () => <Icon><path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h8z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/></Icon>
const IconPreco = () => <Icon><rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M8 7h8M8 11h8M8 15h4"/></Icon>
const IconClientes = () => <Icon><circle cx="9" cy="8" r="3.3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.6M17.5 20a5 5 0 0 0-3-4.6"/></Icon>
const IconObrig = () => <Icon><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 2.5v4M16 2.5v4"/></Icon>
const IconEmpresa = () => <Icon><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5"/></Icon>
const IconAdmin = () => <Icon><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></Icon>
const IconRucklagen = () => <Icon><path d="M12 3 4 6v6c0 4.5 3.2 7.5 8 9 4.8-1.5 8-4.5 8-9V6z"/><path d="M9.3 12h5.4M12 9.3v5.4" strokeWidth="1.5"/></Icon>
// ESG
const IconDiag = () => <Icon><path d="M12 21c4-2.5 6-6 6-11a6 6 0 0 0-12 0c0 5 2 8.5 6 11z" transform="scale(1)"/><path d="M12 3c0 6 0 12 0 16" strokeWidth="1.4"/></Icon>
const IconMaterial = () => <Icon><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"/></Icon>
const IconKpi = () => <Icon><path d="M4 20V4M4 20h16"/><path d="M8 16l3-4 3 2 4-6" strokeWidth="1.6"/></Icon>
const IconProjetos = () => <Icon><path d="M3.5 7.5a2 2 0 0 1 2-2H10l2 2.2h6.5a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></Icon>
const IconRelatorios = () => <Icon><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M13.5 3.5V8H18M8.5 13h7M8.5 16.5h7" strokeWidth="1.4"/></Icon>
const IconLogout = () => <Icon size={15}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/></Icon>
const SunIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>

const NAV = {
  accounting: [
    { key: 'section_acc', items: [
      { to: '/contabilidade/dashboard',    Icon: IconPainel,   labelKey: 'nav_dash' },
      { to: '/contabilidade/caixa',        Icon: IconCaixa,    labelKey: 'nav_caixa' },
      { to: '/contabilidade/catalogo',     Icon: IconCatalogo, labelKey: 'nav_catalogo' },
      { to: '/contabilidade/obrigacoes',   Icon: IconObrig,    labelKey: 'nav_obligations', badge: 2 },
    ]},
    { key: 'section_mgmt', items: [
      { to: '/contabilidade/precificacao', Icon: IconPreco,    labelKey: 'nav_preco' },
      { to: '/contabilidade/clientes',     Icon: IconClientes, labelKey: 'nav_clients' },
      { to: '/contabilidade/empresa',      Icon: IconEmpresa,  labelKey: 'nav_empresa' },
    ]},
  ],
  esg: [
    { key: 'section_esg', items: [
      { to: '/esg/diagnostico',   Icon: IconDiag,        labelKey: 'nav_esg_diag' },
      { to: '/esg/materialidade', Icon: IconMaterial,    labelKey: 'nav_esg_material' },
      { to: '/esg/kpis',          Icon: IconKpi,         labelKey: 'nav_esg_kpis' },
      { to: '/esg/projetos',      Icon: IconProjetos,    labelKey: 'nav_projects' },
      { to: '/esg/relatorios',    Icon: IconRelatorios,  labelKey: 'nav_esg_reports' },
    ]},
  ],
}

export default function Sidebar() {
  const { lang, setLang } = useLang()
  const { mobileOpen, setMobileOpen } = useSidebar()
  const { user, signOut, isAdmin, platform } = useAuth()
  const { t, night, toggle } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [country, setCountry] = useState(null)
  useEffect(() => { getCompanySettings().then(cs => setCountry(cs?.country || 'PT')) }, [])

  const activePlatform = platform === 'esg' ? 'esg' : 'accounting'
  const sections = NAV[activePlatform]

  const closeOnMobile = () => { if (isMobile) setMobileOpen(false) }
  async function handleLogout() { setMobileOpen(false); await signOut(); navigate('/login', { replace: true }) }

  const W = isMobile ? 264 : 238

  const navRow = (item) => (
    <NavLink key={item.to} to={item.to} onClick={closeOnMobile}
      style={({ isActive }) => ({
        position: 'relative', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 14px', borderRadius: '9px', fontSize: '13.5px', textDecoration: 'none',
        background: isActive ? t.navActiveBg : 'transparent',
        color: isActive ? t.navActiveText : t.navText,
        fontWeight: isActive ? 600 : 500,
      })}
    >
      {({ isActive }) => (
        <>
          <span style={{ position: 'absolute', left: 0, top: '9px', bottom: '9px', width: '3px', borderRadius: '3px', background: isActive ? t.accent : 'transparent' }} />
          <span style={{ color: isActive ? t.accent : 'currentColor', display: 'flex' }}><item.Icon /></span>
          {translate(lang, item.labelKey)}
          {item.badge && <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', background: t.badgeBg, color: t.badgeInk }}>{item.badge}</span>}
        </>
      )}
    </NavLink>
  )

  const sectionLabel = { section_acc: { pt: 'Contabilidade', de: 'Buchhaltung' }, section_mgmt: { pt: 'Gestão', de: 'Verwaltung' }, section_esg: { pt: 'ESG Consulting', de: 'ESG-Beratung' } }
  const mgmtKey = activePlatform === 'esg' ? 'section_esg' : 'section_mgmt'

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, width: `${W}px`, height: '100vh', zIndex: 100,
      display: 'flex', flexDirection: 'column', padding: '26px 0',
      background: t.sidebarBg, fontFamily: t.fontBody,
      transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      transition: 'transform .25s ease', boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,.3)' : 'none',
      paddingTop: 'calc(26px + env(safe-area-inset-top))', paddingBottom: 'calc(0px + env(safe-area-inset-bottom))',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 24px 22px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: `1px solid ${t.sidebarBorder}` }}>
        <img src="/logo.png" alt="LC" style={{ width: '42px', height: '42px', flex: 'none', objectFit: 'contain' }} />
        <div>
          <div style={{ fontFamily: t.fontDisplay, fontStyle: 'italic', fontSize: '19px', lineHeight: 1, color: '#f3ecdb' }}>Lúcia Cílio</div>
          <div style={{ fontSize: '9px', letterSpacing: '2.4px', textTransform: 'uppercase', marginTop: '3px', color: t.sidebarSub }}>Office Consulting</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sections.map((sec, si) => (
          <div key={sec.key} style={{ marginTop: si ? '20px' : 0 }}>
            <div style={{ padding: '0 24px', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 8px', color: t.sectionLabel }}>
              {sectionLabel[sec.key][lang] || sectionLabel[sec.key].pt}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 12px' }}>
              {sec.items.map(navRow)}
              {sec.key === 'section_mgmt' && country === 'DE' && navRow({ to: '/contabilidade/rucklagen', Icon: IconRucklagen, labelKey: 'nav_rucklagen' })}
              {sec.key === mgmtKey && isAdmin && navRow({ to: '/admin', Icon: IconAdmin, labelKey: 'nav_admin' })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '18px 20px 22px', borderTop: `1px solid ${t.sidebarBorder}` }}>
        {/* Utilizador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 6px 12px' }}>
          <div style={{ width: '30px', height: '30px', flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, fontFamily: t.fontDisplay, background: t.avatarBg, color: t.avatarInk, border: t.avatarBorder }}>
            {(user?.user_metadata?.display_name || user?.email || 'LC').slice(0,2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#f3ecdb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utilizador'}
            </div>
          </div>
        </div>
        {/* Logout */}
        <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 6px 14px', fontSize: '12.5px', cursor: 'pointer', color: t.sidebarSub }}>
          <IconLogout />{lang === 'de' ? 'Abmelden' : 'Terminar sessão'}
        </div>
        {/* Idioma + tema */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', fontSize: '11px', fontWeight: 600, border: `1px solid ${t.sidebarBorder}` }}>
            {['pt','de'].map(code => (
              <span key={code} onClick={() => setLang(code)} title={code.toUpperCase()} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 11px', cursor: 'pointer', opacity: lang === code ? 1 : 0.5, background: lang === code ? t.accent : 'transparent' }}><Flag code={code} size={20} /></span>
            ))}
          </div>
          <button onClick={toggle} title={night ? (lang==='de'?'Heller Modus':'Modo claro') : (lang==='de'?'Nachtmodus':'Modo noturno')} style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: t.toggleBg, border: `1px solid ${t.sidebarBorder}` }}>
            {night ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>
    </aside>
  )
}
