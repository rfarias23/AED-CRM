import type { ReactNode } from 'react'

interface KPICardProps {
  label: string
  value: string
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; label: string }
  tooltip?: string
}

export default function KPICard({ label, value, subtitle, icon, trend, tooltip }: KPICardProps) {
  return (
    <div className="bg-ink text-white rounded-lg p-5 flex flex-col gap-1 group relative" title={tooltip}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60 uppercase tracking-wider font-medium">
          {label}
        </span>
        {icon && <span className="text-white/40">{icon}</span>}
      </div>
      <span className="font-mono text-2xl font-semibold tracking-tight">
        {value}
      </span>
      {subtitle && (
        <span className="text-xs text-white/50">{subtitle}</span>
      )}
      {trend && (
        <span
          className={`text-xs font-medium ${
            trend.value >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </span>
      )}
    </div>
  )
}
