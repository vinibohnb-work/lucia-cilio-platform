import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../lib/platformHome'

const Loading = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f2f6f3', color: '#0a2f1a', fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: '14px', fontWeight: 600,
  }}>
    <span style={{ opacity: 0.6 }}>A carregar…</span>
  </div>
)

// Protege rotas por papel. requireRole aceita um papel ou uma lista
// (ex.: 'admin' ou ['admin','comercial']); undefined = qualquer autenticado.
export default function RoleRoute({ requireRole, children }) {
  const { session, role, platform, loading } = useAuth()

  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace />

  const allowed = requireRole == null ? null : (Array.isArray(requireRole) ? requireRole : [requireRole])
  if (allowed && !allowed.includes(role)) {
    // Sem permissão para esta área → volta à página inicial do seu papel
    return <Navigate to={homePathFor(role, platform)} replace />
  }

  return children
}
