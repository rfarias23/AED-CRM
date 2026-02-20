// ─────────────────────────────────────────────────
// Store Reset — Clears all Zustand stores on logout
// Prevents stale data from leaking between user sessions.
// Called by closeUserDb() in db.ts.
// ─────────────────────────────────────────────────

import { useOpportunityStore } from '@/stores/useOpportunityStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useContactStore } from '@/stores/useContactStore'
import { usePlanStore } from '@/stores/usePlanStore'
import { useTripStore } from '@/stores/useTripStore'
import { useReportStore } from '@/stores/useReportStore'
import { useIntensityStore } from '@/stores/useIntensityStore'
import { useCurrencyStore } from '@/stores/useCurrencyStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Reset every Zustand store to its initial (empty) state.
 * This ensures that when a different user logs in, they don't
 * see stale in-memory data from the previous session.
 */
export function resetAllStores(): void {
  useOpportunityStore.setState({ opportunities: [], loading: false })
  useExpenseStore.setState({ expenses: [], loading: false })
  useContactStore.setState({ contacts: [], loading: false })
  usePlanStore.setState({ plans: [], loading: false })
  useTripStore.setState({ trips: [], loading: false })
  useReportStore.setState({ snapshots: [], loading: false })
  useIntensityStore.setState({ config: null, snapshots: [], loading: false })
  useCurrencyStore.setState({ rates: [], rateMap: new Map(), loading: false })
  useSettingsStore.setState({
    displayCurrency: 'USD',
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    activeQuarterId: undefined,
    profileName: '',
    profileCompany: '',
    profileEmail: '',
    loaded: false,
  })
}
