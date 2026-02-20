import { v4 as uuid } from 'uuid'
import type { IntensityConfig } from './types'

export const DEFAULT_INTENSITY_CONFIG: IntensityConfig = {
  id: uuid(),
  thresholds: {
    hotDays: 14,    // ≤14 days since last touchpoint
    warmDays: 30,   // 15–30 days
    coolDays: 60,   // 31–60 days
    coldDays: 90,   // 61–90 days
    // >90 = dormant
  },
  weights: {
    touchpointFrequency: 0.35,
    recency: 0.30,
    highQualityRatio: 0.20,
    diversity: 0.15,
  },
  benchmarks: {
    interactionsPerWeek: 8,
    meetingsPerWeek: 3,
    newContactsPerWeek: 2,
    highQualityPctTarget: 0.40,
    touchpointsPerActiveOpp: 2,
  },
  autoCalibrate: false,
}
