import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import Card from '@/components/shared/Card'
import CountryFlag from '@/components/shared/CountryFlag'
import { Settings as SettingsIcon, Globe, DollarSign, Percent, Activity, User, Database } from 'lucide-react'
import { exportDatabaseJSON, importDatabaseJSON, downloadFile } from '@/lib/backup'
import { exportOpportunitiesToExcel, exportExpensesToExcel, exportContactsToExcel } from '@/lib/export-excel'

const TABS = [
  { key: 'countries', label: 'Países', icon: Globe },
  { key: 'fx', label: 'Tipo de Cambio', icon: DollarSign },
  { key: 'fees', label: 'Fee Structures', icon: Percent },
  { key: 'withholding', label: 'Withholding', icon: Percent },
  { key: 'intensity', label: 'Intensidad', icon: Activity },
  { key: 'profile', label: 'Perfil', icon: User },
  { key: 'data', label: 'Datos', icon: Database },
] as const

type TabKey = (typeof TABS)[number]['key']

const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>('countries')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-5 h-5 text-muted" />
        <h1 className="font-heading text-2xl">Configuración</h1>
      </div>

      <div className="flex gap-1 bg-cream rounded-lg p-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === key ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'countries' && <CountriesTab />}
      {activeTab === 'fx' && <ExchangeRateTab />}
      {activeTab === 'fees' && <FeeStructuresTab />}
      {activeTab === 'withholding' && <WithholdingTab />}
      {activeTab === 'intensity' && <IntensityTab />}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'data' && <DataTab />}
    </div>
  )
}

// ── Countries ────────────────────────────────────
function CountriesTab() {
  const countries = useLiveQuery(() => db.countryProfiles.toArray(), []) ?? []

  async function toggle(id: string, active: boolean) {
    await db.countryProfiles.update(id, { active })
  }

  async function updateVat(id: string, vatRate: number) {
    await db.countryProfiles.update(id, { vatRate })
  }

  return (
    <Card>
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Perfiles de País</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="pb-2">País</th><th className="pb-2">Moneda</th>
            <th className="pb-2 text-right">IVA</th><th className="pb-2 text-center">Activo</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="py-2 flex items-center gap-2">
                <CountryFlag code={c.code} size="sm" />
                <span>{c.name}</span>
              </td>
              <td className="py-2 font-mono">{c.currency}</td>
              <td className="py-2 text-right">
                <input
                  type="number"
                  step="0.01"
                  className="w-20 text-right border border-border rounded px-2 py-1 text-sm font-mono"
                  value={c.vatRate}
                  onChange={(e) => updateVat(c.id, parseFloat(e.target.value) || 0)}
                />
              </td>
              <td className="py-2 text-center">
                <input
                  type="checkbox"
                  checked={c.active}
                  onChange={(e) => toggle(c.id, e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

// ── Exchange Rates ────────────────────────────────
function ExchangeRateTab() {
  const rates = useLiveQuery(() => db.exchangeRates.toArray(), []) ?? []

  async function updateRate(id: string, rate: number) {
    await db.exchangeRates.update(id, { rate, updatedAt: new Date().toISOString() })
  }

  return (
    <Card>
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Tipos de Cambio</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="pb-2">Par</th><th className="pb-2 text-right">Tasa</th>
            <th className="pb-2 text-right">Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="py-2 font-mono">{r.fromCurrency} → {r.toCurrency}</td>
              <td className="py-2 text-right">
                <input
                  type="number"
                  step="0.01"
                  className="w-32 text-right border border-border rounded px-2 py-1 text-sm font-mono"
                  value={r.rate}
                  onChange={(e) => updateRate(r.id, parseFloat(e.target.value) || 0)}
                />
              </td>
              <td className="py-2 text-right text-xs text-muted">
                {new Date(r.updatedAt).toLocaleDateString('es-CL')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

// ── Fee Structures ────────────────────────────────
function FeeStructuresTab() {
  const structures = useLiveQuery(() => db.feeStructures.toArray(), []) ?? []

  return (
    <Card>
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Estructuras de Fee</h3>
      <div className="space-y-4">
        {structures.map((fs) => (
          <div key={fs.id} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{fs.name}</h4>
              <div className="flex gap-2 text-xs">
                {fs.isDefault && <span className="px-2 py-0.5 bg-accent/10 text-accent rounded">Default</span>}
                {fs.scope.country && <span className="px-2 py-0.5 bg-cream rounded">{fs.scope.country}</span>}
                {fs.scope.sector && <span className="px-2 py-0.5 bg-cream rounded">{fs.scope.sector}</span>}
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs">
                  <th className="pb-1">Rango (M USD)</th><th className="pb-1 text-right">Tasa</th>
                </tr>
              </thead>
              <tbody>
                {fs.tiers.map((tier, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="py-1 font-mono text-xs">
                      {tier.minMillions}M — {tier.maxMillions === Infinity ? '∞' : `${tier.maxMillions}M`}
                    </td>
                    <td className="py-1 text-right font-mono text-xs">{(tier.rate * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Withholding ────────────────────────────────────
function WithholdingTab() {
  const profiles = useLiveQuery(() => db.withholdingProfiles.toArray(), []) ?? []

  return (
    <Card>
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Perfiles de Retención</h3>
      <div className="space-y-4">
        {profiles.map((wp) => (
          <div key={wp.id} className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CountryFlag code={wp.jurisdictionCountry} size="sm" />
              <h4 className="font-medium">{wp.name}</h4>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs">
                  <th className="pb-1">Escenario</th><th className="pb-1 text-right">Tasa</th>
                  <th className="pb-1">Aplica a</th>
                </tr>
              </thead>
              <tbody>
                {wp.scenarios.map((sc, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="py-1 text-xs">{sc.name}</td>
                    <td className="py-1 text-right font-mono text-xs">{(sc.rate * 100).toFixed(0)}%</td>
                    <td className="py-1 text-xs text-muted">{sc.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Intensity ────────────────────────────────────
function IntensityTab() {
  const config = useLiveQuery(() => db.intensityConfig.toCollection().first(), [])

  async function updateBenchmark(field: string, value: number) {
    if (!config) return
    await db.intensityConfig.update(config.id, {
      benchmarks: { ...config.benchmarks, [field]: value },
    })
  }

  async function updateThreshold(field: string, value: number) {
    if (!config) return
    await db.intensityConfig.update(config.id, {
      thresholds: { ...config.thresholds, [field]: value },
    })
  }

  if (!config) return <p className="text-muted">Cargando...</p>

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Umbrales de Temperatura (días)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'hotDays', label: 'Hot ≤' },
            { key: 'warmDays', label: 'Warm ≤' },
            { key: 'coolDays', label: 'Cool ≤' },
            { key: 'coldDays', label: 'Cold ≤' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-muted mb-1">{label}</label>
              <input
                type="number"
                className={inputCls}
                value={(config.thresholds as unknown as Record<string, number>)[key]}
                onChange={(e) => updateThreshold(key, parseInt(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Benchmarks</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'interactionsPerWeek', label: 'Interacciones/Sem' },
            { key: 'meetingsPerWeek', label: 'Reuniones/Sem' },
            { key: 'newContactsPerWeek', label: 'Contactos Nuevos/Sem' },
            { key: 'touchpointsPerActiveOpp', label: 'Touchpoints/Opp' },
            { key: 'highQualityPctTarget', label: '% Alta Calidad Target' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-muted mb-1">{label}</label>
              <input
                type="number"
                step={key === 'highQualityPctTarget' ? '0.05' : '1'}
                className={inputCls}
                value={(config.benchmarks as unknown as Record<string, number>)[key]}
                onChange={(e) => updateBenchmark(key, parseFloat(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Auto-Calibración</h3>
            <p className="text-xs text-muted">Ajuste automático basado en datos históricos (requiere 3+ deals cerrados)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${config.autoCalibrate ? 'text-green-net' : 'text-muted'}`}>
              {config.autoCalibrate ? 'Activado' : 'Desactivado'}
            </span>
            {config.lastCalibratedAt && (
              <span className="text-xs text-muted">
                Última: {new Date(config.lastCalibratedAt).toLocaleDateString('es-CL')}
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ── Profile ────────────────────────────────────
function ProfileTab() {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  const [form, setForm] = useState({ profileName: '', profileCompany: '', profileEmail: '', displayCurrency: 'USD' })

  useEffect(() => {
    if (settings) {
      const parsed = JSON.parse(settings.value)
      setForm({
        profileName: parsed.profileName ?? '',
        profileCompany: parsed.profileCompany ?? '',
        profileEmail: parsed.profileEmail ?? '',
        displayCurrency: parsed.displayCurrency ?? 'USD',
      })
    }
  }, [settings])

  async function save() {
    if (!settings) return
    const prev = JSON.parse(settings.value)
    await db.settings.update('app', {
      value: JSON.stringify({ ...prev, ...form }),
    })
  }

  return (
    <Card>
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Perfil</h3>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input className={inputCls} value={form.profileName}
            onChange={(e) => setForm((f) => ({ ...f, profileName: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Empresa</label>
          <input className={inputCls} value={form.profileCompany}
            onChange={(e) => setForm((f) => ({ ...f, profileCompany: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className={inputCls} value={form.profileEmail}
            onChange={(e) => setForm((f) => ({ ...f, profileEmail: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Moneda Display</label>
          <select className={inputCls} value={form.displayCurrency}
            onChange={(e) => setForm((f) => ({ ...f, displayCurrency: e.target.value }))}>
            <option value="USD">USD</option>
            <option value="CLP">CLP</option>
            <option value="PEN">PEN</option>
            <option value="COP">COP</option>
          </select>
        </div>
        <button onClick={save}
          className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90">
          Guardar
        </button>
      </div>
    </Card>
  )
}

// ── Data (Backup/Restore/Export) ────────────────
function DataTab() {
  const [status, setStatus] = useState('')

  async function handleExportJSON() {
    try {
      setStatus('Exportando...')
      const json = await exportDatabaseJSON()
      downloadFile(json, `AED_CRM_Backup_${new Date().toISOString().slice(0, 10)}.json`)
      setStatus('Backup exportado exitosamente.')
    } catch (e) {
      setStatus(`Error: ${e}`)
    }
  }

  async function handleImportJSON() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        setStatus('Importando...')
        const text = await file.text()
        await importDatabaseJSON(text)
        setStatus('Backup restaurado exitosamente. Recargando...')
        setTimeout(() => window.location.reload(), 1500)
      } catch (err) {
        setStatus(`Error: ${err}`)
      }
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Backup / Restauración</h3>
        <div className="flex gap-3">
          <button onClick={handleExportJSON}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90">
            Exportar JSON
          </button>
          <button onClick={handleImportJSON}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-cream">
            Importar JSON
          </button>
        </div>
        {status && <p className="text-sm text-muted mt-3">{status}</p>}
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Exportar a Excel</h3>
        <div className="flex gap-3 flex-wrap">
          <button onClick={exportOpportunitiesToExcel}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-cream">
            Oportunidades (.xlsx)
          </button>
          <button onClick={exportExpensesToExcel}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-cream">
            Gastos (.xlsx)
          </button>
          <button onClick={exportContactsToExcel}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-cream">
            Contactos (.xlsx)
          </button>
        </div>
      </Card>
    </div>
  )
}
