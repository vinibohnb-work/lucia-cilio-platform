import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Loading = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f2f6f3', color: '#0d3b20', fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: '14px', fontWeight: 600,
  }}>
    <span style={{ opacity: 0.6 }}>A carregar…</span>
  </div>
)

// Protege rotas por role. requireRole: 'admin' | 'user' | undefined (qualquer autenticado)
export default function RoleRoute({ requireRole, children }) {
  const { session, role, loading } = useAuth()

  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace />

  if (requireRole === 'admin' && role !== 'admin') {
    // Um utilizador normal não acede à área de admin → vai para a plataforma
    return <Navigate to="/contabilidade/dashboard" replace />
  }

  return children
}
