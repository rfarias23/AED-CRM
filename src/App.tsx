import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ErrorBoundary from './components/shared/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import PageShell from './components/layout/PageShell'
import Login from './routes/Login'
import Dashboard from './routes/Dashboard'
import FeeCalculator from './routes/FeeCalculator'
import Opportunities from './routes/Opportunities'
import OpportunityForm from './routes/Opportunities/OpportunityForm'
import OpportunityDetail from './routes/Opportunities/OpportunityDetail'
import Contacts from './routes/Contacts'
import ContactForm from './routes/Contacts/ContactForm'
import ContactDetail from './routes/Contacts/ContactDetail'
import Expenses from './routes/Expenses'
import ExpenseForm from './routes/Expenses/ExpenseForm'
import Trips from './routes/Trips'
import TripForm from './routes/Trips/TripForm'
import TripDetail from './routes/Trips/TripDetail'
import TripReport from './routes/Trips/TripReport'
import CommercialPlan from './routes/CommercialPlan'
import Reports from './routes/Reports'
import Settings from './routes/Settings'
import TeamManagement from './routes/TeamManagement'
import { seedIfEmpty } from './lib/db'
import { useSettingsStore } from './stores/useSettingsStore'
import { useCurrencyStore } from './stores/useCurrencyStore'
import { Building2 } from 'lucide-react'

export default function App() {
  const loadSettings = useSettingsStore((s) => s.load)
  const loadCurrency = useCurrencyStore((s) => s.load)
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    async function init() {
      await seedIfEmpty()
      await loadSettings()
      await loadCurrency()
      setAppReady(true)
    }
    init()
  }, [loadSettings, loadCurrency])

  // Branded loading screen while DB seed + stores initialize
  if (!appReady) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent rounded-2xl mb-4 animate-pulse">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-xl text-ink mb-1">FyF Public Relations</h1>
          <p className="text-sm text-muted mb-4">Management Center</p>
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes — require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route element={<PageShell />}>
                <Route index element={<Dashboard />} />
                <Route path="calculator" element={<FeeCalculator />} />
                <Route path="opportunities" element={<Opportunities />} />
                <Route path="opportunities/new" element={<OpportunityForm />} />
                <Route path="opportunities/:id" element={<OpportunityDetail />} />
                <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="contacts/new" element={<ContactForm />} />
                <Route path="contacts/:id" element={<ContactDetail />} />
                <Route path="contacts/:id/edit" element={<ContactForm />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="expenses/new" element={<ExpenseForm />} />
                <Route path="expenses/:id/edit" element={<ExpenseForm />} />
                <Route path="trips" element={<Trips />} />
                <Route path="trips/new" element={<TripForm />} />
                <Route path="trips/:id" element={<TripDetail />} />
                <Route path="trips/:id/edit" element={<TripForm />} />
                <Route path="trips/:id/report" element={<TripReport />} />
                <Route path="plan" element={<CommercialPlan />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />

                {/* Admin-only routes */}
                <Route element={<AdminRoute />}>
                  <Route path="team" element={<TeamManagement />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
