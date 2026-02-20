import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { QuarterPlan } from '@/lib/types'
import { db } from '@/lib/db'

interface PlanState {
  plans: QuarterPlan[]
  loading: boolean

  load: () => Promise<void>
  add: (data: Omit<QuarterPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<QuarterPlan>
  update: (id: string, data: Partial<QuarterPlan>) => Promise<void>
  close: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const usePlanStore = create<PlanState>((set) => ({
  plans: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const plans = await db.quarterPlans.toArray()
    set({ plans, loading: false })
  },

  add: async (data) => {
    const now = new Date().toISOString()
    const plan: QuarterPlan = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    }
    await db.quarterPlans.add(plan)
    set((s) => ({ plans: [...s.plans, plan] }))
    return plan
  },

  update: async (id, data) => {
    const updatedAt = new Date().toISOString()
    await db.quarterPlans.update(id, { ...data, updatedAt })
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt } : p,
      ),
    }))
  },

  close: async (id) => {
    // Prevent duplicate close on already-closed plans
    const existing = await db.quarterPlans.get(id)
    if (!existing || existing.status === 'closed') return

    const now = new Date().toISOString()
    await db.quarterPlans.update(id, {
      status: 'closed',
      closedAt: now,
      updatedAt: now,
    })
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === id
          ? { ...p, status: 'closed' as const, closedAt: now, updatedAt: now }
          : p,
      ),
    }))
  },

  remove: async (id) => {
    await db.quarterPlans.delete(id)
    set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }))
  },
}))
