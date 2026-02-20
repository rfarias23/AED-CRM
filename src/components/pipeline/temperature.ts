import { differenceInDays } from 'date-fns'
import type { Temperature, Opportunity, IntensityThresholds } from '@/lib/types'

/**
 * Default thresholds — used until IntensityConfig is loaded from Dexie.
 * Must match DEFAULT_INTENSITY_CONFIG from intensity-benchmarks.ts.
 */
const DEFAULT_THRESHOLDS: IntensityThresholds = {
  hotDays: 14,
  warmDays: 30,
  coolDays: 60,
  coldDays: 90,
}

/**
 * Compute temperature for an opportunity based on days since last touchpoint.
 * Currently uses `updatedAt` as proxy; Sprint 4 intensity engine will
 * replace this with actual interaction-based calculations.
 */
export function getTemperature(
  opportunity: Opportunity,
  thresholds: IntensityThresholds = DEFAULT_THRESHOLDS,
): Temperature {
  // Won / lost / dormant stages have fixed temperatures
  if (opportunity.stage === 'won' || opportunity.stage === 'lost') return 'cold'
  if (opportunity.stage === 'dormant') return 'dormant'

  const daysSince = differenceInDays(new Date(), new Date(opportunity.updatedAt))

  if (daysSince <= thresholds.hotDays) return 'hot'
  if (daysSince <= thresholds.warmDays) return 'warm'
  if (daysSince <= thresholds.coolDays) return 'cool'
  if (daysSince <= thresholds.coldDays) return 'cold'
  return 'dormant'
}
