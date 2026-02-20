import { useEffect, useState } from 'react'
import { usePlanStore } from '@/stores/usePlanStore'
import Card from '@/components/shared/Card'
import KPICard from '@/components/shared/KPICard'
import { StatusBadge } from '@/components/shared/Badge'
import EmptyState from '@/components/shared/EmptyState'
import Modal from '@/components/shared/Modal'
import { Plus, Calendar, Target, CheckCircle2, Clock } from 'lucide-react'
import type { QuarterPlan as QPType } from '@/lib/types'

const STATUS_VARIANTS = {
  draft: 'warning' as const,
  active: 'success' as const,
  closed: 'default' as const,
}

const STATUS_LABELS = {
  draft: 'Borrador',
  active: 'Activo',
  closed: 'Cerrado',
}

type NewPlanData = Omit<QPType, 'id' | 'createdAt' | 'updatedAt' | 'milestones'>

export default function QuarterPlanView() {
  const plans = usePlanStore((s) => s.plans)
  const loading = usePlanStore((s) => s.loading)
  const load = usePlanStore((s) => s.load)
  const addPlan = usePlanStore((s) => s.add)
  const closePlan = usePlanStore((s) => s.close)

  const [showNew, setShowNew] = useState(false)

  useEffect(() => { load() }, [load])

  const activePlan = plans.find((p) => p.status === 'active')
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.status === 'active') return -1
    if (b.status === 'active') return 1
    return b.year - a.year || b.quarter - a.quarter
  })

  const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20'

  const [form, setForm] = useState<NewPlanData>({
    year: new Date().getFullYear(),
    quarter: (Math.ceil((new Date().getMonth() + 1) / 3)) as 1 | 2 | 3 | 4,
    status: 'draft',
    targetPipelineUSD: 0,
    targetWonUSD: 0,
    targetFeesUSD: 0,
    targetNewContacts: 0,
    targetInteractionsPerWeek: 8,
    targetMeetingsPerWeek: 3,
    strategicPriorities: [],
    budgetUSD: 0,
    notes: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await addPlan({ ...form, milestones: [] })
    setShowNew(false)
    load()
  }

  if (loading) return <p className="text-muted">Cargando planes...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Plan Comercial</h1>
        <button onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Plan
        </button>
      </div>

      {/* Active plan KPIs */}
      {activePlan && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Pipeline Target" value={`$${activePlan.targetPipelineUSD}M`} icon={<Target className="w-5 h-5" />} />
          <KPICard label="Won Target" value={`$${activePlan.targetWonUSD}M`} icon={<CheckCircle2 className="w-5 h-5" />} />
          <KPICard label="Fees Target" value={`$${activePlan.targetFeesUSD}M`} icon={<Calendar className="w-5 h-5" />} />
          <KPICard label="Budget" value={`$${activePlan.budgetUSD.toLocaleString()}`} icon={<Clock className="w-5 h-5" />} />
        </div>
      )}

      {/* Plan list */}
      {sortedPlans.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="Sin planes"
          description="Crea tu primer plan comercial trimestral."
        />
      ) : (
        <div className="space-y-3">
          {sortedPlans.map((plan) => (
            <Card key={plan.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-heading text-lg">Q{plan.quarter} {plan.year}</h3>
                  <StatusBadge label={STATUS_LABELS[plan.status]} variant={STATUS_VARIANTS[plan.status]} />
                </div>
                <div className="flex gap-2">
                  {plan.status === 'active' && (
                    <button onClick={() => closePlan(plan.id)}
                      className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-cream transition-colors">
                      Cerrar Plan
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                <div><span className="text-muted">Pipeline:</span> <span className="font-mono">${plan.targetPipelineUSD}M</span></div>
                <div><span className="text-muted">Won:</span> <span className="font-mono">${plan.targetWonUSD}M</span></div>
                <div><span className="text-muted">Fees:</span> <span className="font-mono">${plan.targetFeesUSD}M</span></div>
              </div>
              {plan.strategicPriorities.length > 0 && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {plan.strategicPriorities.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 bg-cream rounded text-xs">{p}</span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New plan modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nuevo Plan Trimestral" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Año</label>
              <input type="number" className={inputCls} value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trimestre</label>
              <select className={inputCls} value={form.quarter}
                onChange={(e) => setForm((f) => ({ ...f, quarter: parseInt(e.target.value) as 1|2|3|4 }))}>
                <option value={1}>Q1</option><option value={2}>Q2</option>
                <option value={3}>Q3</option><option value={4}>Q4</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pipeline USD (M)</label>
              <input type="number" step="0.1" className={inputCls} value={form.targetPipelineUSD || ''}
                onChange={(e) => setForm((f) => ({ ...f, targetPipelineUSD: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Won USD (M)</label>
              <input type="number" step="0.1" className={inputCls} value={form.targetWonUSD || ''}
                onChange={(e) => setForm((f) => ({ ...f, targetWonUSD: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fees USD (M)</label>
              <input type="number" step="0.01" className={inputCls} value={form.targetFeesUSD || ''}
                onChange={(e) => setForm((f) => ({ ...f, targetFeesUSD: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contactos Nuevos</label>
              <input type="number" className={inputCls} value={form.targetNewContacts || ''}
                onChange={(e) => setForm((f) => ({ ...f, targetNewContacts: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Interacciones/Sem</label>
              <input type="number" className={inputCls} value={form.targetInteractionsPerWeek}
                onChange={(e) => setForm((f) => ({ ...f, targetInteractionsPerWeek: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget USD</label>
              <input type="number" className={inputCls} value={form.budgetUSD || ''}
                onChange={(e) => setForm((f) => ({ ...f, budgetUSD: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select className={inputCls} value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'draft' | 'active' }))}>
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea className={`${inputCls} min-h-[60px]`} value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90">Crear Plan</button>
            <button type="button" onClick={() => setShowNew(false)} className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-cream">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
