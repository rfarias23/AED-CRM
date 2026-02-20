import { create } from 'zustand'
import type { Currency, AppSettings } from '@/lib/types'
import { db } from '@/lib/db'

interface SettingsState {
  displayCurrency: Currency
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  activeQuarterId?: string
  profileName: string
  profileCompany: string
  profileEmail: string
  loaded: boolean

  load: () => Promise<void>
  setDisplayCurrency: (currency: Currency) => void
  toggleSidebar: () => void
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
  setActiveQuarter: (quarterId: string | undefined) => void
  updateProfile: (name: string, company: string, email: string) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  displayCurrency: 'USD',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeQuarterId: undefined,
  profileName: '',
  profileCompany: '',
  profileEmail: '',
  loaded: false,

  load: async () => {
    const entry = await db.settings.get('app')
    if (entry) {
      const settings: AppSettings = JSON.parse(entry.value)
      set({
        displayCurrency: settings.displayCurrency,
        sidebarCollapsed: settings.sidebarCollapsed,
        activeQuarterId: settings.activeQuarterId,
        profileName: settings.profileName,
        profileCompany: settings.profileCompany,
        profileEmail: settings.profileEmail,
        loaded: true,
      })
    } else {
      set({ loaded: true })
    }
  },

  setDisplayCurrency: (currency) => {
    set({ displayCurrency: currency })
    persistSettings(get())
  },

  toggleSidebar: () => {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
    persistSettings(get())
  },

  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),

  setActiveQuarter: (quarterId) => {
    set({ activeQuarterId: quarterId })
    persistSettings(get())
  },

  updateProfile: (name, company, email) => {
    set({ profileName: name, profileCompany: company, profileEmail: email })
    persistSettings(get())
  },
}))

function persistSettings(state: SettingsState) {
  const settings: AppSettings = {
    displayCurrency: state.displayCurrency,
    sidebarCollapsed: state.sidebarCollapsed,
    activeQuarterId: state.activeQuarterId,
    profileName: state.profileName,
    profileCompany: state.profileCompany,
    profileEmail: state.profileEmail,
  }
  db.settings.put({ key: 'app', value: JSON.stringify(settings) }).catch((err) =>
    console.error('Failed to persist settings:', err),
  )
}
