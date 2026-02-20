import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { calculateCommission } from '@/lib/commission-engine'
import { convertToUSD, buildRateMap } from '@/lib/currency-engine'
import type { Currency, FeeStructure, WithholdingProfile, CommissionResult } from '@/lib/types'
import CurrencySelector from '@/components/shared/CurrencySelector'
import Card from '@/components/shared/Card'
import TierBreakdown from './TierBreakdown'
import WithholdingPanel from './WithholdingPanel'
import VerificationProof from './VerificationProof'

export default function FeeCalculatorFull() {
  const feeStructures = useLiveQuery(() => db.feeStructures.toArray(), [])
  const withholdingProfiles = useLiveQuery(() => db.withholdingProfiles.toArray(), [])
  const exchangeRates = useLiveQuery(() => db.exchangeRates.toArray(), [])

  const [inputValue, setInputValue] = useState('')
  const [inputCurrency, setInputCurrency] = useState<Currency>('USD')
  const [selectedFsId, setSelectedFsId] = useState<string | undefined>(undefined)
  const [selectedWhId, setSelectedWhId] = useState<string | undefined>(undefined)
  const [inputUnit, setInputUnit] = useState<'absolute' | 'millions'>('millions')

  // Resolve selected structures
  const selectedFs: FeeStructure | undefined = useMemo(() => {
    if (!feeStructures) return undefined
    if (selectedFsId) return feeStructures.find((fs) => fs.id === selectedFsId)
    return feeStructures.find((fs) => fs.isDefault) ?? feeStructures[0]
  }, [feeStructures, selectedFsId])

  const selectedWh: WithholdingProfile | undefined = useMemo(() => {
    if (!withholdingProfiles || !selectedWhId) return undefined
    return withholdingProfiles.find((wp) => wp.id === selectedWhId)
  }, [withholdingProfiles, selectedWhId])

  // Build rate map
  const rateMap = useMemo(() => {
    if (!exchangeRates) return new Map<string, number>()
    return buildRateMap(exchangeRates)
  }, [exchangeRates])

  // Calculate commission
  const result: CommissionResult | null = useMemo(() => {
    const numVal = parseFloat(inputValue)
    if (!selectedFs || isNaN(numVal) || numVal <= 0) return null

    let amountUSD: number
    if (inputCurrency === 'USD') {
      amountUSD = inputUnit === 'millions' ? numVal : numVal / 1_000_000
    } else {
      const localAmount = inputUnit === 'millions' ? numVal * 1_000_000 : numVal
      amountUSD = convertToUSD(localAmount, inputCurrency, rateMap) / 1_000_000
    }

    return calculateCommission(amountUSD, selectedFs, selectedWh)
  }, [inputValue, inputCurrency, inputUnit, selectedFs, selectedWh, rateMap])

  if (!feeStructures || !withholdingProfiles || !exchangeRates) {
    return <p className="text-muted">Cargando datos...</p>
  }

  // Auto-select default fee structure on first render
  if (!selectedFsId && feeStructures.length > 0) {
    const def = feeStructures.find((fs) => fs.isDefault) ?? feeStructures[0]
    setSelectedFsId(def.id)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Input */}
      <div className="space-y-5">
        <Card>
          <h2 className="font-heading text-lg mb-4">Parámetros</h2>

          {/* Deal value input */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted font-medium block mb-1">
                Valor del Proyecto
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputUnit === 'millions' ? 'Ej: 50' : 'Ej: 50000000'}
                  className="flex-1 border border-border rounded-md px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
                  min="0"
                  step="any"
                />
                <select
                  value={inputUnit}
                  onChange={(e) => setInputUnit(e.target.value as 'absolute' | 'millions')}
                  className="border border-border rounded-md px-2 py-2 text-xs bg-white"
                >
                  <option value="millions">Millones</option>
                  <option value="absolute">Absoluto</option>
                </select>
              </div>
            </div>

            <CurrencySelector
              value={inputCurrency}
              onChange={setInputCurrency}
              label="Moneda de Entrada"
            />

            {/* USD equivalent */}
            {result && inputCurrency !== 'USD' && (
              <div className="bg-cream rounded-lg px-3 py-2 text-xs text-muted">
                Equivalente: <span className="font-mono font-medium text-ink">USD {result.dealMillions.toFixed(2)}M</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          {/* Fee structure selector */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted font-medium block mb-1">
                Estructura de Fees
              </label>
              <select
                value={selectedFsId ?? ''}
                onChange={(e) => setSelectedFsId(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {feeStructures.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name}{fs.isDefault ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
              {selectedFs && (
                <div className="mt-1 text-xs text-muted">
                  Tiers: {selectedFs.tiers.map((t) => `${(t.rate * 100).toFixed(1)}%`).join(' / ')}
                  {' — '}Scope: {selectedFs.scope.type}
                  {selectedFs.scope.country ? ` (${selectedFs.scope.country})` : ''}
                </div>
              )}
            </div>

            {/* Withholding selector */}
            <div>
              <label className="text-xs text-muted font-medium block mb-1">
                Jurisdicción de Retención
              </label>
              <select
                value={selectedWhId ?? ''}
                onChange={(e) => setSelectedWhId(e.target.value || undefined)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Sin retención</option>
                {withholdingProfiles.map((wp) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Right: Results */}
      <div className="space-y-5">
        <Card>
          <TierBreakdown
            tiers={result?.tierBreakdown ?? []}
            dealMillions={result?.dealMillions ?? 0}
            grossFee={result?.grossFee ?? 0}
            effectiveRate={result?.effectiveRate ?? 0}
          />
        </Card>

        {result && result.withholding.length > 0 && (
          <Card>
            <WithholdingPanel
              results={result.withholding}
              profileName={selectedWh?.name}
            />
          </Card>
        )}

        {result && (
          <Card>
            <VerificationProof result={result} />
          </Card>
        )}
      </div>
    </div>
  )
}
