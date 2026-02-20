import { create } from 'zustand'
import type { IntensityConfig, IntensitySnapshot } from '@/lib/types'
import { db } from '@/lib/db'

interface IntensityState {
  config: IntensityConfig | null
  snapshots: IntensitySnapshot[]
  loading: boolean

  load: () => Promise<void>
  updateConfig: (data: Partial<IntensityConfig>) => Promise<void>
  saveSnapshot: (snapshot: IntensitySnapshot) => Promise<void>
}

export const useIntensityStore = create<IntensityState>((set, get) => ({
  config: null,
  snapshots: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const configs = await db.intensityConfig.toArray()
    const config = configs[0] ?? null
    // Restore persisted snapshots
    const entry = await db.settings.get('intensity-snapshots')
    const snapshots: IntensitySnapshot[] = entry ? JSON.parse(entry.value) : []
    set({ config, snapshots, loading: false })
  },

  updateConfig: async (data) => {
    const current = get().config
    if (!current) return
    const updated = { ...current, ...data }
    await db.intensityConfig.put(updated)
    set({ config: updated })
  },

  saveSnapshot: async (snapshot) => {
    const updated = [...get().snapshots, snapshot]
    await db.settings.put({
      key: 'intensity-snapshots',
      value: JSON.stringify(updated),
    })
    set({ snapshots: updated })
  },
}))
