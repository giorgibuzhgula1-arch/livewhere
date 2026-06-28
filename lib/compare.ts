import { CITIES, type CityRow } from '@/lib/recommendation/index'
import {
  COMPARE_DATA_BY_KEY,
  COMPARE_DATA_BY_NAME,
  type CompareCityRecord,
} from '@/data/compareData'

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

function compareRecordForCity(city: CityRow): CompareCityRecord | undefined {
  return COMPARE_DATA_BY_KEY[cityRowKey(city)] ?? COMPARE_DATA_BY_NAME[city.name.toLowerCase()]
}

export function getCityCompareMetrics(city: CityRow): CityCompareMetrics {
  const record = compareRecordForCity(city)
  if (!record) {
    throw new Error(`Missing compare data for ${city.name}, ${city.country}`)
  }

  return {
    city,
    monthlyCostOfLiving: record.monthlyCostOfLiving,
    monthlyRent: record.monthlyRent,
    healthcareScore: record.healthcareScore,
    safetyScore: record.safetyScore,
    taxScore: record.taxScore,
    climateScore: record.climateScore,
    airportScore: record.airportScore,
    internetScore: record.internetScore,
    walkabilityScore: record.walkabilityScore,
    expatCommunityScore: record.expatCommunityScore,
    visaAccessScore: record.visaAccessScore,
    overallRetirementScore: record.overallRetirementScore,
  }
}

export function compareHrefForCity(cityName: string, cityB?: string): string {
  const params = new URLSearchParams({ cityA: cityName })
  if (cityB) params.set('cityB', cityB)
  return `/compare?${params.toString()}`
}
