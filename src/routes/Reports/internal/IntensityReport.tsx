import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { getTemperature } from '@/components/pipeline/temperature'
import Card from '@/components/shared/Card'
import { TemperatureDot } from '@/components/shared/Badge'
import CountryFlag from '@/components/shared/CountryFlag'
import { formatRelativeDate } from '@/lib/formatters'
import { AlertTriangle, Shield } from 'lucide-react'
import type { OpportunityStage, Temperature } from '@/lib/types'

const ACTIVE_STAGES: OpportunityStage[] = ['identification', 'qualification', 'proposal', 'negotiation']

export default function IntensityReport() {
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []) ?? []
  const contacts = useLiveQuery(() => db.contacts.toArray(), []) ?? []
  const config = useLiveQuery(() => db.intensityConfig.toCollection().first(), [])

  const data = useMemo(() => {
    const active = opportunities.filter((o) => ACTIVE_STAGES.includes(o.stage))
    const allInteractions = contacts.flatMap((c) => c.interactions)

    // Activity summary
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisWeek = allInteractions.filter((ix) => new Date(ix.date) >= weekAgo)
    const meetings = thisWeek.filter((ix) => ix.type === 'meeting' || ix.type === 'presentation' || ix.type === 'site_visit')
    const highQuality = thisWeek.filter((ix) => ix.quality === 'high')

    // Temperature map
    const tempMap: Array<{ id: string; name: string; country: string; temp: Temperature; lastUpdate: string }> = []
    for (const opp of active) {
      tempMap.push({
        id: opp.id,
        name: opp.name,
        country: opp.country,
        temp: getTemperature(opp, config?.thresholds),
        lastUpdate: opp.updatedAt,
      })
    }
    tempMap.sort((a, b) => {
      const order: Temperature[] = ['dormant', 'cold', 'cool', 'warm', 'hot']
      return order.indexOf(a.temp) - order.indexOf(b.temp)
    })

    // Attention needed
    const attentionNeeded = tempMap.filter((t) => t.temp === 'cold' || t.temp === 'dormant')

    // Interaction types distribution
    const typeDistribution = new Map<string, number>()
    for (const ix of allInteractions) {
      typeDistribution.set(ix.type, (typeDistribution.get(ix.type) ?? 0) + 1)
    }

    return {
      weeklyInteractions: thisWeek.length,
      weeklyMeetings: meetings.length,
      highQualityCount: highQuality.length,
      highQualityPct: thisWeek.length > 0 ? highQuality.length / thisWeek.length : 0,
      totalInteractions: allInteractions.length,
      tempMap,
      attentionNeeded,
      typeDistribution: Array.from(typeDistribution.entries()).sort((a, b) => b[1] - a[1]),
      activeCount: active.length,
    }
  }, [opportunities, contacts, config])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="font-heading text-xl">Reporte de Intensidad</h2>
        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
          <Shield className="w-3 h-3" /> INTERNO
        </span>
      </div>

      {/* Activity KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card dark padding="sm">
          <span className="text-xs text-muted" title="Número total de interacciones registradas en los últimos 7 días. Mide el ritmo de actividad comercial semanal.">Interacciones/Sem</span>
          <div className="font-mono text-2xl mt-1">{data.weeklyInteractions}</div>
          <span className="text-xs text-muted/70">Objetivo: {config?.benchmarks.interactionsPerWeek ?? 8}</span>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-muted" title="Reuniones presenciales, presentaciones y visitas de sitio realizadas esta semana. Las reuniones son las interacciones de mayor impacto comercial.">Reuniones/Sem</span>
          <div className="font-mono text-2xl mt-1">{data.weeklyMeetings}</div>
          <span className="text-xs text-muted/70">Objetivo: {config?.benchmarks.meetingsPerWeek ?? 3}</span>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-muted" title="Porcentaje de interacciones semanales calificadas como alta calidad. Refleja la profundidad y relevancia de las conversaciones comerciales.">% Alta Calidad</span>
          <div className="font-mono text-2xl mt-1">{(data.highQualityPct * 100).toFixed(0)}%</div>
          <span className="text-xs text-muted/70">Objetivo: {((config?.benchmarks.highQualityPctTarget ?? 0.4) * 100).toFixed(0)}%</span>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-muted" title="Cantidad acumulada de todas las interacciones registradas históricamente con todos los contactos.">Total Interacciones</span>
          <div className="font-mono text-2xl mt-1">{data.totalInteractions}</div>
        </Card>
      </div>

      {/* Temperature heatmap */}
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3" title="Indicador visual de la actividad reciente de cada oportunidad. Las temperaturas frías o dormidas señalan oportunidades que requieren atención inmediata.">Mapa de Temperatura</h3>
        <div className="space-y-2">
          {data.tempMap.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-border last:border-0">
              <TemperatureDot temperature={item.temp} />
              <CountryFlag code={item.country} size="sm" />
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-xs text-muted">{formatRelativeDate(item.lastUpdate)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Interaction types */}
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3" title="Desglose de interacciones por tipo (reunión, email, llamada, etc.). Permite evaluar si el mix de actividades es el adecuado para avanzar oportunidades.">Distribución de Esfuerzo</h3>
        <div className="space-y-2">
          {data.typeDistribution.map(([type, count]) => {
            const pct = data.totalInteractions > 0 ? (count / data.totalInteractions) * 100 : 0
            return (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm w-36 capitalize">{type.replace('_', ' ')}</span>
                <div className="flex-1 bg-cream rounded-full h-2 overflow-hidden">
                  <div className="bg-tier2 h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-mono text-xs text-muted w-12 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Attention needed */}
      {data.attentionNeeded.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gold" /> <span title="Oportunidades con temperatura fría o dormida que necesitan interacción urgente para evitar perder tracción comercial.">Requieren Atención</span>
          </h3>
          <div className="space-y-2">
            {data.attentionNeeded.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <TemperatureDot temperature={item.temp} showLabel />
                <span className="flex-1">{item.name}</span>
                <span className="text-xs text-muted">{formatRelativeDate(item.lastUpdate)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
