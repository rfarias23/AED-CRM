import { Link } from 'react-router-dom'
import ExpenseList from './ExpenseList'
import ExpenseDashboard from './ExpenseDashboard'
import { Plus } from 'lucide-react'

export default function Expenses() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl">Gastos</h1>
        <Link
          to="/expenses/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </Link>
      </div>
      <ExpenseDashboard />
      <div className="mt-6">
        <ExpenseList />
      </div>
    </div>
  )
}
