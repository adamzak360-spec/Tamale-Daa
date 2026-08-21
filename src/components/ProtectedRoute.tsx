import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyStore } from '../services/marketplaceService'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
  sellerOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false, sellerOnly = false }: ProtectedRouteProps) {
  const { user, isAdmin, isSeller, isLoading } = useAuth()
  const [sellerVerified, setSellerVerified] = useState<boolean | null>(null)

  // Verify approved seller status directly from the sellers table.
  // User metadata is only a fast cache; the sellers table is the source of truth
  // (an admin may approve an application after the session was created).
  useEffect(() => {
    if (!sellerOnly || isLoading || !user) return
    let cancelled = false
    if (isSeller) {
      setSellerVerified(true)
      return
    }
    getMyStore(user.id)
      .then((store) => {
        if (cancelled) return
        setSellerVerified(store?.status === 'approved')
      })
      .catch(() => {
        if (!cancelled) setSellerVerified(false)
      })
    return () => {
      cancelled = true
    }
  }, [sellerOnly, isLoading, user, isSeller])

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

  if (sellerOnly && !isSeller && sellerVerified !== true) {
    if (sellerVerified === null) {
      return (
        <div className="loading-container">
          <div className="spinner" />
          <p>Checking seller access...</p>
        </div>
      )
    }
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
