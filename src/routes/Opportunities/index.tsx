import { Link } from 'react-router-dom'
import OpportunityList from './OpportunityList'
import { Plus } from 'lucide-react'

export default function Opportunities() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl">Oportunidades</h1>
        <Link
          to="/opportunities/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </Link>
      </div>
      <OpportunityList />
    </div>
  )
}
