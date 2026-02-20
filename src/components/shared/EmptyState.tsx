import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-muted/40 mb-4">
        {icon ?? <Inbox className="w-12 h-12" />}
      </div>
      <h3 className="font-heading text-lg text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
