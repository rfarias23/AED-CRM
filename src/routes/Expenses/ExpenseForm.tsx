import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useCurrencyStore } from '@/stores/useCurrencyStore'
import { convertToUSD } from '@/lib/currency-engine'
import type { Expense, ExpenseType, Currency } from '@/lib/types'

const EXPENSE_TYPES: { value: ExpenseType; label: string }[] = [
  { value: 'travel', label: 'Viaje' },
  { value: 'accommodation', label: 'Alojamiento' },
  { value: 'meals', label: 'Alimentación' },
  { value: 'transport', label: 'Transporte' },
  { value: 'communication', label: 'Comunicaciones' },
  { value: 'subscriptions', label: 'Suscripciones' },
  { value: 'office', label: 'Oficina' },
  { value: 'representation', label: 'Representación' },
  { value: 'professional_services', label: 'Servicios Profesionales' },
  { value: 'other', label: 'Otro' },
]

const CURRENCIES: Currency[] = ['USD', 'CLP', 'PEN', 'COP', 'EUR']

type FormData = Omit<Expense, 'id' | 'createdAt'>

export default function ExpenseForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addExpense = useExpenseStore((s) => s.add)
  const updateExpense = useExpenseStore((s) => s.update)
  const rateMap = useCurrencyStore((s) => s.rateMap)

  const existing = useLiveQuery(() => (id ? db.expenses.get(id) : undefined), [id])
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), [])

  const [form, setForm] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    type: 'travel',
    description: '',
    vendor: '',
    amountOriginal: 0,
    currency: 'USD',
    amountUSD: 0,
    opportunityId: undefined,
    quarterId: undefined,
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (existing) {
      setForm({
        date: existing.date.split('T')[0],
        type: existing.type,
        description: existing.description,
        vendor: existing.vendor,
        amountOriginal: existing.amountOriginal,
        currency: existing.currency,
        amountUSD: existing.amountUSD,
        receiptRef: existing.receiptRef,
        opportunityId: existing.opportunityId,
        quarterId: existing.quarterId,
        tags: existing.tags,
      })
    }
  }, [existing])

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Auto-convert to USD when amount or currency changes
  useEffect(() => {
    if (form.currency === 'USD') {
      setForm((prev) => ({ ...prev, amountUSD: prev.amountOriginal }))
    } else {
      const usd = convertToUSD(form.amountOriginal, form.currency, rateMap)
      setForm((prev) => ({ ...prev, amountUSD: usd }))
    }
  }, [form.amountOriginal, form.currency, rateMap])

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setField('tags', [...form.tags, tag])
      setTagInput('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (id && existing) {
      await updateExpense(id, form)
    } else {
      await addExpense(form)
    }
    navigate('/expenses')
  }

  const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20'

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl mb-6">
        {id ? 'Editar Gasto' : 'Nuevo Gasto'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date + Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha *</label>
            <input type="date" className={inputCls} value={form.date.split('T')[0]}
              onChange={(e) => setField('date', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo *</label>
            <select className={inputCls} value={form.type}
              onChange={(e) => setField('type', e.target.value as ExpenseType)}>
              {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Description + Vendor */}
        <div>
          <label className="block text-sm font-medium mb-1">Descripción *</label>
          <input className={inputCls} value={form.description}
            onChange={(e) => setField('description', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Proveedor *</label>
          <input className={inputCls} value={form.vendor}
            onChange={(e) => setField('vendor', e.target.value)} required />
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Monto Original *</label>
            <input type="number" step="0.01" className={inputCls} value={form.amountOriginal || ''}
              onChange={(e) => setField('amountOriginal', parseFloat(e.target.value) || 0)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Moneda</label>
            <select className={inputCls} value={form.currency}
              onChange={(e) => setField('currency', e.target.value as Currency)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* USD equivalent */}
        <div className="bg-cream rounded-lg px-4 py-2 text-sm">
          <span className="text-muted">Equivalente USD: </span>
          <span className="font-mono font-semibold">
            ${form.amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Opportunity link */}
        <div>
          <label className="block text-sm font-medium mb-1">Oportunidad Vinculada</label>
          <select className={inputCls} value={form.opportunityId ?? ''}
            onChange={(e) => setField('opportunityId', e.target.value || undefined)}>
            <option value="">— Sin vincular —</option>
            {opportunities?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        {/* Receipt ref */}
        <div>
          <label className="block text-sm font-medium mb-1">Ref. Boleta/Factura</label>
          <input className={inputCls} value={form.receiptRef ?? ''}
            onChange={(e) => setField('receiptRef', e.target.value || undefined)}
            placeholder="Número de boleta o factura" />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Etiquetas</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {form.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream rounded text-xs">
                {tag}
                <button type="button" onClick={() => setField('tags', form.tags.filter((t) => t !== tag))} className="text-muted hover:text-red">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inputCls} value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Agregar etiqueta..." />
            <button type="button" onClick={addTag} className="px-3 py-2 bg-cream rounded-lg text-sm hover:bg-border transition-colors">+</button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            {id ? 'Guardar Cambios' : 'Registrar Gasto'}
          </button>
          <button type="button" onClick={() => navigate('/expenses')}
            className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-cream transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
