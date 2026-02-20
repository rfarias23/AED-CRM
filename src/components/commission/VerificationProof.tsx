import { CheckCircle, AlertCircle } from 'lucide-react'
import type { CommissionResult } from '@/lib/types'
import { formatPercent } from '@/lib/formatters'

interface VerificationProofProps {
  result: CommissionResult
}

export default function VerificationProof({ result }: VerificationProofProps) {
  const { verification, tierBreakdown, grossFee, effectiveRate, dealMillions } = result

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
        Verificación Cruzada
      </h3>

      <div className="bg-cream/50 rounded-lg p-4 space-y-2 text-sm font-mono">
        {/* Tier sum proof */}
        <div className="space-y-1">
          {tierBreakdown.map((item) => (
            <div key={item.tier.label} className="flex justify-between text-xs">
              <span>
                {item.tier.label}: {item.applicableMillions.toFixed(2)}M ×{' '}
                {formatPercent(item.tier.rate, 2)}
              </span>
              <span>= {item.fee.toFixed(6)}M</span>
            </div>
          ))}
          <div className="border-t border-border pt-1 flex justify-between font-semibold">
            <span>Σ Tiers</span>
            <span>{verification.sumOfTiers.toFixed(6)}M</span>
          </div>
        </div>

        {/* Cross-check */}
        <div className="flex items-center gap-2 pt-1">
          {verification.matchesGross ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-net" />
              <span className="text-green-net text-xs">
                ✓ Suma de tiers coincide con fee bruto
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red" />
              <span className="text-red text-xs">
                ✗ Discrepancia detectada: Σ={verification.sumOfTiers.toFixed(6)} vs Gross={grossFee.toFixed(6)}
              </span>
            </>
          )}
        </div>

        {/* Rate verification */}
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-net" />
          <span className="text-xs">
            Tasa efectiva: {grossFee.toFixed(6)}M / {dealMillions.toFixed(2)}M ={' '}
            {formatPercent(effectiveRate, 4)}
          </span>
        </div>
      </div>
    </div>
  )
}
