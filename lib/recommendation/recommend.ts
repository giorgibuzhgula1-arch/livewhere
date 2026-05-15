import { CANDIDATE_CITIES, type CandidateCity } from '@/lib/recommendation/candidates'
import { buildCityResult } from '@/lib/recommendation/build-result'
import { normalizePriorities } from '@/lib/recommendation/normalize-priorities'
import { NUMBEO_FALLBACK } from '@/lib/recommendation/numbeo-fallback'
import { enrichCandidate, type EnrichedCityData } from '@/lib/recommendation/score'
import { getStaticMeanTempC } from '@/lib/recommendation/weather'
import type { AnalyzeRequest, CityResult } from '@/lib/types'

/** Always return this many cities, ranked by weighted score (no hard filters). */
export const RESULT_COUNT = 3

function fallbackNumbeo(candidate: CandidateCity) {
  return (
    NUMBEO_FALLBACK[candidate.numbeoQuery] ??
    NUMBEO_FALLBACK[candidate.name] ?? {
      monthlyRent: 900,
      monthlyCost: 1700,
      safetyIndex: 55,
      crimeIndex: 45,
    }
  )
}

function enrichCandidateFast(candidate: CandidateCity): EnrichedCityData {
  return enrichCandidate(
    candidate,
    fallbackNumbeo(candidate),
    getStaticMeanTempC(candidate.name)
  )
}

function enrichAllCandidatesFast(): EnrichedCityData[] {
  return CANDIDATE_CITIES.map(enrichCandidateFast)
}

function pickTopByScore(
  enriched: EnrichedCityData[],
  request: AnalyzeRequest,
  count: number
): EnrichedCityData[] {
  const ranked = [...enriched].sort(
    (a, b) => buildCityResult(b, request, 1).score - buildCityResult(a, request, 1).score
  )

  const picked: EnrichedCityData[] = []
  const seen = new Set<string>()

  for (const data of ranked) {
    const key = `${data.candidate.name}|${data.candidate.country}`
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(data)
    if (picked.length >= count) break
  }

  let i = 0
  while (picked.length < count && i < CANDIDATE_CITIES.length * 2) {
    const candidate = CANDIDATE_CITIES[i % CANDIDATE_CITIES.length]
    const key = `${candidate.name}|${candidate.country}`
    i++
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(enrichCandidateFast(candidate))
  }

  return picked.slice(0, count)
}

export async function recommendCities(body: AnalyzeRequest): Promise<CityResult[]> {
  const priorities = normalizePriorities(body.priorities)
  const request: AnalyzeRequest = { ...body, priorities }

  const enriched = enrichAllCandidatesFast()
  const top = pickTopByScore(enriched, request, RESULT_COUNT)

  return top.map((data, idx) => buildCityResult(data, request, idx + 1))
}
