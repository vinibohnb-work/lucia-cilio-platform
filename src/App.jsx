import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './context/LangContext'
import { SidebarProvider, useSidebar } from './context/SidebarContext'

// Public pages
import Landing from './pages/Landing'
import DiagnosticoPublico from './pages/DiagnosticoPublico'

// Internal layout
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'

// Internal pages
import Clientes from './pages/contabilidade/Clientes'
import LivroCaixa from './pages/contabilidade/LivroCaixa'
import ObrigacoesFiscais from './pages/contabilidade/ObrigacoesFiscais'
import Precificacao from './pages/contabilidade/Precificacao'

function AppLayout() {
  const { collapsed } = useSidebar()
  const ml = collapsed ? '64px' : '248px'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: ml, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left .22s ease' }}>
        <Topbar />
        <main style={{ flex: 1, padding: '24px 28px', background: 'var(--bg)', minWidth: 0 }}>
          <Routes>
            <Route path="/contabilidade/caixa"         element={<LivroCaixa />} />
            <Route path="/contabilidade/precificacao"  element={<Precificacao />} />
            <Route path="/contabilidade/clientes"      element={<Clientes />} />
            <Route path="/contabilidade/obrigacoes"    element={<ObrigacoesFiscais />} />
            <Route path="*"                            element={<LivroCaixa />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"                      element={<Landing />} />
            <Route path="/diagnostico-gratuito"  element={<DiagnosticoPublico />} />
            <Route path="/*"                     element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </LangProvider>
  )
}
