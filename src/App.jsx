import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LangProvider, useLang } from './context/LangContext'
import { SidebarProvider, useSidebar } from './context/SidebarContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { ViewAsProvider, useViewAs } from './context/ViewAsContext'
import { useIsMobile } from './hooks/useIsMobile'
import ViewAsBanner from './components/ViewAsBanner'

// Public pages
import Login from './pages/Login'
import DefinirSenha from './pages/DefinirSenha'

// Auth guards
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import PlatformRoute from './components/PlatformRoute'
import { useAuth } from './context/AuthContext'
import { homePathFor } from './lib/platformHome'

// Admin
import AdminHome from './pages/admin/AdminHome'
import ClientesAtivos from './pages/gestao/ClientesAtivos'
import Consultorias from './pages/gestao/Consultorias'
import Consultoria from './pages/Consultoria'

// Internal layout
import Sidebar from './components/layout/Sidebar'
import FiscalBell from './components/FiscalBell'

// Internal pages
import Dashboard from './pages/contabilidade/Dashboard'
import Clientes from './pages/contabilidade/Clientes'
import LivroCaixa from './pages/contabilidade/LivroCaixa'
import ObrigacoesFiscais from './pages/contabilidade/ObrigacoesFiscais'
import Precificacao from './pages/contabilidade/Precificacao'
import Catalogo from './pages/contabilidade/Catalogo'
import DespesasRecorrentes from './pages/contabilidade/DespesasRecorrentes'
import RucklagenSteuern from './pages/contabilidade/RucklagenSteuern'
import PlaneamentoMensal from './pages/contabilidade/PlaneamentoMensal'
import Empresa from './pages/Empresa'

// ESG pages
import DiagnosticoESG from './pages/esg/Diagnostico'
import Materialidade from './pages/esg/Materialidade'
import KPIs from './pages/esg/KPIs'
import ProjetosESG from './pages/esg/ProjetosESG'
import RelatoriosESG from './pages/esg/RelatoriosESG'

// Fallback: leva cada utilizador à sua plataforma (nunca vê um seletor)
function HomeRedirect() {
  const { role, platform } = useAuth()
  return <Navigate to={homePathFor(role, platform)} replace />
}

function AppLayout() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar()
  const isMobile = useIsMobile()
  const { lang } = useLang()
  const { t } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const ml = isMobile ? '0' : '238px'

  const { isViewing } = useViewAs()
  // FAB "Nova Entrada" apenas no Dashboard e no Livro de Caixa (e não em "Ver como")
  const showFab = !isViewing && (pathname.startsWith('/contabilidade/dashboard') || pathname.startsWith('/contabilidade/caixa'))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.appBg, fontFamily: t.fontBody }}>
      <Sidebar />
      <FiscalBell />
      {/* Backdrop do drawer no mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 90 }}
        />
      )}
      <div style={{ marginLeft: ml, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', transition: 'margin-left .22s ease' }}>
        <ViewAsBanner />
        <main style={{
          flex: 1, background: t.mainBg, minWidth: 0, color: t.text, fontFamily: t.fontBody,
          padding: isMobile ? 'calc(env(safe-area-inset-top) + 64px) 14px 40px' : '30px 34px 40px',
        }}>
          <Routes>
            {/* Plataforma Contabilidade */}
            <Route element={<PlatformRoute requirePlatform="accounting" />}>
              <Route path="/contabilidade/dashboard"     element={<Dashboard />} />
              <Route path="/contabilidade/caixa"         element={<LivroCaixa />} />
              <Route path="/contabilidade/recorrentes"   element={<DespesasRecorrentes />} />
              <Route path="/contabilidade/catalogo"      element={<Catalogo />} />
              <Route path="/contabilidade/precificacao"  element={<Precificacao />} />
              <Route path="/contabilidade/clientes"      element={<Clientes />} />
              <Route path="/contabilidade/obrigacoes"    element={<ObrigacoesFiscais />} />
              <Route path="/contabilidade/empresa"       element={<Empresa />} />
              <Route path="/contabilidade/rucklagen"     element={<RucklagenSteuern />} />
              <Route path="/contabilidade/planeamento"   element={<PlaneamentoMensal />} />
            </Route>

            {/* Plataforma ESG */}
            <Route element={<PlatformRoute requirePlatform="esg" />}>
              <Route path="/esg/diagnostico"   element={<DiagnosticoESG />} />
              <Route path="/esg/materialidade" element={<Materialidade />} />
              <Route path="/esg/kpis"          element={<KPIs />} />
              <Route path="/esg/projetos"      element={<ProjetosESG />} />
              <Route path="/esg/relatorios"    element={<RelatoriosESG />} />
            </Route>

            {/* Consultoria partilhada (qualquer utilizador autenticado; lê pelo utilizador efetivo) */}
            <Route path="/consultoria" element={<Consultoria />} />

            {/* Plataforma Gestão (apenas admin, por agora) */}
            <Route path="/gestao/clientes"      element={<RoleRoute requireRole="admin"><ClientesAtivos /></RoleRoute>} />
            <Route path="/gestao/consultorias"  element={<RoleRoute requireRole="admin"><Consultorias /></RoleRoute>} />
            <Route path="/gestao/acessos"       element={<RoleRoute requireRole="admin"><AdminHome /></RoleRoute>} />
            <Route path="/admin"                element={<Navigate to="/gestao/clientes" replace />} />
            <Route path="*"               element={<HomeRedirect />} />
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
          {lang === 'de' ? 'Neue Buchung' : lang === 'en' ? 'New Entry' : 'Nova Entrada'}
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
        <ViewAsProvider>
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
        </ViewAsProvider>
      </AuthProvider>
    </LangProvider>
    </ThemeProvider>
  )
}
