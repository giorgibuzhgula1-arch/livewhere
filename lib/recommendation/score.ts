import {
  cityKey,
  CLIMATE_MIN_TEMP_C,
  COOL_CLIMATE_CITIES,
  HEALTHCARE_HUB_CITIES,
  HOUSING_MAX_RENT_USD,
  LOW_TAX_COUNTRIES,
  MAX_CRIME_INDEX,
  NIGHTLIFE_HUB_CITIES,
  SAFETY_MIN_INDEX,
  UNSAFE_CITIES,
} from '@/lib/recommendation/allowlists'
import { getCountryTaxRate } from '@/lib/recommendation/country-tax-rates'
import type { CandidateCity } from '@/lib/recommendation/candidates'
import type { NumbeoSnapshot } from '@/lib/recommendation/numbeo-fallback'
import { isPriorityHigh } from '@/lib/recommendation/normalize-priorities'
import type { UserPriorities } from '@/lib/types'

export type EnrichedCityData = {
  candidate: CandidateCity
  numbeo: NumbeoSnapshot
  avgTempC: number
  taxRate: number
}

export type DimensionScores = {
  tax: number
  housing: number
  climate: number
  health: number
  nightlife: number
  safety: number
}

/** Warm year-round: blocklist + verified temp floor (used when Climate is High/Max). */
export function passesClimateHighFilter(data: EnrichedCityData): boolean {
  const { candidate, avgTempC } = data
  const key = cityKey(candidate.name, candidate.country)

  if (COOL_CLIMATE_CITIES.has(key)) return false
  if (avgTempC < CLIMATE_MIN_TEMP_C) return false

  return true
}

export function passesHighPriorityFilters(
  data: EnrichedCityData,
  priorities: UserPriorities
): boolean {
  const { candidate, numbeo, taxRate } = data
  const key = cityKey(candidate.name, candidate.country)

  if (isPriorityHigh(priorities.climate) && !passesClimateHighFilter(data)) {
    return false
  }

  if (isPriorityHigh(priorities.tax)) {
    if (!LOW_TAX_COUNTRIES.has(candidate.country)) return false
    if (taxRate >= 10) return false
  }

  if (isPriorityHigh(priorities.housing)) {
    if (numbeo.monthlyRent >= HOUSING_MAX_RENT_USD) return false
  }

  if (isPriorityHigh(priorities.health)) {
    if (!HEALTHCARE_HUB_CITIES.has(key)) return false
  }

  if (isPriorityHigh(priorities.safety)) {
    if (UNSAFE_CITIES.has(key)) return false
    if (numbeo.safetyIndex < SAFETY_MIN_INDEX) return false
    if (numbeo.crimeIndex > MAX_CRIME_INDEX) return false
  }

  if (isPriorityHigh(priorities.nightlife)) {
    if (!NIGHTLIFE_HUB_CITIES.has(key) && !candidate.nightlifeHub) return false
  }

  return true
}

function scoreTax(taxRate: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - taxRate * 2.5)))
}

function scoreHousing(monthlyRent: number): number {
  if (monthlyRent <= 400) return 100
  if (monthlyRent >= 2500) return 10
  return Math.max(10, Math.min(100, Math.round(100 - ((monthlyRent - 400) / 2100) * 90)))
}

function scoreClimate(avgTempC: number, climatePriority: number): number {
  if (climatePriority >= 4) {
    if (avgTempC < CLIMATE_MIN_TEMP_C) return Math.max(0, Math.round((avgTempC / CLIMATE_MIN_TEMP_C) * 40))
    return Math.min(100, Math.round(50 + ((avgTempC - CLIMATE_MIN_TEMP_C) / 12) * 50))
  }
  if (avgTempC >= 22 && avgTempC <= 28) return 90
  if (avgTempC >= 18 && avgTempC < 22) return 75
  if (avgTempC >= 14 && avgTempC < 18) return 60
  return 50
}

function scoreHealth(candidate: CandidateCity): number {
  switch (candidate.healthcareTier) {
    case 'excellent':
      return 95
    case 'good':
      return 78
    case 'average':
      return 55
    case 'poor':
      return 30
    default:
      return 50
  }
}

function scoreNightlife(candidate: CandidateCity): number {
  const key = cityKey(candidate.name, candidate.country)
  if (NIGHTLIFE_HUB_CITIES.has(key) || candidate.nightlifeHub) return 92
  return 45
}

function scoreSafety(numbeo: NumbeoSnapshot, candidate: CandidateCity): number {
  const key = cityKey(candidate.name, candidate.country)
  if (UNSAFE_CITIES.has(key)) return 15
  return Math.max(0, Math.min(100, Math.round(numbeo.safetyIndex)))
}

export function computeDimensionScores(
  data: EnrichedCityData,
  priorities: UserPriorities
): DimensionScores {
  return {
    tax: scoreTax(data.taxRate),
    housing: scoreHousing(data.numbeo.monthlyRent),
    climate: scoreClimate(data.avgTempC, priorities.climate),
    health: scoreHealth(data.candidate),
    nightlife: scoreNightlife(data.candidate),
    safety: scoreSafety(data.numbeo, data.candidate),
  }
}

export function computeWeightedScore(
  dimensions: DimensionScores,
  priorities: UserPriorities,
  monthlySavings: number,
  salary: number
): number {
  const weights = {
    tax: priorities.tax,
    housing: priorities.housing,
    climate: priorities.climate,
    health: priorities.health,
    nightlife: priorities.nightlife,
    safety: priorities.safety,
  }

  let sum = 0
  let weightTotal = 0
  for (const k of Object.keys(weights) as (keyof typeof weights)[]) {
    const w = weights[k]
    if (w <= 0) continue
    sum += w * dimensions[k]
    weightTotal += w
  }

  const base = weightTotal > 0 ? sum / weightTotal : 50
  const affordabilityBoost = Math.max(-8, Math.min(12, (monthlySavings / Math.max(salary / 12, 1)) * 20))
  return Math.max(0, Math.min(100, Math.round(base + affordabilityBoost)))
}

export function enrichCandidate(
  candidate: CandidateCity,
  numbeo: NumbeoSnapshot,
  avgTempC: number
): EnrichedCityData {
  return {
    candidate,
    numbeo,
    avgTempC,
    taxRate: getCountryTaxRate(candidate.country),
  }
}
