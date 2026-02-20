import { create } from 'zustand'
import type { QuarterReportSnapshot } from '@/lib/types'
import { db } from '@/lib/db'

interface ReportState {
  snapshots: QuarterReportSnapshot[]
  loading: boolean

  load: () => Promise<void>
  save: (snapshot: QuarterReportSnapshot) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useReportStore = create<ReportState>((set) => ({
  snapshots: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const snapshots = await db.reportSnapshots.toArray()
    set({ snapshots, loading: false })
  },

  save: async (snapshot) => {
    await db.reportSnapshots.put(snapshot)
    set((s) => ({
      snapshots: [
        ...s.snapshots.filter((r) => r.id !== snapshot.id),
        snapshot,
      ],
    }))
  },

  remove: async (id) => {
    await db.reportSnapshots.delete(id)
    set((s) => ({ snapshots: s.snapshots.filter((r) => r.id !== id) }))
  },
}))
