import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useTripStore } from '@/stores/useTripStore'
import { useAuth } from '@/contexts/AuthContext'
import Card from '@/components/shared/Card'
import KPICard from '@/components/shared/KPICard'
import CountryFlag from '@/components/shared/CountryFlag'
import MoneyDisplay from '@/components/shared/MoneyDisplay'
import { StatusBadge } from '@/components/shared/Badge'
import { formatDate } from '@/lib/formatters'
import type { Expense, TripStatus } from '@/lib/types'
import { Pencil, Trash2, Send, CheckCircle, Lock, FileText } from 'lucide-react'

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Borrador',
  submitted: 'Enviado',
  approved: 'Aprobado',
  closed: 'Cerrado',
}

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { transition, remove } = useTripStore()
  const { user } = useAuth()

  const trip = useLiveQuery(() => (id ? db.trips.get(id) : undefined), [id])
  const expenses = useLiveQuery(
    () => (trip?.expenseIds?.length ? db.expenses.where('id').anyOf(trip.expenseIds).toArray() : Promise.resolve([] as Expense[])),
    [trip?.expenseIds],
  )

  const actualTotal = useMemo(
    () => expenses?.reduce((sum, e) => sum + e.amountUSD, 0) ?? 0,
    [expenses],
  )

  if (!trip) return <p className="text-muted">Cargando viaje...</p>

  const budgetVariance = trip.budgetUSD ? actualTotal - trip.budgetUSD : 0
  const daysCount = Math.ceil(
    (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / (1000 * 60 * 60 * 24),
  )

  async function handleTransition(status: TripStatus) {
    if (!id) return
    await transition(id, status, user?.displayName ?? user?.email ?? undefined)
    // Update actualUSD when closing
    if (status === 'closed') {
      await db.trips.update(id, { actualUSD: actualTotal })
    }
  }

  async function handleDelete() {
    if (!id || !confirm('¿Eliminar este viaje?')) return
    await remove(id)
    navigate('/trips')
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl mb-1">{trip.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <CountryFlag code={trip.country} size="sm" />
              {trip.country}{trip.city ? ` — ${trip.city}` : ''}
            </span>
            <span>{formatDate(trip.departureDate)} → {formatDate(trip.returnDate)}</span>
            <span>{daysCount} día{daysCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge label={STATUS_LABELS[trip.status]} variant={trip.status === 'approved' ? 'success' : trip.status === 'closed' ? 'warning' : 'info'} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Presupuesto" value={trip.budgetUSD ? `$${trip.budgetUSD.toLocaleString()}` : '—'} />
        <KPICard label="Gasto Real" value={`$${actualTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
        <KPICard
          label="Variación"
          value={trip.budgetUSD ? `${budgetVariance >= 0 ? '+' : ''}$${budgetVariance.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
          trend={trip.budgetUSD ? { value: budgetVariance > 0 ? -1 : 1, label: budgetVariance > 0 ? 'Sobre presupuesto' : 'Bajo presupuesto' } : undefined}
        />
        <KPICard label="Gastos" value={String(expenses?.length ?? 0)} subtitle={`${daysCount} días`} />
      </div>

      {/* Trip Info */}
      <Card className="space-y-3">
        <h2 className="font-heading text-lg">Información del Viaje</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted">Propósito:</span>
            <p>{trip.purpose}</p>
          </div>
          {trip.participants && trip.participants.length > 0 && (
            <div>
              <span className="text-muted">Participantes:</span>
              <p>{trip.participants.join(', ')}</p>
            </div>
          )}
          {trip.conclusions && (
            <div className="col-span-2">
              <span className="text-muted">Conclusiones:</span>
              <p>{trip.conclusions}</p>
            </div>
          )}
          {trip.approvedBy && (
            <div>
              <span className="text-muted">Aprobado por:</span>
              <p>{trip.approvedBy} — {trip.approvedAt ? formatDate(trip.approvedAt) : ''}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Expenses table */}
      <Card className="space-y-3">
        <h2 className="font-heading text-lg">Gastos del Viaje ({expenses?.length ?? 0})</h2>
        {expenses && expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Descripción</th>
                  <th className="pb-2 font-medium">Proveedor</th>
                  <th className="pb-2 font-medium text-right">USD</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="py-2">{formatDate(e.date)}</td>
                    <td className="py-2 capitalize">{e.type.replace('_', ' ')}</td>
                    <td className="py-2">{e.description}</td>
                    <td className="py-2">{e.vendor}</td>
                    <td className="py-2 text-right"><MoneyDisplay amount={e.amountUSD} currency="USD" compact /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td colSpan={4} className="pt-2 text-right">Total:</td>
                  <td className="pt-2 text-right"><MoneyDisplay amount={actualTotal} currency="USD" compact /></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">No hay gastos vinculados a este viaje.</p>
        )}
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {trip.status === 'draft' && (
          <>
            <Link to={`/trips/${id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-cream transition-colors">
              <Pencil className="w-4 h-4" /> Editar
            </Link>
            <button onClick={() => handleTransition('submitted')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
              <Send className="w-4 h-4" /> Enviar para Aprobación
            </button>
            <button onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 text-red hover:bg-red/5 rounded-lg text-sm transition-colors">
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          </>
        )}
        {trip.status === 'submitted' && (
          <>
            <button onClick={() => handleTransition('approved')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-net text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
              <CheckCircle className="w-4 h-4" /> Aprobar
            </button>
            <button onClick={() => handleTransition('draft')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-cream transition-colors">
              Devolver a Borrador
            </button>
          </>
        )}
        {trip.status === 'approved' && (
          <button onClick={() => handleTransition('closed')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            <Lock className="w-4 h-4" /> Cerrar Viaje
          </button>
        )}
        {trip.status === 'closed' && (
          <Link to={`/trips/${id}/report`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            <FileText className="w-4 h-4" /> Ver Informe PDF
          </Link>
        )}
      </div>
    </div>
  )
}
