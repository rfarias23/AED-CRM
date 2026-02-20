import type { TierBreakdownItem } from '@/lib/types'
import { formatPercent } from '@/lib/formatters'

interface TierBreakdownProps {
  tiers: TierBreakdownItem[]
  dealMillions: number
  grossFee: number
  effectiveRate: number
}

const TIER_COLORS = [
  'bg-tier1 text-white',
  'bg-tier2 text-white',
  'bg-tier3 text-white',
]

export default function TierBreakdown({
  tiers,
  dealMillions,
  grossFee,
  effectiveRate,
}: TierBreakdownProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
        Desglose por Nivel
      </h3>

      {tiers.length === 0 ? (
        <p className="text-sm text-muted">Ingrese un monto para ver el desglose.</p>
      ) : (
        <>
          {/* Tier bars */}
          <div className="space-y-2">
            {tiers.map((item, i) => {
              const pct = dealMillions > 0 ? (item.applicableMillions / dealMillions) * 100 : 0
              return (
                <div key={item.tier.label} className="space-y-1" title="Cada tramo aplica un porcentaje diferente según el rango de valor del contrato.">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" title="Rango de valor del contrato al que se aplica este porcentaje de fee.">{item.tier.label}</span>
                    <span className="font-mono text-xs text-muted">
                      <span title="Porcentaje de fee que se aplica sobre el valor dentro de este tramo.">{formatPercent(item.tier.rate, 2)}</span>
                      {' × '}
                      <span title="Monto del contrato que cae dentro de este rango específico.">USD {item.applicableMillions.toFixed(2)}M</span>
                    </span>
                  </div>
                  <div className="h-6 bg-cream rounded overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded flex items-center px-2 transition-all ${TIER_COLORS[i] ?? TIER_COLORS[0]}`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    >
                      <span className="text-xs font-mono font-medium whitespace-nowrap" title="Honorario generado por este tramo específico.">
                        USD {item.fee.toFixed(4)}M
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium" title="Honorario bruto total calculado según los tramos de la estructura de fees, antes de retenciones.">Fee Bruto Total</span>
              <span className="font-mono font-semibold text-accent">
                USD {grossFee.toFixed(4)}M
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Tasa Efectiva</span>
              <span className="font-mono text-muted">
                {formatPercent(effectiveRate, 4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">En USD (absoluto)</span>
              <span className="font-mono">
                ${(grossFee * 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
