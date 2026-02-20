import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link } from 'react-router-dom'
import { TemperatureDot } from '@/components/shared/Badge'
import MoneyDisplay from '@/components/shared/MoneyDisplay'
import CountryFlag from '@/components/shared/CountryFlag'
import { getTemperature } from './temperature'
import { formatPercent } from '@/lib/formatters'
import type { Opportunity } from '@/lib/types'

interface OpportunityCardProps {
  opportunity: Opportunity
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const temperature = getTemperature(opportunity)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          to={`/opportunities/${opportunity.id}`}
          className="text-sm font-medium text-ink hover:text-accent truncate flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          {opportunity.name}
        </Link>
        <TemperatureDot temperature={temperature} />
      </div>

      <p className="text-xs text-muted truncate mb-2">{opportunity.client}</p>

      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          <CountryFlag code={opportunity.country} size="sm" />
          <span className="font-mono">
            <MoneyDisplay amount={opportunity.aschValueUSD} currency="USD" compact />
          </span>
        </span>
        <span className="font-mono text-muted">
          {formatPercent(opportunity.probabilityOfAward, 0)}
        </span>
      </div>
    </div>
  )
}
