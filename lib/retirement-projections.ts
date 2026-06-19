import { CityResult } from '@/lib/types'
import { visaScoreForCountry } from '@/lib/visa-data'

export type RiskLevel = 'Low' | 'Medium' | 'High'

const US_BASELINE_TAX_RATE = 22
const PROJECTION_MONTHS = 120
const ANNUAL_COL_INCREASE = 0.02

export interface TenYearProjectionResult {
  totalAccumulatedSavings: number
  averageMonthlySavings: number
  finalMonthlySavings: number
}

export interface RiskAssessmentResult {
  level: RiskLevel
  politicalStability: number
  healthcareIndex: number
  currencyRisk: number
  visaPermanence: number
}

export interface WealthPreservationResult {
  preservationScore: number
  taxDragVsUsMonthly: number
  usBaselineTaxRate: number
  destinationTaxRate: number
}

function effectiveBudget(city: CityResult, budget: number): number {
  if (budget > 0) return budget
  if (city.takeHomeMonthly > 0) return city.takeHomeMonthly
  return Math.max(city.monthlyCost, 1)
}

/** Projects 120 months of savings with 2% annual cost-of-living increases. */
export function tenYearProjection(city: CityResult, budget: number): TenYearProjectionResult {
  const takeHome = effectiveBudget(city, budget)
  let total = 0
  let finalMonthlySavings = 0

  for (let month = 0; month < PROJECTION_MONTHS; month++) {
    const yearIndex = Math.floor(month / 12)
    const colMultiplier = Math.pow(1 + ANNUAL_COL_INCREASE, yearIndex)
    const adjustedCost = city.monthlyCost * colMultiplier
    const monthlySavings = takeHome - adjustedCost
    total += monthlySavings
    if (month === PROJECTION_MONTHS - 1) {
      finalMonthlySavings = monthlySavings
    }
  }

  return {
    totalAccumulatedSavings: Math.round(total),
    averageMonthlySavings: Math.round(total / PROJECTION_MONTHS),
    finalMonthlySavings: Math.round(finalMonthlySavings),
  }
}

function scoreToRiskLevel(composite: number): RiskLevel {
  if (composite >= 75) return 'Low'
  if (composite >= 55) return 'Medium'
  return 'High'
}

/** Scores political stability, healthcare, currency risk, and visa permanence. */
export function riskAssessment(city: CityResult): RiskAssessmentResult {
  const politicalStability = city.scores.stability
  const healthcareIndex = city.scores.health
  const visaPermanence = visaScoreForCountry(city.country) ?? 52

  const stabilityGap = Math.max(0, 70 - politicalStability)
  const regionCurrencyPenalty =
    city.country === 'United States' ? 0 : city.continent === 'Americas' ? 8 : 5
  const currencyRisk = Math.round(
    Math.min(100, Math.max(0, stabilityGap * 0.6 + regionCurrencyPenalty + (100 - visaPermanence) * 0.15)),
  )

  const composite =
    (politicalStability + healthcareIndex + visaPermanence + (100 - currencyRisk)) / 4

  return {
    level: scoreToRiskLevel(composite),
    politicalStability,
    healthcareIndex,
    currencyRisk,
    visaPermanence,
  }
}

/** Compares destination tax drag to a US baseline and scores wealth preservation. */
export function wealthPreservation(city: CityResult, budget: number): WealthPreservationResult {
  const takeHome = effectiveBudget(city, budget)
  const usTaxPaidMonthly = (takeHome * US_BASELINE_TAX_RATE) / 100
  const destTaxPaidMonthly = (takeHome * city.taxRate) / 100
  const taxDragVsUsMonthly = Math.round(destTaxPaidMonthly - usTaxPaidMonthly)

  const taxAdvantage = US_BASELINE_TAX_RATE - city.taxRate
  const savingsRatio = city.monthlySavings / Math.max(takeHome, 1)
  const preservationScore = Math.round(
    Math.min(100, Math.max(0, 45 + taxAdvantage * 1.4 + savingsRatio * 120 + city.scores.stability * 0.15)),
  )

  return {
    preservationScore,
    taxDragVsUsMonthly,
    usBaselineTaxRate: US_BASELINE_TAX_RATE,
    destinationTaxRate: city.taxRate,
  }
}
