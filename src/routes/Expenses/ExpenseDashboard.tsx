import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import KPICard from '@/components/shared/KPICard'
import Card from '@/components/shared/Card'
import type { ExpenseType } from '@/lib/types'
import { DollarSign, TrendingDown, Hash } from 'lucide-react'

const TYPE_LABELS: Record<ExpenseType, string> = {
  travel: 'Viaje',
  accommodation: 'Alojamiento',
  meals: 'Alimentación',
  transport: 'Transporte',
  communication: 'Comunicaciones',
  subscriptions: 'Suscripciones',
  office: 'Oficina',
  representation: 'Representación',
  professional_services: 'Servicios Prof.',
  other: 'Otro',
}

export default function ExpenseDashboard() {
  const expenses = useLiveQuery(() => db.expenses.toArray(), [])

  const stats = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { totalUSD: 0, count: 0, byType: [] as { type: ExpenseType; total: number; count: number }[], byCountry: [] as { country: string; total: number }[] }
    }

    const totalUSD = expenses.reduce((sum, e) => sum + e.amountUSD, 0)

    // Group by type
    const typeMap = new Map<ExpenseType, { total: number; count: number }>()
    for (const e of expenses) {
      const prev = typeMap.get(e.type) ?? { total: 0, count: 0 }
      typeMap.set(e.type, { total: prev.total + e.amountUSD, count: prev.count + 1 })
    }
    const byType = Array.from(typeMap.entries())
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.total - a.total)

    return { totalUSD, count: expenses.length, byType, byCountry: [] }
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Total Gastos"
          value={`$${stats.totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          subtitle="USD acumulado"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KPICard
          label="Registros"
          value={stats.count.toString()}
          subtitle="Gastos registrados"
          icon={<Hash className="w-5 h-5" />}
        />
        <KPICard
          label="Promedio"
          value={stats.count > 0 ? `$${(stats.totalUSD / stats.count).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$0'}
          subtitle="USD por gasto"
          icon={<TrendingDown className="w-5 h-5" />}
        />
      </div>

      {/* By Type breakdown */}
      {stats.byType.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Gastos por Categoría</h3>
          <div className="space-y-2">
            {stats.byType.map((item) => {
              const pct = stats.totalUSD > 0 ? (item.total / stats.totalUSD) * 100 : 0
              return (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate">{TYPE_LABELS[item.type]}</span>
                  <div className="flex-1 bg-cream rounded-full h-2 overflow-hidden">
                    <div className="bg-accent h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-xs text-muted w-20 text-right">
                    ${item.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="font-mono text-xs text-muted w-10 text-right">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
