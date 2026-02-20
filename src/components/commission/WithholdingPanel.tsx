import { useState } from 'react'
import type { WithholdingResult } from '@/lib/types'
import Tooltip from '@/components/shared/Tooltip'

interface WithholdingPanelProps {
  results: WithholdingResult[]
  profileName?: string
}

export default function WithholdingPanel({
  results,
  profileName,
}: WithholdingPanelProps) {
  const [activeTab, setActiveTab] = useState(0)

  if (results.length === 0) {
    return (
      <div className="text-sm text-muted italic">
        Sin retención aplicable — seleccione un perfil de jurisdicción.
      </div>
    )
  }

  const active = results[activeTab]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Retención — {profileName}
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream rounded-lg p-1">
        {results.map((r, i) => (
          <button
            key={r.scenario.name}
            onClick={() => setActiveTab(i)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              i === activeTab
                ? 'bg-white shadow-sm text-ink'
                : 'text-muted hover:text-ink'
            }`}
          >
            {r.scenario.name}
          </button>
        ))}
      </div>

      {/* Active scenario details */}
      {active && (
        <div className="space-y-2 bg-cream/50 rounded-lg p-4">
          <p className="text-xs text-muted">{active.scenario.description}</p>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <Tooltip text="Honorario bruto total calculado según los tramos de la estructura de fees, antes de retenciones."><span className="text-xs text-muted block">Fee Bruto</span></Tooltip>
              <span className="font-mono font-semibold text-sm">
                USD {active.grossFee.toFixed(4)}M
              </span>
            </div>
            <div>
              <Tooltip text="Monto retenido por la jurisdicción según el escenario de retención seleccionado."><span className="text-xs text-muted block">Retención</span></Tooltip>
              <span className="font-mono font-semibold text-sm text-red">
                −USD {active.withholdingAmount.toFixed(4)}M
              </span>
            </div>
            <div>
              <Tooltip text="Honorario neto después de aplicar el escenario de retención seleccionado."><span className="text-xs text-muted block">Fee Neto</span></Tooltip>
              <span className="font-mono font-semibold text-sm text-green-net">
                USD {active.netFee.toFixed(4)}M
              </span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted pt-1 border-t border-border">
            <span>En USD absoluto:</span>
            <span className="font-mono">
              Bruto ${(active.grossFee * 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              {' → '}
              Neto ${(active.netFee * 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
