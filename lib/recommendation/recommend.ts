import { CANDIDATE_CITIES } from '@/lib/recommendation/candidates'
import { buildCityResult } from '@/lib/recommendation/build-result'
import { fetchNumbeoData } from '@/lib/recommendation/numbeo'
import { NUMBEO_FALLBACK } from '@/lib/recommendation/numbeo-fallback'
import {
  isPriorityHigh,
  normalizePriorities,
} from '@/lib/recommendation/normalize-priorities'
import {
  enrichCandidate,
  passesClimateHighFilter,
  passesHighPriorityFilters,
  type EnrichedCityData,
} from '@/lib/recommendation/score'
import { fetchAnnualMeanTempC } from '@/lib/recommendation/weather'
import type { AnalyzeRequest, CityResult, UserPriorities } from '@/lib/types'

const RESULT_LIMIT = 12
const FETCH_CONCURRENCY = 6
const NUMBEO_TIMEOUT_MS = 4000

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const i = nextIndex++
      if (i >= items.length) break
      results[i] = await fn(items[i], i)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  )
  return results
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ])
}

async function loadNumbeo(query: string, cityName: string) {
  try {
    return await withTimeout(fetchNumbeoData(query), NUMBEO_TIMEOUT_MS)
  } catch {
    return (
      NUMBEO_FALLBACK[query] ??
      NUMBEO_FALLBACK[cityName] ?? {
        monthlyRent: 900,
        monthlyCost: 1700,
        safetyIndex: 55,
        crimeIndex: 45,
      }
    )
  }
}

async function enrichAllCandidates(): Promise<EnrichedCityData[]> {
  return mapPool(CANDIDATE_CITIES, FETCH_CONCURRENCY, async (candidate) => {
    const [numbeo, avgTempC] = await Promise.all([
      loadNumbeo(candidate.numbeoQuery, candidate.name),
      fetchAnnualMeanTempC(candidate.lat, candidate.lon, candidate.name),
    ])
    return enrichCandidate(candidate, numbeo, avgTempC)
  })
}

function filterEligibleCities(
  enriched: EnrichedCityData[],
  priorities: ReturnType<typeof normalizePriorities>
): EnrichedCityData[] {
  return enriched.filter((data) => {
    if (isPriorityHigh(priorities.climate) && !passesClimateHighFilter(data)) {
      return false
    }
    return passesHighPriorityFilters(data, priorities)
  })
}

function hasAnyHighPriority(priorities: ReturnType<typeof normalizePriorities>): boolean {
  return Object.values(priorities).some((p) => isPriorityHigh(p))
}

export async function recommendCities(body: AnalyzeRequest): Promise<CityResult[]> {
  const priorities = normalizePriorities(body.priorities)
  const enriched = await enrichAllCandidates()

  const eligible = filterEligibleCities(enriched, priorities)

  if (hasAnyHighPriority(priorities) && eligible.length === 0) {
    return []
  }

  const pool = hasAnyHighPriority(priorities) ? eligible : enriched

  const sorted = [...pool].sort((a, b) => {
    const scoreA = buildCityResult(a, { ...body, priorities }, 1).score
    const scoreB = buildCityResult(b, { ...body, priorities }, 1).score
    return scoreB - scoreA
  })

  return sorted
    .slice(0, RESULT_LIMIT)
    .map((data, idx) => buildCityResult(data, { ...body, priorities }, idx + 1))
}

/** Final safety net before sending to client. */
export function excludeColdCitiesForClimatePriority(
  cities: CityResult[],
  priorities: UserPriorities
): CityResult[] {
  const p = normalizePriorities(priorities)
  if (!isPriorityHigh(p.climate)) return cities

  const coolNames = new Set(
    [
      'Tbilisi',
      'Yerevan',
      'Kyiv',
      'Belgrade',
      'Budapest',
      'Bucharest',
      'Sofia',
      'Prague',
      'Warsaw',
      'Berlin',
      'Paris',
      'London',
      'Amsterdam',
      'Vienna',
    ].map((n) => n.toLowerCase())
  )

  return cities.filter((c) => !coolNames.has(c.name.toLowerCase()))
}
