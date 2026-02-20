import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { FeeStructure } from '@/lib/types'

interface FeeStructureSelectorProps {
  value: string | undefined
  onChange: (fs: FeeStructure) => void
  className?: string
}

export default function FeeStructureSelector({
  value,
  onChange,
  className = '',
}: FeeStructureSelectorProps) {
  const structures = useLiveQuery(() => db.feeStructures.toArray(), [])

  if (!structures) return null

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-muted font-medium">Estructura de Fees</label>
      <select
        value={value ?? ''}
        onChange={(e) => {
          const fs = structures.find((s) => s.id === e.target.value)
          if (fs) onChange(fs)
        }}
        className="border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {structures.map((fs) => (
          <option key={fs.id} value={fs.id}>
            {fs.name}
            {fs.isDefault ? ' (Default)' : ''}
            {fs.scope.type === 'country' ? ` — ${fs.scope.country}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
