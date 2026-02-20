import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { calculatePipelineFees } from '@/lib/commission-engine'
import Card from '@/components/shared/Card'
import { StageBadge } from '@/components/shared/Badge'
import { formatPercent } from '@/lib/formatters'
import type { OpportunityStage } from '@/lib/types'

const STAGE_ORDER: OpportunityStage[] = ['identification', 'qualification', 'proposal', 'negotiation', 'won']

export default function CommissionForecast() {
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []) ?? []
  const feeStructures = useLiveQuery(() => db.feeStructures.toArray(), []) ?? []
  const withholdingProfiles = useLiveQuery(() => db.withholdingProfiles.toArray(), []) ?? []

  const data = useMemo(() => {
    const pipeline = calculatePipelineFees(opportunities, feeStructures, withholdingProfiles)

    // Group by stage
    const byStage = STAGE_ORDER.map((stage) => {
      const stageOpps = pipeline.byOpportunity.filter((item) => item.opportunity.stage === stage)
      return {
        stage,
        count: stageOpps.length,
        grossFees: stageOpps.reduce((s, i) => s + i.commission.grossFee, 0),
        weightedFees: stageOpps.reduce((s, i) => s + i.weightedGross, 0),
      }
    })

    return { pipeline, byStage }
  }, [opportunities, feeStructures, withholdingProfiles])

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl">Pronóstico de Comisiones</h2>

      <div className="grid grid-cols-2 gap-4">
        <Card dark padding="sm">
          <span className="text-xs text-white/60">Total Gross</span>
          <div className="font-mono text-lg mt-1 text-gold-soft">USD {data.pipeline.totalGrossFees.toFixed(3)}M</div>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-white/60">Total Weighted</span>
          <div className="font-mono text-lg mt-1 text-green-net">USD {data.pipeline.totalWeightedFees.toFixed(3)}M</div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Fees por Etapa</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted">
            <th className="pb-2">Etapa</th><th className="pb-2 text-right">Opp.</th>
            <th className="pb-2 text-right">Gross Fee (M)</th><th className="pb-2 text-right">Weighted Fee (M)</th>
          </tr></thead>
          <tbody>
            {data.byStage.filter((s) => s.count > 0).map((s) => (
              <tr key={s.stage} className="border-t border-border">
                <td className="py-2"><StageBadge stage={s.stage} /></td>
                <td className="py-2 text-right font-mono">{s.count}</td>
                <td className="py-2 text-right font-mono">{s.grossFees.toFixed(4)}</td>
                <td className="py-2 text-right font-mono">{s.weightedFees.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink font-semibold">
              <td className="py-2">Total</td>
              <td className="py-2 text-right font-mono">{data.pipeline.byOpportunity.length}</td>
              <td className="py-2 text-right font-mono">{data.pipeline.totalGrossFees.toFixed(4)}</td>
              <td className="py-2 text-right font-mono">{data.pipeline.totalWeightedFees.toFixed(4)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {/* Individual opportunity forecast */}
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Detalle por Oportunidad</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted">
              <th className="pb-2">Proyecto</th><th className="pb-2">PoA</th>
              <th className="pb-2 text-right">Gross</th><th className="pb-2 text-right">Weighted</th>
              <th className="pb-2 text-right">Rate</th>
            </tr></thead>
            <tbody>
              {data.pipeline.byOpportunity.map((item) => (
                <tr key={item.opportunity.id} className="border-t border-border">
                  <td className="py-2">{item.opportunity.name}</td>
                  <td className="py-2 font-mono">{formatPercent(item.opportunity.probabilityOfAward)}</td>
                  <td className="py-2 text-right font-mono">{item.commission.grossFee.toFixed(4)}M</td>
                  <td className="py-2 text-right font-mono">{item.weightedGross.toFixed(4)}M</td>
                  <td className="py-2 text-right font-mono">{formatPercent(item.commission.effectiveRate, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
