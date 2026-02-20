import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { Contact, Interaction } from '@/lib/types'
import { db } from '@/lib/db'

interface ContactState {
  contacts: Contact[]
  loading: boolean

  load: () => Promise<void>
  add: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => Promise<Contact>
  update: (id: string, data: Partial<Contact>) => Promise<void>
  remove: (id: string) => Promise<void>
  addInteraction: (contactId: string, data: Omit<Interaction, 'id' | 'createdAt'>) => Promise<Interaction>
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const contacts = await db.contacts.toArray()
    set({ contacts, loading: false })
  },

  add: async (data) => {
    const now = new Date().toISOString()
    const contact: Contact = {
      ...data,
      id: uuid(),
      interactions: [],
      createdAt: now,
      updatedAt: now,
    }
    await db.contacts.add(contact)
    set((s) => ({ contacts: [...s.contacts, contact] }))
    return contact
  },

  update: async (id, data) => {
    const updatedAt = new Date().toISOString()
    await db.contacts.update(id, { ...data, updatedAt })
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt } : c,
      ),
    }))
  },

  remove: async (id) => {
    await db.contacts.delete(id)
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }))
  },

  addInteraction: async (contactId, data) => {
    const interaction: Interaction = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    }
    const contact = get().contacts.find((c) => c.id === contactId)
    if (!contact) throw new Error(`Contact not found: ${contactId}`)

    const interactions = [...contact.interactions, interaction]
    const updatedAt = new Date().toISOString()
    await db.contacts.update(contactId, { interactions, updatedAt })
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === contactId ? { ...c, interactions, updatedAt } : c,
      ),
    }))
    return interaction
  },
}))
