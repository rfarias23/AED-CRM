import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useTripStore } from '@/stores/useTripStore'
import DataTable from '@/components/shared/DataTable'
import CountryFlag from '@/components/shared/CountryFlag'
import { StatusBadge } from '@/components/shared/Badge'
import EmptyState from '@/components/shared/EmptyState'
import MoneyDisplay from '@/components/shared/MoneyDisplay'
import { formatDate } from '@/lib/formatters'
import type { Trip, TripStatus } from '@/lib/types'
import { Plus, Plane } from 'lucide-react'

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Borrador',
  submitted: 'Enviado',
  approved: 'Aprobado',
  closed: 'Cerrado',
}

const STATUS_VARIANTS: Record<TripStatus, 'default' | 'info' | 'success' | 'warning'> = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
  closed: 'warning',
}

const col = createColumnHelper<Trip>()

const columns = [
  col.accessor('name', {
    header: 'Viaje',
    cell: (info) => (
      <Link to={`/trips/${info.row.original.id}`} className="font-medium text-accent hover:underline">
        {info.getValue()}
      </Link>
    ),
  }),
  col.accessor('country', {
    header: 'Destino',
    cell: (info) => (
      <span className="flex items-center gap-1.5">
        <CountryFlag code={info.getValue()} size="sm" />
        <span className="text-sm">{info.getValue()}</span>
        {info.row.original.city && (
          <span className="text-xs text-muted">— {info.row.original.city}</span>
        )}
      </span>
    ),
  }),
  col.accessor('departureDate', {
    header: 'Salida',
    cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
  }),
  col.accessor('returnDate', {
    header: 'Retorno',
    cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
  }),
  col.accessor('status', {
    header: 'Estado',
    cell: (info) => (
      <StatusBadge label={STATUS_LABELS[info.getValue()]} variant={STATUS_VARIANTS[info.getValue()]} />
    ),
  }),
  col.accessor('budgetUSD', {
    header: 'Presupuesto',
    cell: (info) => (
      info.getValue() ? <MoneyDisplay amount={info.getValue()!} currency="USD" compact /> : <span className="text-muted">—</span>
    ),
  }),
  col.accessor('actualUSD', {
    header: 'Gastos',
    cell: (info) => <MoneyDisplay amount={info.getValue()} currency="USD" compact />,
  }),
]

export default function Trips() {
  const trips = useTripStore((s) => s.trips)
  const loading = useTripStore((s) => s.loading)
  const load = useTripStore((s) => s.load)

  useEffect(() => { load() }, [load])

  if (loading) return <p className="text-muted">Cargando viajes...</p>

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={<Plane className="w-12 h-12" />}
        title="Sin viajes"
        description="Comienza registrando tu primer viaje de negocios."
        action={
          <Link to="/trips/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            <Plus className="w-4 h-4" /> Nuevo Viaje
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl">Viajes</h1>
        <Link to="/trips/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Viaje
        </Link>
      </div>
      <DataTable data={trips} columns={columns} searchPlaceholder="Buscar viajes..." />
    </div>
  )
}
