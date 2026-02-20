import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  dark?: boolean
  padding?: 'sm' | 'md' | 'lg'
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
}: CardProps) {
  return (
    <div
      className={`rounded-lg border shadow-sm ${PADDING[padding]} ${
        dark
          ? 'bg-ink text-white border-transparent'
          : 'bg-white border-border'
      } ${className}`}
    >
      {children}
    </div>
  )
}
