import { CANDIDATE_CITIES } from '@/lib/recommendation/candidates'
import { buildCityResult } from '@/lib/recommendation/build-result'
import { fetchNumbeoData } from '@/lib/recommendation/numbeo'
import {
  enrichCandidate,
  passesHighPriorityFilters,
  type EnrichedCityData,
} from '@/lib/recommendation/score'
import { fetchAnnualMeanTempC } from '@/lib/recommendation/weather'
import type { AnalyzeRequest, CityResult } from '@/lib/types'

const RESULT_LIMIT = 12
const FETCH_CONCURRENCY = 6

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

async function enrichAllCandidates(): Promise<EnrichedCityData[]> {
  return mapPool(CANDIDATE_CITIES, FETCH_CONCURRENCY, async (candidate) => {
    const [numbeo, avgTempC] = await Promise.all([
      fetchNumbeoData(candidate.numbeoQuery),
      fetchAnnualMeanTempC(candidate.lat, candidate.lon, candidate.name),
    ])
    return enrichCandidate(candidate, numbeo, avgTempC)
  })
}

export async function recommendCities(body: AnalyzeRequest): Promise<CityResult[]> {
  const enriched = await enrichAllCandidates()

  const hasHighPriority = Object.values(body.priorities).some((p) => p >= 4)
  const strictMatches = enriched.filter((data) =>
    passesHighPriorityFilters(data, body.priorities)
  )

  if (hasHighPriority && strictMatches.length === 0) {
    return []
  }

  const pool = hasHighPriority ? strictMatches : enriched

  const sorted = [...pool].sort((a, b) => {
    const scoreA = buildCityResult(a, body, 1).score
    const scoreB = buildCityResult(b, body, 1).score
    return scoreB - scoreA
  })

  return sorted.slice(0, RESULT_LIMIT).map((data, idx) => buildCityResult(data, body, idx + 1))
}
