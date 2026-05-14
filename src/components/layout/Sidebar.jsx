import { NavLink } from 'react-router-dom'

const Logo = () => (
  <svg width="48" height="48" viewBox="0 0 50 50" fill="none">
    <circle cx="25" cy="25" r="25" fill="#0a3318"/>
    <path d="M37 13 A15 15 0 1 0 37 37" stroke="#c9a84c" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
    <path d="M32 18 A9 9 0 1 0 32 32" stroke="#c9a84c" strokeWidth="2.3" strokeLinecap="round" fill="none"/>
    <line x1="18" y1="15" x2="18" y2="31" stroke="#c9a84c" strokeWidth="2.8" strokeLinecap="round"/>
    <line x1="18" y1="31" x2="26" y2="31" stroke="#c9a84c" strokeWidth="2.8" strokeLinecap="round"/>
  </svg>
)

const navItems = [
  {
    section: 'ESG Consulting',
    items: [
      { to: '/dashboard',           icon: '📊', label: 'Dashboard' },
      { to: '/esg/projetos',        icon: '🌱', label: 'Projetos ESG',       badge: 4 },
      { to: '/esg/diagnostico',     icon: '🔍', label: 'Diagnóstico' },
      { to: '/esg/materialidade',   icon: '⚖️', label: 'Materialidade' },
      { to: '/esg/kpis',            icon: '📈', label: 'KPIs & Monitorização' },
      { to: '/esg/relatorios',      icon: '📋', label: 'Relatórios ESG' },
    ]
  },
  {
    section: 'Contabilidade',
    items: [
      { to: '/contabilidade/clientes',    icon: '👥', label: 'Clientes',           badge: 2 },
      { to: '/contabilidade/obrigacoes',  icon: '📅', label: 'Obrigações Fiscais' },
      { to: '/contabilidade/tarefas',     icon: '✅', label: 'Tarefas' },
    ]
  },
  {
    section: 'Gestão',
    items: [
      { to: '/financeiro', icon: '💶', label: 'Financeiro' },
    ]
  }
]

const niBase = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '9px 18px', margin: '1px 8px', borderRadius: '8px',
  color: 'rgba(255,255,255,.72)', fontSize: '13px', fontWeight: 500,
  cursor: 'pointer', textDecoration: 'none', transition: 'all .2s',
}
const niActive = { background: 'var(--gold)', color: 'var(--green)', fontWeight: 700 }

export default function Sidebar() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '248px', height: '100vh',
      background: 'var(--green)', display: 'flex', flexDirection: 'column',
      zIndex: 100, boxShadow: '4px 0 24px rgba(0,0,0,.18)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Logo />
        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 800, marginTop: '9px' }}>Office Consulting</div>
        <div style={{ color: 'var(--gold)', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>Lúcio Cilio</div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '12px' }}>
        {navItems.map(group => (
          <div key={group.section}>
            <div style={{ padding: '14px 14px 3px', color: 'rgba(255,255,255,.35)', fontSize: '9px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
              {group.section}
            </div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({ ...niBase, ...(isActive ? niActive : {}) })}
              >
                <span style={{ fontSize: '15px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span style={{ marginLeft: 'auto', background: '#e53e3e', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', color: 'var(--green)', flexShrink: 0 }}>LC</div>
        <div>
          <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Lúcia Cilio</div>
          <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '10px' }}>TOC · Consultora ESG</div>
        </div>
      </div>
    </div>
  )
}
