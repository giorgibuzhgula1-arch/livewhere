/**
 * Deterministic two-phase city scoring for the retirement quiz.
 *
 * Phase 1 — hard elimination filters (any failure removes the city).
 * Phase 2 — weighted 0–100 ranking on survivors only.
 */
import type { UserPriorities } from '@/lib/types'
import { visaScoreForCountry } from '@/lib/visa-data'
import type { CityRow } from '@/lib/recommendation/index'

export type { CityRow } from '@/lib/recommendation/index'

/** Monthly living cost estimate (rent + utilities, food, transport). */
export const RENT_TO_LIVING_MULTIPLIER = 1.72


export type ScoreFactorKey =
  | 'budget'
  | 'healthcare'
  | 'taxes'
  | 'safety'
  | 'housing'
  | 'residency'
  | 'stability'
  | 'climate'

export type EliminationReason =
  | 'cost_of_living'
  | 'healthcare'
  | 'safety'
  | 'very_hard_residency'

/** Residency scores below this trigger Phase 1 elimination when visa_residency slider is 4–5. */
export const VERY_HARD_RESIDENCY_THRESHOLD = 45

export interface ScoreCityUserInput {
  monthlyBudget: number
  priorities: UserPriorities
  lifestyle: string[]
}

export const WARM_CLIMATE_LIFESTYLE_TAG = 'warm_climate_year_round'
export const CLIMATE_TARGET_WARM = 27
export const CLIMATE_TARGET_DEFAULT = 18
export const CLIMATE_WEIGHT_WARM = 15
export const CLIMATE_WEIGHT_DEFAULT = 3

export function hasWarmClimateYearRound(lifestyle: string[] | undefined): boolean {
  return lifestyle?.includes(WARM_CLIMATE_LIFESTYLE_TAG) ?? false
}

export function climateTargetTemp(lifestyle: string[] | undefined): number {
  return hasWarmClimateYearRound(lifestyle) ? CLIMATE_TARGET_WARM : CLIMATE_TARGET_DEFAULT
}

export function climateWeightPercent(lifestyle: string[] | undefined): number {
  return hasWarmClimateYearRound(lifestyle) ? CLIMATE_WEIGHT_WARM : CLIMATE_WEIGHT_DEFAULT
}

export interface FactorSubScores {
  budget: number
  healthcare: number
  taxes: number
  safety: number
  housing: number
  residency: number
  stability: number
  climate: number
  /** Informational only — excluded from weighted ranking (0% base weight). */
  expat: number
}

export interface AppliedWeights {
  budget: number
  healthcare: number
  taxes: number
  safety: number
  housing: number
  residency: number
  stability: number
  climate: number
}

export interface ScoreCityResult {
  city: CityRow
  eliminated: boolean
  eliminationReasons: EliminationReason[]
  costOfLiving: number
  healthcareScore: number
  safetyScore: number
  residencyScore: number
  veryHardResidency: boolean
  subScores: FactorSubScores | null
  appliedWeights: AppliedWeights | null
  /** Final weighted score 0–100; null when eliminated in Phase 1. */
  score: number | null
}

const BASE_WEIGHTS: Record<ScoreFactorKey, number> = {
  budget: 30,
  healthcare: 22,
  taxes: 5,
  safety: 14,
  housing: 8,
  residency: 2,
  stability: 18,
  climate: CLIMATE_WEIGHT_DEFAULT,
}

type AdjustableWeightKey = Exclude<ScoreFactorKey, 'budget' | 'climate'>

const ADJUSTABLE_BASE_WEIGHTS: Record<AdjustableWeightKey, number> = {
  healthcare: BASE_WEIGHTS.healthcare,
  taxes: BASE_WEIGHTS.taxes,
  safety: BASE_WEIGHTS.safety,
  housing: BASE_WEIGHTS.housing,
  residency: BASE_WEIGHTS.residency,
  stability: BASE_WEIGHTS.stability,
}

/**
 * Fallback visa scores (0–100) for countries absent from visa-data.ts.
 * Higher = easier long-stay / retirement path for a typical Western passport holder.
 */
const FALLBACK_VISA_SCORE: Partial<Record<string, number>> = {
  Argentina: 68,
  Armenia: 72,
  Australia: 48,
  Austria: 54,
  Azerbaijan: 58,
  Bahrain: 55,
  Belgium: 52,
  Bolivia: 65,
  Brazil: 58,
  Bulgaria: 62,
  Canada: 45,
  Chile: 60,
  China: 32,
  'Costa Rica': 70,
  Croatia: 64,
  Cuba: 40,
  Cyprus: 66,
  'Czech Republic': 58,
  Denmark: 50,
  'Dominican Republic': 68,
  Ecuador: 72,
  Egypt: 50,
  'El Salvador': 62,
  Ethiopia: 48,
  Finland: 52,
  France: 55,
  Germany: 52,
  Greece: 60,
  Guatemala: 65,
  Honduras: 58,
  'Hong Kong': 42,
  Hungary: 60,
  Iceland: 50,
  Indonesia: 62,
  Ireland: 54,
  Israel: 48,
  Italy: 58,
  Jamaica: 60,
  Japan: 36,
  Jordan: 55,
  Kazakhstan: 55,
  Kenya: 52,
  Kuwait: 45,
  Latvia: 60,
  Lebanon: 38,
  Lithuania: 62,
  Luxembourg: 50,
  Macau: 40,
  Malaysia: 68,
  Mongolia: 55,
  Morocco: 58,
  Nepal: 50,
  Netherlands: 52,
  'New Zealand': 50,
  Nicaragua: 66,
  Nigeria: 42,
  Norway: 48,
  Oman: 55,
  Panama: 72,
  Paraguay: 70,
  Peru: 62,
  Philippines: 58,
  Poland: 58,
  'Puerto Rico': 75,
  Qatar: 48,
  Romania: 62,
  Russia: 28,
  'Saudi Arabia': 42,
  Serbia: 62,
  Singapore: 45,
  Slovenia: 62,
  'South Africa': 55,
  'South Korea': 42,
  'Sri Lanka': 58,
  Sweden: 52,
  Switzerland: 44,
  Taiwan: 50,
  Tanzania: 52,
  Tunisia: 55,
  Ukraine: 38,
  'United Kingdom': 40,
  'United States': 38,
  Uruguay: 72,
  Uzbekistan: 55,
  Vietnam: 62,
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function normPriority(p: unknown): number {
  const n = typeof p === 'number' ? p : Number(p)
  if (!Number.isFinite(n)) return 3
  return clamp(Math.round(n), 1, 5)
}

export function estimatedMonthlyCost(rentUsd: number): number {
  return Math.round(rentUsd * RENT_TO_LIVING_MULTIPLIER)
}

export function effectiveVisaScore(country: string): number {
  return visaScoreForCountry(country) ?? FALLBACK_VISA_SCORE[country] ?? 52
}

export function isVeryHardResidency(country: string): boolean {
  return effectiveVisaScore(country) < VERY_HARD_RESIDENCY_THRESHOLD
}

/**
 * Normalization formulas (each returns 0–100):
 *
 * budget — 100 at or below budget; linear decay to 0 at budget × 1.25 ceiling.
 * healthcare — city.healthcare (0–10) × 10.
 * taxes — 100 − tax_rate × 2.5 (0% tax → 100; 40%+ → 0).
 * safety — city.safety (0–10) × 10.
 * housing — 100 when rent ≤ 20% of budget; linear to 0 when rent ≥ 60% of budget.
 * residency — city.visaAccessScore (0–100).
 * climate — 100 at ideal °C (27 if warm_climate_year_round lifestyle tag, else 18); −4 pts/°C deviation.
 * stability — city.stability_score (World Bank WGI political stability percentile, 0–100).
 * expat — city.expatCommunityScore (0–100).
 */
export function computeSubScores(
  city: CityRow,
  monthlyBudget: number,
  lifestyle: string[],
): FactorSubScores {
  const budget = Math.max(monthlyBudget, 1)
  const cost = estimatedMonthlyCost(city.rent_usd)
  const ceiling = budget * 1.25

  let budgetScore: number
  if (cost <= budget) {
    budgetScore = 100
  } else if (cost >= ceiling) {
    budgetScore = 0
  } else {
    budgetScore = clamp(100 * (1 - (cost - budget) / (ceiling - budget)), 0, 100)
  }

  const rentShareLow = budget * 0.2
  const rentShareHigh = budget * 0.6
  let housingScore: number
  if (city.rent_usd <= rentShareLow) {
    housingScore = 100
  } else if (city.rent_usd >= rentShareHigh) {
    housingScore = 0
  } else {
    housingScore = clamp(
      100 * (1 - (city.rent_usd - rentShareLow) / (rentShareHigh - rentShareLow)),
      0,
      100,
    )
  }

  const targetTemp = climateTargetTemp(lifestyle)
  const climateScore = clamp(100 - Math.abs(city.avg_temp - targetTemp) * 4, 0, 100)

  const expatScore = city.expatCommunityScore

  return {
    budget: Math.round(budgetScore),
    healthcare: clamp(city.healthcare * 10, 0, 100),
    taxes: clamp(Math.round(100 - city.tax_rate * 2.5), 0, 100),
    safety: clamp(city.safety * 10, 0, 100),
    housing: Math.round(housingScore),
    residency: Math.round(clamp(city.visaAccessScore, 0, 100)),
    stability: clamp(city.stability_score, 0, 100),
    climate: Math.round(climateScore),
    expat: Math.round(clamp(expatScore, 0, 100)),
  }
}

function sliderMultiplier(slider: number): number {
  return 0.6 + (slider / 5) * 0.8
}

export function computeAppliedWeights(
  priorities: UserPriorities,
  lifestyle: string[],
): AppliedWeights {
  const budgetWeight = BASE_WEIGHTS.budget
  const climateWeight = climateWeightPercent(lifestyle)
  const remaining = 100 - budgetWeight - climateWeight

  const raw: Record<AdjustableWeightKey, number> = {
    healthcare: ADJUSTABLE_BASE_WEIGHTS.healthcare * sliderMultiplier(normPriority(priorities.health)),
    taxes: ADJUSTABLE_BASE_WEIGHTS.taxes * sliderMultiplier(normPriority(priorities.tax)),
    safety: ADJUSTABLE_BASE_WEIGHTS.safety * sliderMultiplier(normPriority(priorities.safety)),
    housing: ADJUSTABLE_BASE_WEIGHTS.housing * sliderMultiplier(normPriority(priorities.housing)),
    residency: ADJUSTABLE_BASE_WEIGHTS.residency * sliderMultiplier(normPriority(priorities.visa_residency)),
    stability: ADJUSTABLE_BASE_WEIGHTS.stability * sliderMultiplier(normPriority(priorities.stability)),
  }

  const adjustableSum = Object.values(raw).reduce((a, b) => a + b, 0)
  const scale = remaining / adjustableSum

  return {
    budget: budgetWeight,
    healthcare: raw.healthcare * scale,
    taxes: raw.taxes * scale,
    safety: raw.safety * scale,
    housing: raw.housing * scale,
    residency: raw.residency * scale,
    stability: raw.stability * scale,
    climate: climateWeight,
  }
}

function weightedTotal(subScores: FactorSubScores, weights: AppliedWeights): number {
  const keys = Object.keys(BASE_WEIGHTS) as ScoreFactorKey[]
  let total = 0
  for (const key of keys) {
    total += subScores[key] * weights[key]
  }
  return total / 100
}

export function scoreCity(city: CityRow, userInput: ScoreCityUserInput): ScoreCityResult {
  const { monthlyBudget, priorities, lifestyle } = userInput
  const budget = Math.max(monthlyBudget, 1)
  const costOfLiving = estimatedMonthlyCost(city.rent_usd)
  const healthcareScore = city.healthcare * 10
  const safetyScore = city.safety * 10
  const residencyScore = city.visaAccessScore
  const veryHardResidency = residencyScore < VERY_HARD_RESIDENCY_THRESHOLD

  const eliminationReasons: EliminationReason[] = []

  if (costOfLiving > budget * 1.25) {
    eliminationReasons.push('cost_of_living')
  }
  if (healthcareScore < 50) {
    eliminationReasons.push('healthcare')
  }
  if (safetyScore < 40) {
    eliminationReasons.push('safety')
  }

  const residencyPriority = normPriority(priorities.visa_residency)
  if (residencyPriority >= 4 && veryHardResidency) {
    eliminationReasons.push('very_hard_residency')
  }

  if (eliminationReasons.length > 0) {
    return {
      city,
      eliminated: true,
      eliminationReasons,
      costOfLiving,
      healthcareScore,
      safetyScore,
      residencyScore,
      veryHardResidency,
      subScores: null,
      appliedWeights: null,
      score: null,
    }
  }

  const subScores = computeSubScores(city, budget, lifestyle)
  const appliedWeights = computeAppliedWeights(priorities, lifestyle)
  const score = Math.round(weightedTotal(subScores, appliedWeights) * 10) / 10

  return {
    city,
    eliminated: false,
    eliminationReasons: [],
    costOfLiving,
    healthcareScore,
    safetyScore,
    residencyScore,
    veryHardResidency,
    subScores,
    appliedWeights,
    score,
  }
}

export function rankCities(cities: CityRow[], userInput: ScoreCityUserInput): ScoreCityResult[] {
  return cities
    .map((city) => scoreCity(city, userInput))
    .sort((a, b) => {
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1
      return (b.score ?? -1) - (a.score ?? -1)
    })
}
