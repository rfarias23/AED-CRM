import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { calculatePipelineFees, resolveFeeStructure } from '@/lib/commission-engine'
import Card from '@/components/shared/Card'
import { StageBadge } from '@/components/shared/Badge'
import MoneyDisplay from '@/components/shared/MoneyDisplay'
import CountryFlag from '@/components/shared/CountryFlag'
import { formatPercent } from '@/lib/formatters'
import type { OpportunityStage } from '@/lib/types'

const ACTIVE_STAGES: OpportunityStage[] = ['identification', 'qualification', 'proposal', 'negotiation']

export default function PipelineReport() {
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []) ?? []
  const feeStructures = useLiveQuery(() => db.feeStructures.toArray(), []) ?? []
  const withholdingProfiles = useLiveQuery(() => db.withholdingProfiles.toArray(), []) ?? []

  const data = useMemo(() => {
    const active = opportunities.filter((o) => ACTIVE_STAGES.includes(o.stage))
    const pipeline = calculatePipelineFees(opportunities, feeStructures, withholdingProfiles)

    // By country
    const countryMap = new Map<string, { count: number; value: number; fees: number }>()
    for (const item of pipeline.byOpportunity) {
      const opp = item.opportunity
      const prev = countryMap.get(opp.country) ?? { count: 0, value: 0, fees: 0 }
      countryMap.set(opp.country, {
        count: prev.count + 1,
        value: prev.value + opp.aschValueUSD,
        fees: prev.fees + item.commission.grossFee,
      })
    }

    // By fee structure
    const fsMap = new Map<string, { name: string; count: number; fees: number }>()
    for (const opp of active) {
      try {
        const fs = resolveFeeStructure(opp, feeStructures)
        const prev = fsMap.get(fs.id) ?? { name: fs.name, count: 0, fees: 0 }
        const match = pipeline.byOpportunity.find((i) => i.opportunity.id === opp.id)
        fsMap.set(fs.id, { name: fs.name, count: prev.count + 1, fees: prev.fees + (match?.commission.grossFee ?? 0) })
      } catch { /* no fee structure */ }
    }

    return {
      active,
      pipeline,
      byCountry: Array.from(countryMap.entries()).sort((a, b) => b[1].value - a[1].value),
      byFeeStructure: Array.from(fsMap.values()),
    }
  }, [opportunities, feeStructures, withholdingProfiles])

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl">Reporte de Pipeline</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card dark padding="sm">
          <span className="text-xs text-white/60">Gross Fees</span>
          <div className="font-mono text-lg mt-1">USD {data.pipeline.totalGrossFees.toFixed(3)}M</div>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-white/60">Weighted Fees</span>
          <div className="font-mono text-lg mt-1">USD {data.pipeline.totalWeightedFees.toFixed(3)}M</div>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-white/60">Oportunidades</span>
          <div className="font-mono text-lg mt-1">{data.active.length}</div>
        </Card>
      </div>

      {/* By country */}
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Por País</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted">
            <th className="pb-2">País</th><th className="pb-2">Opp.</th>
            <th className="pb-2 text-right">Valor</th><th className="pb-2 text-right">Fees</th>
          </tr></thead>
          <tbody>
            {data.byCountry.map(([code, v]) => (
              <tr key={code} className="border-t border-border">
                <td className="py-2 flex items-center gap-1.5"><CountryFlag code={code} size="sm" /> {code}</td>
                <td className="py-2">{v.count}</td>
                <td className="py-2 text-right font-mono"><MoneyDisplay amount={v.value} currency="USD" compact /></td>
                <td className="py-2 text-right font-mono">${(v.fees * 1e6).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Opportunity detail table */}
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Detalle por Oportunidad</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted">
              <th className="pb-2">Proyecto</th><th className="pb-2">Etapa</th>
              <th className="pb-2 text-right">ASCH USD</th><th className="pb-2 text-right">PoA</th>
              <th className="pb-2 text-right">Fee Rate</th><th className="pb-2 text-right">Gross Fee</th>
            </tr></thead>
            <tbody>
              {data.pipeline.byOpportunity.map((item) => (
                <tr key={item.opportunity.id} className="border-t border-border">
                  <td className="py-2">{item.opportunity.name}</td>
                  <td className="py-2"><StageBadge stage={item.opportunity.stage} /></td>
                  <td className="py-2 text-right font-mono"><MoneyDisplay amount={item.opportunity.aschValueUSD} currency="USD" compact /></td>
                  <td className="py-2 text-right font-mono">{formatPercent(item.opportunity.probabilityOfAward)}</td>
                  <td className="py-2 text-right font-mono">{formatPercent(item.commission.effectiveRate, 2)}</td>
                  <td className="py-2 text-right font-mono">${(item.commission.grossFee * 1e6).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
