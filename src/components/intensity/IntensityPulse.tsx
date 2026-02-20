import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { getTemperature } from '@/components/pipeline/temperature'
import { assessPipelineHealth } from '@/lib/intensity-engine'
import Card from '@/components/shared/Card'
import { TemperatureDot } from '@/components/shared/Badge'
import CountryFlag from '@/components/shared/CountryFlag'
import { Activity, AlertTriangle } from 'lucide-react'
import type { OpportunityStage, Temperature } from '@/lib/types'

const ACTIVE_STAGES: OpportunityStage[] = ['identification', 'qualification', 'proposal', 'negotiation']

export default function IntensityPulse() {
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []) ?? []
  const contacts = useLiveQuery(() => db.contacts.toArray(), []) ?? []
  const config = useLiveQuery(() => db.intensityConfig.toCollection().first(), [])

  const data = useMemo(() => {
    const active = opportunities.filter((o) => ACTIVE_STAGES.includes(o.stage))
    const allInteractions = contacts.flatMap((c) => c.interactions)

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisWeek = allInteractions.filter((ix) => new Date(ix.date) >= weekAgo)
    const meetings = thisWeek.filter(
      (ix) => ix.type === 'meeting' || ix.type === 'presentation' || ix.type === 'site_visit',
    )

    // Temperature map for active opps
    const tempMap: Array<{ id: string; name: string; country: string; temp: Temperature }> = []
    for (const opp of active) {
      tempMap.push({
        id: opp.id,
        name: opp.name,
        country: opp.country,
        temp: getTemperature(opp, config?.thresholds),
      })
    }

    const hotOpps = tempMap.filter((t) => t.temp === 'hot').length
    const coldAlerts = tempMap.filter((t) => t.temp === 'cold' || t.temp === 'dormant')

    const health = assessPipelineHealth(
      thisWeek.length,
      config?.benchmarks.interactionsPerWeek ?? 8,
      hotOpps,
      active.length,
    )

    return {
      weeklyInteractions: thisWeek.length,
      weeklyMeetings: meetings.length,
      targetInteractions: config?.benchmarks.interactionsPerWeek ?? 8,
      targetMeetings: config?.benchmarks.meetingsPerWeek ?? 3,
      health,
      tempMap,
      coldAlerts,
      activeCount: active.length,
    }
  }, [opportunities, contacts, config])

  const healthColors = {
    healthy: 'text-green-net',
    attention: 'text-gold',
    critical: 'text-red',
  }
  const healthLabels = {
    healthy: 'Saludable',
    attention: 'Atención',
    critical: 'Crítico',
  }

  return (
    <Card dark>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-gold" />
        <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">Pulso de Intensidad</h3>
        <span className={`ml-auto text-sm font-semibold ${healthColors[data.health]}`}>
          {healthLabels[data.health]}
        </span>
      </div>

      {/* Activity bars */}
      <div className="space-y-3 mb-4">
        <ProgressBar label="Interacciones" current={data.weeklyInteractions} target={data.targetInteractions} />
        <ProgressBar label="Reuniones" current={data.weeklyMeetings} target={data.targetMeetings} />
      </div>

      {/* Temperature summary */}
      <div className="flex flex-wrap gap-2 mb-3">
        {data.tempMap.map((item) => (
          <div key={item.id} className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1">
            <TemperatureDot temperature={item.temp} />
            <CountryFlag code={item.country} size="sm" />
            <span className="text-xs text-white/70 truncate max-w-[100px]">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Cold alerts */}
      {data.coldAlerts.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs text-white/60 uppercase tracking-wider">Alertas</span>
          </div>
          {data.coldAlerts.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-white/70 py-0.5">
              <TemperatureDot temperature={item.temp} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function ProgressBar({ label, current, target }: { label: string; current: number; target: number }) {
  const pct = Math.min((current / Math.max(target, 1)) * 100, 100)
  const isOnTrack = current >= target * 0.8

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/60">{label}</span>
        <span className="text-white/80 font-mono">
          {current}/{target}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOnTrack ? 'bg-green-net' : 'bg-gold'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
