import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import Card from '@/components/shared/Card'
import CountryFlag from '@/components/shared/CountryFlag'
import { exportToPDF } from '@/lib/export-pdf'
import { FileDown, Printer } from 'lucide-react'

export default function ExpenseReport() {
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) ?? []
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []) ?? []
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  // Build a map of opportunityId → country for deriving expense country
  const oppCountryMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const o of opportunities) m.set(o.id, o.country)
    return m
  }, [opportunities])

  const data = useMemo(() => {
    const totalUSD = expenses.reduce((s, e) => s + e.amountUSD, 0)

    // By type
    const typeMap = new Map<string, { amount: number; count: number }>()
    for (const e of expenses) {
      const prev = typeMap.get(e.type) ?? { amount: 0, count: 0 }
      typeMap.set(e.type, { amount: prev.amount + e.amountUSD, count: prev.count + 1 })
    }

    // By country (derived from linked opportunity)
    const countryMap = new Map<string, { amount: number; count: number }>()
    for (const e of expenses) {
      const country = (e.opportunityId && oppCountryMap.get(e.opportunityId)) || 'General'
      const prev = countryMap.get(country) ?? { amount: 0, count: 0 }
      countryMap.set(country, { amount: prev.amount + e.amountUSD, count: prev.count + 1 })
    }

    // By month
    const monthMap = new Map<string, number>()
    for (const e of expenses) {
      const m = e.date.slice(0, 7) // YYYY-MM
      monthMap.set(m, (monthMap.get(m) ?? 0) + e.amountUSD)
    }

    // Sorted expenses
    const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return {
      totalUSD,
      byType: Array.from(typeMap.entries())
        .map(([type, v]) => ({ type, ...v }))
        .sort((a, b) => b.amount - a.amount),
      byCountry: Array.from(countryMap.entries())
        .map(([country, v]) => ({ country, ...v }))
        .sort((a, b) => b.amount - a.amount),
      byMonth: Array.from(monthMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      sorted,
    }
  }, [expenses, oppCountryMap])

  async function handleExport() {
    if (!reportRef.current) return
    setExporting(true)
    try {
      await exportToPDF(reportRef.current, `Reporte_Gastos_ASCH_${new Date().toISOString().slice(0, 10)}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl">Reporte de Gastos — ASCH SPA</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50">
            <FileDown className="w-4 h-4" /> {exporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-cream">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 bg-white p-6 rounded-xl print:p-0">
        {/* Header */}
        <div className="border-b-2 border-ink pb-4">
          <h1 className="font-heading text-2xl">Rendición de Gastos</h1>
          <p className="text-muted text-sm mt-1">
            ASCH SPA — Consultor Externo: Rodolfo Farias Corrales
          </p>
          <p className="text-muted text-sm">
            Generado: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Total */}
        <Card>
          <div className="text-center py-4">
            <div className="text-xs text-muted uppercase tracking-wider mb-1">Total Gastos</div>
            <div className="font-mono text-3xl font-bold">
              ${data.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted mt-1">{expenses.length} gastos registrados</div>
          </div>
        </Card>

        {/* By Type */}
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Por Categoría</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2">Tipo</th>
                <th className="pb-2 text-right">Cantidad</th>
                <th className="pb-2 text-right">Monto USD</th>
                <th className="pb-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {data.byType.map((row) => (
                <tr key={row.type} className="border-t border-border">
                  <td className="py-2 capitalize">{row.type.replace('_', ' ')}</td>
                  <td className="py-2 text-right font-mono">{row.count}</td>
                  <td className="py-2 text-right font-mono">
                    ${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {data.totalUSD > 0 ? ((row.amount / data.totalUSD) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right font-mono">{expenses.length}</td>
                <td className="py-2 text-right font-mono">
                  ${data.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-2 text-right font-mono">100%</td>
              </tr>
            </tfoot>
          </table>
        </Card>

        {/* By Country */}
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Por País</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2">País</th>
                <th className="pb-2 text-right">Cantidad</th>
                <th className="pb-2 text-right">Monto USD</th>
              </tr>
            </thead>
            <tbody>
              {data.byCountry.map((row) => (
                <tr key={row.country} className="border-t border-border">
                  <td className="py-2 flex items-center gap-1.5">
                    <CountryFlag code={row.country} size="sm" /> {row.country}
                  </td>
                  <td className="py-2 text-right font-mono">{row.count}</td>
                  <td className="py-2 text-right font-mono">
                    ${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Detail */}
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Detalle de Gastos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Descripción</th>
                  <th className="pb-2">Proveedor</th>
                  <th className="pb-2">País</th>
                  <th className="pb-2">Proyecto</th>
                  <th className="pb-2 text-right">Monto USD</th>
                </tr>
              </thead>
              <tbody>
                {data.sorted.map((e) => {
                  const opp = e.opportunityId ? opportunities.find((o) => o.id === e.opportunityId) : null
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="py-1.5 text-xs">{new Date(e.date).toLocaleDateString('es-CL')}</td>
                      <td className="py-1.5 capitalize text-xs">{e.type.replace('_', ' ')}</td>
                      <td className="py-1.5">{e.description}</td>
                      <td className="py-1.5 text-muted">{e.vendor}</td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-1">
                          <CountryFlag code={opp?.country ?? ''} size="sm" />
                          {opp?.country ?? '—'}
                        </div>
                      </td>
                      <td className="py-1.5 text-xs text-muted">{opp?.name ?? '—'}</td>
                      <td className="py-1.5 text-right font-mono">
                        ${e.amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink font-semibold">
                  <td colSpan={6} className="py-2">Total</td>
                  <td className="py-2 text-right font-mono">
                    ${data.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Signature block */}
        <div className="grid grid-cols-2 gap-12 pt-8">
          <div className="border-t border-ink pt-2 text-center text-sm text-muted">
            Rodolfo Farias Corrales<br />Consultor Externo
          </div>
          <div className="border-t border-ink pt-2 text-center text-sm text-muted">
            ASCH SPA<br />Representante
          </div>
        </div>
      </div>
    </div>
  )
}
