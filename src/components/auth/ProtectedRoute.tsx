// ─────────────────────────────────────────────────
// ProtectedRoute — Auth gate + per-user DB bootstrap
//
// 1. Waits for Firebase Auth to resolve
// 2. Opens the user's namespaced IndexedDB (AECPipelineDB-{uid})
// 3. Seeds reference data + demo data (admin only)
// 4. Loads settings & currency stores
// 5. Renders <Outlet key={uid}> so all useLiveQuery hooks
//    get fresh subscriptions against the correct database
// ─────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { initUserDb, seedDemoData } from '@/lib/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCurrencyStore } from '@/stores/useCurrencyStore'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const loadSettings = useSettingsStore((s) => s.load)
  const loadCurrency = useCurrencyStore((s) => s.load)
  const [dbReady, setDbReady] = useState(false)

  useEffect(() => {
    if (!user) {
      setDbReady(false)
      return
    }

    let cancelled = false

    async function init() {
      // Open (or reopen) the per-user IndexedDB + seed reference data
      await initUserDb(user!.uid)

      // Seed demo commercial data for admin users only
      if (user!.role === 'admin') {
        await seedDemoData()
      }

      // Load global stores from the user's database
      await loadSettings()
      await loadCurrency()

      if (!cancelled) setDbReady(true)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [user, loadSettings, loadCurrency])

  // Show branded loading spinner while auth or DB initializes
  if (loading || (user && !dbReady)) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-3xl text-ink tracking-tight mb-1">FyF</h1>
          <div className="w-12 h-px bg-accent mx-auto my-2" />
          <p className="text-xs text-muted uppercase tracking-[0.25em] font-medium mb-6">
            Public Relations
          </p>
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // key={uid} forces a full subtree remount when the user changes,
  // guaranteeing all useLiveQuery hooks create fresh subscriptions
  // against the new per-user database instance.
  return <Outlet key={user.uid} />
}
