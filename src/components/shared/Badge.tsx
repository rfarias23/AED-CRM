import type { OpportunityStage, Temperature } from '@/lib/types'
import Tooltip from './Tooltip'

// ── Stage Badge ──────────────────────────────────

const STAGE_STYLES: Record<OpportunityStage, string> = {
  identification: 'bg-blue-100 text-blue-800',
  qualification: 'bg-purple-100 text-purple-800',
  proposal: 'bg-amber-100 text-amber-800',
  negotiation: 'bg-orange-100 text-orange-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  dormant: 'bg-gray-100 text-gray-500',
}

const STAGE_LABELS: Record<OpportunityStage, string> = {
  identification: 'Identificación',
  qualification: 'Calificación',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  won: 'Ganada',
  lost: 'Perdida',
  dormant: 'Dormida',
}

const STAGE_TOOLTIPS: Record<OpportunityStage, string> = {
  identification: 'Primera etapa: se identifica una oportunidad potencial en el mercado.',
  qualification: 'Se evalúa si la oportunidad es viable y vale la pena perseguir (Go/No-Go).',
  proposal: 'Se prepara y presenta la propuesta técnica y económica al cliente.',
  negotiation: 'Negociación de términos, alcance y condiciones del contrato.',
  won: 'Oportunidad adjudicada exitosamente.',
  lost: 'Oportunidad no adjudicada.',
  dormant: 'Oportunidad pausada o en espera de reactivación.',
}

export function StageBadge({ stage }: { stage: OpportunityStage }) {
  return (
    <Tooltip text={STAGE_TOOLTIPS[stage]}>
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_STYLES[stage]}`}
      >
        {STAGE_LABELS[stage]}
      </span>
    </Tooltip>
  )
}

// ── Temperature Dot ──────────────────────────────

const TEMP_COLORS: Record<Temperature, string> = {
  hot: 'bg-red',
  warm: 'bg-gold',
  cool: 'bg-tier3',
  cold: 'bg-border',
  dormant: 'bg-muted',
}

const TEMP_LABELS: Record<Temperature, string> = {
  hot: 'Caliente',
  warm: 'Tibia',
  cool: 'Fría',
  cold: 'Muy fría',
  dormant: 'Dormida',
}

export function TemperatureDot({
  temperature,
  showLabel = false,
}: {
  temperature: Temperature
  showLabel?: boolean
}) {
  return (
    <Tooltip text={TEMP_LABELS[temperature]}>
      <span className="inline-flex items-center gap-1.5">
        <span
          className={`w-2.5 h-2.5 rounded-full ${TEMP_COLORS[temperature]}`}
        />
        {showLabel && (
          <span className="text-xs text-muted">{TEMP_LABELS[temperature]}</span>
        )}
      </span>
    </Tooltip>
  )
}

// ── Generic Status Badge ─────────────────────────

interface StatusBadgeProps {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const VARIANT_STYLES = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
}

export function StatusBadge({ label, variant = 'default' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${VARIANT_STYLES[variant]}`}
    >
      {label}
    </span>
  )
}
