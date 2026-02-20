import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { getTemperature } from '@/components/pipeline/temperature'
import Card from '@/components/shared/Card'
import { TemperatureDot } from '@/components/shared/Badge'
import CountryFlag from '@/components/shared/CountryFlag'
import { formatRelativeDate } from '@/lib/formatters'
import type { OpportunityStage, Temperature } from '@/lib/types'

const ACTIVE_STAGES: OpportunityStage[] = ['identification', 'qualification', 'proposal', 'negotiation']

export default function TemperatureHeatmap() {
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []) ?? []
  const config = useLiveQuery(() => db.intensityConfig.toCollection().first(), [])

  const items = useMemo(() => {
    const active = opportunities.filter((o) => ACTIVE_STAGES.includes(o.stage))
    return active
      .map((opp) => ({
        id: opp.id,
        name: opp.name,
        country: opp.country,
        stage: opp.stage,
        temp: getTemperature(opp, config?.thresholds),
        lastUpdate: opp.updatedAt,
      }))
      .sort((a, b) => {
        const order: Temperature[] = ['dormant', 'cold', 'cool', 'warm', 'hot']
        return order.indexOf(a.temp) - order.indexOf(b.temp)
      })
  }, [opportunities, config])

  // Group by temperature
  const groups = useMemo(() => {
    const map = new Map<Temperature, typeof items>()
    for (const item of items) {
      const arr = map.get(item.temp) ?? []
      arr.push(item)
      map.set(item.temp, arr)
    }
    return map
  }, [items])

  const tempOrder: Temperature[] = ['dormant', 'cold', 'cool', 'warm', 'hot']

  return (
    <Card>
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Mapa de Temperatura</h3>
      <div className="space-y-4">
        {tempOrder.map((temp) => {
          const group = groups.get(temp)
          if (!group || group.length === 0) return null
          return (
            <div key={temp}>
              <div className="flex items-center gap-2 mb-2">
                <TemperatureDot temperature={temp} showLabel />
                <span className="text-xs text-muted">({group.length})</span>
              </div>
              <div className="space-y-1">
                {group.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm pl-6 py-1">
                    <CountryFlag code={item.country} size="sm" />
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="text-xs text-muted">{formatRelativeDate(item.lastUpdate)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {items.length === 0 && (
          <p className="text-sm text-muted">Sin oportunidades activas.</p>
        )}
      </div>
    </Card>
  )
}
