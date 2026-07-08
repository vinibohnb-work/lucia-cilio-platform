import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LangProvider, useLang } from './context/LangContext'
import { SidebarProvider, useSidebar } from './context/SidebarContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { useIsMobile } from './hooks/useIsMobile'

// Public pages
import Login from './pages/Login'
import DefinirSenha from './pages/DefinirSenha'

// Auth guards
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'

// Admin
import AdminHome from './pages/admin/AdminHome'

// Internal layout
import Sidebar from './components/layout/Sidebar'

// Internal pages
import Dashboard from './pages/contabilidade/Dashboard'
import Clientes from './pages/contabilidade/Clientes'
import LivroCaixa from './pages/contabilidade/LivroCaixa'
import ObrigacoesFiscais from './pages/contabilidade/ObrigacoesFiscais'
import Precificacao from './pages/contabilidade/Precificacao'
import Catalogo from './pages/contabilidade/Catalogo'
import DespesasRecorrentes from './pages/contabilidade/DespesasRecorrentes'
import Empresa from './pages/Empresa'

function AppLayout() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar()
  const isMobile = useIsMobile()
  const { lang } = useLang()
  const { t } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const ml = isMobile ? '0' : '238px'

  // FAB "Nova Entrada" apenas no Dashboard e no Livro de Caixa
  const showFab = pathname.startsWith('/contabilidade/dashboard') || pathname.startsWith('/contabilidade/caixa')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.appBg, fontFamily: t.fontBody }}>
      <Sidebar />
      {/* Backdrop do drawer no mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 90 }}
        />
      )}
      <div style={{ marginLeft: ml, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', transition: 'margin-left .22s ease' }}>
        <main style={{
          flex: 1, background: t.mainBg, minWidth: 0, color: t.text, fontFamily: t.fontBody,
          padding: isMobile ? 'calc(env(safe-area-inset-top) + 64px) 14px 40px' : '30px 34px 40px',
        }}>
          <Routes>
            <Route path="/contabilidade/dashboard"     element={<Dashboard />} />
            <Route path="/contabilidade/caixa"         element={<LivroCaixa />} />
            <Route path="/contabilidade/recorrentes"   element={<DespesasRecorrentes />} />
            <Route path="/contabilidade/catalogo"      element={<Catalogo />} />
            <Route path="/contabilidade/precificacao"  element={<Precificacao />} />
            <Route path="/contabilidade/clientes"      element={<Clientes />} />
            <Route path="/contabilidade/obrigacoes"    element={<ObrigacoesFiscais />} />
            <Route path="/contabilidade/empresa"       element={<Empresa />} />
            <Route path="/admin"                       element={<RoleRoute requireRole="admin"><AdminHome /></RoleRoute>} />
            <Route path="*"                            element={<Dashboard />} />
          </Routes>
        </main>
      </div>

      {/* Botão flutuante de menu (mobile) — substitui o cabeçalho */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Menu"
          style={{
            position: 'fixed', top: 'calc(env(safe-area-inset-top) + 12px)', left: '12px', zIndex: 80,
            width: '42px', height: '42px', borderRadius: '11px', border: `1px solid ${t.cardBorder}`,
            background: t.cardBg, color: t.accent, fontSize: '19px', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(0,0,0,.18)', backdropFilter: 'blur(6px)',
          }}
        >
          ☰
        </button>
      )}

      {/* FAB Nova Entrada (Dashboard / Livro de Caixa) */}
      {showFab && (
        <button
          onClick={() => navigate('/contabilidade/caixa?new=1')}
          style={{
            position: 'fixed', zIndex: 80,
            bottom: 'calc(env(safe-area-inset-bottom) + 22px)', right: '22px',
            padding: '13px 22px', borderRadius: '999px', border: 'none',
            background: t.btnBg, color: t.btnInk, fontWeight: 700, fontSize: '14px',
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,.28)',
            display: 'flex', alignItems: 'center', gap: '7px',
            transition: 'transform .15s, box-shadow .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1, color: t.accent }}>+</span>
          {lang === 'de' ? 'Neue Buchung' : 'Nova Entrada'}
        </button>
      )}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
    <LangProvider>
      <AuthProvider>
        <SidebarProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/"                      element={<Navigate to="/login" replace />} />
              <Route path="/login"                 element={<Login />} />
              <Route path="/definir-senha"         element={<DefinirSenha />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </AuthProvider>
    </LangProvider>
    </ThemeProvider>
  )
}
