import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useContactStore } from '@/stores/useContactStore'
import Modal from '@/components/shared/Modal'
import type { InteractionType, InteractionFormat, InteractionQuality, Interaction } from '@/lib/types'

const TYPE_OPTIONS: { value: InteractionType; label: string }[] = [
  { value: 'meeting', label: 'Reunión' },
  { value: 'call', label: 'Llamada' },
  { value: 'email', label: 'Email' },
  { value: 'event', label: 'Evento' },
  { value: 'site_visit', label: 'Visita a Sitio' },
  { value: 'presentation', label: 'Presentación' },
  { value: 'proposal_delivery', label: 'Entrega Propuesta' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Otro' },
]

const FORMAT_OPTIONS: { value: InteractionFormat; label: string }[] = [
  { value: 'in_person', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'async', label: 'Asíncrono' },
]

const QUALITY_OPTIONS: { value: InteractionQuality; label: string; color: string }[] = [
  { value: 'high', label: 'Alta', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'medium', label: 'Media', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'low', label: 'Baja', color: 'bg-red-100 text-red-800 border-red-300' },
]

interface InteractionFormProps {
  contactId: string
  onClose: () => void
  onSaved?: (interaction: Interaction) => void
}

type FormData = Omit<Interaction, 'id' | 'createdAt'>

export default function InteractionForm({ contactId, onClose, onSaved }: InteractionFormProps) {
  const addInteraction = useContactStore((s) => s.addInteraction)
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), [])
  const contacts = useLiveQuery(() => db.contacts.toArray(), [])

  const [form, setForm] = useState<FormData>({
    type: 'meeting',
    format: 'in_person',
    quality: 'medium',
    summary: '',
    outcome: '',
    nextAction: '',
    nextActionDate: undefined,
    contactId,
    additionalContactIds: [],
    opportunityId: undefined,
    duration: undefined,
    date: new Date().toISOString().split('T')[0],
  })

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await addInteraction(contactId, form)
    onSaved?.(result)
    onClose()
  }

  const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20'

  return (
    <Modal open={true} title="Registrar Interacción" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type + Format */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo *</label>
            <select className={inputCls} value={form.type} onChange={(e) => setField('type', e.target.value as InteractionType)}>
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Formato *</label>
            <select className={inputCls} value={form.format} onChange={(e) => setField('format', e.target.value as InteractionFormat)}>
              {FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Date + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha *</label>
            <input type="date" className={inputCls} value={form.date.split('T')[0]}
              onChange={(e) => setField('date', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duración (min)</label>
            <input type="number" className={inputCls} value={form.duration ?? ''}
              onChange={(e) => setField('duration', e.target.value ? parseInt(e.target.value) : undefined)}
              min={0} />
          </div>
        </div>

        {/* Quality — radio buttons */}
        <div>
          <label className="block text-sm font-medium mb-2">Calidad *</label>
          <div className="flex gap-2">
            {QUALITY_OPTIONS.map((q) => (
              <button key={q.value} type="button"
                onClick={() => setField('quality', q.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.quality === q.value ? q.color : 'bg-white text-muted border-border hover:bg-cream'
                }`}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium mb-1">Resumen *</label>
          <textarea className={`${inputCls} min-h-[60px]`} value={form.summary}
            onChange={(e) => setField('summary', e.target.value)} required />
        </div>

        {/* Outcome */}
        <div>
          <label className="block text-sm font-medium mb-1">Resultado</label>
          <textarea className={`${inputCls} min-h-[50px]`} value={form.outcome}
            onChange={(e) => setField('outcome', e.target.value)} />
        </div>

        {/* Next Action + Date */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Siguiente Acción</label>
            <input className={inputCls} value={form.nextAction}
              onChange={(e) => setField('nextAction', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Límite</label>
            <input type="date" className={inputCls} value={form.nextActionDate?.split('T')[0] ?? ''}
              onChange={(e) => setField('nextActionDate', e.target.value || undefined)} />
          </div>
        </div>

        {/* Opportunity link */}
        <div>
          <label className="block text-sm font-medium mb-1">Oportunidad Vinculada</label>
          <select className={inputCls} value={form.opportunityId ?? ''}
            onChange={(e) => setField('opportunityId', e.target.value || undefined)}>
            <option value="">— Ninguna —</option>
            {opportunities?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        {/* Additional contacts */}
        <div>
          <label className="block text-sm font-medium mb-1">Contactos Adicionales</label>
          <select className={inputCls} multiple value={form.additionalContactIds}
            onChange={(e) => setField('additionalContactIds',
              Array.from(e.target.selectedOptions, (o) => o.value))}>
            {contacts?.filter((c) => c.id !== contactId).map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.company}</option>
            ))}
          </select>
          <p className="text-xs text-muted mt-1">Ctrl+click para seleccionar múltiples</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            Registrar
          </button>
          <button type="button" onClick={onClose}
            className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-cream transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}
