// ─────────────────────────────────────────────────
// AEC Pipeline Command Center — Type Definitions
// PRD v1.3 §2.3 — All interfaces
// ─────────────────────────────────────────────────

// ── Currency ──────────────────────────────────────

/** All Americas currencies + UF + EUR */
export type Currency =
  // North America
  | 'USD' | 'CAD' | 'MXN'
  // Central America & Caribbean
  | 'GTQ' | 'HNL' | 'NIO' | 'CRC' | 'PAB' | 'BZD' | 'SVC'
  | 'DOP' | 'HTG' | 'JMD' | 'TTD' | 'CUP' | 'BBD' | 'BSD'
  | 'AWG' | 'ANG' | 'KYD' | 'XCD' | 'BMD'
  // South America
  | 'BRL' | 'ARS' | 'CLP' | 'PEN' | 'COP' | 'UYU' | 'PYG'
  | 'BOB' | 'VES' | 'GYD' | 'SRD' | 'FKP'
  // Special
  | 'UF' | 'EUR'

// ── Enumerations ─────────────────────────────────

export type OpportunityStage =
  | 'identification'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'dormant'

export type ContractType =
  | 'fee_success'
  | 'retainer'
  | 'mixed'
  | 'project_based'

export type ProjectSector =
  | 'mining'
  | 'energy'
  | 'infrastructure'
  | 'water'
  | 'oil_gas'
  | 'real_estate'
  | 'industrial'
  | 'technology'
  | 'other'

export type ClientType =
  | 'owner'
  | 'developer'
  | 'epc'
  | 'government'
  | 'financial'
  | 'other'

export type ExpenseType =
  | 'travel'
  | 'accommodation'
  | 'meals'
  | 'transport'
  | 'communication'
  | 'subscriptions'
  | 'office'
  | 'representation'
  | 'professional_services'
  | 'other'

export type InteractionType =
  | 'meeting'
  | 'call'
  | 'email'
  | 'event'
  | 'site_visit'
  | 'presentation'
  | 'proposal_delivery'
  | 'social'
  | 'other'

export type InteractionFormat = 'in_person' | 'virtual' | 'async'

export type InteractionQuality = 'high' | 'medium' | 'low'

export type Temperature = 'hot' | 'warm' | 'cool' | 'cold' | 'dormant'

export type ReportType = 'quarter_report' | 'expense_report'

// ── Country & FX ─────────────────────────────────

export interface CountryProfile {
  id: string
  code: string          // ISO 3166-1 alpha-2
  name: string
  currency: Currency
  vatRate: number       // e.g. 0.19
  active: boolean
  timezone: string
  locale: string        // e.g. 'es-CL'
}

export interface ExchangeRate {
  id: string
  fromCurrency: Currency
  toCurrency: Currency
  rate: number          // 1 fromCurrency = rate toCurrency
  updatedAt: string     // ISO date
  source: string        // e.g. 'manual', 'BCCh', 'SBS'
}

// ── Withholding ──────────────────────────────────

export interface WithholdingScenario {
  name: string          // e.g. 'Art. 59 (15%)' or 'Art. 60 (35%)'
  rate: number          // e.g. 0.15
  description: string
  isDefault: boolean
}

export interface WithholdingProfile {
  id: string
  jurisdictionCountry: string   // who pays: 'CL', 'PE', 'CO'
  name: string                  // e.g. 'Chile — Withholding'
  scenarios: WithholdingScenario[]
  notes: string
}

// ── Fee Structure ────────────────────────────────

export interface FeeTier {
  label: string         // e.g. 'Tier 1'
  minMillions: number   // inclusive
  maxMillions: number   // exclusive (Infinity for last tier)
  rate: number          // e.g. 0.03
}

export interface FeeStructure {
  id: string
  name: string          // e.g. 'ASCH Default', 'Adenda Perú'
  isDefault: boolean
  scope: FeeStructureScope
  tiers: FeeTier[]
  effectiveDate: string // ISO date
  notes: string
}

export interface FeeStructureScope {
  type: 'global' | 'country' | 'sector' | 'project'
  country?: string      // ISO code
  sector?: ProjectSector
  projectId?: string
}

// ── Commission Results ───────────────────────────

export interface TierBreakdownItem {
  tier: FeeTier
  applicableMillions: number
  fee: number
}

export interface WithholdingResult {
  scenario: WithholdingScenario
  grossFee: number
  withholdingAmount: number
  netFee: number
}

export interface CommissionResult {
  dealMillions: number
  grossFee: number
  effectiveRate: number
  tierBreakdown: TierBreakdownItem[]
  withholding: WithholdingResult[]
  verification: {
    sumOfTiers: number
    matchesGross: boolean
  }
}

// ── Opportunity ──────────────────────────────────

export interface StageTransition {
  from: OpportunityStage
  to: OpportunityStage
  date: string          // ISO date
  reason: string
  goNoGo: boolean       // was Go/No-Go gate applied?
}

export interface Invoice {
  id: string
  number: string
  amount: number
  currency: Currency
  amountUSD: number
  issueDate: string
  dueDate: string
  paidDate?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
}

export interface Opportunity {
  id: string
  name: string
  client: string
  country: string       // ISO code
  sector: ProjectSector
  clientType: ClientType
  contractType: ContractType
  stage: OpportunityStage

  // Dimensionamiento
  valueOriginal: number       // in original currency
  valueCurrency: Currency
  valueUSD: number            // converted
  aschPercentage: number      // e.g. 0.60 for 60%
  aschValueUSD: number        // valueUSD * aschPercentage
  feeStructureId?: string     // project-specific override

  // Probability
  probabilityOfAward: number  // 0-1

  // Timing
  expectedCloseDate: string
  expectedStartDate?: string
  deadlineRFP?: string

  // Strategy
  teamingPartners: string[]
  tags: string[]
  notes: string

  // History
  stageHistory: StageTransition[]
  invoices: Invoice[]

  // Linking
  contactIds: string[]
  quarterId?: string          // which quarter plan this belongs to

  // Metadata
  createdAt: string
  updatedAt: string
}

// ── Contact & Interaction ────────────────────────

export interface Interaction {
  id: string
  type: InteractionType
  format: InteractionFormat
  duration?: number           // minutes
  quality: InteractionQuality
  summary: string
  outcome: string
  nextAction: string
  nextActionDate?: string
  contactId: string           // primary contact (required)
  additionalContactIds: string[]
  opportunityId?: string
  date: string                // ISO date
  createdAt: string
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  title: string
  company: string
  country: string             // ISO code
  email?: string
  phone?: string
  linkedIn?: string
  notes: string
  tags: string[]
  interactions: Interaction[]
  createdAt: string
  updatedAt: string
}

// ── Expense ──────────────────────────────────────

export interface Expense {
  id: string
  date: string                // ISO date
  type: ExpenseType
  description: string
  vendor: string
  country: string             // ISO code — destination/origin of expense
  amountOriginal: number
  currency: Currency
  amountUSD: number
  receiptRef?: string
  opportunityId?: string
  tripId?: string             // back-reference to Trip
  quarterId?: string
  tags: string[]
  createdAt: string
}

// ── Trips ────────────────────────────────────

export type TripStatus = 'draft' | 'submitted' | 'approved' | 'closed'

export interface Trip {
  id: string
  name: string                  // "Viaje Lima - Solar Moquegua"
  country: string               // ISO destination
  city?: string
  departureDate: string
  returnDate: string
  purpose: string
  participants?: string[]
  budgetUSD?: number
  actualUSD: number             // Computed sum of expenses
  opportunityId?: string
  status: TripStatus
  approvedBy?: string
  approvedAt?: string
  conclusions?: string
  expenseIds: string[]
  createdAt: string
  updatedAt: string
}

// ── Planning ─────────────────────────────────────

export interface PlanAction {
  id: string
  description: string
  responsible: string
  dueDate: string
  completed: boolean
  completedDate?: string
}

export interface PlanMilestone {
  id: string
  name: string
  targetDate: string
  achieved: boolean
  achievedDate?: string
  actions: PlanAction[]
}

export interface QuarterPlan {
  id: string
  year: number
  quarter: 1 | 2 | 3 | 4
  status: 'draft' | 'active' | 'closed' | 'reviewed'

  // ── Pipeline Input ──
  pipelineBrutoUSD: number
  opportunidadesActivas: number
  pipelinePorFase: {
    identification: number
    qualification: number
    proposal: number
    negotiation: number
  }

  // ── Conversion ──
  opportunidadesEvaluadas: number
  opportunidadesGo: number
  winRateTarget: number             // 0-1

  // ── Results ──
  wonUSD: number
  lostUSD: number
  feesDevengadosUSD: number
  feesCobradosUSD: number

  // ── Vintage & Aging ──
  agingPromedioMeses: number
  pipelineNuevoUSD: number
  pipelineSalidoUSD: number
  velocidadPipelineMeses: number
  vintageWon: string[]

  // ── Commercial Cost ──
  bidCostUSD: number
  budgetUSD: number

  // ── Activity (Leading Indicators) ──
  targetNewContacts: number
  targetInteractionsPerWeek: number
  targetMeetingsPerWeek: number
  reunionesDecisionMakers: number

  // ── Narrative ──
  strategicPriorities: string[]
  top3Oportunidades: {
    name: string
    valueUSD: number
    stage: string
    pWin: number
    nextMilestone: string
  }[]
  riesgos: string[]
  notes: string

  milestones: PlanMilestone[]

  // Legacy compatibility (kept for backward compat with old seed data)
  targetPipelineUSD?: number
  targetWonUSD?: number
  targetFeesUSD?: number

  createdAt: string
  updatedAt: string
  closedAt?: string
}

// ── Intensity ────────────────────────────────────

export interface IntensityThresholds {
  hotDays: number       // ≤14
  warmDays: number      // 15-30
  coolDays: number      // 31-60
  coldDays: number      // 61-90
  // >coldDays = dormant
}

export interface IntensityWeights {
  touchpointFrequency: number   // 0-1, sum to 1
  recency: number
  highQualityRatio: number
  diversity: number
}

export interface IntensityBenchmarks {
  interactionsPerWeek: number
  meetingsPerWeek: number
  newContactsPerWeek: number
  highQualityPctTarget: number  // e.g. 0.40
  touchpointsPerActiveOpp: number
}

export interface IntensityConfig {
  id: string
  thresholds: IntensityThresholds
  weights: IntensityWeights
  benchmarks: IntensityBenchmarks
  autoCalibrate: boolean
  lastCalibratedAt?: string
}

export interface IntensitySnapshot {
  id: string
  quarterId: string
  date: string

  // Aggregates
  totalInteractions: number
  totalMeetings: number
  newContacts: number
  avgInteractionsPerWeek: number
  avgMeetingsPerWeek: number
  highQualityPct: number

  // Per-opportunity
  opportunityScores: Array<{
    opportunityId: string
    score: number         // 0-100
    temperature: Temperature
    daysSinceLastTouch: number
    touchpointCount: number
  }>

  // Health
  pipelineHealthScore: number
  hotOppsCount: number
  coldOppsCount: number
  dormantOppsCount: number

  createdAt: string
}

// ── Reports ──────────────────────────────────────

export interface OpportunitySummary {
  opportunityId: string
  name: string
  client: string
  country: string
  sector: ProjectSector
  stage: OpportunityStage
  valueUSD: number
  aschValueUSD: number
  grossFeeUSD: number
  probabilityOfAward: number
  weightedFeeUSD: number
  stageChanges: number
  notes: string
}

export interface ConversionMetrics {
  totalOpportunities: number
  byStage: Record<OpportunityStage, number>
  wonCount: number
  lostCount: number
  winRate: number
  avgDaysToClose: number
  avgDealSizeUSD: number
}

export interface FeesForecastSnapshot {
  totalGrossFees: number
  totalWeightedFees: number
  byCountry: Array<{ country: string; gross: number; weighted: number }>
  bySector: Array<{ sector: ProjectSector; gross: number; weighted: number }>
  byStage: Array<{ stage: OpportunityStage; gross: number; weighted: number }>
}

export interface ExpenseReportDetail {
  totalUSD: number
  byType: Array<{ type: ExpenseType; amount: number; count: number }>
  byCountry: Array<{ country: string; amount: number; count: number }>
  byMonth: Array<{ month: string; amount: number }>
  topExpenses: Expense[]
}

export interface QuarterReportSnapshot {
  id: string
  quarterId: string
  year: number
  quarter: 1 | 2 | 3 | 4
  type: ReportType
  generatedAt: string

  // Plan vs Achieved
  plan: {
    targetPipelineUSD: number
    targetWonUSD: number
    targetFeesUSD: number
    strategicPriorities: string[]
  }
  achieved: {
    pipelineUSD: number
    wonUSD: number
    feesUSD: number
    collectedUSD: number
  }

  // Details
  opportunities: OpportunitySummary[]
  conversion: ConversionMetrics
  feesForecast: FeesForecastSnapshot
  expenses: ExpenseReportDetail

  // Snapshot data (for historical review)
  data: string  // JSON serialized full snapshot
}

// ── Settings ─────────────────────────────────────

export interface AppSettings {
  displayCurrency: Currency
  sidebarCollapsed: boolean
  activeQuarterId?: string
  profileName: string
  profileCompany: string
  profileEmail: string
}
