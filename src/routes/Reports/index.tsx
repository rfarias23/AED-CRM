import { useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Activity, Shield } from 'lucide-react'
import PipelineReport from './internal/PipelineReport'
import CommissionForecast from './internal/CommissionForecast'
import ConversionAnalysis from './internal/ConversionAnalysis'
import IntensityReport from './internal/IntensityReport'

const TABS = [
  { key: 'pipeline', label: 'Pipeline', icon: BarChart3 },
  { key: 'commissions', label: 'Comisiones', icon: DollarSign },
  { key: 'conversion', label: 'Conversión', icon: TrendingUp },
  { key: 'intensity', label: 'Intensidad', icon: Activity },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabKey>('pipeline')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl">Reportes Internos</h1>
        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
          <Shield className="w-3 h-3" /> INTERNO
        </span>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-cream rounded-lg p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === key ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Active report */}
      {activeTab === 'pipeline' && <PipelineReport />}
      {activeTab === 'commissions' && <CommissionForecast />}
      {activeTab === 'conversion' && <ConversionAnalysis />}
      {activeTab === 'intensity' && <IntensityReport />}
    </div>
  )
}
