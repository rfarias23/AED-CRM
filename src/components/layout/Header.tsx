import { useSettingsStore } from '@/stores/useSettingsStore'
import type { Currency } from '@/lib/types'
import { Menu } from 'lucide-react'

const DISPLAY_CURRENCIES: Currency[] = ['USD', 'CLP', 'PEN', 'COP', 'EUR']

export default function Header() {
  const displayCurrency = useSettingsStore((s) => s.displayCurrency)
  const setDisplayCurrency = useSettingsStore((s) => s.setDisplayCurrency)
  const openMobile = useSettingsStore((s) => s.openMobileSidebar)

  return (
    <header className="h-14 lg:h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={openMobile}
        className="p-2 -ml-2 rounded-lg hover:bg-cream transition-colors lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop spacer */}
      <div className="hidden lg:block" />

      {/* Currency selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted hidden sm:inline" htmlFor="display-currency">
          Moneda:
        </label>
        <select
          id="display-currency"
          value={displayCurrency}
          onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
          className="text-sm border border-border rounded-md px-2 py-1 bg-paper focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {DISPLAY_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
