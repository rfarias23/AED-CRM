import type { ReactNode } from 'react'

interface TooltipProps {
  text?: string
  children: ReactNode
  position?: 'top' | 'bottom'
}

export default function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  if (!text) return <>{children}</>

  const isTop = position === 'top'

  return (
    <span className="group/tip relative inline-flex" tabIndex={0}>
      {children}
      <span
        role="tooltip"
        className={`
          pointer-events-none absolute left-1/2 -translate-x-1/2 z-50
          invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100
          group-focus-within/tip:visible group-focus-within/tip:opacity-100
          transition-opacity duration-150
          max-w-[280px] w-max px-3 py-1.5
          bg-ink text-white text-xs leading-relaxed font-body
          rounded-md shadow-md
          ${isTop ? 'bottom-full mb-2' : 'top-full mt-2'}
        `}
      >
        {text}
        <span
          className={`
            absolute left-1/2 -translate-x-1/2
            border-[5px] border-transparent
            ${isTop ? 'top-full border-t-ink' : 'bottom-full border-b-ink'}
          `}
        />
      </span>
    </span>
  )
}
