import { useMemo } from 'react'
// NOTE: useLiveQuery + useMemo pattern avoids Dexie observing unindexed keypaths
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { calculateCommission } from '@/lib/commission-engine'
import { formatPercent } from '@/lib/formatters'
import Tooltip from '@/components/shared/Tooltip'
import type { FeeStructure, WithholdingProfile } from '@/lib/types'

interface FeeCalculatorInlineProps {
  dealMillionsUSD: number
  feeStructure?: FeeStructure
  withholdingProfile?: WithholdingProfile
  className?: string
}

/**
 * Compact fee calculator for embedding in opportunity forms.
 * Shows tier breakdown in a single row with totals.
 */
export default function FeeCalculatorInline({
  dealMillionsUSD,
  feeStructure: fsProp,
  withholdingProfile: whProp,
  className = '',
}: FeeCalculatorInlineProps) {
  const allFs = useLiveQuery(() => db.feeStructures.toArray(), [])
  const defaultFs = useMemo(() => allFs?.find((fs) => fs.isDefault), [allFs])

  const fs = fsProp ?? defaultFs
  const result = useMemo(() => {
    if (!fs || dealMillionsUSD <= 0) return null
    return calculateCommission(dealMillionsUSD, fs, whProp)
  }, [dealMillionsUSD, fs, whProp])

  if (!result) {
    return (
      <div className={`text-xs text-muted ${className}`}>
        Comisión: —
      </div>
    )
  }

  const defaultWh = result.withholding.find((w) => w.scenario.isDefault)

  return (
    <div className={`bg-cream rounded-lg px-3 py-2 text-xs space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <Tooltip text="Honorario bruto total calculado según los tramos de la estructura de fees, antes de retenciones."><span className="text-muted">Fee Bruto:</span></Tooltip>
        <span className="font-mono font-semibold text-accent">
          USD {result.grossFee.toFixed(4)}M
          <span className="text-muted ml-1">({formatPercent(result.effectiveRate, 2)})</span>
        </span>
      </div>
      {defaultWh && (
        <div className="flex items-center justify-between">
          <Tooltip text="Honorario neto después de aplicar el escenario de retención seleccionado."><span className="text-muted">
            Neto ({defaultWh.scenario.name}):
          </span></Tooltip>
          <span className="font-mono font-semibold text-green-net">
            USD {defaultWh.netFee.toFixed(4)}M
          </span>
        </div>
      )}
      <div className="flex gap-2 text-muted">
        {result.tierBreakdown.map((t) => (
          <span key={t.tier.label} className="font-mono">
            {t.tier.label}: {t.applicableMillions.toFixed(1)}M
          </span>
        ))}
      </div>
    </div>
  )
}
