import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import Card from '@/components/shared/Card'
import EmptyState from '@/components/shared/EmptyState'
import { FileText, Calendar } from 'lucide-react'

export default function ReportHistory() {
  const snapshots = useLiveQuery(() => db.reportSnapshots.toArray(), []) ?? []

  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  )

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl">Historial de Reportes</h2>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="Sin reportes guardados"
          description="Los reportes generados durante el cierre de trimestre aparecerán aquí."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((snap) => (
            <Card key={snap.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted" />
                  <div>
                    <h3 className="font-medium text-sm">
                      Q{snap.quarter} {snap.year} — {snap.type === 'quarter_report' ? 'Reporte Trimestral' : 'Reporte de Gastos'}
                    </h3>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(snap.generatedAt).toLocaleDateString('es-CL', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm font-mono">
                  <div>Pipeline: ${snap.achieved.pipelineUSD.toFixed(1)}M</div>
                  <div className="text-muted">Won: ${snap.achieved.wonUSD.toFixed(1)}M</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
