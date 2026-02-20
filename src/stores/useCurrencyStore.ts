import { create } from 'zustand'
import type { ExchangeRate, Currency } from '@/lib/types'
import { db } from '@/lib/db'
import { buildRateMap } from '@/lib/currency-engine'

interface CurrencyState {
  rates: ExchangeRate[]
  rateMap: Map<string, number>
  loading: boolean

  load: () => Promise<void>
  updateRate: (id: string, rate: number) => Promise<void>
  getRate: (from: Currency, to: Currency) => number | undefined
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rates: [],
  rateMap: new Map(),
  loading: false,

  load: async () => {
    set({ loading: true })
    const rates = await db.exchangeRates.toArray()
    const rateMap = buildRateMap(rates)
    set({ rates, rateMap, loading: false })
  },

  updateRate: async (id, rate) => {
    const updatedAt = new Date().toISOString()
    await db.exchangeRates.update(id, { rate, updatedAt })
    const rates = get().rates.map((r) =>
      r.id === id ? { ...r, rate, updatedAt } : r,
    )
    set({ rates, rateMap: buildRateMap(rates) })
  },

  getRate: (from, to) => {
    if (from === to) return 1
    return get().rateMap.get(`${from}->${to}`)
  },
}))
