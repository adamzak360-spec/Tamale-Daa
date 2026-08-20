import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
  sellerOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false, sellerOnly = false }: ProtectedRouteProps) {
  const { user, isAdmin, isSeller, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Checking authentication...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (sellerOnly && !isSeller) {
    return (
      <div className="admin-page" style={{ padding: 60, textAlign: 'center' }}>
        <h2>Access restricted</h2>
        <p>You don't have an approved seller store yet.</p>
        <p style={{ marginTop: 12 }}><a href="/seller-register" style={{ color: '#2563eb' }}>Apply to become a seller</a></p>
      </div>
    )
  }

  return <>{children}</>
}
