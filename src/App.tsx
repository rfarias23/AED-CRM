import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import PageShell from './components/layout/PageShell'
import Dashboard from './routes/Dashboard'
import FeeCalculator from './routes/FeeCalculator'
import Opportunities from './routes/Opportunities'
import OpportunityForm from './routes/Opportunities/OpportunityForm'
import OpportunityDetail from './routes/Opportunities/OpportunityDetail'
import Contacts from './routes/Contacts'
import Expenses from './routes/Expenses'
import CommercialPlan from './routes/CommercialPlan'
import Reports from './routes/Reports'
import Settings from './routes/Settings'
import { seedIfEmpty } from './lib/db'
import { useSettingsStore } from './stores/useSettingsStore'
import { useCurrencyStore } from './stores/useCurrencyStore'

export default function App() {
  const loadSettings = useSettingsStore((s) => s.load)
  const loadCurrency = useCurrencyStore((s) => s.load)

  useEffect(() => {
    async function init() {
      await seedIfEmpty()
      await loadSettings()
      await loadCurrency()
    }
    init()
  }, [loadSettings, loadCurrency])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PageShell />}>
          <Route index element={<Dashboard />} />
          <Route path="calculator" element={<FeeCalculator />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="opportunities/new" element={<OpportunityForm />} />
          <Route path="opportunities/:id" element={<OpportunityDetail />} />
          <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="plan" element={<CommercialPlan />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
