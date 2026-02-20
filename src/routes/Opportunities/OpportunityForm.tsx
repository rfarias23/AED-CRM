import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useOpportunityStore } from '@/stores/useOpportunityStore'
import { useCurrencyStore } from '@/stores/useCurrencyStore'
import { convertToUSD } from '@/lib/currency-engine'
import { resolveFeeStructure } from '@/lib/commission-engine'
import FeeCalculatorInline from '@/components/commission/FeeCalculatorInline'
import Card from '@/components/shared/Card'
import type {
  Currency,
  ProjectSector,
  ClientType,
  ContractType,
  OpportunityStage,
  Opportunity,
  FeeStructure,
  WithholdingProfile,
} from '@/lib/types'

const SECTORS: { value: ProjectSector; label: string }[] = [
  { value: 'mining', label: 'Minería' },
  { value: 'energy', label: 'Energía' },
  { value: 'infrastructure', label: 'Infraestructura' },
  { value: 'water', label: 'Agua' },
  { value: 'oil_gas', label: 'Petróleo y Gas' },
  { value: 'real_estate', label: 'Inmobiliario' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'technology', label: 'Tecnología' },
  { value: 'other', label: 'Otro' },
]

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: 'owner', label: 'Mandante' },
  { value: 'developer', label: 'Desarrollador' },
  { value: 'epc', label: 'EPC / Contratista' },
  { value: 'government', label: 'Gobierno' },
  { value: 'financial', label: 'Financiero' },
  { value: 'other', label: 'Otro' },
]

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: 'fee_success', label: 'Comisión de Éxito' },
  { value: 'retainer', label: 'Anticipo Mensual' },
  { value: 'mixed', label: 'Mixto' },
  { value: 'project_based', label: 'Por Proyecto' },
]

export default function OpportunityForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addOpp = useOpportunityStore((s) => s.add)
  const updateOpp = useOpportunityStore((s) => s.update)
  const rateMap = useCurrencyStore((s) => s.rateMap)

  const allCountries = useLiveQuery(() => db.countryProfiles.toArray(), [])
  const countries = useMemo(() => allCountries?.filter((c) => c.active), [allCountries])
  const feeStructures = useLiveQuery(() => db.feeStructures.toArray(), [])
  const withholdingProfiles = useLiveQuery(() => db.withholdingProfiles.toArray(), [])
  const existing = useLiveQuery(() => (id ? db.opportunities.get(id) : undefined), [id])

  const [step, setStep] = useState(1)

  // Form state
  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [country, setCountry] = useState('')
  const [sector, setSector] = useState<ProjectSector>('mining')
  const [clientType, setClientType] = useState<ClientType>('owner')
  const [contractType, setContractType] = useState<ContractType>('fee_success')
  const [stage, setStage] = useState<OpportunityStage>('identification')

  const [valueOriginal, setValueOriginal] = useState('')
  const [valueCurrency, setValueCurrency] = useState<Currency>('USD')
  const [aschPercentage, setAschPercentage] = useState('100')
  const [probabilityOfAward, setProbabilityOfAward] = useState('50')

  const [expectedCloseDate, setExpectedCloseDate] = useState('')
  const [expectedStartDate, setExpectedStartDate] = useState('')
  const [deadlineRFP, setDeadlineRFP] = useState('')
  const [teamingPartners, setTeamingPartners] = useState('')
  const [tags, setEtiquetas] = useState('')
  const [notes, setNotes] = useState('')

  // Populate from existing
  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setClient(existing.client)
    setCountry(existing.country)
    setSector(existing.sector)
    setClientType(existing.clientType)
    setContractType(existing.contractType)
    setStage(existing.stage)
    setValueOriginal(String(existing.valueOriginal))
    setValueCurrency(existing.valueCurrency)
    setAschPercentage(String(existing.aschPercentage * 100))
    setProbabilityOfAward(String(existing.probabilityOfAward * 100))
    setExpectedCloseDate(existing.expectedCloseDate)
    setExpectedStartDate(existing.expectedStartDate ?? '')
    setDeadlineRFP(existing.deadlineRFP ?? '')
    setTeamingPartners(existing.teamingPartners.join(', '))
    setEtiquetas(existing.tags.join(', '))
    setNotes(existing.notes)
  }, [existing])

  // Auto-fill currency from country
  useEffect(() => {
    if (!countries || !country) return
    const profile = countries.find((c) => c.code === country)
    if (profile) setValueCurrency(profile.currency)
  }, [country, countries])

  // Computed values
  const numValue = parseFloat(valueOriginal) || 0
  const valueUSD = useMemo(() => {
    if (valueCurrency === 'USD') return numValue
    return convertToUSD(numValue, valueCurrency, rateMap)
  }, [numValue, valueCurrency, rateMap])

  const aschPct = (parseFloat(aschPercentage) || 100) / 100
  const aschValueUSD = valueUSD * aschPct
  const dealMillionsUSD = aschValueUSD / 1_000_000

  // Resolve fee structure
  const resolvedFs: FeeStructure | undefined = useMemo(() => {
    if (!feeStructures || feeStructures.length === 0) return undefined
    const mockOpp = { country, sector, feeStructureId: undefined } as Opportunity
    return resolveFeeStructure(mockOpp, feeStructures)
  }, [country, sector, feeStructures])

  const resolvedWh: WithholdingProfile | undefined = useMemo(() => {
    if (!withholdingProfiles) return undefined
    return withholdingProfiles.find((wp) => wp.jurisdictionCountry === country)
  }, [country, withholdingProfiles])

  async function handleSubmit() {
    const data = {
      name,
      client,
      country,
      sector,
      clientType,
      contractType,
      stage,
      valueOriginal: numValue,
      valueCurrency,
      valueUSD,
      aschPercentage: aschPct,
      aschValueUSD,
      probabilityOfAward: (parseFloat(probabilityOfAward) || 50) / 100,
      expectedCloseDate,
      expectedStartDate: expectedStartDate || undefined,
      deadlineRFP: deadlineRFP || undefined,
      teamingPartners: teamingPartners.split(',').map((s) => s.trim()).filter(Boolean),
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
      notes,
      contactIds: existing?.contactIds ?? [],
      quarterId: existing?.quarterId,
    }

    if (id && existing) {
      await updateOpp(id, data)
    } else {
      await addOpp(data as Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt' | 'stageHistory' | 'invoices'>)
    }
    navigate('/opportunities')
  }

  if (!countries || !feeStructures || !withholdingProfiles) {
    return <p className="text-muted">Cargando...</p>
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl mb-6">
        {id ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
      </h1>

      {/* Step indicator */}
      <div className="flex gap-1 mb-6">
        {['Identificación', 'Dimensionamiento', 'Plazos y Estrategia'].map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i + 1)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              step === i + 1
                ? 'bg-accent text-white'
                : 'bg-cream text-muted hover:text-ink'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* Step 1: Identification */}
      {step === 1 && (
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-muted font-medium block mb-1">Nombre del Proyecto</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted font-medium block mb-1">Cliente</label>
              <input value={client} onChange={(e) => setClient(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">País</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20">
                <option value="">Seleccionar...</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Sector</label>
              <select value={sector} onChange={(e) => setSector(e.target.value as ProjectSector)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20">
                {SECTORS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Tipo de Cliente</label>
              <select value={clientType} onChange={(e) => setClientType(e.target.value as ClientType)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20">
                {CLIENT_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Tipo de Contrato</label>
              <select value={contractType} onChange={(e) => setContractType(e.target.value as ContractType)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20">
                {CONTRACT_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => setStep(2)}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
              Siguiente →
            </button>
          </div>
        </Card>
      )}

      {/* Step 2: Dimensionamiento */}
      {step === 2 && (
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Valor del Proyecto</label>
              <input type="number" value={valueOriginal} onChange={(e) => setValueOriginal(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Moneda</label>
              <select value={valueCurrency} onChange={(e) => setValueCurrency(e.target.value as Currency)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-accent/20">
                {['USD', 'CLP', 'PEN', 'COP', 'BRL', 'MXN', 'UF', 'EUR'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {valueCurrency !== 'USD' && numValue > 0 && (
            <div className="bg-cream rounded-lg px-3 py-2 text-xs text-muted">
              Equivalente: <span className="font-mono font-medium text-ink">USD {valueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted font-medium block mb-1">% ASCH del Proyecto</label>
              <div className="flex items-center gap-2">
                <input type="number" value={aschPercentage} onChange={(e) => setAschPercentage(e.target.value)}
                  min="0" max="100" step="5"
                  className="w-20 border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/20" />
                <span className="text-sm text-muted">%</span>
                <span className="text-xs text-muted ml-2">
                  → ASCH: USD {aschValueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Probabilidad de Adjudicación</label>
              <div className="flex items-center gap-2">
                <input type="number" value={probabilityOfAward} onChange={(e) => setProbabilityOfAward(e.target.value)}
                  min="0" max="100" step="5"
                  className="w-20 border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/20" />
                <span className="text-sm text-muted">%</span>
              </div>
            </div>
          </div>

          {/* Auto-resolved fee structure info */}
          {resolvedFs && (
            <div className="bg-cream/50 rounded-lg px-3 py-2 text-xs text-muted">
              Estructura de comisión auto-resuelta: <span className="font-medium text-ink">{resolvedFs.name}</span>
              {' '}({resolvedFs.tiers.map((t) => `${(t.rate * 100).toFixed(1)}%`).join('/')})
            </div>
          )}

          {/* Inline fee preview */}
          {dealMillionsUSD > 0 && (
            <FeeCalculatorInline
              dealMillionsUSD={dealMillionsUSD}
              feeStructure={resolvedFs}
              withholdingProfile={resolvedWh}
            />
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-cream transition-colors">
              ← Anterior
            </button>
            <button onClick={() => setStep(3)}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
              Siguiente →
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Timing & Strategy */}
      {step === 3 && (
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Fecha Estimada de Cierre</label>
              <input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Fecha Estimada de Inicio</label>
              <input type="date" value={expectedStartDate} onChange={(e) => setExpectedStartDate(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Plazo RFP</label>
              <input type="date" value={deadlineRFP} onChange={(e) => setDeadlineRFP(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Etapa</label>
              <select value={stage} onChange={(e) => setStage(e.target.value as OpportunityStage)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20">
                <option value="identification">Identificación</option>
                <option value="qualification">Calificación</option>
                <option value="proposal">Propuesta</option>
                <option value="negotiation">Negociación</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted font-medium block mb-1">Socios / Teaming</label>
            <input value={teamingPartners} onChange={(e) => setTeamingPartners(e.target.value)}
              placeholder="Separados por coma"
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <div>
            <label className="text-xs text-muted font-medium block mb-1">Etiquetas</label>
            <input value={tags} onChange={(e) => setEtiquetas(e.target.value)}
              placeholder="Separados por coma"
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <div>
            <label className="text-xs text-muted font-medium block mb-1">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-cream transition-colors">
              ← Anterior
            </button>
            <button onClick={handleSubmit}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
              {id ? 'Guardar Cambios' : 'Crear Oportunidad'}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
