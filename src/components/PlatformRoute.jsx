import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathFor, basePlatform } from '../lib/platformHome'

const Loading = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f2f6f3', color: '#0a2f1a', fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: '14px', fontWeight: 600,
  }}>
    <span style={{ opacity: 0.6 }}>A carregar…</span>
  </div>
)

// Protege rotas por plataforma. O admin acede a tudo; os restantes só à sua.
export default function PlatformRoute({ requirePlatform, children }) {
  const { session, role, platform, loading } = useAuth()

  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace />

  // 'both' acede a ambas as plataformas (tal como o admin).
  // 'accounting_lite' é Contabilidade — o que muda é o âmbito de páginas,
  // aplicado no ProtectedRoute (que cobre também rotas fora deste guarda).
  if (role !== 'admin' && platform !== 'both' && requirePlatform && basePlatform(platform) !== requirePlatform) {
    return <Navigate to={homePathFor(role, platform)} replace />
  }

  // Como layout route (sem children) → renderiza as rotas aninhadas.
  return children || <Outlet />
}
