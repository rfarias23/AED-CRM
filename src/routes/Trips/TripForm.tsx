import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useTripStore } from '@/stores/useTripStore'
import Card from '@/components/shared/Card'
import type { Trip } from '@/lib/types'

export default function TripForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addTrip = useTripStore((s) => s.add)
  const updateTrip = useTripStore((s) => s.update)

  const existing = useLiveQuery(() => (id ? db.trips.get(id) : undefined), [id])
  const allCountries = useLiveQuery(() => db.countryProfiles.toArray(), [])
  const countries = useMemo(() => allCountries?.filter((c) => c.active), [allCountries])
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), [])

  const [name, setName] = useState('')
  const [country, setCountry] = useState('CL')
  const [city, setCity] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [participantsInput, setParticipantsInput] = useState('')
  const [budgetUSD, setBudgetUSD] = useState('')
  const [opportunityId, setOpportunityId] = useState('')
  const [conclusions, setConclusions] = useState('')

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setCountry(existing.country)
    setCity(existing.city ?? '')
    setDepartureDate(existing.departureDate)
    setReturnDate(existing.returnDate)
    setPurpose(existing.purpose)
    setParticipantsInput(existing.participants?.join(', ') ?? '')
    setBudgetUSD(existing.budgetUSD ? String(existing.budgetUSD) : '')
    setOpportunityId(existing.opportunityId ?? '')
    setConclusions(existing.conclusions ?? '')
  }, [existing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'actualUSD'> = {
      name,
      country,
      city: city || undefined,
      departureDate,
      returnDate,
      purpose,
      participants: participantsInput.split(',').map((s) => s.trim()).filter(Boolean),
      budgetUSD: parseFloat(budgetUSD) || undefined,
      opportunityId: opportunityId || undefined,
      status: existing?.status ?? 'draft',
      approvedBy: existing?.approvedBy,
      approvedAt: existing?.approvedAt,
      conclusions: conclusions || undefined,
      expenseIds: existing?.expenseIds ?? [],
    }

    if (id && existing) {
      await updateTrip(id, data)
    } else {
      await addTrip(data)
    }
    navigate('/trips')
  }

  const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20'

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl mb-6">
        {id ? 'Editar Viaje' : 'Nuevo Viaje'}
      </h1>

      <form onSubmit={handleSubmit}>
        <Card className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Viaje *</label>
            <input className={inputCls} value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Viaje Lima — Central Solar Moquegua" required />
          </div>

          {/* Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">País Destino *</label>
              <select className={inputCls} value={country}
                onChange={(e) => setCountry(e.target.value)}>
                {countries?.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ciudad</label>
              <input className={inputCls} value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej: Moquegua" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Salida *</label>
              <input type="date" className={inputCls} value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Retorno *</label>
              <input type="date" className={inputCls} value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)} required />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium mb-1">Propósito *</label>
            <textarea className={inputCls} value={purpose} rows={2}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Objetivo principal del viaje" required />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium mb-1">Participantes</label>
            <input className={inputCls} value={participantsInput}
              onChange={(e) => setParticipantsInput(e.target.value)}
              placeholder="Separados por coma" />
          </div>

          {/* Budget + Opportunity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Presupuesto (USD)</label>
              <input type="number" step="0.01" className={inputCls} value={budgetUSD}
                onChange={(e) => setBudgetUSD(e.target.value)}
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Oportunidad Vinculada</label>
              <select className={inputCls} value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}>
                <option value="">— Sin vincular —</option>
                {opportunities?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>

          {/* Conclusions (only for editing existing) */}
          {id && (
            <div>
              <label className="block text-sm font-medium mb-1">Conclusiones</label>
              <textarea className={inputCls} value={conclusions} rows={3}
                onChange={(e) => setConclusions(e.target.value)}
                placeholder="Resumen y conclusiones del viaje" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
              {id ? 'Guardar Cambios' : 'Crear Viaje'}
            </button>
            <button type="button" onClick={() => navigate('/trips')}
              className="px-6 py-2 border border-border rounded-lg text-sm hover:bg-cream transition-colors">
              Cancelar
            </button>
          </div>
        </Card>
      </form>
    </div>
  )
}
