import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useOpportunityStore } from '@/stores/useOpportunityStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useCurrencyStore } from '@/stores/useCurrencyStore'
import { calculatePipelineFees } from '@/lib/commission-engine'
import { convertFromUSD, formatMoney } from '@/lib/currency-engine'
import { getTemperature } from '@/components/pipeline/temperature'
import KPICard from '@/components/shared/KPICard'
import Card from '@/components/shared/Card'
import Tooltip from '@/components/shared/Tooltip'
import { StageBadge, TemperatureDot } from '@/components/shared/Badge'
import { formatRelativeDate } from '@/lib/formatters'
import {
  DollarSign, TrendingUp, Award, Receipt,
  Activity, AlertTriangle, Thermometer,
} from 'lucide-react'
import type { OpportunityStage } from '@/lib/types'

const ACTIVE_STAGES: OpportunityStage[] = ['identification', 'qualification', 'proposal', 'negotiation']
const STAGE_ORDER: OpportunityStage[] = ['identification', 'qualification', 'proposal', 'negotiation', 'won']

export default function Dashboard() {
  const load = useOpportunityStore((s) => s.load)
  useEffect(() => { load() }, [load])

  const displayCurrency = useSettingsStore((s) => s.displayCurrency)
  const rateMap = useCurrencyStore((s) => s.rateMap)

  const opportunities = useLiveQuery(() => db.opportunities.toArray(), []) ?? []
  const feeStructures = useLiveQuery(() => db.feeStructures.toArray(), []) ?? []
  const withholdingProfiles = useLiveQuery(() => db.withholdingProfiles.toArray(), []) ?? []
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) ?? []
  const contacts = useLiveQuery(() => db.contacts.toArray(), []) ?? []

  // Helper: convert USD → display currency (safe fallback to USD if rate missing)
  const toDisplay = useMemo(() => {
    return (amountUSD: number) => {
      try {
        return convertFromUSD(amountUSD, displayCurrency, rateMap)
      } catch {
        return amountUSD // Fallback: show USD if rate not found
      }
    }
  }, [displayCurrency, rateMap])

  // Helper: format in display currency with compact notation
  const fmt = useMemo(() => {
    return (amountUSD: number) => formatMoney(toDisplay(amountUSD), displayCurrency, { compact: true })
  }, [toDisplay, displayCurrency])

  const stats = useMemo(() => {
    const active = opportunities.filter((o) => ACTIVE_STAGES.includes(o.stage))
    const won = opportunities.filter((o) => o.stage === 'won')
    const pipeline = calculatePipelineFees(opportunities, feeStructures, withholdingProfiles)

    const pipelineTotal = active.reduce((sum, o) => sum + o.aschValueUSD, 0)
    const weighted = active.reduce((sum, o) => sum + o.aschValueUSD * o.probabilityOfAward, 0)
    const wonTotal = won.reduce((sum, o) => sum + o.aschValueUSD, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amountUSD, 0)
    // Gross fees are in USD millions — convert to raw USD for consistent formatting
    const grossFeesUSD = pipeline.totalGrossFees * 1_000_000

    // By stage counts (values in raw USD for conversion)
    const byStage = STAGE_ORDER.map((stage) => ({
      stage,
      count: opportunities.filter((o) => o.stage === stage).length,
      value: opportunities.filter((o) => o.stage === stage).reduce((s, o) => s + o.aschValueUSD, 0),
    }))

    // Temperature breakdown
    const tempCounts = { hot: 0, warm: 0, cool: 0, cold: 0, dormant: 0 }
    for (const opp of active) {
      const temp = getTemperature(opp)
      tempCounts[temp]++
    }

    // Recent interactions
    const allInteractions = contacts
      .flatMap((c) => c.interactions.map((ix) => ({ ...ix, contactName: `${c.firstName} ${c.lastName}` })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    // Cold/dormant alerts
    const coldAlerts = active
      .filter((o) => {
        const temp = getTemperature(o)
        return temp === 'cold' || temp === 'dormant'
      })
      .slice(0, 5)

    return {
      pipelineTotal, weighted, wonTotal, totalExpenses, grossFeesUSD,
      byStage, tempCounts,
      allInteractions, coldAlerts,
      activeCount: active.length,
    }
  }, [opportunities, feeStructures, withholdingProfiles, expenses, contacts])

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl">Panel Principal</h1>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Pipeline Total" value={fmt(stats.pipelineTotal)}
          icon={<DollarSign className="w-5 h-5" />}
          tooltip="Valor total (ASCH) de las oportunidades activas: Identificación, Calificación, Propuesta y Negociación." />
        <KPICard label="Ponderado" value={fmt(stats.weighted)}
          icon={<TrendingUp className="w-5 h-5" />}
          tooltip="Pipeline Total ajustado por la probabilidad de ganar cada oportunidad. Refleja el valor esperado realista." />
        <KPICard label="Fees Bruto" value={fmt(stats.grossFeesUSD)}
          icon={<DollarSign className="w-5 h-5" />}
          tooltip="Comisiones brutas estimadas sobre el pipeline activo, antes de retenciones e impuestos." />
        <KPICard label="Ganado YTD" value={fmt(stats.wonTotal)}
          icon={<Award className="w-5 h-5" />}
          tooltip="Valor total (ASCH) de oportunidades ganadas en lo que va del año." />
        <KPICard label="Gastos Q" value={formatMoney(toDisplay(stats.totalExpenses), displayCurrency)}
          icon={<Receipt className="w-5 h-5" />}
          tooltip="Total de gastos registrados en el trimestre actual: viajes, representación, y otros costos operativos." />
        <KPICard label="Opp. Activas" value={stats.activeCount.toString()}
          icon={<Activity className="w-5 h-5" />}
          tooltip="Número de oportunidades en etapas activas (excluyendo ganadas, perdidas y dormidas)." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline by stage */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Pipeline por Etapa</h3>
          <div className="space-y-3">
            {stats.byStage.map((s) => {
              const maxVal = Math.max(...stats.byStage.map((x) => x.value), 1)
              const pct = (s.value / maxVal) * 100
              return (
                <div key={s.stage} className="flex items-center gap-3">
                  <div className="w-28"><StageBadge stage={s.stage} /></div>
                  <div className="flex-1 bg-cream rounded-full h-3 overflow-hidden">
                    <div className="bg-accent h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-xs text-muted w-28 text-right">
                    {fmt(s.value)} ({s.count})
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Temperature / Intensity Pulse */}
        <Card dark>
          <Tooltip text="Distribución de oportunidades activas según la frecuencia e intensidad de interacciones recientes." position="bottom">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <Thermometer className="w-4 h-4" /> Pulso de Intensidad
            </h3>
          </Tooltip>
          <div className="space-y-3">
            {(['hot', 'warm', 'cool', 'cold', 'dormant'] as const).map((temp) => (
              <div key={temp} className="flex items-center justify-between">
                <TemperatureDot temperature={temp} showLabel />
                <span className="font-mono text-sm text-ink">{stats.tempCounts[temp]}</span>
              </div>
            ))}
          </div>
          {stats.coldAlerts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted flex items-center gap-1 mb-2">
                <AlertTriangle className="w-3 h-3" /> Alertas frías
              </p>
              {stats.coldAlerts.map((o) => (
                <Link key={o.id} to={`/opportunities/${o.id}`}
                  className="block text-xs text-ink/70 hover:text-accent truncate py-0.5">
                  {o.name}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Actividad Reciente</h3>
        {stats.allInteractions.length === 0 ? (
          <p className="text-sm text-muted">Sin interacciones recientes.</p>
        ) : (
          <div className="space-y-3">
            {stats.allInteractions.map((ix) => (
              <div key={ix.id} className="flex items-start gap-3 text-sm">
                <span className="text-xs text-muted w-20 shrink-0">{formatRelativeDate(ix.date)}</span>
                <div className="flex-1">
                  <span className="font-medium">{ix.contactName}</span>
                  <span className="text-muted"> — {ix.summary.slice(0, 80)}{ix.summary.length > 80 ? '...' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
