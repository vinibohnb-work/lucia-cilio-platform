import { NavLink, useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useSidebar } from '../../context/SidebarContext'
import { useAuth } from '../../context/AuthContext'
import { t } from '../../i18n/translations'

// ── SVG Flags (reliable cross-platform) ───────────────────────────────────
const FlagPT = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px', flexShrink: 0 }}>
    <rect width="8"  height="14" fill="#006600"/>
    <rect x="8" width="12" height="14" fill="#CC0000"/>
    <ellipse cx="8" cy="7" rx="2.8" ry="3.5" fill="#FFFF00" stroke="#006600" strokeWidth="0.4"/>
    <ellipse cx="8" cy="7" rx="1.6" ry="2.0" fill="#fff" stroke="#003399" strokeWidth="0.4"/>
  </svg>
)

const FlagDE = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px', flexShrink: 0 }}>
    <rect y="0"    width="20" height="4.67" fill="#000000"/>
    <rect y="4.67" width="20" height="4.67" fill="#CC0000"/>
    <rect y="9.33" width="20" height="4.67" fill="#FFCE00"/>
  </svg>
)

// ── Nav items ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/contabilidade/caixa',        icon: '💵', labelKey: 'nav_caixa'       },
  { to: '/contabilidade/precificacao', icon: '🧮', labelKey: 'nav_preco'       },
  { to: '/contabilidade/clientes',     icon: '👥', labelKey: 'nav_clients'     },
  { to: '/contabilidade/obrigacoes',   icon: '📅', labelKey: 'nav_obligations' },
]

export default function Sidebar() {
  const { lang, setLang }       = useLang()
  const { collapsed, setCollapsed } = useSidebar()
  const { user, signOut }       = useAuth()
  const navigate                = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const initials = (user?.email || 'LC').slice(0, 2).toUpperCase()
  const displayName = user?.email?.split('@')[0] || 'Lúcia Cílio'

  const W = collapsed ? '64px' : '248px'

  const niBase = {
    display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '10px',
    padding: collapsed ? '10px 0' : '9px 18px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    margin: '1px 8px', borderRadius: '8px',
    color: 'rgba(255,255,255,.72)', fontSize: '13px', fontWeight: 500,
    cursor: 'pointer', textDecoration: 'none', transition: 'all .15s',
  }
  const niActive = { background: 'var(--gold)', color: 'var(--green)', fontWeight: 700 }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: W, height: '100vh',
      background: 'var(--green)', display: 'flex', flexDirection: 'column',
      zIndex: 100, boxShadow: '4px 0 24px rgba(0,0,0,.18)',
      transition: 'width .22s ease', overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: collapsed ? '16px 8px' : '18px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <img
          src="/logo.png"
          alt="LC Office Consulting"
          style={{
            width: collapsed ? '54px' : '78px',
            height: collapsed ? '54px' : '78px',
            objectFit: 'contain',
            transition: 'width .22s, height .22s',
          }}
        />
      </div>

      {/* ── Nav ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '18px', paddingBottom: '12px' }}>
        {!collapsed && (
          <div style={{ padding: '0 14px 6px', color: 'rgba(255,255,255,.35)', fontSize: '9px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            {t(lang, 'section_acc')}
          </div>
        )}

        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? t(lang, item.labelKey) : undefined}
            style={({ isActive }) => ({ ...niBase, ...(isActive ? niActive : {}) })}
          >
            <span style={{ fontSize: '16px', flexShrink: 0, width: '18px', textAlign: 'center' }}>
              {item.icon}
            </span>
            {!collapsed && (
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {t(lang, item.labelKey)}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? (lang === 'de' ? 'Erweitern' : 'Expandir') : (lang === 'de' ? 'Minimieren' : 'Recolher')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', width: '100%', padding: '10px 18px',
          background: 'rgba(255,255,255,.04)', border: 'none',
          borderTop: '1px solid rgba(255,255,255,.08)',
          color: 'rgba(255,255,255,.4)', cursor: 'pointer',
          fontSize: '12px', fontWeight: 600,
          transition: 'background .15s, color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.09)'; e.currentTarget.style.color = 'rgba(255,255,255,.75)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.color = 'rgba(255,255,255,.4)' }}
      >
        <span style={{ fontSize: '16px', lineHeight: 1, transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .22s', display: 'inline-block' }}>
          »
        </span>
        {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{lang === 'de' ? 'Minimieren' : 'Recolher'}</span>}
      </button>

      {/* ── Language switcher ── */}
      <div style={{
        padding: collapsed ? '12px 6px' : '12px 18px',
        borderTop: '1px solid rgba(255,255,255,.1)',
      }}>
        {!collapsed && (
          <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            {lang === 'de' ? 'Sprache' : 'Idioma'}
          </div>
        )}
        <div style={{ display: 'flex', gap: '6px', justifyContent: collapsed ? 'center' : 'flex-start', flexDirection: collapsed ? 'column' : 'row' }}>
          {[
            { code: 'pt', Flag: FlagPT, label: 'PT' },
            { code: 'de', Flag: FlagDE, label: 'DE' },
          ].map(({ code, Flag, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              title={code.toUpperCase()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: collapsed ? '5px' : '5px 10px',
                borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                cursor: 'pointer',
                border: `1px solid ${lang === code ? 'var(--gold)' : 'rgba(255,255,255,.2)'}`,
                background: lang === code ? 'var(--gold)' : 'transparent',
                color: lang === code ? 'var(--green)' : 'rgba(255,255,255,.6)',
                justifyContent: 'center',
              }}
            >
              <Flag />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── User footer ── */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 14px',
        borderTop: '1px solid rgba(255,255,255,.1)',
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : '8px',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: 'var(--gold)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 800, fontSize: '13px',
          color: 'var(--green)', flexShrink: 0,
        }}>
          {initials}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '10px' }}>
              {t(lang, 'role_label')}
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={handleLogout}
            title={lang === 'de' ? 'Abmelden' : 'Sair'}
            style={{
              background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
              borderRadius: '7px', cursor: 'pointer', color: 'rgba(255,255,255,.7)',
              padding: '6px 9px', fontSize: '13px', flexShrink: 0, lineHeight: 1,
            }}
          >
            ⎋
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={handleLogout}
          title={lang === 'de' ? 'Abmelden' : 'Sair'}
          style={{
            margin: '0 8px 12px', background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.15)', borderRadius: '7px',
            cursor: 'pointer', color: 'rgba(255,255,255,.7)', padding: '8px',
            fontSize: '14px', lineHeight: 1,
          }}
        >
          ⎋
        </button>
      )}

    </div>
  )
}
