import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard'
import ProjetosESG from './pages/esg/ProjetosESG'
import Diagnostico from './pages/esg/Diagnostico'
import Materialidade from './pages/esg/Materialidade'
import KPIs from './pages/esg/KPIs'
import RelatoriosESG from './pages/esg/RelatoriosESG'
import Clientes from './pages/contabilidade/Clientes'
import ObrigacoesFiscais from './pages/contabilidade/ObrigacoesFiscais'
import Tarefas from './pages/contabilidade/Tarefas'
import Financeiro from './pages/Financeiro'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ marginLeft: '248px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Topbar />
          <main style={{ flex: 1, padding: '26px 30px', background: 'var(--bg)' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/esg/projetos" element={<ProjetosESG />} />
              <Route path="/esg/diagnostico" element={<Diagnostico />} />
              <Route path="/esg/materialidade" element={<Materialidade />} />
              <Route path="/esg/kpis" element={<KPIs />} />
              <Route path="/esg/relatorios" element={<RelatoriosESG />} />
              <Route path="/contabilidade/clientes" element={<Clientes />} />
              <Route path="/contabilidade/obrigacoes" element={<ObrigacoesFiscais />} />
              <Route path="/contabilidade/tarefas" element={<Tarefas />} />
              <Route path="/financeiro" element={<Financeiro />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
