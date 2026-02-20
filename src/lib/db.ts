import Dexie, { type EntityTable } from 'dexie'
import type {
  Opportunity,
  Contact,
  Expense,
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
  }
}

export const db = new AppDB()

// ── Seed Loader ──────────────────────────────────

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
  const { createSeedOpportunities } = await import('./seed-opportunities')

  await db.transaction(
    'rw',
    [
      db.countryProfiles,
      db.exchangeRates,
      db.feeStructures,
      db.withholdingProfiles,
      db.intensityConfig,
      db.opportunities,
      db.settings,
    ],
    async () => {
      await db.countryProfiles.bulkAdd(DEFAULT_COUNTRY_PROFILES)
      await db.exchangeRates.bulkAdd(DEFAULT_EXCHANGE_RATES)
      await db.feeStructures.bulkAdd(DEFAULT_FEE_STRUCTURES)
      await db.withholdingProfiles.bulkAdd(DEFAULT_WITHHOLDING_PROFILES)
      await db.intensityConfig.add(DEFAULT_INTENSITY_CONFIG)
      await db.opportunities.bulkAdd(createSeedOpportunities())
      await db.settings.add({
        key: 'app',
        value: JSON.stringify({
          displayCurrency: 'USD',
          sidebarCollapsed: false,
          profileName: 'Rodolfo Farias Corrales',
          profileCompany: 'Independent Consultant',
          profileEmail: '',
        }),
      })
    },
  )
}
