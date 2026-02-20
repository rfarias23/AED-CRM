import { useState } from 'react'
import Modal from '@/components/shared/Modal'
import { StageBadge } from '@/components/shared/Badge'
import { useOpportunityStore } from '@/stores/useOpportunityStore'
import type { Opportunity, OpportunityStage } from '@/lib/types'
import { AlertTriangle } from 'lucide-react'

interface StageGateProps {
  opportunity: Opportunity
  targetStage: OpportunityStage
  onClose: () => void
  onComplete: () => void
}

// Stages that require Go/No-Go gate (proposal and beyond)
const GATE_REQUIRED: OpportunityStage[] = ['proposal', 'negotiation', 'won']

export default function StageGate({
  opportunity,
  targetStage,
  onClose,
  onComplete,
}: StageGateProps) {
  const changeStage = useOpportunityStore((s) => s.changeStage)
  const [reason, setReason] = useState('')
  const [goDecision, setGoDecision] = useState<'go' | 'nogo' | null>(null)

  const requiresGate = GATE_REQUIRED.includes(targetStage)

  async function handleSubmit() {
    if (requiresGate && !goDecision) return
    if (!reason.trim()) return

    if (requiresGate && goDecision === 'nogo') {
      // No-Go: move to dormant instead
      await changeStage(opportunity.id, 'dormant', reason, true)
    } else {
      await changeStage(opportunity.id, targetStage, reason, requiresGate)
    }
    onComplete()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={requiresGate ? 'Decisión Go / No-Go' : 'Cambio de Etapa'}
      size="md"
    >
      <div className="space-y-4">
        {/* Stage transition display */}
        <div className="flex items-center justify-center gap-3 py-3">
          <StageBadge stage={opportunity.stage} />
          <span className="text-muted text-lg">→</span>
          <StageBadge stage={targetStage} />
        </div>

        {/* Go/No-Go decision */}
        {requiresGate && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-gold" />
              Esta etapa requiere decisión Go/No-Go
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setGoDecision('go')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  goDecision === 'go'
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : 'border-border hover:bg-cream'
                }`}
              >
                ✓ Go — Avanzar
              </button>
              <button
                onClick={() => setGoDecision('nogo')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  goDecision === 'nogo'
                    ? 'bg-red-100 border-red-300 text-red-800'
                    : 'border-border hover:bg-cream'
                }`}
              >
                ✗ No-Go — Dormir
              </button>
            </div>
            {goDecision === 'nogo' && (
              <p className="text-xs text-red">
                La oportunidad será movida a "Dormida" en lugar de avanzar.
              </p>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="text-xs text-muted font-medium block mb-1">
            Razón / Justificación
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={
              requiresGate
                ? 'Explique la decisión Go/No-Go...'
                : 'Razón del cambio de etapa...'
            }
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-cream"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || (requiresGate && !goDecision)}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  )
}
