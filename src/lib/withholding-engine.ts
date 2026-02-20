import type { WithholdingProfile, WithholdingResult } from './types'

/**
 * Resolve the withholding profile for a given jurisdiction country.
 * Returns undefined if no profile exists for that jurisdiction.
 */
export function resolveWithholdingProfile(
  jurisdictionCountry: string,
  profiles: WithholdingProfile[],
): WithholdingProfile | undefined {
  return profiles.find(
    (p) => p.jurisdictionCountry === jurisdictionCountry,
  )
}

/**
 * Calculate withholding for all scenarios in a profile.
 * Returns an array of results, one per scenario.
 */
export function calculateWithholding(
  grossFee: number,
  profile: WithholdingProfile,
): WithholdingResult[] {
  return profile.scenarios.map((scenario) => ({
    scenario,
    grossFee,
    withholdingAmount: grossFee * scenario.rate,
    netFee: grossFee * (1 - scenario.rate),
  }))
}

/**
 * Get the default withholding scenario for a profile.
 * Falls back to the first scenario if none is marked default.
 */
export function getDefaultScenario(profile: WithholdingProfile) {
  return (
    profile.scenarios.find((s) => s.isDefault) ?? profile.scenarios[0]
  )
}

/**
 * Calculate net fee using the default withholding scenario.
 */
export function calculateDefaultNetFee(
  grossFee: number,
  profile: WithholdingProfile,
): number {
  const scenario = getDefaultScenario(profile)
  return grossFee * (1 - scenario.rate)
}
