import type {
  Temperature,
  IntensityConfig,
  QuarterPlan,
} from './types'

/**
 * Calculate temperature from days since last touchpoint.
 * PRD §2.6: hot ≤14d, warm 15-30d, cool 31-60d, cold 61-90d, dormant >90d
 */
export function calculateOpportunityTemperature(
  daysSinceLastTouchpoint: number,
  config: IntensityConfig,
): Temperature {
  const t = config.thresholds
  if (daysSinceLastTouchpoint <= t.hotDays) return 'hot'
  if (daysSinceLastTouchpoint <= t.warmDays) return 'warm'
  if (daysSinceLastTouchpoint <= t.coolDays) return 'cool'
  if (daysSinceLastTouchpoint <= t.coldDays) return 'cold'
  return 'dormant'
}

/**
 * Calculate opportunity intensity score (0-100).
 * Weighted composite of frequency, recency, quality, and diversity.
 */
export function calculateOpportunityIntensityScore(
  touchpoints: number,
  expectedTouchpoints: number,
  daysSinceLastTouchpoint: number,
  highQualityPct: number,
  config: IntensityConfig,
): number {
  const w = config.weights

  // Frequency score: actual / expected, capped at 1.0
  const frequencyScore = expectedTouchpoints > 0
    ? Math.min(touchpoints / expectedTouchpoints, 1.0)
    : 0

  // Recency score: inverse of days, normalized against hot threshold
  const recencyScore = daysSinceLastTouchpoint <= 0
    ? 1.0
    : Math.max(0, 1 - daysSinceLastTouchpoint / (config.thresholds.coldDays * 1.5))

  // High quality ratio score
  const qualityScore = Math.min(highQualityPct / config.benchmarks.highQualityPctTarget, 1.0)

  // Diversity score: placeholder — use frequency as proxy (unique types / total)
  const diversityScore = frequencyScore * 0.8

  const raw =
    frequencyScore * w.touchpointFrequency +
    recencyScore * w.recency +
    qualityScore * w.highQualityRatio +
    diversityScore * w.diversity

  return Math.round(Math.max(0, Math.min(100, raw * 100)))
}

/**
 * Calculate required weekly intensity to meet quarter plan targets.
 * Inverse calculation: what weekly rate is needed given weeks remaining.
 */
export function calculateRequiredIntensity(
  quarterPlan: QuarterPlan,
  _config: IntensityConfig,
  weeksRemaining: number,
): {
  interactionsPerWeek: number
  meetingsPerWeek: number
  newContactsPerWeek: number
} {
  if (weeksRemaining <= 0) {
    return {
      interactionsPerWeek: 0,
      meetingsPerWeek: 0,
      newContactsPerWeek: 0,
    }
  }

  // Use plan targets and distribute evenly across remaining weeks
  const totalInteractions = quarterPlan.targetInteractionsPerWeek * 13 // 13 weeks per quarter
  const totalMeetings = quarterPlan.targetMeetingsPerWeek * 13
  const totalContacts = quarterPlan.targetNewContacts

  return {
    interactionsPerWeek: Math.ceil(totalInteractions / weeksRemaining),
    meetingsPerWeek: Math.ceil(totalMeetings / weeksRemaining),
    newContactsPerWeek: Math.ceil(totalContacts / weeksRemaining),
  }
}

/**
 * Assess pipeline health based on activity metrics.
 * Returns a health grade: 'healthy' | 'attention' | 'critical'
 */
export function assessPipelineHealth(
  actualWeekly: number,
  requiredWeekly: number,
  hotOpps: number,
  totalActiveOpps: number,
): 'healthy' | 'attention' | 'critical' {
  const activityRatio = requiredWeekly > 0 ? actualWeekly / requiredWeekly : 1
  const hotRatio = totalActiveOpps > 0 ? hotOpps / totalActiveOpps : 0

  if (activityRatio >= 0.8 && hotRatio >= 0.4) return 'healthy'
  if (activityRatio >= 0.5 || hotRatio >= 0.2) return 'attention'
  return 'critical'
}

/**
 * Auto-calibrate config based on historical data.
 * Requires at least 3 closed deals to produce meaningful benchmarks.
 */
export function calibrateConfig(
  currentConfig: IntensityConfig,
  historicalData: {
    totalInteractions: number
    totalMeetings: number
    totalNewContacts: number
    totalWeeks: number
    highQualityPct: number
    closedDeals: number
  },
): IntensityConfig | null {
  if (historicalData.closedDeals < 3) return null // Not enough data

  const weeks = Math.max(historicalData.totalWeeks, 1)

  return {
    ...currentConfig,
    benchmarks: {
      interactionsPerWeek: Math.round(historicalData.totalInteractions / weeks),
      meetingsPerWeek: Math.round(historicalData.totalMeetings / weeks),
      newContactsPerWeek: Math.max(1, Math.round(historicalData.totalNewContacts / weeks)),
      highQualityPctTarget: Math.max(0.2, Math.min(0.8, historicalData.highQualityPct)),
      touchpointsPerActiveOpp: currentConfig.benchmarks.touchpointsPerActiveOpp,
    },
    autoCalibrate: true,
    lastCalibratedAt: new Date().toISOString(),
  }
}
