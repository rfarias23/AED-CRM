import type { ReactNode } from 'react'
import Tooltip from './Tooltip'

interface CardProps {
  children: ReactNode
  className?: string
  dark?: boolean
  padding?: 'sm' | 'md' | 'lg'
  title?: string
}

const PADDING = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({
  children,
  className = '',
  dark = false,
  padding = 'md',
  title,
}: CardProps) {
  return (
    <Tooltip text={title}>
      <div
        className={`rounded-lg border shadow-sm ${PADDING[padding]} ${
          dark
            ? 'bg-white border-accent text-ink'
            : 'bg-white border-border'
        } ${className}`}
      >
        {children}
      </div>
    </Tooltip>
  )
}
