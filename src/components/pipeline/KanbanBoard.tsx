import { useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useOpportunityStore } from '@/stores/useOpportunityStore'
import KanbanColumn from './KanbanColumn'
import type { Opportunity, OpportunityStage } from '@/lib/types'

/** Active pipeline stages shown in the Kanban — excludes won/lost/dormant */
const KANBAN_STAGES: OpportunityStage[] = [
  'identification',
  'qualification',
  'proposal',
  'negotiation',
]

/** Stages that require a Go/No-Go gate before entering */
const GATED_STAGES: OpportunityStage[] = ['proposal', 'negotiation', 'won']

interface KanbanBoardProps {
  opportunities: Opportunity[]
}

export default function KanbanBoard({ opportunities }: KanbanBoardProps) {
  const changeStage = useOpportunityStore((s) => s.changeStage)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const grouped = KANBAN_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = opportunities.filter((o) => o.stage === stage)
      return acc
    },
    {} as Record<OpportunityStage, Opportunity[]>,
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const oppId = active.id as string
      const targetStage = over.id as OpportunityStage

      // Only allow drops on valid kanban columns
      if (!KANBAN_STAGES.includes(targetStage)) return

      const opp = opportunities.find((o) => o.id === oppId)
      if (!opp || opp.stage === targetStage) return

      // Block gated transitions via drag — user must use the StageGate modal
      if (GATED_STAGES.includes(targetStage)) {
        return
      }

      await changeStage(oppId, targetStage, 'Movido en Kanban', false)
    },
    [opportunities, changeStage],
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STAGES.map((stage) => (
          <KanbanColumn key={stage} stage={stage} opportunities={grouped[stage] ?? []} />
        ))}
      </div>
      <DragOverlay />
    </DndContext>
  )
}
