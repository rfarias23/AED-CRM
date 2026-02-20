import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useOpportunityStore } from '@/stores/useOpportunityStore'
import { resolveFeeStructure, calculateCommission } from '@/lib/commission-engine'
import Card from '@/components/shared/Card'
import { StageBadge } from '@/components/shared/Badge'
import MoneyDisplay from '@/components/shared/MoneyDisplay'
import CountryFlag from '@/components/shared/CountryFlag'
import FeeCalculatorInline from '@/components/commission/FeeCalculatorInline'
import StageGate from '@/components/pipeline/StageGate'
import IntensityScorecard from '@/components/intensity/IntensityScorecard'
import { formatDate, formatPercent } from '@/lib/formatters'
import { Pencil, Trash2, ArrowLeft, GitBranch } from 'lucide-react'
import type { OpportunityStage } from '@/lib/types'

/** Sub-component: linked expenses tab */
function ExpenseTab({ opportunityId }: { opportunityId: string }) {
  const expenses = useLiveQuery(
    () => db.expenses.where('opportunityId').equals(opportunityId).toArray(),
    [opportunityId],
  )

  if (!expenses) return <p className="text-muted text-sm">Cargando...</p>

  const total = expenses.reduce((sum, e) => sum + e.amountUSD, 0)

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Gastos Vinculados</h3>
        {expenses.length > 0 && (
          <span className="font-mono text-sm font-semibold">
            Total: <MoneyDisplayInline amount={total} />
          </span>
        )}
      </div>
      {expenses.length === 0 ? (
        <p className="text-sm text-muted">Sin gastos vinculados a esta oportunidad.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
              <div>
                <span className="font-medium">{e.description}</span>
                <span className="text-muted ml-2">{e.vendor}</span>
              </div>
              <span className="font-mono"><MoneyDisplayInline amount={e.amountUSD} /></span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function MoneyDisplayInline({ amount }: { amount: number }) {
  return <span className="font-mono">${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
}

const STAGE_ORDER: OpportunityStage[] = [
  'identification', 'qualification', 'proposal', 'negotiation', 'won',
]

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const removeOpp = useOpportunityStore((s) => s.remove)
  const load = useOpportunityStore((s) => s.load)
  const opp = useLiveQuery(() => (id ? db.opportunities.get(id) : undefined), [id])
  const feeStructures = useLiveQuery(() => db.feeStructures.toArray(), [])
  const withholdingProfiles = useLiveQuery(() => db.withholdingProfiles.toArray(), [])

  const [showStageGate, setShowStageGate] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'expenses' | 'intensity'>('details')

  useEffect(() => { load() }, [load])

  if (!opp) return <p className="text-muted">Cargando...</p>

  const resolvedFs = feeStructures ? (() => {
    try { return resolveFeeStructure(opp, feeStructures) } catch { return undefined }
  })() : undefined

  const resolvedWh = withholdingProfiles?.find((wp) => wp.jurisdictionCountry === opp.country)
  const dealMillions = opp.aschValueUSD / 1_000_000
  const commission = resolvedFs ? calculateCommission(dealMillions, resolvedFs, resolvedWh) : null

  const currentStageIdx = STAGE_ORDER.indexOf(opp.stage)
  const canAdvance = currentStageIdx >= 0 && currentStageIdx < STAGE_ORDER.length - 1

  async function handleDelete() {
    if (!confirm('¿Eliminar esta oportunidad?')) return
    await removeOpp(opp!.id)
    navigate('/opportunities')
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/opportunities" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <h1 className="font-heading text-2xl flex items-center gap-3">
            <CountryFlag code={opp.country} size="lg" />
            {opp.name}
          </h1>
          <p className="text-muted text-sm mt-1">{opp.client} — {opp.sector}</p>
        </div>
        <div className="flex gap-2">
          {canAdvance && (
            <button onClick={() => setShowStageGate(true)}
              className="px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4" /> Avanzar Etapa
            </button>
          )}
          <Link to={`/opportunities/${opp.id}/edit`}
            className="p-2 border border-border rounded-lg hover:bg-cream">
            <Pencil className="w-4 h-4 text-muted" />
          </Link>
          <button onClick={handleDelete}
            className="p-2 border border-border rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4 text-red" />
          </button>
        </div>
      </div>

      {/* Stage + KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card dark padding="sm">
          <span className="text-xs text-white/60">Etapa</span>
          <div className="mt-1"><StageBadge stage={opp.stage} /></div>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-white/60">Valor ASCH</span>
          <div className="mt-1 font-mono text-lg">
            <MoneyDisplay amount={opp.aschValueUSD} currency="USD" compact />
          </div>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-white/60">PoA</span>
          <div className="mt-1 font-mono text-lg">{formatPercent(opp.probabilityOfAward)}</div>
        </Card>
        <Card dark padding="sm">
          <span className="text-xs text-white/60">Fee Bruto</span>
          <div className="mt-1 font-mono text-lg text-gold-soft">
            {commission ? `USD ${commission.grossFee.toFixed(3)}M` : '—'}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream rounded-lg p-1">
        {(['details', 'history', 'expenses', 'intensity'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
            }`}>
            {tab === 'details' ? 'Detalles' : tab === 'history' ? 'Historial' : tab === 'expenses' ? 'Gastos' : 'Intensidad'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Proyecto</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Valor Original</dt>
                <dd className="font-mono"><MoneyDisplay amount={opp.valueOriginal} currency={opp.valueCurrency} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted">Valor USD</dt>
                <dd className="font-mono"><MoneyDisplay amount={opp.valueUSD} currency="USD" /></dd></div>
              <div className="flex justify-between"><dt className="text-muted">% ASCH</dt>
                <dd className="font-mono">{formatPercent(opp.aschPercentage)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tipo Contrato</dt>
                <dd>{opp.contractType}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tipo Cliente</dt>
                <dd>{opp.clientType}</dd></div>
            </dl>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Timing</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Cierre Est.</dt>
                <dd>{opp.expectedCloseDate ? formatDate(opp.expectedCloseDate) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Inicio Est.</dt>
                <dd>{opp.expectedStartDate ? formatDate(opp.expectedStartDate) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Deadline RFP</dt>
                <dd>{opp.deadlineRFP ? formatDate(opp.deadlineRFP) : '—'}</dd></div>
            </dl>
            {opp.teamingPartners.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted">Teaming:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {opp.teamingPartners.map((p) => (
                    <span key={p} className="px-2 py-0.5 bg-cream rounded text-xs">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>
          {/* Inline fee breakdown */}
          <Card className="md:col-span-2">
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Comisión</h3>
            <FeeCalculatorInline
              dealMillionsUSD={dealMillions}
              feeStructure={resolvedFs}
              withholdingProfile={resolvedWh}
            />
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Historial de Etapas</h3>
          {opp.stageHistory.length === 0 ? (
            <p className="text-sm text-muted">Sin transiciones registradas.</p>
          ) : (
            <div className="space-y-3">
              {opp.stageHistory.map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-muted w-24">{formatDate(t.date)}</span>
                  <StageBadge stage={t.from} />
                  <span className="text-muted">→</span>
                  <StageBadge stage={t.to} />
                  <span className="text-muted">{t.reason}</span>
                  {t.goNoGo && <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Go/No-Go</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'expenses' && (
        <ExpenseTab opportunityId={opp.id} />
      )}

      {activeTab === 'intensity' && (
        <IntensityScorecard opportunityId={opp.id} />
      )}

      {/* Stage Gate Modal */}
      {showStageGate && canAdvance && (
        <StageGate
          opportunity={opp}
          targetStage={STAGE_ORDER[currentStageIdx + 1]}
          onClose={() => setShowStageGate(false)}
          onComplete={() => {
            setShowStageGate(false)
            load()
          }}
        />
      )}
    </div>
  )
}
