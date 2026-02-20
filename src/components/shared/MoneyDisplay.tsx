import type { Currency } from '@/lib/types'
import { formatMoney, formatDualCurrency } from '@/lib/currency-engine'

interface MoneyDisplayProps {
  amount: number
  currency: Currency
  amountUSD?: number
  compact?: boolean
  showDual?: boolean
  className?: string
}

/**
 * Currency-aware monetary display.
 * Uses JetBrains Mono (font-mono) for all monetary values per design spec.
 * When showDual=true and currency ≠ USD, shows "CLP 42.750M / USD 45M".
 */
export default function MoneyDisplay({
  amount,
  currency,
  amountUSD,
  compact = false,
  showDual = true,
  className = '',
}: MoneyDisplayProps) {
  if (showDual && currency !== 'USD' && amountUSD !== undefined) {
    return (
      <span className={`font-mono ${className}`}>
        {formatDualCurrency(amount, currency, amountUSD, { compact })}
      </span>
    )
  }

  return (
    <span className={`font-mono ${className}`}>
      {formatMoney(amount, currency, { compact })}
    </span>
  )
}
