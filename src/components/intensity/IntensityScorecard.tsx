import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import {
  calculateOpportunityTemperature,
  calculateOpportunityIntensityScore,
} from '@/lib/intensity-engine'
import Card from '@/components/shared/Card'
import { TemperatureDot } from '@/components/shared/Badge'
import { differenceInDays } from 'date-fns'
import { Activity, Clock, BarChart3 } from 'lucide-react'

interface Props {
  opportunityId: string
}

export default function IntensityScorecard({ opportunityId }: Props) {
  const contacts = useLiveQuery(() => db.contacts.toArray(), []) ?? []
  const config = useLiveQuery(() => db.intensityConfig.toCollection().first(), [])
  const opp = useLiveQuery(() => db.opportunities.get(opportunityId), [opportunityId])

  const data = useMemo(() => {
    if (!opp || !config) return null

    // Find all interactions linked to this opportunity
    const oppInteractions = contacts.flatMap((c) =>
      c.interactions.filter((ix) => ix.opportunityId === opportunityId),
    )

    const now = new Date()

    // Use the latest interaction date as the actual "last touchpoint"
    const lastInteractionDate = oppInteractions.length > 0
      ? new Date(Math.max(...oppInteractions.map((ix) => new Date(ix.date).getTime())))
      : new Date(opp.updatedAt)
    const daysSinceLastTouchpoint = differenceInDays(now, lastInteractionDate)

    const temperature = calculateOpportunityTemperature(daysSinceLastTouchpoint, config)

    const highQualityCount = oppInteractions.filter((ix) => ix.quality === 'high').length
    const highQualityPct = oppInteractions.length > 0 ? highQualityCount / oppInteractions.length : 0

    const expectedTouchpoints = config.benchmarks.touchpointsPerActiveOpp ?? 4
    const intensityScore = calculateOpportunityIntensityScore(
      oppInteractions.length,
      expectedTouchpoints,
      daysSinceLastTouchpoint,
      highQualityPct,
      config,
    )

    // Distribution by type
    const typeDist = new Map<string, number>()
    for (const ix of oppInteractions) {
      typeDist.set(ix.type, (typeDist.get(ix.type) ?? 0) + 1)
    }

    // Recent timeline (last 5)
    const timeline = [...oppInteractions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    return {
      temperature,
      intensityScore,
      totalTouchpoints: oppInteractions.length,
      highQualityPct,
      daysSinceLastTouchpoint,
      typeDist: Array.from(typeDist.entries()).sort((a, b) => b[1] - a[1]),
      timeline,
    }
  }, [opp, contacts, config, opportunityId])

  if (!data) return null

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Scorecard de Intensidad</h3>
      </div>

      {/* Score + Temperature */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <IntensityGauge score={data.intensityScore} />
          <span className="text-xs text-muted block mt-1">Score</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 h-12">
            <TemperatureDot temperature={data.temperature} showLabel />
          </div>
          <span className="text-xs text-muted block mt-1">Temperatura</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 h-12">
            <Clock className="w-4 h-4 text-muted" />
            <span className="font-mono text-lg">{data.daysSinceLastTouchpoint}d</span>
          </div>
          <span className="text-xs text-muted block mt-1">Desde último contacto</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-cream rounded-lg p-3 text-center">
          <div className="font-mono text-xl">{data.totalTouchpoints}</div>
          <div className="text-xs text-muted">Touchpoints</div>
        </div>
        <div className="bg-cream rounded-lg p-3 text-center">
          <div className="font-mono text-xl">{(data.highQualityPct * 100).toFixed(0)}%</div>
          <div className="text-xs text-muted">Alta Calidad</div>
        </div>
      </div>

      {/* Type distribution */}
      {data.typeDist.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-muted" />
            <span className="text-xs text-muted uppercase tracking-wider">Distribución</span>
          </div>
          <div className="space-y-1.5">
            {data.typeDist.map(([type, count]) => {
              const pct = data.totalTouchpoints > 0 ? (count / data.totalTouchpoints) * 100 : 0
              return (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <span className="w-24 capitalize truncate">{type.replace('_', ' ')}</span>
                  <div className="flex-1 bg-cream rounded-full h-1.5 overflow-hidden">
                    <div className="bg-accent h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-muted w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent timeline */}
      {data.timeline.length > 0 && (
        <div>
          <span className="text-xs text-muted uppercase tracking-wider">Últimos Contactos</span>
          <div className="space-y-1.5 mt-2">
            {data.timeline.map((ix, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-border last:border-0">
                <span className="text-muted w-20">
                  {new Date(ix.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                </span>
                <span className="capitalize px-1.5 py-0.5 bg-cream rounded text-[10px]">
                  {ix.type.replace('_', ' ')}
                </span>
                <span className="flex-1 truncate text-muted">{ix.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function IntensityGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-green-net' : score >= 40 ? 'text-gold' : 'text-red'

  return (
    <div className={`font-mono text-3xl font-bold ${color} h-12 flex items-center justify-center`}>
      {score}
    </div>
  )
}
