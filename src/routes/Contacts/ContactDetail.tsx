import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useContactStore } from '@/stores/useContactStore'
import Card from '@/components/shared/Card'
import CountryFlag from '@/components/shared/CountryFlag'
import { StatusBadge } from '@/components/shared/Badge'
import { formatDate, formatRelativeDate } from '@/lib/formatters'
import InteractionForm from '@/components/contacts/InteractionForm'
import { Pencil, Trash2, ArrowLeft, Mail, Phone, Linkedin, Plus } from 'lucide-react'
import type { InteractionType } from '@/lib/types'

const INTERACTION_LABELS: Record<InteractionType, string> = {
  meeting: 'Reunión',
  call: 'Llamada',
  email: 'Email',
  event: 'Evento',
  site_visit: 'Visita',
  presentation: 'Presentación',
  proposal_delivery: 'Entrega Propuesta',
  social: 'Social',
  other: 'Otro',
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const removeContact = useContactStore((s) => s.remove)
  const load = useContactStore((s) => s.load)

  const contact = useLiveQuery(() => (id ? db.contacts.get(id) : undefined), [id])

  const [activeTab, setActiveTab] = useState<'info' | 'interactions'>('info')
  const [showInteractionForm, setShowInteractionForm] = useState(false)

  useEffect(() => { load() }, [load])

  if (!contact) return <p className="text-muted">Cargando...</p>

  async function handleDelete() {
    if (!confirm('¿Eliminar este contacto?')) return
    await removeContact(contact!.id)
    navigate('/contacts')
  }

  const sortedInteractions = [...contact.interactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/contacts" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <h1 className="font-heading text-2xl flex items-center gap-3">
            <CountryFlag code={contact.country} size="lg" />
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="text-muted text-sm mt-1">{contact.title} — {contact.company}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/contacts/${contact.id}/edit`}
            className="p-2 border border-border rounded-lg hover:bg-cream">
            <Pencil className="w-4 h-4 text-muted" />
          </Link>
          <button onClick={handleDelete}
            className="p-2 border border-border rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4 text-red" />
          </button>
        </div>
      </div>

      {/* Contact info cards */}
      <div className="flex flex-wrap gap-3">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream rounded-lg text-sm hover:bg-border transition-colors">
            <Mail className="w-4 h-4 text-muted" /> {contact.email}
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream rounded-lg text-sm hover:bg-border transition-colors">
            <Phone className="w-4 h-4 text-muted" /> {contact.phone}
          </a>
        )}
        {contact.linkedIn && (
          <a href={contact.linkedIn.startsWith('http') ? contact.linkedIn : `https://${contact.linkedIn}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream rounded-lg text-sm hover:bg-border transition-colors">
            <Linkedin className="w-4 h-4 text-muted" /> LinkedIn
          </a>
        )}
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {contact.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-cream rounded text-xs text-muted">{tag}</span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-cream rounded-lg p-1">
        {(['info', 'interactions'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
            }`}>
            {tab === 'info' ? 'Información' : `Interacciones (${contact.interactions.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Notas</h3>
          {contact.notes ? (
            <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
          ) : (
            <p className="text-sm text-muted">Sin notas.</p>
          )}
        </Card>
      )}

      {activeTab === 'interactions' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowInteractionForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva Interacción
          </button>

          {sortedInteractions.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">Sin interacciones registradas.</p>
            </Card>
          ) : (
            sortedInteractions.map((ix) => (
              <Card key={ix.id}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge label={INTERACTION_LABELS[ix.type]} variant="info" />
                    <span className="text-xs text-muted">{ix.format}</span>
                    {ix.duration && <span className="text-xs text-muted">{ix.duration} min</span>}
                  </div>
                  <span className="text-xs text-muted">{formatDate(ix.date)} · {formatRelativeDate(ix.date)}</span>
                </div>
                <p className="text-sm mb-2">{ix.summary}</p>
                {ix.outcome && (
                  <p className="text-xs text-muted"><strong>Resultado:</strong> {ix.outcome}</p>
                )}
                {ix.nextAction && (
                  <p className="text-xs text-accent mt-1">
                    <strong>Siguiente:</strong> {ix.nextAction}
                    {ix.nextActionDate && ` — ${formatDate(ix.nextActionDate)}`}
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      )}
      {/* Interaction Form Modal */}
      {showInteractionForm && (
        <InteractionForm
          contactId={contact.id}
          onClose={() => setShowInteractionForm(false)}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}
