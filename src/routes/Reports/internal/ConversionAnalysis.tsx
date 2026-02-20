import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import Card from '@/components/shared/Card'
import { StageBadge } from '@/components/shared/Badge'
import { formatPercent } from '@/lib/formatters'
import type { OpportunityStage } from '@/lib/types'

const FUNNEL_STAGES: OpportunityStage[] = ['identification', 'qualification', 'proposal', 'negotiation', 'won']

export default function ConversionAnalysis() {
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []) ?? []

  const data = useMemo(() => {
    const stageCounts = FUNNEL_STAGES.map((stage) => ({
      stage,
      count: opportunities.filter((o) => o.stage === stage).length,
    }))

    // Conversion rates between stages
    const conversions = []
    for (let i = 0; i < stageCounts.length - 1; i++) {
      const from = stageCounts[i]
      const to = stageCounts[i + 1]
      // Include all opps that passed through the 'from' stage
      const passedFrom = opportunities.filter((o) => {
        const idx = FUNNEL_STAGES.indexOf(o.stage)
        return idx >= i
      }).length
      const passedTo = opportunities.filter((o) => {
        const idx = FUNNEL_STAGES.indexOf(o.stage)
        return idx >= i + 1
      }).length
      conversions.push({
        from: from.stage,
        to: to.stage,
        rate: passedFrom > 0 ? passedTo / passedFrom : 0,
        fromCount: passedFrom,
        toCount: passedTo,
      })
    }

    const lostCount = opportunities.filter((o) => o.stage === 'lost').length
    const dormantCount = opportunities.filter((o) => o.stage === 'dormant').length
    const totalCount = opportunities.length
    const wonCount = opportunities.filter((o) => o.stage === 'won').length
    const overallWinRate = totalCount > 0 ? wonCount / totalCount : 0

    return { stageCounts, conversions, lostCount, dormantCount, overallWinRate, totalCount, wonCount }
  }, [opportunities])

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl">Análisis de Conversión</h2>

      {/* Win rate KPI */}
      <div className="grid grid-cols-3 gap-4">
        <Card dark padding="sm">
          <span className="text-xs text-white/60" title="Porcentaje de oportunidades ganadas sobre el total de oportunidades cerradas (ganadas + perdidas). Mide la efectividad comercial global.">Tasa de Éxito</span>
          <div className="font-mono text-2xl mt-1 text-green-net">{formatPercent(data.overallWinRate)}</div>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-white/60" title="Cantidad de oportunidades que no se adjudicaron. Sirve para analizar patrones de pérdida y mejorar la estrategia comercial.">Perdidas</span>
          <div className="font-mono text-2xl mt-1 text-red-soft">{data.lostCount}</div>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-white/60" title="Oportunidades sin actividad reciente que no fueron cerradas formalmente. Pueden reactivarse o requieren decisión de cierre.">Dormidas</span>
          <div className="font-mono text-2xl mt-1">{data.dormantCount}</div>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4" title="Visualización del flujo de oportunidades a través de cada etapa del pipeline. Muestra cuántas oportunidades avanzan entre etapas y dónde se producen las mayores caídas.">Funnel de Conversión</h3>
        <div className="space-y-3">
          {data.stageCounts.map((s, i) => {
            const maxCount = Math.max(...data.stageCounts.map((x) => x.count), 1)
            const pct = (s.count / maxCount) * 100
            return (
              <div key={s.stage} className="flex items-center gap-3">
                <div className="w-28"><StageBadge stage={s.stage} /></div>
                <div className="flex-1 bg-cream rounded-full h-4 overflow-hidden">
                  <div className="bg-accent h-full rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(pct, 10)}%` }}>
                    <span className="text-[10px] text-white font-mono">{s.count}</span>
                  </div>
                </div>
                {i < data.conversions.length && (
                  <span className="font-mono text-xs text-muted w-12 text-right">
                    {formatPercent(data.conversions[i].rate)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Conversion table */}
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Tasas de Conversión</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted">
            <th className="pb-2" title="Etapa de origen en el pipeline.">Desde</th><th className="pb-2" title="Etapa de destino a la que avanzaron las oportunidades.">Hacia</th>
            <th className="pb-2 text-right" title="Total de oportunidades que alcanzaron o superaron la etapa de origen.">Pasaron</th><th className="pb-2 text-right" title="Oportunidades que avanzaron exitosamente a la siguiente etapa.">Convirtieron</th>
            <th className="pb-2 text-right" title="Porcentaje de oportunidades que convirtieron de una etapa a la siguiente. Indica la eficiencia de avance en el pipeline.">Tasa</th>
          </tr></thead>
          <tbody>
            {data.conversions.map((c) => (
              <tr key={`${c.from}-${c.to}`} className="border-t border-border">
                <td className="py-2"><StageBadge stage={c.from} /></td>
                <td className="py-2"><StageBadge stage={c.to} /></td>
                <td className="py-2 text-right font-mono">{c.fromCount}</td>
                <td className="py-2 text-right font-mono">{c.toCount}</td>
                <td className="py-2 text-right font-mono font-semibold">{formatPercent(c.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
