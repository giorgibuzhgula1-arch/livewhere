/**
 * Slider-based scoring only. One hard filter: low taxes priority (4–5) → income_tax_rate < 15%.
 * No external APIs. Data: lib/recommendation/cities-db.ts
 */
import { CITY_DATABASE } from '@/lib/recommendation/cities-db'
import type { AnalyzeRequest, CityResult, UserPriorities } from '@/lib/types'

export const RESULT_COUNT = 3

const NIGHTLIFE_STRONG = new Set(
  [
    'berlin',
    'barcelona',
    'lisbon',
    'london',
    'paris',
    'amsterdam',
    'tokyo',
    'seoul',
    'bangkok',
    'new york',
    'los angeles',
    'miami',
    'las vegas',
    'austin',
    'nashville',
    'madrid',
    'rome',
    'milan',
    'buenos aires',
    'rio de janeiro',
    'sao paulo',
    'dublin',
    'prague',
    'budapest',
    'medellin',
    'mexico city',
    'montreal',
    'melbourne',
    'sydney',
    'tel aviv',
  ].map((s) => s.toLowerCase())
)

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function normPriority(p: unknown): number {
  const n = typeof p === 'number' ? p : Number(p)
  if (!Number.isFinite(n)) return 3
  return clamp(Math.round(n), 1, 5)
}

function wantsLowTax(priorities: UserPriorities): boolean {
  return normPriority(priorities.tax) >= 4
}

function nightlifeScore(cityName: string): number {
  return NIGHTLIFE_STRONG.has(cityName.toLowerCase()) ? 88 : 48
}

function dimTax(rate: number, priorities: UserPriorities): number {
  const w = normPriority(priorities.tax)
  if (w <= 2) return 50
  return clamp(Math.round(100 - rate * 4.5), 0, 100)
}

function dimHousing(rent: number, priorities: UserPriorities): number {
  const w = normPriority(priorities.housing)
  if (w <= 2) return 50
  return clamp(Math.round(100 - (rent / 3500) * 100), 0, 100)
}

function dimClimate(temp: number, priorities: UserPriorities): number {
  const w = normPriority(priorities.climate)
  if (w <= 2) return 50
  const ideal = 22
  return clamp(Math.round(100 - Math.abs(temp - ideal) * 5), 0, 100)
}

function dimHealth(idx: number, priorities: UserPriorities): number {
  const w = normPriority(priorities.health)
  if (w <= 2) return 50
  return clamp(Math.round(idx * 1.05), 0, 100)
}

function dimSafety(idx: number, priorities: UserPriorities): number {
  const w = normPriority(priorities.safety)
  if (w <= 2) return 50
  return clamp(Math.round(idx), 0, 100)
}

function dimNightlife(name: string, priorities: UserPriorities): number {
  const w = normPriority(priorities.nightlife)
  if (w <= 2) return 50
  return nightlifeScore(name)
}

type Dims = CityResult['scores']
type Row = (typeof CITY_DATABASE)[number]

function allDims(row: Row, priorities: UserPriorities): Dims {
  return {
    tax: dimTax(row.income_tax_rate, priorities),
    housing: dimHousing(row.rent_1bed_usd, priorities),
    climate: dimClimate(row.avg_temp_celsius, priorities),
    health: dimHealth(row.healthcare_index, priorities),
    nightlife: dimNightlife(row.name, priorities),
    safety: dimSafety(row.safety_index, priorities),
  }
}

function weightedScore(dims: Dims, priorities: UserPriorities): number {
  const w = {
    tax: normPriority(priorities.tax),
    housing: normPriority(priorities.housing),
    climate: normPriority(priorities.climate),
    health: normPriority(priorities.health),
    nightlife: normPriority(priorities.nightlife),
    safety: normPriority(priorities.safety),
  }
  let sum = 0
  let tw = 0
  for (const k of Object.keys(w) as (keyof typeof w)[]) {
    sum += w[k] * dims[k]
    tw += w[k]
  }
  return tw > 0 ? Math.round(sum / tw) : 50
}

function estimatedMonthlyCost(rent: number): number {
  return Math.round(rent * 1.72)
}

function toCityResult(
  row: Row,
  rank: number,
  priorities: UserPriorities,
  salary: number,
  currency: string
): CityResult {
  const dims = allDims(row, priorities)
  const score = weightedScore(dims, priorities)
  const monthlyCost = estimatedMonthlyCost(row.rent_1bed_usd)
  const takeHomeMonthly = Math.round((salary * (1 - row.income_tax_rate / 100)) / 12)

  return {
    name: row.name,
    country: row.country,
    continent: row.continent,
    flag: row.flag,
    score,
    taxRate: row.income_tax_rate,
    monthlyRent: row.rent_1bed_usd,
    monthlyCost,
    takeHomeMonthly,
    monthlySavings: takeHomeMonthly - monthlyCost,
    pros: [
      `${row.income_tax_rate}% income tax (2025 reference)`,
      `$${row.rent_1bed_usd}/mo 1-bed · ~$${monthlyCost}/mo est. total`,
      `Safety ${row.safety_index} · Healthcare ${row.healthcare_index} (Numbeo 2025)`,
      `${row.avg_temp_celsius}°C annual avg`,
    ],
    cons: [
      'Tax and visa rules depend on nationality and residency — confirm with a professional.',
    ],
    tags: [row.continent],
    visa: 'Research work, nomad, or residency routes for your passport.',
    scores: dims,
    aiInsight: `${row.flag} ${row.name} #${rank} (${score}/100). ${row.avg_temp_celsius}°C · ${row.income_tax_rate}% tax · rent $${row.rent_1bed_usd} · Numbeo safety ${row.safety_index}, healthcare ${row.healthcare_index}. At ${salary.toLocaleString()} ${currency}/yr.`,
  }
}

function scoreSource(rows: Row[], priorities: UserPriorities) {
  return rows
    .map((row) => ({
      row,
      score: weightedScore(allDims(row, priorities), priorities),
    }))
    .sort((a, b) => b.score - a.score)
}

export function recommendCities(body: AnalyzeRequest): CityResult[] {
  const priorities: UserPriorities = {
    tax: normPriority(body.priorities.tax),
    housing: normPriority(body.priorities.housing),
    climate: normPriority(body.priorities.climate),
    health: normPriority(body.priorities.health),
    nightlife: normPriority(body.priorities.nightlife),
    safety: normPriority(body.priorities.safety),
  }

  const filtered = wantsLowTax(priorities)
    ? CITY_DATABASE.filter((c) => c.income_tax_rate < 15)
    : CITY_DATABASE

  const primary = filtered.length > 0 ? filtered : CITY_DATABASE
  const ranked = scoreSource(primary, priorities)

  const picked: { row: Row; score: number }[] = []
  const seen = new Set<string>()

  for (const item of ranked) {
    if (seen.has(item.row.name)) continue
    seen.add(item.row.name)
    picked.push(item)
    if (picked.length >= RESULT_COUNT) break
  }

  if (picked.length < RESULT_COUNT) {
    for (const item of scoreSource(CITY_DATABASE, priorities)) {
      if (seen.has(item.row.name)) continue
      seen.add(item.row.name)
      picked.push(item)
      if (picked.length >= RESULT_COUNT) break
    }
  }

  return picked
    .slice(0, RESULT_COUNT)
    .map((t, idx) => toCityResult(t.row, idx + 1, priorities, body.salary, body.currency))
}
