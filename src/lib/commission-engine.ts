import type {
  FeeStructure,
  Opportunity,
  WithholdingProfile,
  CommissionResult,
  TierBreakdownItem,
  WithholdingResult,
} from './types'

// ── Commission Calculation ───────────────────────
// CRITICAL: This engine NEVER hardcodes tiers.
// All tier information comes from the FeeStructure parameter.

/**
 * Calculate commission for a deal using the provided fee structure.
 * Applies tiered marginal calculation (like income tax brackets).
 *
 * @param dealMillions - Deal value in USD millions
 * @param feeStructure - The fee structure with tiers to apply
 * @param withholdingProfile - Optional withholding profile for tax scenarios
 */
export function calculateCommission(
  dealMillions: number,
  feeStructure: FeeStructure,
  withholdingProfile?: WithholdingProfile,
): CommissionResult {
  if (dealMillions < 0) {
    throw new Error('Deal value cannot be negative')
  }

  const tiers = [...feeStructure.tiers].sort((a, b) => a.minMillions - b.minMillions)
  const tierBreakdown: TierBreakdownItem[] = []
  let grossFee = 0

  for (const tier of tiers) {
    const max = tier.maxMillions === Infinity ? dealMillions : tier.maxMillions
    const applicableMillions = Math.max(
      0,
      Math.min(dealMillions, max) - tier.minMillions,
    )

    if (applicableMillions > 0) {
      const fee = applicableMillions * tier.rate
      grossFee += fee
      tierBreakdown.push({ tier, applicableMillions, fee })
    }
  }

  const effectiveRate = dealMillions > 0 ? grossFee / dealMillions : 0

  // Cross-verification
  const sumOfTiers = tierBreakdown.reduce((sum, item) => sum + item.fee, 0)
  const matchesGross = Math.abs(sumOfTiers - grossFee) < 0.0001

  // Withholding scenarios
  const withholding: WithholdingResult[] = withholdingProfile
    ? withholdingProfile.scenarios.map((scenario) => {
        const withholdingAmount = grossFee * scenario.rate
        return {
          scenario,
          grossFee,
          withholdingAmount,
          netFee: grossFee - withholdingAmount,
        }
      })
    : []

  return {
    dealMillions,
    grossFee,
    effectiveRate,
    tierBreakdown,
    withholding,
    verification: { sumOfTiers, matchesGross },
  }
}

// ── Fee Structure Resolution ─────────────────────
// Priority: project-specific > country > sector > global

/**
 * Resolve which fee structure applies to an opportunity.
 * Resolution priority: project > country > sector > global default.
 */
export function resolveFeeStructure(
  opportunity: Opportunity,
  feeStructures: FeeStructure[],
): FeeStructure {
  // 1. Project-specific override
  if (opportunity.feeStructureId) {
    const projectSpecific = feeStructures.find(
      (fs) => fs.id === opportunity.feeStructureId,
    )
    if (projectSpecific) return projectSpecific
  }

  // 2. Country-scoped
  const countryMatch = feeStructures.find(
    (fs) =>
      fs.scope.type === 'country' && fs.scope.country === opportunity.country,
  )
  if (countryMatch) return countryMatch

  // 3. Sector-scoped
  const sectorMatch = feeStructures.find(
    (fs) =>
      fs.scope.type === 'sector' && fs.scope.sector === opportunity.sector,
  )
  if (sectorMatch) return sectorMatch

  // 4. Global default
  const globalDefault = feeStructures.find((fs) => fs.isDefault)
  if (globalDefault) return globalDefault

  throw new Error('No fee structure found — at least one global default is required')
}

// ── Pipeline Fees Aggregation ────────────────────

export interface PipelineFeesSummary {
  totalGrossFees: number
  totalWeightedFees: number
  byOpportunity: Array<{
    opportunity: Opportunity
    feeStructure: FeeStructure
    commission: CommissionResult
    weightedGross: number
  }>
}

/**
 * Calculate aggregate fees across a pipeline of opportunities.
 */
export function calculatePipelineFees(
  opportunities: Opportunity[],
  feeStructures: FeeStructure[],
  withholdingProfiles: WithholdingProfile[],
): PipelineFeesSummary {
  let totalGrossFees = 0
  let totalWeightedFees = 0

  const byOpportunity = opportunities
    .filter((opp) => opp.stage !== 'lost' && opp.stage !== 'dormant')
    .map((opp) => {
      const feeStructure = resolveFeeStructure(opp, feeStructures)
      const withholdingProfile = withholdingProfiles.find(
        (wp) => wp.jurisdictionCountry === opp.country,
      )

      // Use ASCH's portion of the deal in USD millions
      const dealMillions = opp.aschValueUSD / 1_000_000
      const commission = calculateCommission(
        dealMillions,
        feeStructure,
        withholdingProfile,
      )

      const weightedGross = commission.grossFee * opp.probabilityOfAward
      totalGrossFees += commission.grossFee
      totalWeightedFees += weightedGross

      return { opportunity: opp, feeStructure, commission, weightedGross }
    })

  return { totalGrossFees, totalWeightedFees, byOpportunity }
}
