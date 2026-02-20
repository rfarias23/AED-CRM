import { describe, it, expect } from 'vitest'
import {
  calculateCommission,
  resolveFeeStructure,
  calculatePipelineFees,
} from '@/lib/commission-engine'
import type {
  FeeStructure,
  WithholdingProfile,
  Opportunity,
} from '@/lib/types'

// ── Test Fee Structures ──────────────────────────

const DEFAULT_FEE_STRUCTURE: FeeStructure = {
  id: 'fs-default',
  name: 'ASCH Default',
  isDefault: true,
  scope: { type: 'global' },
  tiers: [
    { label: 'Tier 1', minMillions: 0, maxMillions: 40, rate: 0.03 },
    { label: 'Tier 2', minMillions: 40, maxMillions: 60, rate: 0.02 },
    { label: 'Tier 3', minMillions: 60, maxMillions: Infinity, rate: 0.0125 },
  ],
  effectiveDate: '2024-01-01',
  notes: '',
}

const ADENDA_PERU: FeeStructure = {
  id: 'fs-peru',
  name: 'Adenda Perú',
  isDefault: false,
  scope: { type: 'country', country: 'PE' },
  tiers: [
    { label: 'Tier 1', minMillions: 0, maxMillions: 30, rate: 0.035 },
    { label: 'Tier 2', minMillions: 30, maxMillions: 50, rate: 0.025 },
    { label: 'Tier 3', minMillions: 50, maxMillions: Infinity, rate: 0.015 },
  ],
  effectiveDate: '2025-06-01',
  notes: '',
}

const MINING_FEE_STRUCTURE: FeeStructure = {
  id: 'fs-mining',
  name: 'Mining Sector',
  isDefault: false,
  scope: { type: 'sector', sector: 'mining' },
  tiers: [
    { label: 'Tier 1', minMillions: 0, maxMillions: 50, rate: 0.025 },
    { label: 'Tier 2', minMillions: 50, maxMillions: Infinity, rate: 0.015 },
  ],
  effectiveDate: '2025-01-01',
  notes: '',
}

const CHILE_WITHHOLDING: WithholdingProfile = {
  id: 'wh-cl',
  jurisdictionCountry: 'CL',
  name: 'Chile — Retención',
  scenarios: [
    { name: 'Art. 59 (15%)', rate: 0.15, description: '', isDefault: true },
    { name: 'Art. 60 (35%)', rate: 0.35, description: '', isDefault: false },
  ],
  notes: '',
}

// ── Helper ───────────────────────────────────────

function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor) / factor
}

// ── Tests: calculateCommission with DEFAULT structure ──

describe('calculateCommission — ASCH Default (3%/2%/1.25%)', () => {
  it('handles 0M deal', () => {
    const result = calculateCommission(0, DEFAULT_FEE_STRUCTURE)
    expect(result.grossFee).toBe(0)
    expect(result.effectiveRate).toBe(0)
    expect(result.tierBreakdown).toHaveLength(0)
    expect(result.verification.matchesGross).toBe(true)
  })

  it('handles 10M deal (fully in Tier 1)', () => {
    const result = calculateCommission(10, DEFAULT_FEE_STRUCTURE)
    expect(result.grossFee).toBeCloseTo(0.3, 6) // 10 * 3% = 0.3M
    expect(result.effectiveRate).toBeCloseTo(0.03, 6)
    expect(result.tierBreakdown).toHaveLength(1)
    expect(result.verification.matchesGross).toBe(true)
  })

  it('handles 25M deal (fully in Tier 1)', () => {
    const result = calculateCommission(25, DEFAULT_FEE_STRUCTURE)
    expect(result.grossFee).toBeCloseTo(0.75, 6) // 25 * 3% = 0.75M
    expect(result.effectiveRate).toBeCloseTo(0.03, 6)
  })

  it('handles 40M deal (boundary T1/T2)', () => {
    const result = calculateCommission(40, DEFAULT_FEE_STRUCTURE)
    expect(result.grossFee).toBeCloseTo(1.2, 6) // 40 * 3% = 1.2M
    expect(result.effectiveRate).toBeCloseTo(0.03, 6)
    expect(result.tierBreakdown).toHaveLength(1)
    expect(result.verification.matchesGross).toBe(true)
  })

  it('handles 50M deal (T1 + T2)', () => {
    const result = calculateCommission(50, DEFAULT_FEE_STRUCTURE)
    // T1: 40 * 3% = 1.2, T2: 10 * 2% = 0.2 → total = 1.4M
    expect(result.grossFee).toBeCloseTo(1.4, 6)
    expect(result.effectiveRate).toBeCloseTo(1.4 / 50, 6)
    expect(result.tierBreakdown).toHaveLength(2)
    expect(result.verification.matchesGross).toBe(true)
  })

  it('handles 60M deal (boundary T2/T3)', () => {
    const result = calculateCommission(60, DEFAULT_FEE_STRUCTURE)
    // T1: 40 * 3% = 1.2, T2: 20 * 2% = 0.4 → total = 1.6M
    expect(result.grossFee).toBeCloseTo(1.6, 6)
    expect(result.effectiveRate).toBeCloseTo(1.6 / 60, 6)
    expect(result.tierBreakdown).toHaveLength(2)
  })

  it('handles 80M deal (all 3 tiers)', () => {
    const result = calculateCommission(80, DEFAULT_FEE_STRUCTURE)
    // T1: 40*3%=1.2, T2: 20*2%=0.4, T3: 20*1.25%=0.25 → 1.85M
    expect(result.grossFee).toBeCloseTo(1.85, 6)
    expect(result.effectiveRate).toBeCloseTo(1.85 / 80, 6)
    expect(result.tierBreakdown).toHaveLength(3)
    expect(result.verification.matchesGross).toBe(true)
  })

  it('handles 100M deal', () => {
    const result = calculateCommission(100, DEFAULT_FEE_STRUCTURE)
    // T1: 1.2, T2: 0.4, T3: 40*1.25%=0.5 → 2.1M
    expect(result.grossFee).toBeCloseTo(2.1, 6)
    expect(result.effectiveRate).toBeCloseTo(0.021, 4)
  })

  it('handles 150M deal', () => {
    const result = calculateCommission(150, DEFAULT_FEE_STRUCTURE)
    // T1: 1.2, T2: 0.4, T3: 90*1.25%=1.125 → 2.725M
    expect(result.grossFee).toBeCloseTo(2.725, 6)
  })

  it('handles 200M deal', () => {
    const result = calculateCommission(200, DEFAULT_FEE_STRUCTURE)
    // T1: 1.2, T2: 0.4, T3: 140*1.25%=1.75 → 3.35M
    expect(result.grossFee).toBeCloseTo(3.35, 6)
    expect(result.effectiveRate).toBeCloseTo(3.35 / 200, 6)
  })

  it('handles 500M deal', () => {
    const result = calculateCommission(500, DEFAULT_FEE_STRUCTURE)
    // T1: 1.2, T2: 0.4, T3: 440*1.25%=5.5 → 7.1M
    expect(result.grossFee).toBeCloseTo(7.1, 6)
    expect(result.effectiveRate).toBeCloseTo(7.1 / 500, 6)
    expect(result.verification.matchesGross).toBe(true)
  })

  it('rejects negative deal values', () => {
    expect(() => calculateCommission(-10, DEFAULT_FEE_STRUCTURE)).toThrow(
      'Deal value cannot be negative',
    )
  })
})

// ── Tests: calculateCommission with Adenda Perú ──

describe('calculateCommission — Adenda Perú (3.5%/2.5%/1.5%)', () => {
  it('handles 25M deal (fully T1)', () => {
    const result = calculateCommission(25, ADENDA_PERU)
    expect(result.grossFee).toBeCloseTo(0.875, 6) // 25 * 3.5%
    expect(result.effectiveRate).toBeCloseTo(0.035, 6)
  })

  it('handles 50M deal (T1 + T2)', () => {
    const result = calculateCommission(50, ADENDA_PERU)
    // T1: 30*3.5%=1.05, T2: 20*2.5%=0.5 → 1.55M
    expect(result.grossFee).toBeCloseTo(1.55, 6)
    expect(result.tierBreakdown).toHaveLength(2)
  })

  it('handles 100M deal (all 3 tiers)', () => {
    const result = calculateCommission(100, ADENDA_PERU)
    // T1: 30*3.5%=1.05, T2: 20*2.5%=0.5, T3: 50*1.5%=0.75 → 2.3M
    expect(result.grossFee).toBeCloseTo(2.3, 6)
    expect(result.tierBreakdown).toHaveLength(3)
    expect(result.verification.matchesGross).toBe(true)
  })

  it('produces DIFFERENT results than default for same deal', () => {
    const defaultResult = calculateCommission(100, DEFAULT_FEE_STRUCTURE)
    const peruResult = calculateCommission(100, ADENDA_PERU)
    expect(peruResult.grossFee).not.toBeCloseTo(defaultResult.grossFee, 2)
    // Peru structure: 2.3M, Default: 2.1M → Peru is higher
    expect(peruResult.grossFee).toBeGreaterThan(defaultResult.grossFee)
  })
})

// ── Tests: Withholding multi-scenario ────────────

describe('calculateCommission — with withholding', () => {
  it('calculates 15% withholding correctly', () => {
    const result = calculateCommission(100, DEFAULT_FEE_STRUCTURE, CHILE_WITHHOLDING)
    const scenario15 = result.withholding.find(
      (w) => w.scenario.rate === 0.15,
    )!
    expect(scenario15).toBeDefined()
    expect(scenario15.grossFee).toBeCloseTo(2.1, 6)
    expect(scenario15.withholdingAmount).toBeCloseTo(2.1 * 0.15, 6)
    expect(scenario15.netFee).toBeCloseTo(2.1 * 0.85, 6)
  })

  it('calculates 35% withholding correctly', () => {
    const result = calculateCommission(100, DEFAULT_FEE_STRUCTURE, CHILE_WITHHOLDING)
    const scenario35 = result.withholding.find(
      (w) => w.scenario.rate === 0.35,
    )!
    expect(scenario35).toBeDefined()
    expect(scenario35.grossFee).toBeCloseTo(2.1, 6)
    expect(scenario35.withholdingAmount).toBeCloseTo(2.1 * 0.35, 6)
    expect(scenario35.netFee).toBeCloseTo(2.1 * 0.65, 6)
  })

  it('returns empty withholding array when no profile provided', () => {
    const result = calculateCommission(100, DEFAULT_FEE_STRUCTURE)
    expect(result.withholding).toHaveLength(0)
  })
})

// ── Tests: resolveFeeStructure priority ──────────

describe('resolveFeeStructure', () => {
  const allStructures = [DEFAULT_FEE_STRUCTURE, ADENDA_PERU, MINING_FEE_STRUCTURE]

  function makeOpp(overrides: Partial<Opportunity>): Opportunity {
    return {
      id: 'test-opp',
      name: 'Test',
      client: 'ACME',
      country: 'CL',
      sector: 'energy',
      clientType: 'owner',
      contractType: 'fee_success',
      stage: 'qualification',
      valueOriginal: 100_000_000,
      valueCurrency: 'CLP',
      valueUSD: 100_000,
      aschPercentage: 1,
      aschValueUSD: 100_000,
      probabilityOfAward: 0.5,
      expectedCloseDate: '2026-06-01',
      teamingPartners: [],
      tags: [],
      notes: '',
      stageHistory: [],
      invoices: [],
      contactIds: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      ...overrides,
    }
  }

  it('resolves to global default when no specific match', () => {
    const opp = makeOpp({ country: 'CL', sector: 'energy' })
    const result = resolveFeeStructure(opp, allStructures)
    expect(result.id).toBe('fs-default')
  })

  it('resolves to country-scoped structure', () => {
    const opp = makeOpp({ country: 'PE', sector: 'energy' })
    const result = resolveFeeStructure(opp, allStructures)
    expect(result.id).toBe('fs-peru')
  })

  it('resolves to sector-scoped structure', () => {
    const opp = makeOpp({ country: 'CL', sector: 'mining' })
    const result = resolveFeeStructure(opp, allStructures)
    expect(result.id).toBe('fs-mining')
  })

  it('project-specific override takes highest priority', () => {
    const projectFs: FeeStructure = {
      id: 'fs-project-123',
      name: 'Project Override',
      isDefault: false,
      scope: { type: 'project', projectId: 'opp-123' },
      tiers: [{ label: 'Flat', minMillions: 0, maxMillions: Infinity, rate: 0.02 }],
      effectiveDate: '2025-01-01',
      notes: '',
    }
    const opp = makeOpp({
      country: 'PE', // would match Adenda Perú
      sector: 'mining', // would match mining
      feeStructureId: 'fs-project-123',
    })
    const result = resolveFeeStructure(opp, [...allStructures, projectFs])
    expect(result.id).toBe('fs-project-123')
  })

  it('country takes priority over sector', () => {
    const opp = makeOpp({ country: 'PE', sector: 'mining' })
    const result = resolveFeeStructure(opp, allStructures)
    // PE matches country-scoped Adenda Perú, even though mining also matches
    expect(result.id).toBe('fs-peru')
  })

  it('throws when no fee structure found', () => {
    const opp = makeOpp({})
    expect(() => resolveFeeStructure(opp, [])).toThrow(
      'No fee structure found',
    )
  })
})

// ── Tests: calculatePipelineFees ─────────────────

describe('calculatePipelineFees', () => {
  const structures = [DEFAULT_FEE_STRUCTURE, ADENDA_PERU]
  const profiles = [CHILE_WITHHOLDING]

  function makeOpp(overrides: Partial<Opportunity>): Opportunity {
    return {
      id: 'opp-1',
      name: 'Test',
      client: 'ACME',
      country: 'CL',
      sector: 'energy',
      clientType: 'owner',
      contractType: 'fee_success',
      stage: 'qualification',
      valueOriginal: 0,
      valueCurrency: 'USD',
      valueUSD: 0,
      aschPercentage: 1,
      aschValueUSD: 50_000_000, // 50M USD
      probabilityOfAward: 0.6,
      expectedCloseDate: '2026-06-01',
      teamingPartners: [],
      tags: [],
      notes: '',
      stageHistory: [],
      invoices: [],
      contactIds: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      ...overrides,
    }
  }

  it('excludes lost and dormant opportunities', () => {
    const opps = [
      makeOpp({ id: 'active', stage: 'qualification' }),
      makeOpp({ id: 'lost', stage: 'lost' }),
      makeOpp({ id: 'dormant', stage: 'dormant' }),
    ]
    const result = calculatePipelineFees(opps, structures, profiles)
    expect(result.byOpportunity).toHaveLength(1)
  })

  it('aggregates fees across opportunities', () => {
    const opps = [
      makeOpp({ id: 'opp-1', aschValueUSD: 50_000_000, probabilityOfAward: 1 }),
      makeOpp({ id: 'opp-2', aschValueUSD: 100_000_000, probabilityOfAward: 0.5 }),
    ]
    const result = calculatePipelineFees(opps, structures, profiles)
    expect(result.byOpportunity).toHaveLength(2)

    // opp-1: 50M → T1: 40*3%=1.2, T2: 10*2%=0.2 → 1.4M gross, 1.4M weighted
    // opp-2: 100M → T1: 1.2, T2: 0.4, T3: 0.5 → 2.1M gross, 1.05M weighted
    expect(result.totalGrossFees).toBeCloseTo(1.4 + 2.1, 4)
    expect(result.totalWeightedFees).toBeCloseTo(1.4 + 1.05, 4)
  })

  it('uses ASCH value (not full deal value) for fee calculation', () => {
    const opp = makeOpp({
      aschValueUSD: 30_000_000, // 30M ASCH portion
      probabilityOfAward: 1,
    })
    const result = calculatePipelineFees([opp], structures, profiles)
    // 30M: fully in T1 → 30 * 3% = 0.9M
    expect(result.totalGrossFees).toBeCloseTo(0.9, 6)
  })
})
