import { resolveClimatePreference } from '@/lib/recommendation/filters'
import type { CityRecord } from '@/lib/recommendation/city-database'
import type { UserPriorities } from '@/lib/types'

export type DimensionScores = {
  tax: number
  housing: number
  climate: number
  health: number
  nightlife: number
  safety: number
}

function scoreTax(taxRate: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - taxRate * 2.2)))
}

function scoreHousing(monthlyRent: number): number {
  if (monthlyRent <= 400) return 100
  if (monthlyRent >= 2500) return 8
  return Math.max(8, Math.min(100, Math.round(100 - ((monthlyRent - 400) / 2100) * 92)))
}

function scoreClimate(avgTempC: number, preference: ReturnType<typeof resolveClimatePreference>): number {
  if (preference === 'warm') {
    if (avgTempC >= 26) return 100
    if (avgTempC >= 20) return 70 + Math.round((avgTempC - 20) * 5)
    return Math.max(0, Math.round((avgTempC / 20) * 50))
  }
  if (preference === 'cool') {
    if (avgTempC <= 10) return 95
    if (avgTempC <= 14) return 85
    if (avgTempC <= 18) return 55
    return Math.max(0, 40 - (avgTempC - 18) * 8)
  }
  const ideal = 22
  const diff = Math.abs(avgTempC - ideal)
  return Math.max(20, Math.round(100 - diff * 6))
}

function scoreHealth(healthcareIndex: number): number {
  return Math.max(0, Math.min(100, Math.round(healthcareIndex * 1.15)))
}

function scoreNightlife(nightlifeIndex: number): number {
  return Math.max(0, Math.min(100, nightlifeIndex))
}

function scoreSafety(crimeIndex: number, safetyIndex: number): number {
  const fromCrime = Math.max(0, Math.min(100, Math.round(100 - crimeIndex * 1.4)))
  return Math.round((fromCrime + safetyIndex) / 2)
}

export function computeDimensionScores(
  city: CityRecord,
  priorities: UserPriorities,
  lifestyle: string[]
): DimensionScores {
  const climatePref = resolveClimatePreference(lifestyle)
  return {
    tax: scoreTax(city.taxRate),
    housing: scoreHousing(city.monthlyRent),
    climate: scoreClimate(city.avgTempC, climatePref),
    health: scoreHealth(city.healthcareIndex),
    nightlife: scoreNightlife(city.nightlifeIndex),
    safety: scoreSafety(city.crimeIndex, city.safetyIndex),
  }
}

export function computeWeightedScore(
  dimensions: DimensionScores,
  priorities: UserPriorities,
  monthlySavings: number,
  salary: number
): number {
  const weights: (keyof DimensionScores)[] = [
    'tax',
    'housing',
    'climate',
    'health',
    'nightlife',
    'safety',
  ]
  const priorityMap: Record<keyof DimensionScores, number> = {
    tax: priorities.tax,
    housing: priorities.housing,
    climate: priorities.climate,
    health: priorities.health,
    nightlife: priorities.nightlife,
    safety: priorities.safety,
  }

  let sum = 0
  let weightTotal = 0
  for (const k of weights) {
    const w = priorityMap[k]
    if (w <= 0) continue
    sum += w * dimensions[k]
    weightTotal += w
  }

  const base = weightTotal > 0 ? sum / weightTotal : 50
  const affordabilityBoost = Math.max(-6, Math.min(10, (monthlySavings / Math.max(salary / 12, 1)) * 15))
  return Math.max(0, Math.min(100, Math.round(base + affordabilityBoost)))
}
