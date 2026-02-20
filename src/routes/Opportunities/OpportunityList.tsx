import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useOpportunityStore } from '@/stores/useOpportunityStore'
import DataTable from '@/components/shared/DataTable'
import { StageBadge } from '@/components/shared/Badge'
import CountryFlag from '@/components/shared/CountryFlag'
import MoneyDisplay from '@/components/shared/MoneyDisplay'
import EmptyState from '@/components/shared/EmptyState'
import type { Opportunity } from '@/lib/types'
import { formatDate } from '@/lib/formatters'
import { Plus, Target } from 'lucide-react'

const col = createColumnHelper<Opportunity>()

const columns = [
  col.accessor('name', {
    header: 'Proyecto',
    cell: (info) => (
      <Link
        to={`/opportunities/${info.row.original.id}`}
        className="font-medium text-accent hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  col.accessor('client', {
    header: 'Cliente',
    cell: (info) => <span className="text-sm">{info.getValue()}</span>,
  }),
  col.accessor('country', {
    header: 'País',
    cell: (info) => (
      <span className="flex items-center gap-1.5">
        <CountryFlag code={info.getValue()} size="sm" />
        <span className="text-sm">{info.getValue()}</span>
      </span>
    ),
  }),
  col.accessor('stage', {
    header: 'Etapa',
    cell: (info) => <StageBadge stage={info.getValue()} />,
  }),
  col.accessor('aschValueUSD', {
    header: 'ASCH USD',
    cell: (info) => (
      <MoneyDisplay amount={info.getValue()} currency="USD" compact />
    ),
  }),
  col.accessor('probabilityOfAward', {
    header: 'PoA',
    cell: (info) => (
      <span className="font-mono text-sm">{(info.getValue() * 100).toFixed(0)}%</span>
    ),
  }),
  col.accessor('expectedCloseDate', {
    header: 'Cierre Est.',
    cell: (info) => (
      <span className="text-sm text-muted">
        {info.getValue() ? formatDate(info.getValue()) : '—'}
      </span>
    ),
  }),
]

export default function OpportunityList() {
  const opportunities = useOpportunityStore((s) => s.opportunities)
  const loading = useOpportunityStore((s) => s.loading)
  const load = useOpportunityStore((s) => s.load)

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <p className="text-muted">Cargando oportunidades...</p>

  if (opportunities.length === 0) {
    return (
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
    )
  }

  return <DataTable data={opportunities} columns={columns} searchPlaceholder="Buscar oportunidades..." />
}
