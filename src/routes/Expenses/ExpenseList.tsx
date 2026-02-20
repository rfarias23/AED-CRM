import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useExpenseStore } from '@/stores/useExpenseStore'
import DataTable from '@/components/shared/DataTable'
import MoneyDisplay from '@/components/shared/MoneyDisplay'
import { StatusBadge } from '@/components/shared/Badge'
import EmptyState from '@/components/shared/EmptyState'
import { formatDate } from '@/lib/formatters'
import type { Expense, ExpenseType } from '@/lib/types'
import CountryFlag from '@/components/shared/CountryFlag'
import { Plus, Receipt } from 'lucide-react'

const TYPE_LABELS: Record<ExpenseType, string> = {
  travel: 'Viaje',
  accommodation: 'Alojamiento',
  meals: 'Alimentación',
  transport: 'Transporte',
  communication: 'Comunicaciones',
  subscriptions: 'Suscripciones',
  office: 'Oficina',
  representation: 'Representación',
  professional_services: 'Servicios Prof.',
  other: 'Otro',
}

const col = createColumnHelper<Expense>()

const columns = [
  col.accessor('date', {
    header: 'Fecha',
    cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
  }),
  col.accessor('type', {
    header: 'Tipo',
    cell: (info) => <StatusBadge label={TYPE_LABELS[info.getValue()]} variant="info" />,
  }),
  col.accessor('description', {
    header: 'Descripción',
    cell: (info) => (
      <Link to={`/expenses/${info.row.original.id}/edit`} className="text-sm font-medium text-accent hover:underline">
        {info.getValue()}
      </Link>
    ),
  }),
  col.accessor('vendor', {
    header: 'Proveedor',
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
  col.accessor('amountOriginal', {
    header: () => <span title="Valor original del gasto en la moneda local de la transacción.">Monto</span>,
    cell: (info) => (
      <MoneyDisplay amount={info.getValue()} currency={info.row.original.currency} compact />
    ),
  }),
  col.accessor('amountUSD', {
    header: () => <span title="Equivalente en dólares estadounidenses, convertido al tipo de cambio del momento.">USD</span>,
    cell: (info) => <MoneyDisplay amount={info.getValue()} currency="USD" compact />,
  }),
]

export default function ExpenseList() {
  const expenses = useExpenseStore((s) => s.expenses)
  const loading = useExpenseStore((s) => s.loading)
  const load = useExpenseStore((s) => s.load)

  useEffect(() => { load() }, [load])

  if (loading) return <p className="text-muted">Cargando gastos...</p>

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="w-12 h-12" />}
        title="Sin gastos"
        description="Comienza registrando tu primer gasto."
        action={
          <Link to="/expenses/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            <Plus className="w-4 h-4" /> Nuevo Gasto
          </Link>
        }
      />
    )
  }

  return <DataTable data={expenses} columns={columns} searchPlaceholder="Buscar gastos..." />
}
