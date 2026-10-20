import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useSidebar } from '../../context/SidebarContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { t as translate } from '../../i18n/translations'
import { getCompanySettings } from '../../lib/companySettings'
import { isLite, LITE_SECTIONS } from '../../lib/platformHome'
import { useFiscalAlerts } from '../../hooks/useFiscalAlerts'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import Flag from '../Flag'
import { usePortal } from '../../portal/dados'
import { naoLidas } from '../../portal/seletores'

// ── Ícones (stroke = currentColor) ─────────────────────────────────────────
const Icon = ({ d, size = 17, sw = 1.7, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} style={{ flexShrink: 0 }}>
    {children || <path d={d} />}
  </svg>
)
const IconInicio = () => <Icon><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/></Icon>
const IconPainel = () => <Icon><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Icon>
const IconCaixa = () => <Icon><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M8 8h8M8 12h5"/></Icon>
const IconCatalogo = () => <Icon><path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h8z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/></Icon>
const IconPreco = () => <Icon><rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M8 7h8M8 11h8M8 15h4"/></Icon>
const IconClientes = () => <Icon><circle cx="9" cy="8" r="3.3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.6M17.5 20a5 5 0 0 0-3-4.6"/></Icon>
const IconObrig = () => <Icon><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 2.5v4M16 2.5v4"/></Icon>
const IconEmpresa = () => <Icon><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5"/></Icon>
const IconRucklagen = () => <Icon><path d="M12 3 4 6v6c0 4.5 3.2 7.5 8 9 4.8-1.5 8-4.5 8-9V6z"/><path d="M9.3 12h5.4M12 9.3v5.4" strokeWidth="1.5"/></Icon>
// ESG
const IconDiag = () => <Icon><path d="M12 21c4-2.5 6-6 6-11a6 6 0 0 0-12 0c0 5 2 8.5 6 11z" transform="scale(1)"/><path d="M12 3c0 6 0 12 0 16" strokeWidth="1.4"/></Icon>
const IconMaterial = () => <Icon><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"/></Icon>
const IconKpi = () => <Icon><path d="M4 20V4M4 20h16"/><path d="M8 16l3-4 3 2 4-6" strokeWidth="1.6"/></Icon>
// Megafone — Marketing
const IconMarketing = () => <Icon><path d="M4 10v4h3l6 3.5v-11L7 10H4z"/><path d="M17 9.5a3.5 3.5 0 0 1 0 5" strokeWidth="1.6"/></Icon>
const IconProjetos = () => <Icon><path d="M3.5 7.5a2 2 0 0 1 2-2H10l2 2.2h6.5a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></Icon>
const IconRelatorios = () => <Icon><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M13.5 3.5V8H18M8.5 13h7M8.5 16.5h7" strokeWidth="1.4"/></Icon>
const IconTarefas = () => <Icon><rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/></Icon>
const IconHoras = () => <Icon><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></Icon>
const IconMensagens = () => <Icon><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/></Icon>
// 13-D (13/10): um ícone por item da Gestão — antes Relatórios, CRM e
// Diagnósticos usavam todos o IconKpi e a Agenda o ícone das Obrigações.
const IconCalendario = () => <Icon><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 2.5v4M16 2.5v4"/><circle cx="8.5" cy="13.5" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="13.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="13.5" r=".9" fill="currentColor" stroke="none"/><circle cx="8.5" cy="17" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/></Icon>
const IconBarras = () => <Icon><path d="M5 20V11M10 20V5M15 20v-7M20 20V9"/></Icon>
const IconFunil = () => <Icon><path d="M3.5 4.5h17l-6.5 8v6l-4 2v-8z"/></Icon>
const IconFormulario = () => <Icon><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M8.5 10h7M8.5 13.5h7M8.5 17h4"/></Icon>
const IconPasta = () => <Icon><rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3.5 12.5h17"/></Icon>
const IconFolha = () => <Icon><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19 13 11" strokeWidth="1.5"/></Icon>
const IconEuro = () => <Icon><path d="M17 6.5A7 7 0 1 0 17 17.5M4 10.5h9M4 13.5h8"/></Icon>
const IconChave = () => <Icon><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16.5 6.5l2.5 2.5M14 9l2 2"/></Icon>
const STAFF = ['admin', 'comercial', 'marketing']
const IconLogout = () => <Icon size={15}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/></Icon>
// Os nomes estavam trocados (o "Sun" desenhava a lua) — 13-D, 13/10.
const MoonIcon = ({ cor }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
const SunIcon = ({ cor }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>

const NAV = {
  accounting: [
    { key: 'section_acc', items: [
      { to: '/contabilidade/inicio',       Icon: IconInicio,   labelKey: 'nav_inicio' },
      { to: '/contabilidade/dashboard',    Icon: IconPainel,   labelKey: 'nav_dash' },
      { to: '/contabilidade/caixa',        Icon: IconCaixa,    labelKey: 'nav_caixa' },
      // Antes só se chegava pelo "!" do Painel, que só aparecia com modelos já criados (R-D2)
      { to: '/contabilidade/recorrentes',  Icon: IconRelatorios, labelKey: 'nav_recorrentes' },
      // A Conciliação não existe no Lite — o menu mostrava-a e devolvia ao Painel (R-D3)
      { to: '/contabilidade/conciliacao',  Icon: IconRucklagen, labelKey: 'nav_conciliacao', semLite: true },
      { to: '/contabilidade/catalogo',     Icon: IconCatalogo, labelKey: 'nav_catalogo' },
      { to: '/contabilidade/obrigacoes',   Icon: IconObrig,    labelKey: 'nav_obligations' },
    ]},
    { key: 'section_mgmt', items: [
      { to: '/contabilidade/precificacao', Icon: IconPreco,      labelKey: 'nav_preco' },
      { to: '/contabilidade/planeamento',  Icon: IconKpi,        labelKey: 'nav_plano' },
      { to: '/contabilidade/clientes',     Icon: IconClientes,   labelKey: 'nav_clients' },
      { to: '/contabilidade/empresa',      Icon: IconEmpresa,    labelKey: 'nav_empresa' },
      { to: '/consultoria',                Icon: IconRelatorios, labelKey: 'nav_consultoria' },
    ]},
  ],
  // ESG: as rotas são relativas ao caso — /esg/<rota> no cliente, /gestao/esg/:id/<rota>
  // quando a Lúcia abre um caso na Gestão (o mesmo menu, o mesmo produto).
  esg: [
    { key: 'section_esg', items: [
      // Ordem do método da Lúcia (documento de 15/10): compreender → diagnosticar →
      // priorizar → agir → medir → evoluir → reportar.
      { rota: 'percurso',      Icon: IconRelatorios,  labelKey: 'nav_esg_percurso' },
      { rota: 'arranque',      Icon: IconClientes,    labelKey: 'nav_esg_arranque' },
      { rota: 'diagnostico',   Icon: IconDiag,        labelKey: 'nav_esg_diag' },
      { rota: 'materialidade', Icon: IconMaterial,    labelKey: 'nav_esg_material' },
      { rota: 'projetos',      Icon: IconProjetos,    labelKey: 'nav_esg_plano' },
      { rota: 'kpis',          Icon: IconKpi,         labelKey: 'nav_esg_kpis' },
      { rota: 'acompanhamento', Icon: IconTarefas,    labelKey: 'nav_esg_acompanhamento' },
      { rota: 'relatorios',    Icon: IconRelatorios,  labelKey: 'nav_esg_reports' },
      { to: '/consultoria',    Icon: IconCaixa,       labelKey: 'nav_consultoria', soCliente: true },
    ]},
  ],
  // roles: quem vê cada item (ausente = todos). Papéis de equipa só veem a sua área.
  // Reunião de 10/09: a gestão interna (como ela trabalha) fica separada dos
  // serviços (o que ela vende). Sem isto, a Consultoria e os Diagnósticos
  // apareciam no meio dos Acessos e do Marketing.
  // 29/09: o portal de gestão de clientes (a antiga v2) abre a Gestão — é onde
  // a equipa passa o dia. O Marketing é partilhado pelas três (reunião de
  // 01/10): a administradora e o papel "marketing" veem-no.
  management: [
    // 13-D (13/10): agrupado por frequência de uso. Em cima, sem rótulo, o dia a
    // dia (os rótulos "Clientes" e "Gestão" repetiam o item e a plataforma);
    // depois o Comercial, os Serviços e, no fim, o Escritório (usa-se pouco).
    // Os Diagnósticos saem dos Serviços: são a entrada do formulário público,
    // que alimenta a Prospeção. A visibilidade por papel não mudou.
    { key: 'section_topo', items: [
      { to: '/gestao/inicio',     Icon: IconInicio,     labelKey: 'nav_inicio_equipa',   roles: STAFF },
      { to: '/gestao/clientes',   Icon: IconClientes,   labelKey: 'nav_clientes_ativos', roles: STAFF },
      { to: '/gestao/agenda',     Icon: IconCalendario, labelKey: 'nav_agenda',          roles: STAFF },
      { to: '/gestao/tarefas',    Icon: IconTarefas,    labelKey: 'nav_tarefas',         roles: STAFF },
      { to: '/gestao/mensagens',  Icon: IconMensagens,  labelKey: 'nav_mensagens',       roles: STAFF },
      { to: '/gestao/horas',      Icon: IconHoras,      labelKey: 'nav_horas',           roles: STAFF },
      { to: '/gestao/relatorios', Icon: IconBarras,     labelKey: 'nav_relatorios_trim', roles: STAFF },
    ]},
    { key: 'section_comercial', items: [
      { to: '/gestao/crm',          Icon: IconFunil,      labelKey: 'nav_crm',          roles: ['admin', 'comercial'] },
      { to: '/gestao/diagnosticos', Icon: IconFormulario, labelKey: 'nav_diagnosticos', roles: ['admin', 'comercial'] },
      { to: '/gestao/marketing',    Icon: IconMarketing,  labelKey: 'nav_marketing',    roles: ['admin', 'marketing'] },
    ]},
    { key: 'section_servicos', items: [
      { to: '/gestao/consultorias', Icon: IconPasta,      labelKey: 'nav_consultorias', roles: ['admin'] },
      { to: '/gestao/esg',          Icon: IconFolha,      labelKey: 'nav_esg_consultorias', roles: ['admin'] },
    ]},
    { key: 'section_escritorio', items: [
      { to: '/gestao/financeiro', Icon: IconEuro,       labelKey: 'nav_fin_gestao',      roles: ['admin'] },
      { to: '/gestao/acessos',    Icon: IconChave,      labelKey: 'nav_acessos',         roles: ['admin'] },
    ]},
  ],
}

export default function Sidebar() {
  const { lang, setLang } = useLang()
  const { mobileOpen, setMobileOpen } = useSidebar()
  const { user, signOut, isAdmin, platform, role } = useAuth()
  const { t, night, toggle } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const portal = usePortal()
  const { pathname } = useLocation()
  const eid = useEffectiveUserId()
  const { isViewing, viewAs } = useViewAs()
  const [country, setCountry] = useState(null)
  useEffect(() => { if (eid) getCompanySettings(eid).then(cs => setCountry(cs?.country || 'PT')) }, [eid])
  const { count: alertCount } = useFiscalAlerts(14, eid)

  // O admin vive só na Gestão (30/09) — vê a Contabilidade ou a ESG apenas em
  // "Visualização completa" de um cliente; utilizadores 'both' alternam entre
  // Contab.+ESG; os papéis de equipa (comercial/marketing) vivem só na Gestão.
  // A plataforma ativa segue o URL (o toggle apenas navega).
  const isTeamRole = role === 'comercial' || role === 'marketing'
  // Um caso ESG aberto na Gestão (/gestao/esg/:id/…) mostra o menu da ESG, não o
  // da gestão: abre num separador próprio e tem de parecer a plataforma ESG.
  const casoId = pathname.match(/^\/gestao\/esg\/([^/]+)/)?.[1] || null
  const esgBase = casoId ? `/gestao/esg/${casoId}` : '/esg'
  const platformFromPath = casoId ? 'esg' : pathname.startsWith('/gestao') ? 'management' : pathname.startsWith('/esg') ? 'esg' : 'accounting'
  const viewPlatform = isTeamRole
    ? 'management'
    : isAdmin
      ? platformFromPath
      : platform === 'both'
        ? (platformFromPath === 'management' ? 'accounting' : platformFromPath)
        : (platform === 'esg' ? 'esg' : 'accounting')
  // Contabilidade Lite: só a secção "Contabilidade" (esconde a secção "Gestão")
  const lite = isLite(platform)
  // Itens sem `roles` são visíveis a todos; com `roles`, só a quem consta.
  const sections = (NAV[viewPlatform] || NAV.accounting)
    .filter(sec => !lite || LITE_SECTIONS.includes(sec.key))
    .map(sec => ({
      ...sec,
      items: sec.items
        .filter(it => !it.roles || it.roles.includes(role))
        .filter(it => !(casoId && it.soCliente))
        .filter(it => !(lite && it.semLite))
        .map(it => it.rota ? { ...it, to: `${esgBase}/${it.rota}` } : it),
    })).filter(sec => sec.items.length > 0)

  const PLATFORM_HOME = { management: '/gestao/clientes', accounting: '/contabilidade/dashboard', esg: '/esg/percurso' }
  const closeOnMobile = () => { if (isMobile) setMobileOpen(false) }
  async function handleLogout() { setMobileOpen(false); await signOut(); navigate('/login', { replace: true }) }
  function switchAdminView(p) {
    navigate(PLATFORM_HOME[p] || '/contabilidade/dashboard')
    if (isMobile) setMobileOpen(false)
  }

  const W = isMobile ? 264 : 238
  // 13-D (13/10): o número passa das Tarefas para as Mensagens (mensagens de
  // clientes por ler). Conta sempre que o armazém do portal está carregado;
  // antes disso não se mostra nada, em vez de um 0 que depois muda.
  const porLer = portal.carregado ? naoLidas(portal).length : 0

  const navRow = (item) => {
    // Badge dinâmico: obrigações fiscais vencidas / a vencer · mensagens por ler
    const badge = item.to === '/contabilidade/obrigacoes' ? (alertCount || null)
      : item.to === '/gestao/mensagens' ? (porLer || null) : item.badge
    return (
    <NavLink key={item.to} to={item.to} onClick={closeOnMobile}
      style={({ isActive }) => ({
        position: 'relative', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '8px 14px', borderRadius: '9px', fontSize: '13.5px', textDecoration: 'none',
        background: isActive ? t.navActiveBg : 'transparent',
        color: isActive ? t.navActiveText : t.navText,
        fontWeight: isActive ? 600 : 500,
      })}
    >
      {({ isActive }) => (
        <>
          <span style={{ position: 'absolute', left: 0, top: '7px', bottom: '7px', width: '3px', borderRadius: '3px', background: isActive ? t.accent : 'transparent' }} />
          <span style={{ color: isActive ? t.accent : 'currentColor', display: 'flex' }}><item.Icon /></span>
          {translate(lang, item.labelKey)}
          {badge && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', background: t.badgeBg, color: t.badgeInk }}>{badge}</span>}
        </>
      )}
    </NavLink>
    )
  }

  const sectionLabel = {
    section_acc: { pt: 'Contabilidade', de: 'Buchhaltung', en: 'Accounting' },
    section_mgmt: { pt: 'Gestão', de: 'Verwaltung', en: 'Management' },
    section_esg: { pt: 'ESG Consulting', de: 'ESG-Beratung', en: 'ESG Consulting' },
    section_comercial: { pt: 'Comercial', de: 'Vertrieb', en: 'Sales' },
    section_servicos: { pt: 'Serviços', de: 'Dienstleistungen', en: 'Services' },
    section_escritorio: { pt: 'Escritório', de: 'Büro', en: 'Office' },
  }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, width: `${W}px`, height: '100vh', zIndex: 100,
      display: 'flex', flexDirection: 'column', padding: '20px 0',
      background: t.sidebarBg, fontFamily: t.fontBody,
      transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      transition: 'transform .25s ease', boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,.3)' : 'none',
      paddingTop: 'calc(20px + env(safe-area-inset-top))', paddingBottom: 'calc(0px + env(safe-area-inset-bottom))',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'center', marginBottom: '14px', borderBottom: `1px solid ${t.sidebarBorder}` }}>
        <img src="/logo-letra-branca.png" alt="LC Office Consulting" style={{ width: '100%', maxWidth: '130px', height: 'auto', display: 'block' }} />
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sections.map((sec, si) => (
          <div key={sec.key} style={{ marginTop: si ? '14px' : 0 }}>
            {/* Secções sem rótulo (o Início da equipa) ficam soltas no topo */}
            {sectionLabel[sec.key] && <div style={{ padding: '0 24px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 5px', color: t.sectionLabel }}>
              {sectionLabel[sec.key][lang] || sectionLabel[sec.key].pt}
            </div>}
            {/* 13-D (13/10): saiu a caixa com o nome da empresa por cima do menu ESG
                — o nome já está na tira do caso (CasoESG). */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 12px' }}>
              {sec.items.map(navRow)}
              {sec.key === 'section_mgmt' && country === 'DE' && navRow({ to: '/contabilidade/rucklagen', Icon: IconRucklagen, labelKey: 'nav_rucklagen' })}
              {sec.key === 'section_mgmt' && country === 'DE' && navRow({ to: '/contabilidade/eur', Icon: IconRelatorios, labelKey: 'nav_eur' })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '12px 20px 14px', borderTop: `1px solid ${t.sidebarBorder}` }}>
        {/* Utilizador + sair */}
        {/* 13-D (13/10): saiu o círculo com as iniciais — decorativo, o nome está ao lado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 6px 10px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '12px', color: t.navActiveText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utilizador'}
            </div>
          </div>
          <button onClick={handleLogout} title={lang === 'de' ? 'Abmelden' : lang === 'en' ? 'Sign out' : 'Terminar sessão'} style={{ flex: 'none', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', border: `1px solid ${t.sidebarBorder}`, color: t.sidebarSub }}>
            <IconLogout />
          </button>
        </div>
        {/* Alternar plataforma — admin: Gestão e a Contabilidade de demonstração
            (conta própria, 01/10) · cliente 'both': Contab.+ESG, também durante a
            "Visualização completa" de um deles. */}
        {!isTeamRole && !casoId && (isViewing ? viewAs?.platform === 'both' : (isAdmin || platform === 'both')) && (
          <div style={{ display: 'flex', gap: '4px', padding: '2px', marginBottom: '12px', borderRadius: '9px', border: `1px solid ${t.sidebarBorder}` }}>
            {(isAdmin && !isViewing ? [
              ['management', lang === 'de' ? 'Verwaltung' : lang === 'en' ? 'Management' : 'Gestão'],
              ['accounting', lang === 'de' ? 'Demo' : lang === 'en' ? 'Demo' : 'Demonstração'],
            ] : [
              ['accounting', lang === 'de' ? 'Buchhaltung' : lang === 'en' ? 'Accounting' : 'Contabilidade'],
              ['esg', 'ESG'],
            ]).map(([p, lbl]) => (
              <button key={p} onClick={() => switchAdminView(p)} style={{
                flex: 1, padding: '7px 4px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
                background: viewPlatform === p ? t.accent : 'transparent',
                color: viewPlatform === p ? t.sidebarBg : t.sidebarSub,
              }}>{lbl}</button>
            ))}
          </div>
        )}
        {/* Idioma + tema */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', fontSize: '11px', fontWeight: 600, border: `1px solid ${t.sidebarBorder}` }}>
            {/* Botões a sério (13-D, 13/10): antes eram <span> sem teclado nem leitor de ecrã */}
            {[['pt', 'Português'], ['de', 'Deutsch'], ['en', 'English']].map(([code, nome]) => (
              <button key={code} type="button" onClick={() => setLang(code)} title={nome} aria-label={nome} aria-pressed={lang === code} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 9px', cursor: 'pointer', border: 'none', opacity: lang === code ? 1 : 0.5, background: lang === code ? t.accent : 'transparent' }}><Flag code={code} size={20} /></button>
            ))}
          </div>
          <button onClick={toggle} aria-label={night ? (lang==='de'?'Heller Modus':lang==='en'?'Light mode':'Modo claro') : (lang==='de'?'Nachtmodus':lang==='en'?'Night mode':'Modo noturno')} title={night ? (lang==='de'?'Heller Modus':lang==='en'?'Light mode':'Modo claro') : (lang==='de'?'Nachtmodus':lang==='en'?'Night mode':'Modo noturno')} style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: t.toggleBg, border: `1px solid ${t.sidebarBorder}` }}>
            {/* No modo noturno mostra o sol (passar a claro); no claro, a lua */}
            {night ? <SunIcon cor={t.accent} /> : <MoonIcon cor={t.accent} />}
          </button>
        </div>
      </div>
    </aside>
  )
}
