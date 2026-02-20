import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { calculatePipelineFees } from '@/lib/commission-engine'
import type { Opportunity, FeeStructure, WithholdingProfile } from '@/lib/types'
import KPICard from '@/components/shared/KPICard'
import { DollarSign, TrendingUp, Percent } from 'lucide-react'

interface PipelineFeesSummaryProps {
  opportunities?: Opportunity[]
  feeStructures?: FeeStructure[]
  withholdingProfiles?: WithholdingProfile[]
}

export default function PipelineFeesSummary({
  opportunities: oppsProp,
  feeStructures: fsProp,
  withholdingProfiles: whProp,
}: PipelineFeesSummaryProps = {}) {
  const oppsQuery = useLiveQuery(() => db.opportunities.toArray(), [])
  const fsQuery = useLiveQuery(() => db.feeStructures.toArray(), [])
  const whQuery = useLiveQuery(() => db.withholdingProfiles.toArray(), [])

  const opportunities = oppsProp ?? oppsQuery ?? []
  const feeStructures = fsProp ?? fsQuery ?? []
  const withholdingProfiles = whProp ?? whQuery ?? []

  const summary = useMemo(
    () => calculatePipelineFees(opportunities, feeStructures, withholdingProfiles),
    [opportunities, feeStructures, withholdingProfiles],
  )

  const activeCount = summary.byOpportunity.length
  const avgRate =
    activeCount > 0
      ? summary.byOpportunity.reduce((sum, o) => sum + o.commission.effectiveRate, 0) / activeCount
      : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KPICard
        label="Fees Bruto Pipeline"
        value={`$${(summary.totalGrossFees * 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
        subtitle={`USD ${summary.totalGrossFees.toFixed(2)}M`}
        icon={<DollarSign className="w-5 h-5" />}
      />
      <KPICard
        label="Fees Ponderado"
        value={`$${(summary.totalWeightedFees * 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
        subtitle={`USD ${summary.totalWeightedFees.toFixed(2)}M — ${activeCount} oportunidades`}
        icon={<TrendingUp className="w-5 h-5" />}
      />
      <KPICard
        label="Tasa Efectiva Prom."
        value={`${(avgRate * 100).toFixed(2)}%`}
        subtitle="Promedio ponderado del pipeline activo"
        icon={<Percent className="w-5 h-5" />}
      />
    </div>
  )
}
