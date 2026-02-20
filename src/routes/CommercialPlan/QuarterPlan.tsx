import { useEffect, useState } from 'react'
import { usePlanStore } from '@/stores/usePlanStore'
import Card from '@/components/shared/Card'
import KPICard from '@/components/shared/KPICard'
import { StatusBadge } from '@/components/shared/Badge'
import EmptyState from '@/components/shared/EmptyState'
import Modal from '@/components/shared/Modal'
import Tooltip from '@/components/shared/Tooltip'
import {
  Plus, Calendar, Target, CheckCircle2, TrendingUp,
  DollarSign, BarChart3, Users, AlertTriangle,
} from 'lucide-react'
import type { QuarterPlan as QPType } from '@/lib/types'

const STATUS_VARIANTS = {
  draft: 'warning' as const,
  active: 'success' as const,
  closed: 'default' as const,
  reviewed: 'info' as const,
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  closed: 'Cerrado',
  reviewed: 'Revisado',
}

const STAGE_LABELS: Record<string, string> = {
  identification: 'Identificación',
  qualification: 'Calificación',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
}

// ── Helper: format M$ ──
function fmtM(v: number): string {
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 1 })}M`
}
function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}
function fmtX(v: number): string {
  return `${v.toFixed(1)}x`
}

// ── Default empty plan ──
function defaultPlan(): Omit<QPType, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    year: new Date().getFullYear(),
    quarter: (Math.ceil((new Date().getMonth() + 1) / 3)) as 1 | 2 | 3 | 4,
    status: 'draft',
    pipelineBrutoUSD: 0,
    opportunidadesActivas: 0,
    pipelinePorFase: { identification: 0, qualification: 0, proposal: 0, negotiation: 0 },
    opportunidadesEvaluadas: 0,
    opportunidadesGo: 0,
    winRateTarget: 0.25,
    wonUSD: 0,
    lostUSD: 0,
    feesDevengadosUSD: 0,
    feesCobradosUSD: 0,
    agingPromedioMeses: 0,
    pipelineNuevoUSD: 0,
    pipelineSalidoUSD: 0,
    velocidadPipelineMeses: 0,
    vintageWon: [],
    bidCostUSD: 0,
    budgetUSD: 0,
    targetNewContacts: 0,
    targetInteractionsPerWeek: 8,
    targetMeetingsPerWeek: 3,
    reunionesDecisionMakers: 0,
    strategicPriorities: [],
    top3Oportunidades: [],
    riesgos: [],
    notes: '',
    milestones: [],
  }
}

// ── Tab definitions for create/edit form ──
const TABS = ['Identificación', 'Pipeline', 'Resultados', 'Vintage', 'Costos', 'Actividad', 'Narrativa'] as const

export default function QuarterPlanView() {
  const plans = usePlanStore((s) => s.plans)
  const loading = usePlanStore((s) => s.loading)
  const load = usePlanStore((s) => s.load)
  const addPlan = usePlanStore((s) => s.add)
  const closePlan = usePlanStore((s) => s.close)

  const [showNew, setShowNew] = useState(false)
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState(defaultPlan())
  const [priorityInput, setPriorityInput] = useState('')
  const [riesgoInput, setRiesgoInput] = useState('')

  useEffect(() => { load() }, [load])

  const activePlan = plans.find((p) => p.status === 'active')
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.status === 'active') return -1
    if (b.status === 'active') return 1
    return b.year - a.year || b.quarter - a.quarter
  })

  // ── Computed metrics for active plan ──
  const computed = activePlan ? {
    dealSizePromedio: activePlan.opportunidadesActivas > 0
      ? activePlan.pipelineBrutoUSD / activePlan.opportunidadesActivas : 0,
    goNoGoRatio: activePlan.opportunidadesEvaluadas > 0
      ? (activePlan.opportunidadesGo / activePlan.opportunidadesEvaluadas) : 0,
    cobertura: activePlan.wonUSD > 0
      ? activePlan.pipelineBrutoUSD / activePlan.wonUSD : 0,
    tasaEfectivaFees: activePlan.wonUSD > 0
      ? activePlan.feesDevengadosUSD / activePlan.wonUSD : 0,
    cashConversion: activePlan.feesDevengadosUSD > 0
      ? activePlan.feesCobradosUSD / activePlan.feesDevengadosUSD : 0,
    pipelineHealth: activePlan.pipelineSalidoUSD > 0
      ? activePlan.pipelineNuevoUSD / activePlan.pipelineSalidoUSD : 0,
    bidEfficiency: activePlan.bidCostUSD > 0
      ? activePlan.wonUSD / (activePlan.bidCostUSD / 1_000_000) : 0,
  } : null

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await addPlan(form)
    setShowNew(false)
    setForm(defaultPlan())
    setTab(0)
    load()
  }

  const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20'

  if (loading) return <p className="text-muted">Cargando planes...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Plan Comercial — ASCH SPA</h1>
        <button onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Plan
        </button>
      </div>

      {/* ── ASCH Dashboard (active plan) ── */}
      {activePlan && computed && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-lg">Q{activePlan.quarter} {activePlan.year}</h2>
            <StatusBadge label={STATUS_LABELS[activePlan.status]} variant={STATUS_VARIANTS[activePlan.status]} />
          </div>

          {/* Row 1: Pipeline + Conversión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Pipeline
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <KPICard label="Pipeline Bruto" value={fmtM(activePlan.pipelineBrutoUSD)}
                  tooltip="Valor total no ponderado de todas las oportunidades activas en el pipeline." />
                <KPICard label="Deal Size Prom." value={fmtM(computed.dealSizePromedio)}
                  tooltip="Tamaño promedio de cada oportunidad. Se calcula: Pipeline Bruto ÷ # Oportunidades Activas." />
                <KPICard label="# Oportunidades" value={String(activePlan.opportunidadesActivas)}
                  tooltip="Cantidad total de oportunidades activas en el pipeline este trimestre." />
                <KPICard label="Aging Promedio" value={`${activePlan.agingPromedioMeses.toFixed(1)} meses`}
                  tooltip="Tiempo promedio que las oportunidades llevan en el pipeline. Un aging alto puede indicar deals estancados." />
              </div>
              {/* Stage distribution */}
              <div className="flex gap-1 text-xs">
                {Object.entries(activePlan.pipelinePorFase).map(([stage, count]) => (
                  <Tooltip key={stage} text={STAGE_LABELS[stage]}><span className="px-2 py-0.5 bg-cream rounded">
                    {STAGE_LABELS[stage]}: {count}
                  </span></Tooltip>
                ))}
              </div>
            </Card>

            <Card className="space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" /> Conversión
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <KPICard label="Go/No-Go Ratio" value={fmtPct(computed.goNoGoRatio)}
                  tooltip="Porcentaje de oportunidades evaluadas que se decidió perseguir. Fórmula: Go ÷ Evaluadas × 100." />
                <KPICard label="Win Rate Target" value={fmtPct(activePlan.winRateTarget)}
                  tooltip="Tasa objetivo de conversión de propuesta a ganada. En AEC, un benchmark saludable es 20-30%." />
                <KPICard label="Cobertura" value={fmtX(computed.cobertura)}
                  tooltip="Ratio entre pipeline bruto y objetivo de ganado. Benchmark: ≥ 3.0x para compensar el ciclo largo de ventas AEC."
                  trend={computed.cobertura >= 3 ? { value: 1, label: '≥ 3x objetivo' } : { value: -1, label: '< 3x riesgo' }} />
                <KPICard label="Evaluadas" value={`${activePlan.opportunidadesGo}/${activePlan.opportunidadesEvaluadas}`}
                  tooltip="Oportunidades que pasaron el filtro Go/No-Go sobre el total evaluadas." />
              </div>
            </Card>
          </div>

          {/* Row 2: Resultados + Economics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Resultados
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <KPICard label="Won" value={fmtM(activePlan.wonUSD)}
                  tooltip="Valor total de oportunidades ganadas este trimestre." />
                <KPICard label="Lost" value={fmtM(activePlan.lostUSD)}
                  tooltip="Valor total de oportunidades perdidas este trimestre." />
                <KPICard label="Fees Devengados" value={fmtM(activePlan.feesDevengadosUSD)}
                  tooltip="Comisiones brutas devengadas por contrato, antes de retenciones. Refleja el valor contractual." />
                <KPICard label="Fees Cobrados" value={fmtM(activePlan.feesCobradosUSD)}
                  tooltip="Comisiones efectivamente cobradas, netas de retención en origen. Es el cash real recibido." />
              </div>
            </Card>

            <Card className="space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Economics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <KPICard label="Bid Cost" value={`$${activePlan.bidCostUSD.toLocaleString()}`}
                  tooltip="Costo total de preparar propuestas este trimestre (viajes, materiales, horas-hombre dedicadas)." />
                <KPICard label="Tasa Efectiva Fees" value={fmtPct(computed.tasaEfectivaFees)}
                  tooltip="Comisión bruta como porcentaje del valor ganado. Fórmula: Fees Devengados ÷ Won × 100." />
                <KPICard label="Cash Conversion" value={fmtPct(computed.cashConversion)}
                  tooltip="Porcentaje de fees devengados que se convirtieron en cobro real. Fórmula: Cobrados ÷ Devengados × 100." />
                <KPICard label="Bid Efficiency" value={`${computed.bidEfficiency.toFixed(0)}x`}
                  tooltip="Cuántos USD se ganan por cada USD gastado en propuestas. Benchmark: > 50x. Fórmula: Won ÷ Bid Cost." />
              </div>
            </Card>
          </div>

          {/* Row 3: Actividad + Pipeline Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Actividad
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <KPICard label="Contactos Nuevos" value={String(activePlan.targetNewContacts)}
                  tooltip="Meta de nuevos contactos a generar este trimestre. Los contactos alimentan el pipeline futuro." />
                <KPICard label="Int./Semana" value={String(activePlan.targetInteractionsPerWeek)}
                  tooltip="Meta de interacciones semanales (emails, llamadas, reuniones). Indicador líder de generación de pipeline." />
                <KPICard label="Reuniones/Semana" value={String(activePlan.targetMeetingsPerWeek)}
                  tooltip="Meta de reuniones presenciales o virtuales por semana con prospects y clientes." />
                <KPICard label="Reuniones Decision-Makers" value={String(activePlan.reunionesDecisionMakers)}
                  tooltip="Reuniones realizadas directamente con tomadores de decisión (C-level, directores). Alta correlación con win rate." />
              </div>
            </Card>

            <Card className="space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Pipeline Health
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <KPICard label="Pipeline Nuevo" value={fmtM(activePlan.pipelineNuevoUSD)}
                  tooltip="Valor de nuevas oportunidades ingresadas al pipeline este trimestre." />
                <KPICard label="Pipeline Salido" value={fmtM(activePlan.pipelineSalidoUSD)}
                  tooltip="Valor de oportunidades que salieron del pipeline (ganadas + perdidas + abandonadas)." />
                <KPICard label="Health Score" value={fmtX(computed.pipelineHealth)}
                  tooltip="Ratio nuevo vs salido. > 1.0 = pipeline creciendo. < 1.0 = pipeline encogiéndose."
                  trend={computed.pipelineHealth >= 1 ? { value: 1, label: 'Creciendo' } : { value: -1, label: 'Encogiéndose' }} />
                <KPICard label="Velocidad" value={`${activePlan.velocidadPipelineMeses} meses`}
                  tooltip="Tiempo promedio desde identificación hasta resolución (ganada o perdida). Velocidad del ciclo de ventas." />
              </div>
            </Card>
          </div>

          {/* Top 3 Opportunities */}
          {activePlan.top3Oportunidades.length > 0 && (
            <Card className="space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Top 3 Oportunidades</h3>
              <div className="space-y-2">
                {activePlan.top3Oportunidades.map((opp, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <span className="font-medium">{i + 1}. {opp.name}</span>
                      <span className="text-xs text-muted ml-2">{fmtM(opp.valueUSD)} — {STAGE_LABELS[opp.stage] ?? opp.stage}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Tooltip text="Probabilidad de ganar"><span className="font-mono">PWin: {fmtPct(opp.pWin)}</span></Tooltip>
                      <span className="text-xs text-muted">{opp.nextMilestone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Risks */}
          {activePlan.riesgos.length > 0 && (
            <Card className="space-y-2">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Riesgos
              </h3>
              <ul className="space-y-1 text-sm">
                {activePlan.riesgos.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Close button */}
          {activePlan.status === 'active' && (
            <button onClick={() => closePlan(activePlan.id)}
              className="px-4 py-2 text-xs border border-border rounded-lg hover:bg-cream transition-colors">
              Cerrar Plan Q{activePlan.quarter} {activePlan.year}
            </button>
          )}
        </div>
      )}

      {/* ── Plan History ── */}
      {sortedPlans.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="Sin planes"
          description="Crea tu primer plan comercial ASCH trimestral."
        />
      ) : (
        !activePlan && (
          <div className="space-y-3">
            {sortedPlans.map((plan) => (
              <Card key={plan.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-lg">Q{plan.quarter} {plan.year}</h3>
                    <StatusBadge label={STATUS_LABELS[plan.status]} variant={STATUS_VARIANTS[plan.status]} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div><span className="text-muted">Pipeline:</span> <span className="font-mono">{fmtM(plan.pipelineBrutoUSD)}</span></div>
                  <div><span className="text-muted">Won:</span> <span className="font-mono">{fmtM(plan.wonUSD)}</span></div>
                  <div><span className="text-muted">Fees Dev.:</span> <span className="font-mono">{fmtM(plan.feesDevengadosUSD)}</span></div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* ── New Plan Modal (7 tabs) ── */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nuevo Plan ASCH" size="lg">
        {/* Tab bar */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {TABS.map((label, i) => (
            <button key={label} onClick={() => setTab(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                tab === i ? 'bg-accent text-white' : 'bg-cream text-muted hover:text-ink'
              }`}>
              {i + 1}. {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Tab 0: Identificación */}
          {tab === 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Año</label>
                <input type="number" className={inputCls} value={form.year}
                  onChange={(e) => setField('year', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trimestre</label>
                <select className={inputCls} value={form.quarter}
                  onChange={(e) => setField('quarter', parseInt(e.target.value) as 1|2|3|4)}>
                  <option value={1}>Q1</option><option value={2}>Q2</option>
                  <option value={3}>Q3</option><option value={4}>Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select className={inputCls} value={form.status}
                  onChange={(e) => setField('status', e.target.value as 'draft' | 'active')}>
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab 1: Pipeline */}
          {tab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pipeline Bruto (USD M)</label>
                  <input type="number" step="0.1" className={inputCls} value={form.pipelineBrutoUSD || ''}
                    onChange={(e) => setField('pipelineBrutoUSD', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1"># Oportunidades Activas</label>
                  <input type="number" className={inputCls} value={form.opportunidadesActivas || ''}
                    onChange={(e) => setField('opportunidadesActivas', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {(['identification', 'qualification', 'proposal', 'negotiation'] as const).map((stage) => (
                  <div key={stage}>
                    <label className="block text-xs font-medium mb-1">{STAGE_LABELS[stage]}</label>
                    <input type="number" className={inputCls} value={form.pipelinePorFase[stage] || ''}
                      onChange={(e) => setField('pipelinePorFase', { ...form.pipelinePorFase, [stage]: parseInt(e.target.value) || 0 })} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Win Rate Target (%)</label>
                <input type="number" step="1" min="0" max="100" className={inputCls} value={(form.winRateTarget * 100) || ''}
                  onChange={(e) => setField('winRateTarget', (parseFloat(e.target.value) || 0) / 100)} />
              </div>
            </div>
          )}

          {/* Tab 2: Resultados */}
          {tab === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Won (USD M)</label>
                  <input type="number" step="0.1" className={inputCls} value={form.wonUSD || ''}
                    onChange={(e) => setField('wonUSD', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lost (USD M)</label>
                  <input type="number" step="0.1" className={inputCls} value={form.lostUSD || ''}
                    onChange={(e) => setField('lostUSD', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fees Devengados (USD M)</label>
                  <input type="number" step="0.01" className={inputCls} value={form.feesDevengadosUSD || ''}
                    onChange={(e) => setField('feesDevengadosUSD', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fees Cobrados (USD M)</label>
                  <input type="number" step="0.01" className={inputCls} value={form.feesCobradosUSD || ''}
                    onChange={(e) => setField('feesCobradosUSD', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Evaluadas (Go/No-Go)</label>
                  <input type="number" className={inputCls} value={form.opportunidadesEvaluadas || ''}
                    onChange={(e) => setField('opportunidadesEvaluadas', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Go (decididas perseguir)</label>
                  <input type="number" className={inputCls} value={form.opportunidadesGo || ''}
                    onChange={(e) => setField('opportunidadesGo', parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Vintage/Aging */}
          {tab === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pipeline Nuevo (USD M)</label>
                <input type="number" step="0.1" className={inputCls} value={form.pipelineNuevoUSD || ''}
                  onChange={(e) => setField('pipelineNuevoUSD', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pipeline Salido (USD M)</label>
                <input type="number" step="0.1" className={inputCls} value={form.pipelineSalidoUSD || ''}
                  onChange={(e) => setField('pipelineSalidoUSD', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Velocidad Pipeline (meses)</label>
                <input type="number" step="0.5" className={inputCls} value={form.velocidadPipelineMeses || ''}
                  onChange={(e) => setField('velocidadPipelineMeses', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Aging Promedio (meses)</label>
                <input type="number" step="0.5" className={inputCls} value={form.agingPromedioMeses || ''}
                  onChange={(e) => setField('agingPromedioMeses', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* Tab 4: Costos */}
          {tab === 4 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bid Cost (USD)</label>
                <input type="number" className={inputCls} value={form.bidCostUSD || ''}
                  onChange={(e) => setField('bidCostUSD', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Presupuesto (USD)</label>
                <input type="number" className={inputCls} value={form.budgetUSD || ''}
                  onChange={(e) => setField('budgetUSD', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* Tab 5: Actividad */}
          {tab === 5 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contactos Nuevos (target)</label>
                <input type="number" className={inputCls} value={form.targetNewContacts || ''}
                  onChange={(e) => setField('targetNewContacts', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interacciones/Semana</label>
                <input type="number" className={inputCls} value={form.targetInteractionsPerWeek}
                  onChange={(e) => setField('targetInteractionsPerWeek', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reuniones/Semana</label>
                <input type="number" className={inputCls} value={form.targetMeetingsPerWeek}
                  onChange={(e) => setField('targetMeetingsPerWeek', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reuniones Decision-Makers</label>
                <input type="number" className={inputCls} value={form.reunionesDecisionMakers || ''}
                  onChange={(e) => setField('reunionesDecisionMakers', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* Tab 6: Narrativa */}
          {tab === 6 && (
            <div className="space-y-4">
              {/* Strategic priorities */}
              <div>
                <label className="block text-sm font-medium mb-1">Prioridades Estratégicas</label>
                <div className="flex gap-1 flex-wrap mb-2">
                  {form.strategicPriorities.map((p, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream rounded text-xs">
                      {p}
                      <button type="button" onClick={() => setField('strategicPriorities', form.strategicPriorities.filter((_, j) => j !== i))} className="text-muted hover:text-red">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inputCls} value={priorityInput} onChange={(e) => setPriorityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (priorityInput.trim()) { setField('strategicPriorities', [...form.strategicPriorities, priorityInput.trim()]); setPriorityInput('') } } }}
                    placeholder="Agregar prioridad..." />
                  <button type="button" onClick={() => { if (priorityInput.trim()) { setField('strategicPriorities', [...form.strategicPriorities, priorityInput.trim()]); setPriorityInput('') } }}
                    className="px-3 py-2 bg-cream rounded-lg text-sm hover:bg-border">+</button>
                </div>
              </div>

              {/* Risks */}
              <div>
                <label className="block text-sm font-medium mb-1">Riesgos (mín. 2)</label>
                <div className="space-y-1 mb-2">
                  {form.riesgos.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red">•</span> {r}
                      <button type="button" onClick={() => setField('riesgos', form.riesgos.filter((_, j) => j !== i))} className="text-muted hover:text-red text-xs ml-auto">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inputCls} value={riesgoInput} onChange={(e) => setRiesgoInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (riesgoInput.trim()) { setField('riesgos', [...form.riesgos, riesgoInput.trim()]); setRiesgoInput('') } } }}
                    placeholder="Agregar riesgo..." />
                  <button type="button" onClick={() => { if (riesgoInput.trim()) { setField('riesgos', [...form.riesgos, riesgoInput.trim()]); setRiesgoInput('') } }}
                    className="px-3 py-2 bg-cream rounded-lg text-sm hover:bg-border">+</button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea className={`${inputCls} min-h-[80px]`} value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)} />
              </div>
            </div>
          )}

          {/* Navigation + Submit */}
          <div className="flex justify-between pt-2">
            <div className="flex gap-2">
              {tab > 0 && (
                <button type="button" onClick={() => setTab(tab - 1)}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-cream">← Anterior</button>
              )}
            </div>
            <div className="flex gap-2">
              {tab < TABS.length - 1 ? (
                <button type="button" onClick={() => setTab(tab + 1)}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90">Siguiente →</button>
              ) : (
                <button type="submit"
                  className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90">Crear Plan</button>
              )}
              <button type="button" onClick={() => setShowNew(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-cream">Cancelar</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
