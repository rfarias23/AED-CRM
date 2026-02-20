import { describe, it, expect } from 'vitest'
import {
  calculateOpportunityTemperature,
  calculateOpportunityIntensityScore,
  calculateRequiredIntensity,
  assessPipelineHealth,
  calibrateConfig,
} from '../src/lib/intensity-engine'
import { DEFAULT_INTENSITY_CONFIG } from '../src/lib/intensity-benchmarks'
import type { QuarterPlan } from '../src/lib/types'

// ── Temperature tests ──────────────────────────

describe('calculateOpportunityTemperature', () => {
  const cfg = DEFAULT_INTENSITY_CONFIG

  it('returns hot for 0 days', () => {
    expect(calculateOpportunityTemperature(0, cfg)).toBe('hot')
  })

  it('returns hot for 14 days (boundary)', () => {
    expect(calculateOpportunityTemperature(14, cfg)).toBe('hot')
  })

  it('returns warm for 15 days', () => {
    expect(calculateOpportunityTemperature(15, cfg)).toBe('warm')
  })

  it('returns warm for 30 days (boundary)', () => {
    expect(calculateOpportunityTemperature(30, cfg)).toBe('warm')
  })

  it('returns cool for 31 days', () => {
    expect(calculateOpportunityTemperature(31, cfg)).toBe('cool')
  })

  it('returns cool for 60 days (boundary)', () => {
    expect(calculateOpportunityTemperature(60, cfg)).toBe('cool')
  })

  it('returns cold for 61 days', () => {
    expect(calculateOpportunityTemperature(61, cfg)).toBe('cold')
  })

  it('returns cold for 90 days (boundary)', () => {
    expect(calculateOpportunityTemperature(90, cfg)).toBe('cold')
  })

  it('returns dormant for 91 days', () => {
    expect(calculateOpportunityTemperature(91, cfg)).toBe('dormant')
  })

  it('returns dormant for 365 days', () => {
    expect(calculateOpportunityTemperature(365, cfg)).toBe('dormant')
  })
})

// ── Intensity Score tests ──────────────────────

describe('calculateOpportunityIntensityScore', () => {
  const cfg = DEFAULT_INTENSITY_CONFIG

  it('returns 0-100 range', () => {
    const score = calculateOpportunityIntensityScore(5, 10, 7, 0.5, cfg)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns higher score for more touchpoints', () => {
    const low = calculateOpportunityIntensityScore(2, 10, 7, 0.5, cfg)
    const high = calculateOpportunityIntensityScore(10, 10, 7, 0.5, cfg)
    expect(high).toBeGreaterThan(low)
  })

  it('returns higher score for more recent touchpoints', () => {
    const recent = calculateOpportunityIntensityScore(5, 10, 1, 0.5, cfg)
    const old = calculateOpportunityIntensityScore(5, 10, 80, 0.5, cfg)
    expect(recent).toBeGreaterThan(old)
  })

  it('returns higher score for higher quality ratio', () => {
    const lowQ = calculateOpportunityIntensityScore(5, 10, 7, 0.1, cfg)
    const highQ = calculateOpportunityIntensityScore(5, 10, 7, 0.8, cfg)
    expect(highQ).toBeGreaterThan(lowQ)
  })

  it('caps score at 100 for perfect metrics', () => {
    const score = calculateOpportunityIntensityScore(20, 10, 0, 1.0, cfg)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns 0 for zero touchpoints and old recency', () => {
    const score = calculateOpportunityIntensityScore(0, 10, 200, 0, cfg)
    expect(score).toBe(0)
  })
})

// ── Required Intensity tests ───────────────────

describe('calculateRequiredIntensity', () => {
  const mockPlan: QuarterPlan = {
    id: 'test',
    year: 2026,
    quarter: 1,
    status: 'active',
    targetPipelineUSD: 500,
    targetWonUSD: 100,
    targetFeesUSD: 3,
    targetNewContacts: 26,
    targetInteractionsPerWeek: 8,
    targetMeetingsPerWeek: 3,
    strategicPriorities: [],
    milestones: [],
    budgetUSD: 5000,
    notes: '',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }
  const cfg = DEFAULT_INTENSITY_CONFIG

  it('returns 0 when no weeks remaining', () => {
    const result = calculateRequiredIntensity(mockPlan, cfg, 0)
    expect(result.interactionsPerWeek).toBe(0)
    expect(result.meetingsPerWeek).toBe(0)
    expect(result.newContactsPerWeek).toBe(0)
  })

  it('distributes across remaining weeks', () => {
    const result = calculateRequiredIntensity(mockPlan, cfg, 13)
    expect(result.interactionsPerWeek).toBe(8) // 8*13/13
    expect(result.meetingsPerWeek).toBe(3)
  })

  it('increases rate when fewer weeks remain', () => {
    const full = calculateRequiredIntensity(mockPlan, cfg, 13)
    const half = calculateRequiredIntensity(mockPlan, cfg, 6)
    expect(half.interactionsPerWeek).toBeGreaterThan(full.interactionsPerWeek)
  })
})

// ── Pipeline Health tests ──────────────────────

describe('assessPipelineHealth', () => {
  it('returns healthy when activity and hot ratio are good', () => {
    expect(assessPipelineHealth(8, 10, 5, 10)).toBe('healthy')
  })

  it('returns attention when activity is moderate', () => {
    expect(assessPipelineHealth(5, 10, 1, 10)).toBe('attention')
  })

  it('returns critical when both metrics are poor', () => {
    expect(assessPipelineHealth(2, 10, 1, 10)).toBe('critical')
  })

  it('returns healthy with 0 required (no targets)', () => {
    expect(assessPipelineHealth(5, 0, 3, 5)).toBe('healthy')
  })
})

// ── Calibration tests ──────────────────────────

describe('calibrateConfig', () => {
  const cfg = DEFAULT_INTENSITY_CONFIG

  it('returns null with fewer than 3 closed deals', () => {
    const result = calibrateConfig(cfg, {
      totalInteractions: 50, totalMeetings: 20, totalNewContacts: 10,
      totalWeeks: 13, highQualityPct: 0.5, closedDeals: 2,
    })
    expect(result).toBeNull()
  })

  it('produces calibrated config with 3+ closed deals', () => {
    const result = calibrateConfig(cfg, {
      totalInteractions: 100, totalMeetings: 40, totalNewContacts: 20,
      totalWeeks: 13, highQualityPct: 0.45, closedDeals: 5,
    })
    expect(result).not.toBeNull()
    expect(result!.benchmarks.interactionsPerWeek).toBe(8) // 100/13 ≈ 7.7 → 8
    expect(result!.benchmarks.meetingsPerWeek).toBe(3) // 40/13 ≈ 3.08 → 3
    expect(result!.autoCalibrate).toBe(true)
    expect(result!.lastCalibratedAt).toBeDefined()
  })

  it('clamps highQualityPctTarget between 0.2 and 0.8', () => {
    const lowResult = calibrateConfig(cfg, {
      totalInteractions: 50, totalMeetings: 20, totalNewContacts: 10,
      totalWeeks: 13, highQualityPct: 0.1, closedDeals: 3,
    })
    expect(lowResult!.benchmarks.highQualityPctTarget).toBe(0.2)

    const highResult = calibrateConfig(cfg, {
      totalInteractions: 50, totalMeetings: 20, totalNewContacts: 10,
      totalWeeks: 13, highQualityPct: 0.95, closedDeals: 3,
    })
    expect(highResult!.benchmarks.highQualityPctTarget).toBe(0.8)
  })
})
