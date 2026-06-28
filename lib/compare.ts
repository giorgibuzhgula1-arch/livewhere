import { CITIES, type CityRow } from '@/lib/recommendation/index'
import {
  computeAppliedWeights,
  computeSubScores,
  estimatedMonthlyCost,
  type ScoreFactorKey,
} from '@/lib/recommendation/scoreCity'
import type { UserPriorities } from '@/lib/types'

/** Reference budget for neutral retirement scores on the compare page. */
export const COMPARE_REFERENCE_BUDGET = 4000

const DEFAULT_PRIORITIES: UserPriorities = {
  tax: 3,
  housing: 3,
  climate: 3,
  health: 3,
  stability: 3,
  safety: 3,
  expat_community: 3,
  visa_residency: 3,
}

export interface CityCompareMetrics {
  city: CityRow
  monthlyCostOfLiving: number
  monthlyRent: number
  healthcareScore: number
  safetyScore: number
  taxScore: number
  climateScore: number
  airportScore: number
  internetScore: number
  walkabilityScore: number
  expatCommunityScore: number
  visaAccessScore: number
  overallRetirementScore: number
}

export function cityRowKey(city: CityRow): string {
  return `${city.name}|${city.country}`
}

export function cityOptionLabel(city: CityRow): string {
  return `${city.name}, ${city.country}`
}

export const SORTED_CITY_OPTIONS = [...CITIES].sort((a, b) =>
  cityOptionLabel(a).localeCompare(cityOptionLabel(b)),
)

export function findCityByKey(key: string): CityRow | undefined {
  return CITIES.find((c) => cityRowKey(c) === key)
}

/** Match by full key or city name (first exact name match if unique). */
export function findCityByQuery(query: string): CityRow | undefined {
  const trimmed = query.trim()
  if (!trimmed) return undefined

  const byKey = findCityByKey(trimmed)
  if (byKey) return byKey

  const lower = trimmed.toLowerCase()
  const matches = CITIES.filter((c) => c.name.toLowerCase() === lower)
  return matches[0]
}

function weightedOverallScore(
  subScores: ReturnType<typeof computeSubScores>,
  weights: ReturnType<typeof computeAppliedWeights>,
): number {
  const keys: ScoreFactorKey[] = [
    'budget',
    'healthcare',
    'taxes',
    'safety',
    'housing',
    'residency',
    'stability',
    'climate',
  ]
  let total = 0
  for (const key of keys) {
    total += subScores[key] * weights[key]
  }
  return Math.round((total / 100) * 10) / 10
}

export function getCityCompareMetrics(city: CityRow): CityCompareMetrics {
  const lifestyle: string[] = []
  const subScores = computeSubScores(city, COMPARE_REFERENCE_BUDGET, lifestyle)
  const weights = computeAppliedWeights(DEFAULT_PRIORITIES, lifestyle)

  return {
    city,
    monthlyCostOfLiving: estimatedMonthlyCost(city.rent_usd),
    monthlyRent: city.rent_usd,
    healthcareScore: subScores.healthcare,
    safetyScore: subScores.safety,
    taxScore: subScores.taxes,
    climateScore: subScores.climate,
    airportScore: city.airportScore,
    internetScore: city.internetScore,
    walkabilityScore: city.walkabilityScore,
    expatCommunityScore: city.expatCommunityScore,
    visaAccessScore: city.visaAccessScore,
    overallRetirementScore: weightedOverallScore(subScores, weights),
  }
}

export function compareHrefForCity(cityName: string, cityB?: string): string {
  const params = new URLSearchParams({ cityA: cityName })
  if (cityB) params.set('cityB', cityB)
  return `/compare?${params.toString()}`
}
