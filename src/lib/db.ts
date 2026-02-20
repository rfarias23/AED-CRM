import Dexie, { type EntityTable } from 'dexie'
import type {
  Opportunity,
  Contact,
  Expense,
  Trip,
  CountryProfile,
  ExchangeRate,
  FeeStructure,
  WithholdingProfile,
  QuarterPlan,
  QuarterReportSnapshot,
  IntensityConfig,
} from './types'

// ── Settings KV Store ────────────────────────────

export interface SettingsEntry {
  key: string
  value: string // JSON serialized
}

// ── Database ─────────────────────────────────────

export class AppDB extends Dexie {
  opportunities!: EntityTable<Opportunity, 'id'>
  contacts!: EntityTable<Contact, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  trips!: EntityTable<Trip, 'id'>
  countryProfiles!: EntityTable<CountryProfile, 'id'>
  exchangeRates!: EntityTable<ExchangeRate, 'id'>
  feeStructures!: EntityTable<FeeStructure, 'id'>
  withholdingProfiles!: EntityTable<WithholdingProfile, 'id'>
  quarterPlans!: EntityTable<QuarterPlan, 'id'>
  reportSnapshots!: EntityTable<QuarterReportSnapshot, 'id'>
  intensityConfig!: EntityTable<IntensityConfig, 'id'>
  settings!: EntityTable<SettingsEntry, 'key'>

  constructor() {
    super('AECPipelineDB')

    this.version(1).stores({
      opportunities: 'id, stage, country, quarterId',
      contacts: 'id, company, country',
      expenses: 'id, date, opportunityId, quarterId',
      countryProfiles: 'id',
      exchangeRates: 'id, [fromCurrency+toCurrency]',
      feeStructures: 'id, isDefault',
      withholdingProfiles: 'id, jurisdictionCountry',
      quarterPlans: 'id, [year+quarter]',
      reportSnapshots: 'id, quarterId, type',
      intensityConfig: 'id',
      settings: 'key',
    })

    // v2: Add country + tripId index on expenses, add trips table
    this.version(2).stores({
      expenses: 'id, date, opportunityId, quarterId, country, tripId',
      trips: 'id, status, country, departureDate',
    }).upgrade(async (tx) => {
      // Backfill country on existing expenses from linked opportunity
      const expenses = tx.table('expenses')
      const opportunities = tx.table('opportunities')
      await expenses.toCollection().modify(async (expense: Record<string, unknown>) => {
        if (!expense.country) {
          if (expense.opportunityId) {
            const opp = await opportunities.get(expense.opportunityId as string)
            expense.country = opp?.country ?? 'CL'
          } else {
            expense.country = 'CL' // default
          }
        }
        // Initialize tripId if missing
        if (expense.tripId === undefined) {
          expense.tripId = undefined
        }
      })
    })
  }
}

export const db = new AppDB()

// ── Seed Loader ──────────────────────────────────

/**
 * Seed reference/config data that ALL users need (country profiles,
 * exchange rates, fee structures, withholding profiles, intensity config).
 * Runs once per browser regardless of user role.
 */
export async function seedIfEmpty(): Promise<void> {
  const profileCount = await db.countryProfiles.count()
  if (profileCount > 0) return // Already seeded

  const { DEFAULT_COUNTRY_PROFILES } = await import('./country-profiles')
  const {
    DEFAULT_EXCHANGE_RATES,
    DEFAULT_FEE_STRUCTURES,
    DEFAULT_WITHHOLDING_PROFILES,
  } = await import('./constants')
  const { DEFAULT_INTENSITY_CONFIG } = await import('./intensity-benchmarks')

  await db.transaction(
    'rw',
    [
      db.countryProfiles,
      db.exchangeRates,
      db.feeStructures,
      db.withholdingProfiles,
      db.intensityConfig,
      db.settings,
    ],
    async () => {
      await db.countryProfiles.bulkAdd(DEFAULT_COUNTRY_PROFILES)
      await db.exchangeRates.bulkAdd(DEFAULT_EXCHANGE_RATES)
      await db.feeStructures.bulkAdd(DEFAULT_FEE_STRUCTURES)
      await db.withholdingProfiles.bulkAdd(DEFAULT_WITHHOLDING_PROFILES)
      await db.intensityConfig.add(DEFAULT_INTENSITY_CONFIG)

      await db.settings.add({
        key: 'app',
        value: JSON.stringify({
          displayCurrency: 'USD',
          sidebarCollapsed: false,
          profileName: '',
          profileCompany: '',
          profileEmail: '',
        }),
      })
    },
  )
}

/**
 * Seed demo/dummy commercial data (opportunities, contacts, expenses, plans).
 * Only called for admin users after authentication.
 */
export async function seedDemoData(): Promise<void> {
  const oppCount = await db.opportunities.count()
  if (oppCount > 0) return // Demo data already loaded

  const { createSeedOpportunities } = await import('./seed-opportunities')
  const { createSeedContacts, createSeedInteractions } = await import('./seed-contacts')
  const { createSeedExpenses } = await import('./seed-expenses')
  const { createSeedPlans } = await import('./seed-plans')

  await db.transaction(
    'rw',
    [db.opportunities, db.contacts, db.expenses, db.quarterPlans],
    async () => {
      await db.opportunities.bulkAdd(createSeedOpportunities())

      const contacts = createSeedContacts()
      const interactionPairs = createSeedInteractions(contacts)
      for (const { contactId, interaction } of interactionPairs) {
        const contact = contacts.find((c) => c.id === contactId)
        if (contact) contact.interactions.push(interaction)
      }
      await db.contacts.bulkAdd(contacts)

      await db.expenses.bulkAdd(createSeedExpenses())
      await db.quarterPlans.bulkAdd(createSeedPlans())
    },
  )
}
