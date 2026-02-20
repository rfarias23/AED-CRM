import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { Opportunity, OpportunityStage, StageTransition } from '@/lib/types'
import { db } from '@/lib/db'

interface OpportunityState {
  opportunities: Opportunity[]
  loading: boolean

  load: () => Promise<void>
  add: (data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt' | 'stageHistory' | 'invoices'>) => Promise<Opportunity>
  update: (id: string, data: Partial<Opportunity>) => Promise<void>
  remove: (id: string) => Promise<void>
  changeStage: (id: string, newStage: OpportunityStage, reason: string, goNoGo: boolean) => Promise<void>
}

export const useOpportunityStore = create<OpportunityState>((set, get) => ({
  opportunities: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const opportunities = await db.opportunities.toArray()
    set({ opportunities, loading: false })
  },

  add: async (data) => {
    const now = new Date().toISOString()
    const opp: Opportunity = {
      ...data,
      id: uuid(),
      stageHistory: [],
      invoices: [],
      createdAt: now,
      updatedAt: now,
    }
    await db.opportunities.add(opp)
    set((s) => ({ opportunities: [...s.opportunities, opp] }))
    return opp
  },

  update: async (id, data) => {
    const updatedAt = new Date().toISOString()
    await db.opportunities.update(id, { ...data, updatedAt })
    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        o.id === id ? { ...o, ...data, updatedAt } : o,
      ),
    }))
  },

  remove: async (id) => {
    await db.opportunities.delete(id)
    set((s) => ({
      opportunities: s.opportunities.filter((o) => o.id !== id),
    }))
  },

  changeStage: async (id, newStage, reason, goNoGo) => {
    const opp = get().opportunities.find((o) => o.id === id)
    if (!opp) return

    const transition: StageTransition = {
      from: opp.stage,
      to: newStage,
      date: new Date().toISOString(),
      reason,
      goNoGo,
    }

    const updatedAt = new Date().toISOString()
    const stageHistory = [...opp.stageHistory, transition]

    await db.opportunities.update(id, {
      stage: newStage,
      stageHistory,
      updatedAt,
    })

    set((s) => ({
      opportunities: s.opportunities.map((o) =>
        o.id === id ? { ...o, stage: newStage, stageHistory, updatedAt } : o,
      ),
    }))
  },
}))
