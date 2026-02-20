import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useContactStore } from '@/stores/useContactStore'
import CountryFlag from '@/components/shared/CountryFlag'
import type { Contact } from '@/lib/types'

const COUNTRY_OPTIONS = [
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'CO', name: 'Colombia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'MX', name: 'México' },
  { code: 'PA', name: 'Panamá' },
  { code: 'AR', name: 'Argentina' },
]

type FormData = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>

const emptyForm: FormData = {
  firstName: '',
  lastName: '',
  title: '',
  company: '',
  country: 'CL',
  email: '',
  phone: '',
  linkedIn: '',
  notes: '',
  tags: [],
}

export default function ContactForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addContact = useContactStore((s) => s.add)
  const updateContact = useContactStore((s) => s.update)

  const existing = useLiveQuery(
    () => (id ? db.contacts.get(id) : undefined),
    [id],
  )

  const [form, setForm] = useState<FormData>(emptyForm)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (existing) {
      setForm({
        firstName: existing.firstName,
        lastName: existing.lastName,
        title: existing.title,
        company: existing.company,
        country: existing.country,
        email: existing.email ?? '',
        phone: existing.phone ?? '',
        linkedIn: existing.linkedIn ?? '',
        notes: existing.notes,
        tags: existing.tags,
      })
    }
  }, [existing])

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setField('tags', [...form.tags, tag])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setField('tags', form.tags.filter((t) => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (id && existing) {
      await updateContact(id, form)
    } else {
      await addContact(form)
    }
    navigate('/contacts')
  }

  const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20'

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl mb-6">
        {id ? 'Editar Contacto' : 'Nuevo Contacto'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Names */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              className={inputCls}
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apellido *</label>
            <input
              className={inputCls}
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Title + Company */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cargo *</label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Empresa *</label>
            <input
              className={inputCls}
              value={form.company}
              onChange={(e) => setField('company', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium mb-1">País *</label>
          <div className="flex items-center gap-2">
            <CountryFlag code={form.country} size="md" />
            <select
              className={inputCls}
              value={form.country}
              onChange={(e) => setField('country', e.target.value)}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className={inputCls}
              value={form.email ?? ''}
              onChange={(e) => setField('email', e.target.value || undefined)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              className={inputCls}
              value={form.phone ?? ''}
              onChange={(e) => setField('phone', e.target.value || undefined)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">LinkedIn</label>
            <input
              className={inputCls}
              value={form.linkedIn ?? ''}
              onChange={(e) => setField('linkedIn', e.target.value || undefined)}
              placeholder="linkedin.com/in/..."
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Etiquetas</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream rounded text-xs"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-muted hover:text-red">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Agregar etiqueta..."
            />
            <button type="button" onClick={addTag} className="px-3 py-2 bg-cream rounded-lg text-sm hover:bg-border transition-colors">
              +
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            {id ? 'Guardar Cambios' : 'Crear Contacto'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/contacts')}
            className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-cream transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
