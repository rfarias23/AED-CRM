import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import OpportunityCard from './OpportunityCard'
import { StageBadge } from '@/components/shared/Badge'
import type { Opportunity, OpportunityStage } from '@/lib/types'

interface KanbanColumnProps {
  stage: OpportunityStage
  opportunities: Opportunity[]
}

export default function KanbanColumn({ stage, opportunities }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-64 min-w-[16rem] shrink-0 rounded-lg transition-colors ${
        isOver ? 'bg-accent/5' : 'bg-cream/50'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2">
        <StageBadge stage={stage} />
        <span className="text-xs text-muted font-mono">{opportunities.length}</span>
      </div>

      {/* Cards */}
      <SortableContext
        items={opportunities.map((o) => o.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 px-2 pb-2 space-y-2 min-h-[4rem]">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
