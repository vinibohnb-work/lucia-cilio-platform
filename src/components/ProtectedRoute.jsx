import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading, mustChangePassword } = useAuth()
  const { pathname } = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f2f6f3', color: '#0a2f1a', fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: '14px', fontWeight: 600,
      }}>
        <span style={{ opacity: 0.6 }}>A carregar…</span>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  // Palavra-passe temporária por trocar: só se sai daqui depois de a mudar.
  if (mustChangePassword && pathname !== '/definir-senha') {
    return <Navigate to="/definir-senha" replace />
  }

  return children
}
