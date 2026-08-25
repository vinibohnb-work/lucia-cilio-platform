import { lazy, Suspense } from 'react'
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

// Internal layout (sempre presente — não faz sentido dividir)
import Sidebar from './components/layout/Sidebar'
import FiscalBell from './components/FiscalBell'

// ── Páginas carregadas a pedido (code splitting por rota) ──
// Cada plataforma só descarrega o seu próprio código: o arranque deixa de
// puxar as três plataformas de uma vez.
const AdminHome           = lazy(() => import('./pages/admin/AdminHome'))
const ClientesAtivos      = lazy(() => import('./pages/gestao/ClientesAtivos'))
const ClienteDetalhe      = lazy(() => import('./pages/gestao/ClienteDetalhe'))
const Crm                 = lazy(() => import('./pages/gestao/Crm'))
const Financeiro          = lazy(() => import('./pages/gestao/Financeiro'))
const Marketing           = lazy(() => import('./pages/gestao/Marketing'))
const Consultorias        = lazy(() => import('./pages/gestao/Consultorias'))
const ConsultoriaDetalhe  = lazy(() => import('./pages/gestao/ConsultoriaDetalhe'))
const ConsultoriaRelatorio= lazy(() => import('./pages/gestao/ConsultoriaRelatorio'))
const Consultoria         = lazy(() => import('./pages/Consultoria'))

const Dashboard           = lazy(() => import('./pages/contabilidade/Dashboard'))
const Clientes            = lazy(() => import('./pages/contabilidade/Clientes'))
const LivroCaixa          = lazy(() => import('./pages/contabilidade/LivroCaixa'))
const ObrigacoesFiscais   = lazy(() => import('./pages/contabilidade/ObrigacoesFiscais'))
const Precificacao        = lazy(() => import('./pages/contabilidade/Precificacao'))
const Catalogo            = lazy(() => import('./pages/contabilidade/Catalogo'))
const DespesasRecorrentes = lazy(() => import('./pages/contabilidade/DespesasRecorrentes'))
const RucklagenSteuern    = lazy(() => import('./pages/contabilidade/RucklagenSteuern'))
const RelatorioEUR        = lazy(() => import('./pages/contabilidade/RelatorioEUR'))
const Conciliacao         = lazy(() => import('./pages/contabilidade/Conciliacao'))
const PlaneamentoMensal   = lazy(() => import('./pages/contabilidade/PlaneamentoMensal'))
const Empresa             = lazy(() => import('./pages/Empresa'))

const DiagnosticoESG      = lazy(() => import('./pages/esg/Diagnostico'))
const Materialidade       = lazy(() => import('./pages/esg/Materialidade'))
const KPIs                = lazy(() => import('./pages/esg/KPIs'))
const ProjetosESG         = lazy(() => import('./pages/esg/ProjetosESG'))
const RelatoriosESG       = lazy(() => import('./pages/esg/RelatoriosESG'))

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
          <Suspense fallback={<div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>…</div>}>
          <Routes>
            {/* Plataforma Contabilidade */}
            <Route element={<PlatformRoute requirePlatform="accounting" />}>
              <Route path="/contabilidade/dashboard"     element={<Dashboard />} />
              <Route path="/contabilidade/caixa"         element={<LivroCaixa />} />
              <Route path="/contabilidade/conciliacao"   element={<Conciliacao />} />
              <Route path="/contabilidade/recorrentes"   element={<DespesasRecorrentes />} />
              <Route path="/contabilidade/catalogo"      element={<Catalogo />} />
              <Route path="/contabilidade/precificacao"  element={<Precificacao />} />
              <Route path="/contabilidade/clientes"      element={<Clientes />} />
              <Route path="/contabilidade/obrigacoes"    element={<ObrigacoesFiscais />} />
              <Route path="/contabilidade/empresa"       element={<Empresa />} />
              <Route path="/contabilidade/rucklagen"     element={<RucklagenSteuern />} />
              <Route path="/contabilidade/eur"           element={<RelatorioEUR />} />
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
            <Route path="/gestao/clientes/:id"  element={<RoleRoute requireRole="admin"><ClienteDetalhe /></RoleRoute>} />
            <Route path="/gestao/crm"           element={<RoleRoute requireRole={['admin', 'comercial']}><Crm /></RoleRoute>} />
            <Route path="/gestao/consultorias"     element={<RoleRoute requireRole="admin"><Consultorias /></RoleRoute>} />
            <Route path="/gestao/consultorias/:id" element={<RoleRoute requireRole="admin"><ConsultoriaDetalhe /></RoleRoute>} />
            <Route path="/gestao/consultorias/:id/relatorio" element={<RoleRoute requireRole="admin"><ConsultoriaRelatorio /></RoleRoute>} />
            <Route path="/gestao/marketing"     element={<RoleRoute requireRole={['admin', 'marketing']}><Marketing /></RoleRoute>} />
            <Route path="/gestao/financeiro"    element={<RoleRoute requireRole="admin"><Financeiro /></RoleRoute>} />
            <Route path="/gestao/acessos"       element={<RoleRoute requireRole="admin"><AdminHome /></RoleRoute>} />
            <Route path="/admin"                element={<Navigate to="/gestao/clientes" replace />} />
            <Route path="*"               element={<HomeRedirect />} />
          </Routes>
          </Suspense>
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
            background: t.cardBg, color: t.accentText, fontSize: '19px', lineHeight: 1,
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
          <span style={{ fontSize: '18px', lineHeight: 1, color: t.accentText }}>+</span>
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
