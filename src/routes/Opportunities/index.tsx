import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOpportunityStore } from '@/stores/useOpportunityStore'
import OpportunityList from './OpportunityList'
import KanbanBoard from '@/components/pipeline/KanbanBoard'
import PipelineFeesSummary from '@/components/commission/PipelineFeesSummary'
import EmptyState from '@/components/shared/EmptyState'
import { Plus, LayoutGrid, List, Target } from 'lucide-react'

type ViewMode = 'kanban' | 'list'

export default function Opportunities() {
  const [view, setView] = useState<ViewMode>('kanban')
  const opportunities = useOpportunityStore((s) => s.opportunities)
  const loading = useOpportunityStore((s) => s.loading)
  const load = useOpportunityStore((s) => s.load)

  useEffect(() => { load() }, [load])

  if (loading) return <p className="text-muted">Cargando oportunidades...</p>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-2xl">Oportunidades</h1>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-cream rounded-lg p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                view === 'kanban' ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
              }`}
              title="Vista Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${
                view === 'list' ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/opportunities/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </Link>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState
          icon={<Target className="w-12 h-12" />}
          title="Sin oportunidades"
          description="Comienza agregando tu primera oportunidad al pipeline."
          action={
            <Link
              to="/opportunities/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Oportunidad
            </Link>
          }
        />
      ) : (
        <>
          {/* Pipeline KPI summary */}
          <div className="mb-6">
            <PipelineFeesSummary />
          </div>

          {/* Main view */}
          {view === 'kanban' ? (
            <KanbanBoard opportunities={opportunities} />
          ) : (
            <OpportunityList />
          )}
        </>
      )}
    </div>
  )
}
