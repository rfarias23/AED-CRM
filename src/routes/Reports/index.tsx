import { useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Activity, Shield, FileText, Receipt, History } from 'lucide-react'
import PipelineReport from './internal/PipelineReport'
import CommissionForecast from './internal/CommissionForecast'
import ConversionAnalysis from './internal/ConversionAnalysis'
import IntensityReport from './internal/IntensityReport'
import QuarterReport from './external/QuarterReport'
import ExpenseReport from './external/ExpenseReport'
import ReportHistory from './external/ReportHistory'

type Section = 'internal' | 'external'

const INTERNAL_TABS = [
  { key: 'pipeline', label: 'Pipeline', icon: BarChart3 },
  { key: 'commissions', label: 'Comisiones', icon: DollarSign },
  { key: 'conversion', label: 'Conversión', icon: TrendingUp },
  { key: 'intensity', label: 'Intensidad', icon: Activity },
] as const

const EXTERNAL_TABS = [
  { key: 'quarter', label: 'Trimestral', icon: FileText },
  { key: 'expenses', label: 'Gastos', icon: Receipt },
  { key: 'history', label: 'Historial', icon: History },
] as const

type InternalKey = (typeof INTERNAL_TABS)[number]['key']
type ExternalKey = (typeof EXTERNAL_TABS)[number]['key']

export default function Reports() {
  const [section, setSection] = useState<Section>('internal')
  const [internalTab, setInternalTab] = useState<InternalKey>('pipeline')
  const [externalTab, setExternalTab] = useState<ExternalKey>('quarter')

  return (
    <div className="space-y-6">
      {/* Section toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl">Reportes</h1>
        <div className="flex gap-1 bg-cream rounded-lg p-1">
          <button
            onClick={() => setSection('internal')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              section === 'internal' ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Internos
          </button>
          <button
            onClick={() => setSection('external')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              section === 'external' ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> ASCH SPA
          </button>
        </div>
      </div>

      {/* Internal section */}
      {section === 'internal' && (
        <>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" /> INTERNO
            </span>
          </div>
          <div className="flex gap-1 bg-cream rounded-lg p-1 overflow-x-auto">
            {INTERNAL_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setInternalTab(key)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  internalTab === key ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          {internalTab === 'pipeline' && <PipelineReport />}
          {internalTab === 'commissions' && <CommissionForecast />}
          {internalTab === 'conversion' && <ConversionAnalysis />}
          {internalTab === 'intensity' && <IntensityReport />}
        </>
      )}

      {/* External section */}
      {section === 'external' && (
        <>
          <div className="flex gap-1 bg-cream rounded-lg p-1 overflow-x-auto">
            {EXTERNAL_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setExternalTab(key)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  externalTab === key ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          {externalTab === 'quarter' && <QuarterReport />}
          {externalTab === 'expenses' && <ExpenseReport />}
          {externalTab === 'history' && <ReportHistory />}
        </>
      )}
    </div>
  )
}
