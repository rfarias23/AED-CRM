// ─────────────────────────────────────────────────
// ProtectedRoute — Requires authentication
// Shows loading spinner while checking auth state
// Redirects to /login if not authenticated
// ─────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { seedDemoData } from '@/lib/db'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const seeded = useRef(false)

  // Seed demo data only for admin users (once per session)
  useEffect(() => {
    if (user?.role === 'admin' && !seeded.current) {
      seeded.current = true
      seedDemoData()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
