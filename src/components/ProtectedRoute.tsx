import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { guest, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <main className="shell">Loading your evening...</main>
  }

  if (!guest) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
