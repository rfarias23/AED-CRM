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
    <div className="bg-white border border-accent rounded-lg p-5 flex flex-col gap-1 group relative" title={tooltip}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted uppercase tracking-wider font-medium">
          {label}
        </span>
        {icon && <span className="text-accent/40">{icon}</span>}
      </div>
      <span className="font-mono text-2xl font-semibold tracking-tight text-ink">
        {value}
      </span>
      {subtitle && (
        <span className="text-xs text-muted">{subtitle}</span>
      )}
      {trend && (
        <span
          className={`text-xs font-medium ${
            trend.value >= 0 ? 'text-green-net' : 'text-red'
          }`}
        >
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </span>
      )}
    </div>
  )
}
