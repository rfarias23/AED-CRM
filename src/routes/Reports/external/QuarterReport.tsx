import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { calculatePipelineFees } from '@/lib/commission-engine'
import Card from '@/components/shared/Card'
import { StageBadge } from '@/components/shared/Badge'
import MoneyDisplay from '@/components/shared/MoneyDisplay'
import CountryFlag from '@/components/shared/CountryFlag'
import { formatPercent } from '@/lib/formatters'
import { exportToPDF } from '@/lib/export-pdf'
import { FileDown, Printer } from 'lucide-react'
import type { OpportunityStage } from '@/lib/types'

const ACTIVE_STAGES: OpportunityStage[] = ['identification', 'qualification', 'proposal', 'negotiation']

export default function QuarterReport() {
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []) ?? []
  const feeStructures = useLiveQuery(() => db.feeStructures.toArray(), []) ?? []
  const withholdingProfiles = useLiveQuery(() => db.withholdingProfiles.toArray(), []) ?? []
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) ?? []
  const plans = useLiveQuery(() => db.quarterPlans.toArray(), []) ?? []
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const activePlan = plans.find((p) => p.status === 'active')

  const data = useMemo(() => {
    const active = opportunities.filter((o) => ACTIVE_STAGES.includes(o.stage))
    const won = opportunities.filter((o) => o.stage === 'won')
    const lost = opportunities.filter((o) => o.stage === 'lost')
    const pipeline = calculatePipelineFees(opportunities, feeStructures, withholdingProfiles)

    const pipelineTotal = active.reduce((s, o) => s + o.aschValueUSD, 0)
    const wonTotal = won.reduce((s, o) => s + o.aschValueUSD, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amountUSD, 0)

    // By country
    const countryMap = new Map<string, { count: number; value: number }>()
    for (const opp of active) {
      const prev = countryMap.get(opp.country) ?? { count: 0, value: 0 }
      countryMap.set(opp.country, { count: prev.count + 1, value: prev.value + opp.aschValueUSD })
    }

    return {
      active, won, lost, pipeline, pipelineTotal, wonTotal, totalExpenses,
      byCountry: Array.from(countryMap.entries()).sort((a, b) => b[1].value - a[1].value),
    }
  }, [opportunities, feeStructures, withholdingProfiles, expenses])

  async function handleExport() {
    if (!reportRef.current) return
    setExporting(true)
    try {
      await exportToPDF(reportRef.current, `Reporte_Trimestral_ASCH_${new Date().toISOString().slice(0, 10)}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl">Reporte Trimestral — ASCH SPA</h2>
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

      {/* Printable report content */}
      <div ref={reportRef} className="space-y-6 bg-white p-6 rounded-xl print:p-0">
        {/* Header */}
        <div className="border-b-2 border-ink pb-4">
          <h1 className="font-heading text-2xl">Reporte Trimestral de Actividad Comercial</h1>
          <p className="text-muted text-sm mt-1">
            ASCH SPA — Consultor Externo: Rodolfo Farias Corrales
          </p>
          <p className="text-muted text-sm">
            Generado: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Plan vs Achieved */}
        {activePlan && (
          <Card>
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Plan vs Logrado</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2" title="Indicador clave de rendimiento evaluado.">Métrica</th>
                  <th className="pb-2 text-right" title="Valor objetivo definido en el plan trimestral.">Planificado</th>
                  <th className="pb-2 text-right" title="Valor real alcanzado al momento del reporte.">Actual</th>
                  <th className="pb-2 text-right" title="Porcentaje de avance del valor actual respecto al planificado.">Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="py-2" title="Valor total bruto de todas las oportunidades activas en el pipeline, expresado en millones de USD.">Pipeline (USD M)</td>
                  <td className="py-2 text-right font-mono">{activePlan.targetPipelineUSD ?? activePlan.pipelineBrutoUSD}</td>
                  <td className="py-2 text-right font-mono">{(data.pipelineTotal / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono">
                    {(activePlan.targetPipelineUSD ?? activePlan.pipelineBrutoUSD) > 0
                      ? formatPercent(data.pipelineTotal / 1e6 / (activePlan.targetPipelineUSD ?? activePlan.pipelineBrutoUSD))
                      : '—'}
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="py-2" title="Valor acumulado de oportunidades adjudicadas (ganadas) en el trimestre, en millones de USD.">Ganado (USD M)</td>
                  <td className="py-2 text-right font-mono">{activePlan.targetWonUSD ?? activePlan.wonUSD}</td>
                  <td className="py-2 text-right font-mono">{(data.wonTotal / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono">
                    {(activePlan.targetWonUSD ?? activePlan.wonUSD) > 0
                      ? formatPercent(data.wonTotal / 1e6 / (activePlan.targetWonUSD ?? activePlan.wonUSD))
                      : '—'}
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="py-2" title="Suma de honorarios brutos devengados por las oportunidades del pipeline, en millones de USD.">Fees Bruto (USD M)</td>
                  <td className="py-2 text-right font-mono">{activePlan.targetFeesUSD ?? activePlan.feesDevengadosUSD}</td>
                  <td className="py-2 text-right font-mono">{data.pipeline.totalGrossFees.toFixed(3)}</td>
                  <td className="py-2 text-right font-mono">
                    {(activePlan.targetFeesUSD ?? activePlan.feesDevengadosUSD) > 0
                      ? formatPercent(data.pipeline.totalGrossFees / (activePlan.targetFeesUSD ?? activePlan.feesDevengadosUSD))
                      : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        )}

        {/* Opportunity Summary */}
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Resumen de Oportunidades</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="font-mono text-2xl">{data.active.length}</div>
              <div className="text-xs text-muted" title="Oportunidades actualmente en proceso en el pipeline (identificación hasta negociación).">Activas</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl text-green-net">{data.won.length}</div>
              <div className="text-xs text-muted" title="Oportunidades adjudicadas exitosamente en el periodo.">Ganadas</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl text-red-soft">{data.lost.length}</div>
              <div className="text-xs text-muted" title="Oportunidades que no se adjudicaron en el periodo.">Perdidas</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl">{opportunities.length}</div>
              <div className="text-xs text-muted" title="Número total de oportunidades gestionadas, incluyendo activas, ganadas, perdidas y dormidas.">Total</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2" title="Nombre del proyecto u oportunidad comercial.">Proyecto</th>
                  <th className="pb-2" title="País donde se ubica la oportunidad.">País</th>
                  <th className="pb-2" title="Fase actual de la oportunidad en el pipeline comercial.">Etapa</th>
                  <th className="pb-2 text-right" title="Valor del contrato ASCH en dólares estadounidenses.">Valor ASCH</th>
                  <th className="pb-2 text-right" title="Probabilidad de Adjudicación: estimación porcentual de ganar esta oportunidad.">PoA</th>
                </tr>
              </thead>
              <tbody>
                {data.pipeline.byOpportunity.map((item) => (
                  <tr key={item.opportunity.id} className="border-t border-border">
                    <td className="py-1.5">{item.opportunity.name}</td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-1">
                        <CountryFlag code={item.opportunity.country} size="sm" />
                        {item.opportunity.country}
                      </div>
                    </td>
                    <td className="py-1.5"><StageBadge stage={item.opportunity.stage} /></td>
                    <td className="py-1.5 text-right font-mono">
                      <MoneyDisplay amount={item.opportunity.aschValueUSD} currency="USD" compact />
                    </td>
                    <td className="py-1.5 text-right font-mono">
                      {formatPercent(item.opportunity.probabilityOfAward)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* By Country */}
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Pipeline por País</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2" title="País donde se ubican las oportunidades.">País</th>
                <th className="pb-2 text-right" title="Cantidad de oportunidades activas en este país.">Oportunidades</th>
                <th className="pb-2 text-right" title="Valor total del pipeline en USD para este país.">Valor Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {data.byCountry.map(([code, v]) => (
                <tr key={code} className="border-t border-border">
                  <td className="py-2 flex items-center gap-1.5">
                    <CountryFlag code={code} size="sm" /> {code}
                  </td>
                  <td className="py-2 text-right font-mono">{v.count}</td>
                  <td className="py-2 text-right font-mono">
                    <MoneyDisplay amount={v.value} currency="USD" compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Expense Summary */}
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3" title="Resumen del gasto operacional del trimestre asociado a la actividad comercial.">Resumen de Gastos</h3>
          <div className="font-mono text-xl mb-2" title="Suma total de todos los gastos registrados en el periodo, convertidos a USD.">
            Total: ${data.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted">Detalle disponible en el Reporte de Gastos dedicado.</p>
        </Card>
      </div>
    </div>
  )
}
