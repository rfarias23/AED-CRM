import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { Trip, TripStatus } from '@/lib/types'
import { db } from '@/lib/db'

interface TripState {
  trips: Trip[]
  loading: boolean

  load: () => Promise<void>
  add: (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'actualUSD'>) => Promise<Trip>
  update: (id: string, data: Partial<Trip>) => Promise<void>
  remove: (id: string) => Promise<void>
  transition: (id: string, status: TripStatus, approvedBy?: string) => Promise<void>
}

export const useTripStore = create<TripState>((set) => ({
  trips: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const trips = await db.trips.toArray()
    set({ trips, loading: false })
  },

  add: async (data) => {
    const now = new Date().toISOString()
    const trip: Trip = {
      ...data,
      id: uuid(),
      actualUSD: 0,
      createdAt: now,
      updatedAt: now,
    }
    await db.trips.add(trip)
    set((s) => ({ trips: [...s.trips, trip] }))
    return trip
  },

  update: async (id, data) => {
    const updatedData = { ...data, updatedAt: new Date().toISOString() }
    await db.trips.update(id, updatedData)
    set((s) => ({
      trips: s.trips.map((t) => (t.id === id ? { ...t, ...updatedData } : t)),
    }))
  },

  remove: async (id) => {
    await db.trips.delete(id)
    set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }))
  },

  transition: async (id, status, approvedBy) => {
    const updates: Partial<Trip> = {
      status,
      updatedAt: new Date().toISOString(),
    }
    if (status === 'approved' && approvedBy) {
      updates.approvedBy = approvedBy
      updates.approvedAt = new Date().toISOString()
    }
    await db.trips.update(id, updates)
    set((s) => ({
      trips: s.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },
}))
