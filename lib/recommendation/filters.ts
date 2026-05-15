import { isPriorityHigh } from '@/lib/recommendation/normalize-priorities'
import type { CityRecord } from '@/lib/recommendation/city-database'
import type { UserPriorities } from '@/lib/types'

export type ClimatePreference = 'warm' | 'cool' | 'neutral'

export const THRESHOLDS = {
  maxTaxRate: 15,
  maxTaxRatePortugal: 20,
  maxRentUsd: 1000,
  maxCrimeIndex: 40,
  minHealthcareIndex: 65,
  warmMinTempC: 20,
  coolMaxTempC: 14,
} as const

export type FilterMode = 'strict' | 'relaxed' | 'none'

/** Infer warm vs cool climate from lifestyle tags. */
export function resolveClimatePreference(lifestyle: string[]): ClimatePreference {
  const text = lifestyle.join(' ').toLowerCase()
  const wantsCool =
    text.includes('mountain') ||
    text.includes('🏔️') ||
    text.includes('slow life') ||
    text.includes('nature')
  const wantsWarm =
    text.includes('beach') ||
    text.includes('🏖️') ||
    text.includes('digital nomad')

  if (wantsCool && !wantsWarm) return 'cool'
  if (wantsWarm && !wantsCool) return 'warm'
  return 'neutral'
}

export function passesLowTaxFilter(city: CityRecord, mode: FilterMode): boolean {
  if (city.country === 'Portugal') return city.taxRate <= THRESHOLDS.maxTaxRatePortugal
  return city.taxRate <= THRESHOLDS.maxTaxRate
}

export function passesHousingFilter(city: CityRecord, mode: FilterMode): boolean {
  if (mode === 'relaxed') return city.monthlyRent < 1500
  return city.monthlyRent < THRESHOLDS.maxRentUsd
}

export function passesSafetyFilter(city: CityRecord, mode: FilterMode): boolean {
  if (mode === 'relaxed') return city.crimeIndex < 55
  return city.crimeIndex < THRESHOLDS.maxCrimeIndex
}

export function passesHealthcareFilter(city: CityRecord, mode: FilterMode): boolean {
  if (mode === 'relaxed') return city.healthcareIndex >= 60
  return city.healthcareIndex > THRESHOLDS.minHealthcareIndex
}

export function passesClimateFilter(
  city: CityRecord,
  climatePref: ClimatePreference,
  mode: FilterMode
): boolean {
  if (mode === 'none') return true
  if (climatePref === 'warm') return city.avgTempC >= THRESHOLDS.warmMinTempC
  if (climatePref === 'cool') return city.avgTempC <= THRESHOLDS.coolMaxTempC
  if (mode === 'relaxed') return true
  return city.avgTempC >= 16 && city.avgTempC <= 26
}

export function passesNightlifeFilter(city: CityRecord, mode: FilterMode): boolean {
  if (mode === 'relaxed' || mode === 'none') return true
  return city.nightlifeIndex >= 75 || city.nightlifeHub
}

export function passesHighPriorityFilters(
  city: CityRecord,
  priorities: UserPriorities,
  lifestyle: string[],
  mode: FilterMode
): boolean {
  if (mode === 'none') return true

  const climatePref = resolveClimatePreference(lifestyle)

  if (isPriorityHigh(priorities.tax) && !passesLowTaxFilter(city, mode)) return false
  if (isPriorityHigh(priorities.housing) && !passesHousingFilter(city, mode)) return false
  if (isPriorityHigh(priorities.safety) && !passesSafetyFilter(city, mode)) return false
  if (isPriorityHigh(priorities.health) && !passesHealthcareFilter(city, mode)) return false
  if (isPriorityHigh(priorities.climate) && !passesClimateFilter(city, climatePref, mode)) {
    return false
  }
  if (isPriorityHigh(priorities.nightlife) && !passesNightlifeFilter(city, mode)) return false

  return true
}

/** How many high-priority rules does this city satisfy (for fallback ranking). */
export function countHighPriorityMatches(
  city: CityRecord,
  priorities: UserPriorities,
  lifestyle: string[]
): number {
  const climatePref = resolveClimatePreference(lifestyle)
  let n = 0
  if (isPriorityHigh(priorities.tax) && passesLowTaxFilter(city, 'strict')) n++
  if (isPriorityHigh(priorities.housing) && passesHousingFilter(city, 'strict')) n++
  if (isPriorityHigh(priorities.safety) && passesSafetyFilter(city, 'strict')) n++
  if (isPriorityHigh(priorities.health) && passesHealthcareFilter(city, 'strict')) n++
  if (isPriorityHigh(priorities.climate) && passesClimateFilter(city, climatePref, 'strict')) n++
  if (isPriorityHigh(priorities.nightlife) && passesNightlifeFilter(city, 'strict')) n++
  return n
}
