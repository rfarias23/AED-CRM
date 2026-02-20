import { useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { exportToPDF } from '@/lib/export-pdf'
import { formatDate } from '@/lib/formatters'
import type { Expense, ExpenseType } from '@/lib/types'
import { ArrowLeft, Download } from 'lucide-react'

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

export default function TripReport() {
  const { id } = useParams<{ id: string }>()
  const reportRef = useRef<HTMLDivElement>(null)

  const trip = useLiveQuery(() => (id ? db.trips.get(id) : undefined), [id])
  const expenses = useLiveQuery(
    () => (trip?.expenseIds?.length ? db.expenses.where('id').anyOf(trip.expenseIds).toArray() : Promise.resolve([] as Expense[])),
    [trip?.expenseIds],
  )

  const totalUSD = useMemo(
    () => expenses?.reduce((sum, e) => sum + e.amountUSD, 0) ?? 0,
    [expenses],
  )

  // Group expenses by type for summary
  const byType = useMemo(() => {
    if (!expenses) return []
    const map = new Map<ExpenseType, { type: ExpenseType; count: number; total: number }>()
    for (const e of expenses) {
      const entry = map.get(e.type) ?? { type: e.type, count: 0, total: 0 }
      entry.count += 1
      entry.total += e.amountUSD
      map.set(e.type, entry)
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [expenses])

  async function handleExport() {
    if (!reportRef.current || !trip) return
    await exportToPDF(reportRef.current, `Informe-Viaje-${trip.name.replace(/\s+/g, '-')}`)
  }

  if (!trip) return <p className="text-muted">Cargando informe...</p>

  const daysCount = Math.ceil(
    (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / (1000 * 60 * 60 * 24),
  )

  return (
    <div className="space-y-4">
      {/* Controls (not in PDF) */}
      <div className="flex items-center gap-3">
        <Link to={`/trips/${id}`} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al viaje
        </Link>
        <button onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          <Download className="w-4 h-4" /> Descargar PDF
        </button>
      </div>

      {/* Printable report */}
      <div ref={reportRef} className="bg-white p-8 rounded-lg shadow-sm max-w-[210mm] mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-ink pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>FyF Public Relations</h1>
            <p className="text-sm text-gray-500 mt-1">Informe de Viaje</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Fecha del informe: {formatDate(new Date().toISOString())}</p>
            <p>Estado: {trip.status === 'closed' ? 'Cerrado' : trip.status}</p>
          </div>
        </div>

        {/* Trip Info */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-200 pb-1">Datos del Viaje</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="text-gray-500">Nombre:</span> <strong>{trip.name}</strong></div>
            <div><span className="text-gray-500">Destino:</span> {trip.country}{trip.city ? ` — ${trip.city}` : ''}</div>
            <div><span className="text-gray-500">Salida:</span> {formatDate(trip.departureDate)}</div>
            <div><span className="text-gray-500">Retorno:</span> {formatDate(trip.returnDate)}</div>
            <div><span className="text-gray-500">Duración:</span> {daysCount} día{daysCount !== 1 ? 's' : ''}</div>
            <div><span className="text-gray-500">Propósito:</span> {trip.purpose}</div>
            {trip.participants && trip.participants.length > 0 && (
              <div className="col-span-2"><span className="text-gray-500">Participantes:</span> {trip.participants.join(', ')}</div>
            )}
          </div>
        </section>

        {/* Budget vs Actual */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-200 pb-1">Presupuesto vs. Ejecución</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500">Presupuesto</p>
              <p className="text-xl font-bold font-mono">{trip.budgetUSD ? `$${trip.budgetUSD.toLocaleString()}` : '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500">Gasto Real</p>
              <p className="text-xl font-bold font-mono">${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500">Variación</p>
              <p className={`text-xl font-bold font-mono ${trip.budgetUSD && totalUSD > trip.budgetUSD ? 'text-red-600' : 'text-green-600'}`}>
                {trip.budgetUSD ? `${totalUSD - trip.budgetUSD >= 0 ? '+' : ''}$${(totalUSD - trip.budgetUSD).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
              </p>
            </div>
          </div>
        </section>

        {/* Expense Detail */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-200 pb-1">Detalle de Gastos</h2>
          {expenses && expenses.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Descripción</th>
                  <th className="pb-2">Proveedor</th>
                  <th className="pb-2 text-right">USD</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100">
                    <td className="py-1.5">{formatDate(e.date)}</td>
                    <td className="py-1.5">{TYPE_LABELS[e.type]}</td>
                    <td className="py-1.5">{e.description}</td>
                    <td className="py-1.5">{e.vendor}</td>
                    <td className="py-1.5 text-right font-mono">${e.amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={4} className="pt-2 text-right">Total:</td>
                  <td className="pt-2 text-right font-mono">${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-gray-500">Sin gastos registrados.</p>
          )}
        </section>

        {/* Totals by Category */}
        {byType.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 border-b border-gray-200 pb-1">Totales por Categoría</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Categoría</th>
                  <th className="pb-2 text-center"># Gastos</th>
                  <th className="pb-2 text-right">Total USD</th>
                  <th className="pb-2 text-right">% del Total</th>
                </tr>
              </thead>
              <tbody>
                {byType.map((row) => (
                  <tr key={row.type} className="border-b border-gray-100">
                    <td className="py-1.5">{TYPE_LABELS[row.type]}</td>
                    <td className="py-1.5 text-center">{row.count}</td>
                    <td className="py-1.5 text-right font-mono">${row.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-1.5 text-right">{totalUSD > 0 ? ((row.total / totalUSD) * 100).toFixed(1) : '0'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Conclusions */}
        {trip.conclusions && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 border-b border-gray-200 pb-1">Conclusiones</h2>
            <p className="text-sm whitespace-pre-wrap">{trip.conclusions}</p>
          </section>
        )}

        {/* Approval Block */}
        <section className="mt-10 pt-6 border-t-2 border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="h-12 border-b border-gray-400 mb-2" />
              <p className="text-xs text-gray-500">Viajero</p>
            </div>
            <div className="text-center">
              <div className="h-12 border-b border-gray-400 mb-2" />
              <p className="text-xs text-gray-500">Aprobación</p>
              {trip.approvedBy && (
                <p className="text-xs text-gray-400 mt-1">{trip.approvedBy} — {trip.approvedAt ? formatDate(trip.approvedAt) : ''}</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
