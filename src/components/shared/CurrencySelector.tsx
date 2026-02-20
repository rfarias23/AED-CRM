import type { Currency } from '@/lib/types'
import { getCurrencyMeta } from '@/lib/currency-engine'

const COMMON_CURRENCIES: Currency[] = [
  'USD', 'CLP', 'PEN', 'COP', 'BRL', 'MXN', 'ARS', 'UF', 'EUR',
]

interface CurrencySelectorProps {
  value: Currency
  onChange: (currency: Currency) => void
  currencies?: Currency[]
  label?: string
  className?: string
}

export default function CurrencySelector({
  value,
  onChange,
  currencies = COMMON_CURRENCIES,
  label,
  className = '',
}: CurrencySelectorProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs text-muted font-medium">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
        className="border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
      >
        {currencies.map((c) => {
          const meta = getCurrencyMeta(c)
          return (
            <option key={c} value={c}>
              {c} — {meta.name}
            </option>
          )
        })}
      </select>
    </div>
  )
}
