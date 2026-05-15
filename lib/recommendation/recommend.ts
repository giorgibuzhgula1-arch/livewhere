import { buildCityResult } from '@/lib/recommendation/build-result'
import { getCityDatabase, type CityRecord } from '@/lib/recommendation/city-database'
import {
  countHighPriorityMatches,
  passesHighPriorityFilters,
  type FilterMode,
} from '@/lib/recommendation/filters'
import { normalizePriorities } from '@/lib/recommendation/normalize-priorities'
import { computeDimensionScores, computeWeightedScore } from '@/lib/recommendation/scoring'
import type { AnalyzeRequest, CityResult } from '@/lib/types'

export const RESULT_COUNT = 3

const FILTER_LADDER: FilterMode[] = ['strict', 'relaxed', 'none']

type ScoredCity = { city: CityRecord; score: number }

function scoreCity(city: CityRecord, request: AnalyzeRequest): number {
  const dimensions = computeDimensionScores(city, request.priorities, request.lifestyle)
  const takeHomeMonthly = Math.round(
    (request.salary * (1 - city.taxRate / 100)) / 12
  )
  const monthlySavings = takeHomeMonthly - city.monthlyCost
  return computeWeightedScore(
    dimensions,
    request.priorities,
    monthlySavings,
    request.salary
  )
}

function rankCities(cities: CityRecord[], request: AnalyzeRequest): ScoredCity[] {
  return cities
    .map((city) => ({ city, score: scoreCity(city, request) }))
    .sort((a, b) => b.score - a.score)
}

function selectPool(
  all: CityRecord[],
  request: AnalyzeRequest
): CityRecord[] {
  const { priorities, lifestyle } = request

  for (const mode of FILTER_LADDER) {
    const filtered = all.filter((city) =>
      passesHighPriorityFilters(city, priorities, lifestyle, mode)
    )
    if (filtered.length >= RESULT_COUNT) return filtered
  }

  return all
}

function pickTopThree(pool: CityRecord[], all: CityRecord[], request: AnalyzeRequest): CityRecord[] {
  const ranked = rankCities(pool, request)
  const picked: CityRecord[] = []
  const seen = new Set<string>()

  for (const { city } of ranked) {
    const key = `${city.name}|${city.country}`
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(city)
    if (picked.length >= RESULT_COUNT) break
  }

  if (picked.length >= RESULT_COUNT) return picked

  const byMatches = [...all]
    .map((city) => ({
      city,
      matches: countHighPriorityMatches(city, request.priorities, request.lifestyle),
      score: scoreCity(city, request),
    }))
    .sort((a, b) => b.matches - a.matches || b.score - a.score)

  for (const { city } of byMatches) {
    const key = `${city.name}|${city.country}`
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(city)
    if (picked.length >= RESULT_COUNT) break
  }

  return picked.slice(0, RESULT_COUNT)
}

export async function recommendCities(body: AnalyzeRequest): Promise<CityResult[]> {
  const priorities = normalizePriorities(body.priorities)
  const request: AnalyzeRequest = { ...body, priorities }

  const all = getCityDatabase()
  const pool = selectPool(all, request)
  const top = pickTopThree(pool, all, request)

  return top.map((city, idx) => buildCityResult(city, request, idx + 1))
}
