/**
 * Standalone Compare Cities data enrichment via Numbeo public API.
 * Does NOT modify scoreCity.ts or the quiz/scoring engine.
 *
 * Primary:  https://www.numbeo.com/api/city_prices?api_key=free&query=[cityname]
 * Fallback: RapidAPI "Cities Cost of Living" (set RAPIDAPI_KEY)
 * Last resort: city row estimates from lib/recommendation/index.ts
 *
 * Optional env:
 *   NUMBEO_API_KEY — overrides default "free" Numbeo key
 *   RAPIDAPI_KEY   — RapidAPI key for Cities Cost of Living fallback
 *
 * Usage: npx tsx scripts/enrich-compare-data.ts
 *
 * Output: data/compareData.ts
 */
import fs from 'fs'
import path from 'path'
import { CITIES, type CityRow } from '../lib/recommendation/index'

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'compareData.ts')
const NUMBEO_BASE = 'https://www.numbeo.com/api'
const RAPIDAPI_HOST = 'cities-cost-of-living1.p.rapidapi.com'
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`
const REQUEST_DELAY_MS = 350
const COMPARE_REFERENCE_BUDGET = 4000
const NYC_CPI_AND_RENT_INDEX = 100

/** Manual query overrides when Numbeo search is ambiguous or city names differ. */
const NUMBEO_QUERY_OVERRIDES: Record<string, string> = {
  'Crete (Heraklion)|Greece': 'Heraklion, Greece',
  'Ho Chi Minh City|Vietnam': 'Ho Chi Minh City, Vietnam',
  'Playa del Carmen|Mexico': 'Playa del Carmen, Mexico',
  'Panama City|Panama': 'Panama City, Panama',
  'Santiago|Chile': 'Santiago, Chile',
  'Santiago|Dominican Republic': 'Santiago de los Caballeros, Dominican Republic',
  'San Jose|Costa Rica': 'San Jose, Costa Rica',
  'Bali|Indonesia': 'Denpasar, Indonesia',
  'Victoria|Seychelles': 'Victoria, Seychelles',
  'Luxembourg|Luxembourg': 'Luxembourg, Luxembourg',
  'Singapore|Singapore': 'Singapore, Singapore',
  'The Hague|Netherlands': 'The Hague, Netherlands',
  'Cordoba|Argentina': 'Cordoba, Argentina',
  'Valletta|Malta': 'Valletta, Malta',
  'Boquete|Panama': 'Boquete, Panama',
  'Tamarindo|Costa Rica': 'Tamarindo, Costa Rica',
  'Punta Cana|Dominican Republic': 'Punta Cana, Dominican Republic',
  'Punta del Este|Uruguay': 'Punta del Este, Uruguay',
  'Port Elizabeth|South Africa': 'Gqeberha, South Africa',
  'Johor Bahru|Malaysia': 'Johor Bahru, Malaysia',
  'Sharjah|United Arab Emirates': 'Sharjah, United Arab Emirates',
}

const RENT_ITEM_IDS = [26, 27] as const

export type CompareCityRecord = {
  key: string
  name: string
  country: string
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
  source: 'numbeo' | 'rapidapi' | 'fallback'
  numbeoCityId: number | null
  enrichedAt: string
}

type NumbeoPriceItem = {
  item_id?: number
  average_price?: number
}

type NumbeoPricesResponse = {
  error?: string
  name?: string
  currency?: string
  city_id?: number
  prices?: NumbeoPriceItem[]
}

type NumbeoIndicesResponse = {
  error?: string
  name?: string
  city_id?: number
  safety_index?: number
  health_care_index?: number
  climate_index?: number
  cpi_and_rent_index?: number
  rent_index?: number
  cpi_index?: number
}

function cityKey(city: CityRow): string {
  return `${city.name}|${city.country}`
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function indexToScore(value: number | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return clamp(Math.round(value), 0, 100)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function numbeoApiKey(): string {
  return process.env.NUMBEO_API_KEY ?? 'free'
}

function rapidApiKey(): string | undefined {
  return process.env.RAPIDAPI_KEY
}

function numbeoQuery(city: CityRow): string {
  const key = cityKey(city)
  if (NUMBEO_QUERY_OVERRIDES[key]) return NUMBEO_QUERY_OVERRIDES[key]
  const name = city.name.split('(')[0].trim()
  return `${name}, ${city.country}`
}

async function numbeoGet<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${NUMBEO_BASE}${endpoint}`)
  url.searchParams.set('api_key', numbeoApiKey())
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`Numbeo ${res.status} for ${endpoint}`)
  }

  const data = (await res.json()) as T & { error?: string }
  if (data.error) {
    throw new Error(data.error)
  }
  return data
}

function priceForItem(prices: NumbeoPriceItem[] | undefined, itemId: number): number | null {
  const item = prices?.find((p) => p.item_id === itemId)
  if (item?.average_price == null || !Number.isFinite(item.average_price) || item.average_price <= 0) {
    return null
  }
  return item.average_price
}

function monthlyCostFromIndices(indices: NumbeoIndicesResponse, monthlyRent: number): number | null {
  if (indices.cpi_and_rent_index != null && Number.isFinite(indices.cpi_and_rent_index)) {
    return Math.round(COMPARE_REFERENCE_BUDGET * (indices.cpi_and_rent_index / NYC_CPI_AND_RENT_INDEX))
  }
  if (monthlyRent > 0) {
    return Math.round(monthlyRent * 1.72)
  }
  return null
}

function budgetScoreFromCol(monthlyCost: number): number {
  const budget = COMPARE_REFERENCE_BUDGET
  const ceiling = budget * 1.25
  if (monthlyCost <= budget) return 100
  if (monthlyCost >= ceiling) return 0
  return clamp(Math.round(100 * (1 - (monthlyCost - budget) / (ceiling - budget))), 0, 100)
}

function computeOverallRetirementScore(record: Omit<CompareCityRecord, 'overallRetirementScore'>): number {
  const budget = budgetScoreFromCol(record.monthlyCostOfLiving)
  const parts = [
    budget,
    record.healthcareScore,
    record.safetyScore,
    record.taxScore,
    record.climateScore,
    record.airportScore,
    record.internetScore,
    record.walkabilityScore,
    record.expatCommunityScore,
    record.visaAccessScore,
  ]
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length
  return Math.round(avg * 10) / 10
}

function fallbackFromCityRow(city: CityRow): CompareCityRecord {
  const monthlyRent = city.rent_usd
  const monthlyCostOfLiving = Math.round(city.rent_usd * 1.72)
  const base = {
    key: cityKey(city),
    name: city.name,
    country: city.country,
    monthlyCostOfLiving,
    monthlyRent,
    healthcareScore: clamp(Math.round(city.healthcare * 10), 0, 100),
    safetyScore: clamp(Math.round(city.safety * 10), 0, 100),
    taxScore: clamp(Math.round(100 - city.tax_rate * 2.5), 0, 100),
    climateScore: clamp(Math.round(100 - Math.abs(city.avg_temp - 18) * 4), 0, 100),
    airportScore: city.airportScore,
    internetScore: city.internetScore,
    walkabilityScore: city.walkabilityScore,
    expatCommunityScore: city.expatCommunityScore,
    visaAccessScore: city.visaAccessScore,
    source: 'fallback' as const,
    numbeoCityId: null,
    enrichedAt: new Date().toISOString(),
  }
  return {
    ...base,
    overallRetirementScore: computeOverallRetirementScore(base),
  }
}

function applyIndicesToRecord(
  record: CompareCityRecord,
  indices: NumbeoIndicesResponse,
): void {
  const safety = indexToScore(indices.safety_index)
  const healthcare = indexToScore(indices.health_care_index)
  const climate = indexToScore(indices.climate_index)

  if (safety != null) record.safetyScore = safety
  if (healthcare != null) record.healthcareScore = healthcare
  if (climate != null) record.climateScore = climate

  const col = monthlyCostFromIndices(indices, record.monthlyRent)
  if (col != null && col > 0) {
    record.monthlyCostOfLiving = col
  }
}

async function fetchNumbeoMetrics(city: CityRow): Promise<CompareCityRecord | null> {
  const query = numbeoQuery(city)
  const fallback = fallbackFromCityRow(city)

  const prices = await numbeoGet<NumbeoPricesResponse>('/city_prices', {
    query,
    currency: 'USD',
    strict_matching: 'false',
  })

  if (!prices.prices?.length) {
    return null
  }

  const record: CompareCityRecord = {
    ...fallback,
    source: 'numbeo',
    numbeoCityId: prices.city_id ?? null,
    enrichedAt: new Date().toISOString(),
  }

  for (const itemId of RENT_ITEM_IDS) {
    const rent = priceForItem(prices.prices, itemId)
    if (rent != null) {
      record.monthlyRent = Math.round(rent)
      break
    }
  }

  if (record.monthlyRent <= 0) {
    record.monthlyRent = fallback.monthlyRent
  }

  try {
    const indices = await numbeoGet<NumbeoIndicesResponse>('/indices', {
      query,
      strict_matching: 'false',
    })
    applyIndicesToRecord(record, indices)
    if (indices.city_id != null) {
      record.numbeoCityId = indices.city_id
    }
  } catch {
    if (record.monthlyRent > 0) {
      record.monthlyCostOfLiving = Math.round(record.monthlyRent * 1.72)
    }
  }

  if (record.monthlyCostOfLiving <= 0 && record.monthlyRent > 0) {
    record.monthlyCostOfLiving = Math.round(record.monthlyRent * 1.72)
  }

  record.overallRetirementScore = computeOverallRetirementScore(record)
  return record
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

function findRentInObject(obj: unknown, depth = 0): number | null {
  if (obj == null || depth > 6) return null

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findRentInObject(item, depth + 1)
      if (found != null) return found
    }
    return null
  }

  if (typeof obj !== 'object') return null

  const record = obj as Record<string, unknown>
  const label = String(record.item_name ?? record.item ?? record.name ?? record.label ?? '').toLowerCase()
  const value = asNumber(record.average_price ?? record.avg ?? record.average ?? record.price ?? record.value)

  if (
    value != null &&
    (label.includes('1 bedroom') || label.includes('one bedroom') || label.includes('apartment (1'))
  ) {
    return value
  }

  for (const key of ['prices', 'items', 'data', 'cities', 'city', 'results', 'details']) {
    if (key in record) {
      const found = findRentInObject(record[key], depth + 1)
      if (found != null) return found
    }
  }

  return null
}

function findIndexInObject(obj: unknown, keys: string[], depth = 0): number | null {
  if (obj == null || depth > 6) return null

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findIndexInObject(item, keys, depth + 1)
      if (found != null) return found
    }
    return null
  }

  if (typeof obj !== 'object') return null

  const record = obj as Record<string, unknown>
  for (const key of keys) {
    const value = asNumber(record[key])
    if (value != null) return value
  }

  for (const nestedKey of ['indexes', 'indices', 'data', 'cities', 'city', 'results', 'details']) {
    if (nestedKey in record) {
      const found = findIndexInObject(record[nestedKey], keys, depth + 1)
      if (found != null) return found
    }
  }

  return null
}

async function rapidApiGet(path: string, params: Record<string, string>): Promise<unknown> {
  const key = rapidApiKey()
  if (!key) {
    throw new Error('RAPIDAPI_KEY not set')
  }

  const url = new URL(`${RAPIDAPI_BASE}${path}`)
  for (const [paramKey, paramValue] of Object.entries(params)) {
    url.searchParams.set(paramKey, paramValue)
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'x-rapidapi-key': key,
      'x-rapidapi-host': RAPIDAPI_HOST,
    },
  })

  if (!res.ok) {
    throw new Error(`RapidAPI ${res.status} for ${path}`)
  }

  return res.json()
}

async function fetchRapidApiMetrics(city: CityRow): Promise<CompareCityRecord | null> {
  const cityName = city.name.split('(')[0].trim()
  const params = {
    city: cityName,
    country: city.country,
    currencies: 'USD',
  }

  let payload: unknown
  try {
    payload = await rapidApiGet('/dev/get_cities_details_by_name', params)
  } catch {
    payload = await rapidApiGet('/dev/get_cities_details_by_name', {
      cities: cityName,
      countries: city.country,
      currencies: 'USD',
    })
  }

  const fallback = fallbackFromCityRow(city)
  const rent = findRentInObject(payload)
  const colIndex = findIndexInObject(payload, [
    'cost_of_living_index',
    'cost_of_living_and_rent_index',
    'cpi_and_rent_index',
    'col_index',
  ])
  const safetyIndex = findIndexInObject(payload, ['safety_index', 'safety'])
  const healthcareIndex = findIndexInObject(payload, ['health_care_index', 'healthcare_index', 'health_index'])
  const climateIndex = findIndexInObject(payload, ['climate_index', 'climate'])

  if (rent == null && colIndex == null && safetyIndex == null && healthcareIndex == null) {
    return null
  }

  const record: CompareCityRecord = {
    ...fallback,
    source: 'rapidapi',
    numbeoCityId: null,
    enrichedAt: new Date().toISOString(),
  }

  if (rent != null) {
    record.monthlyRent = Math.round(rent)
  }

  if (colIndex != null) {
    record.monthlyCostOfLiving = Math.round(COMPARE_REFERENCE_BUDGET * (colIndex / NYC_CPI_AND_RENT_INDEX))
  } else if (record.monthlyRent > 0) {
    record.monthlyCostOfLiving = Math.round(record.monthlyRent * 1.72)
  }

  const safety = indexToScore(safetyIndex ?? undefined)
  const healthcare = indexToScore(healthcareIndex ?? undefined)
  const climate = indexToScore(climateIndex ?? undefined)

  if (safety != null) record.safetyScore = safety
  if (healthcare != null) record.healthcareScore = healthcare
  if (climate != null) record.climateScore = climate

  record.overallRetirementScore = computeOverallRetirementScore(record)
  return record
}

async function enrichCity(city: CityRow): Promise<CompareCityRecord> {
  try {
    const numbeoRecord = await fetchNumbeoMetrics(city)
    if (numbeoRecord) {
      console.log(`[numbeo] ${city.name}, ${city.country}`)
      return numbeoRecord
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!message.includes('invalid api_key')) {
      console.warn(`[numbeo] ${city.name}: ${message}`)
    }
  }

  if (rapidApiKey()) {
    try {
      const rapidRecord = await fetchRapidApiMetrics(city)
      if (rapidRecord) {
        console.log(`[rapidapi] ${city.name}, ${city.country}`)
        return rapidRecord
      }
    } catch (err) {
      console.warn(`[rapidapi] ${city.name}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.warn(`[fallback] ${city.name}, ${city.country}`)
  return fallbackFromCityRow(city)
}

function serializeCompareData(records: CompareCityRecord[]): string {
  return `/**
 * Compare Cities data — generated by scripts/enrich-compare-data.ts
 * Do not edit manually; re-run: npx tsx scripts/enrich-compare-data.ts
 *
 * Source: Numbeo API (https://www.numbeo.com/api/city_prices) with RapidAPI
 * Cities Cost of Living and city-row fallback.
 */

export type CompareCityRecord = {
  key: string
  name: string
  country: string
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
  source: 'numbeo' | 'rapidapi' | 'fallback'
  numbeoCityId: number | null
  enrichedAt: string
}

export const COMPARE_DATA: CompareCityRecord[] = ${JSON.stringify(records, null, 2)}

export const COMPARE_DATA_BY_KEY: Record<string, CompareCityRecord> = Object.fromEntries(
  COMPARE_DATA.map((row) => [row.key, row]),
)

export const COMPARE_DATA_BY_NAME: Record<string, CompareCityRecord> = Object.fromEntries(
  COMPARE_DATA.map((row) => [row.name.toLowerCase(), row]),
)
`
}

async function main() {
  console.log(`Enriching ${CITIES.length} cities from Numbeo API…`)
  if (!rapidApiKey()) {
    console.log('RAPIDAPI_KEY not set — RapidAPI fallback will be skipped.')
  }

  const records: CompareCityRecord[] = []

  for (let i = 0; i < CITIES.length; i++) {
    const city = CITIES[i]
    records.push(await enrichCity(city))
    if (i < CITIES.length - 1) {
      await sleep(REQUEST_DELAY_MS)
    }
  }

  const numbeoCount = records.filter((r) => r.source === 'numbeo').length
  const rapidCount = records.filter((r) => r.source === 'rapidapi').length
  const fallbackCount = records.filter((r) => r.source === 'fallback').length

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, serializeCompareData(records), 'utf8')

  console.log(`\nWrote ${OUTPUT_PATH}`)
  console.log(`  Numbeo:   ${numbeoCount}`)
  console.log(`  RapidAPI: ${rapidCount}`)
  console.log(`  Fallback: ${fallbackCount}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
