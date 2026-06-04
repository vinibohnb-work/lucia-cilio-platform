import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'

const G = '#0d3b20'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const FlagPT = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px' }}>
    <rect width="8" height="14" fill="#006600"/><rect x="8" width="12" height="14" fill="#CC0000"/>
    <ellipse cx="8" cy="7" rx="2.8" ry="3.5" fill="#FFFF00" stroke="#006600" strokeWidth="0.4"/>
    <ellipse cx="8" cy="7" rx="1.6" ry="2.0" fill="#fff" stroke="#003399" strokeWidth="0.4"/>
  </svg>
)
const FlagDE = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px' }}>
    <rect y="0" width="20" height="4.67" fill="#000"/><rect y="4.67" width="20" height="4.67" fill="#CC0000"/><rect y="9.33" width="20" height="4.67" fill="#FFCE00"/>
  </svg>
)

export default function AdminHome() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { lang, setLang } = useLang()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const L = lang === 'de' ? {
    title: 'Administration', badge: 'Administrator',
    soon: 'Verwaltungsbereich in Vorbereitung',
    soonSub: 'Hier verwalten Sie künftig Mandanten, Zugänge und plattformweite Einstellungen.',
    openPlatform: 'Mandanten-Plattform öffnen →', logout: 'Abmelden',
  } : {
    title: 'Administração', badge: 'Administrador',
    soon: 'Área de administração em construção',
    soonSub: 'Aqui irá gerir clientes, acessos e definições globais da plataforma.',
    openPlatform: 'Abrir plataforma do cliente →', logout: 'Sair',
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: G, padding: '0 28px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px' }}>{L.title}</div>
            <div style={{ color: GOLD, fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{L.badge}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[['pt', FlagPT], ['de', FlagDE]].map(([code, Flag]) => (
              <button key={code} onClick={() => setLang(code)} style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 9px', borderRadius: '6px',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${lang === code ? GOLD : 'rgba(255,255,255,.25)'}`,
                background: lang === code ? GOLD : 'transparent', color: lang === code ? G : 'rgba(255,255,255,.8)',
              }}><Flag /> {code.toUpperCase()}</button>
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '12px' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            {L.logout}
          </button>
        </div>
      </div>

      {/* Placeholder content */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 28px' }}>
        <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #dde8de', padding: '52px 48px', textAlign: 'center', maxWidth: '480px', boxShadow: '0 8px 30px rgba(13,59,32,.06)' }}>
          <div style={{ fontSize: '46px', marginBottom: '18px' }}>🛠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: G, margin: '0 0 10px' }}>{L.soon}</h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 28px' }}>{L.soonSub}</p>
          <button onClick={() => navigate('/contabilidade/dashboard')} style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: G, color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
            {L.openPlatform}
          </button>
        </div>
      </div>

    </div>
  )
}
