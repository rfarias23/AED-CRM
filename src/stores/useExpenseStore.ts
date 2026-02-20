import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { Expense } from '@/lib/types'
import { db } from '@/lib/db'

interface ExpenseState {
  expenses: Expense[]
  loading: boolean

  load: () => Promise<void>
  add: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>
  update: (id: string, data: Partial<Expense>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const expenses = await db.expenses.toArray()
    set({ expenses, loading: false })
  },

  add: async (data) => {
    const expense: Expense = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    }
    await db.expenses.add(expense)
    set((s) => ({ expenses: [...s.expenses, expense] }))
    return expense
  },

  update: async (id, data) => {
    await db.expenses.update(id, data)
    set((s) => ({
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }))
  },

  remove: async (id) => {
    await db.expenses.delete(id)
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }))
  },
}))
