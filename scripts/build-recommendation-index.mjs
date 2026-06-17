// DO NOT RUN — superseded by direct index.ts edits.
// Running this will lose decimal healthcare precision and drop stability_score entirely.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { rows } from './gen-cities-db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const NIGHT_STRONG = new Set(
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
    'chicago',
    'san francisco',
    'boston',
    'washington dc',
    'atlanta',
    'honolulu',
    'cancun',
    'playa del carmen',
    'cartagena',
    'ho chi minh city',
    'manila',
    'cebu',
    'bali',
  ].map((s) => s.toLowerCase())
)

function to10(n) {
  return Math.max(1, Math.min(10, Math.round(Number(n) / 10)))
}

function nightlifeFor(name) {
  return NIGHT_STRONG.has(String(name).toLowerCase()) ? 9 : 6
}

function continentFor(country, oldContinent) {
  const mid = new Set([
    'United Arab Emirates',
    'Saudi Arabia',
    'Qatar',
    'Kuwait',
    'Bahrain',
    'Oman',
    'Jordan',
    'Lebanon',
    'Israel',
  ])
  if (mid.has(country)) return 'Middle East'
  if (country === 'Australia' || country === 'New Zealand') return 'Oceania'
  if (oldContinent === 'Other') return 'Oceania'
  return oldContinent
}

/** Swap 23 secondary metros out of the first 200 so Oceania + East Asia tail cities are included. */
const DEMOTE = new Set([
  'Phoenix',
  'Dallas',
  'Houston',
  'Denver',
  'Portland',
  'Recife',
  'Fortaleza',
  'Salvador',
  'Kazan',
  'Yekaterinburg',
  'Novosibirsk',
  'Cologne',
  'Stuttgart',
  'Dusseldorf',
  'Bilbao',
  'Seville',
  'Palermo',
  'Turin',
  'Gdansk',
  'Brno',
  'Plovdiv',
  'Cluj-Napoca',
  'Barranquilla',
])

const head = rows.slice(0, 200)
const tail = rows.slice(200)
const headCore = head.filter((r) => !DEMOTE.has(r[0]))
if (headCore.length + tail.length !== 200) {
  throw new Error(
    `build-recommendation-index: need 200 cities, headCore=${headCore.length} tail=${tail.length} (demote ${DEMOTE.size})`
  )
}
const trimmed = [...headCore, ...tail]
const cityLines = []
const metaLines = []

for (const r of trimmed) {
  const [name, country, cont, flag, temp, tax, rent, safetyIdx, healthIdx] = r
  const safety = to10(safetyIdx)
  const healthcare = to10(healthIdx)
  const nightlife = nightlifeFor(name)
  cityLines.push(
    `  { name: ${JSON.stringify(name)}, country: ${JSON.stringify(country)}, avg_temp: ${temp}, tax_rate: ${tax}, rent_usd: ${rent}, safety: ${safety}, healthcare: ${healthcare}, nightlife: ${nightlife} },`
  )
  const continent = continentFor(country, cont)
  metaLines.push(
    `  ${JSON.stringify(`${name}|${country}`)}: { continent: ${JSON.stringify(continent)}, flag: ${JSON.stringify(flag)} },`
  )
}

const lines = [
  '/**',
  ' * LiveWhere - 200 cities, 2025 reference metrics.',
  ' * safety/healthcare/nightlife: scale 1-10. Scoring uses sliders 4-5 only (no filters).',
  ' */',
  "import type { AnalyzeRequest, CityResult, UserPriorities } from '@/lib/types'",
  '',
  'export type CityRow = {',
  '  name: string',
  '  country: string',
  '  avg_temp: number',
  '  tax_rate: number',
  '  rent_usd: number',
  '  safety: number',
  '  healthcare: number',
  '  nightlife: number',
  '}',
  '',
  'export const CITIES: CityRow[] = [',
  ...cityLines,
  ']',
  '',
  'const DISPLAY: Record<string, { continent: string; flag: string }> = {',
  ...metaLines,
  '}',
  '',
  'export const RESULT_COUNT = 3',
  '',
  'function clamp(n: number, lo: number, hi: number): number {',
  '  return Math.max(lo, Math.min(hi, n))',
  '}',
  '',
  'function normPriority(p: unknown): number {',
  '  const n = typeof p === "number" ? p : Number(p)',
  '  if (!Number.isFinite(n)) return 3',
  '  return clamp(Math.round(n), 1, 5)',
  '}',
  '',
  'function metaFor(city: CityRow): { continent: string; flag: string } {',
  '  return DISPLAY[`${city.name}|${city.country}`] ?? { continent: "Other", flag: "🏙️" }',
  '}',
  '',
  'export function scoreCity(row: CityRow, priorities: UserPriorities): number {',
  '  let score = 0',
  '  const pt = normPriority(priorities.tax)',
  '  if (pt >= 4) score += (10 - row.tax_rate) * pt',
  '  const pc = normPriority(priorities.climate)',
  '  if (pc >= 4) score += row.avg_temp * pc',
  '  const ph = normPriority(priorities.housing)',
  '  if (ph >= 4) score += (10 - row.rent_usd / 200) * ph',
  '  const ps = normPriority(priorities.safety)',
  '  if (ps >= 4) score += row.safety * ps',
  '  const phe = normPriority(priorities.health)',
  '  if (phe >= 4) score += row.healthcare * phe',
  '  const pn = normPriority(priorities.nightlife)',
  '  if (pn >= 4) score += row.nightlife * pn',
  '  return score',
  '}',
  '',
  'function estimatedMonthlyCost(rent: number): number {',
  '  return Math.round(rent * 1.72)',
  '}',
  '',
  'function breakdownScores(row: CityRow): CityResult["scores"] {',
  '  return {',
  '    tax: clamp(Math.round((10 - row.tax_rate) * 10), 0, 100),',
  '    housing: clamp(Math.round((10 - row.rent_usd / 200) * 10), 0, 100),',
  '    climate: clamp(Math.round(row.avg_temp * 3.5), 0, 100),',
  '    health: row.healthcare * 10,',
  '    nightlife: row.nightlife * 10,',
  '    safety: row.safety * 10,',
  '  }',
  '}',
  '',
  'function toCityResult(',
  '  row: CityRow,',
  '  rank: number,',
  '  priorities: UserPriorities,',
  '  salary: number,',
  '  currency: string,',
  '  totalScore: number',
  '): CityResult {',
  '  const { continent, flag } = metaFor(row)',
  '  const monthlyCost = estimatedMonthlyCost(row.rent_usd)',
  '  const takeHomeMonthly = Math.round((salary * (1 - row.tax_rate / 100)) / 12)',
  '  return {',
  '    name: row.name,',
  '    country: row.country,',
  '    continent,',
  '    flag,',
  '    score: Math.round(totalScore),',
  '    taxRate: row.tax_rate,',
  '    monthlyRent: row.rent_usd,',
  '    monthlyCost,',
  '    takeHomeMonthly,',
  '    monthlySavings: takeHomeMonthly - monthlyCost,',
  '    pros: [',
  '      `${row.tax_rate}% tax, ${row.avg_temp}C avg, safety ${row.safety}/10, healthcare ${row.healthcare}/10, nightlife ${row.nightlife}/10`,',
  '      `Rent $${row.rent_usd}/mo, ~$${monthlyCost}/mo est. living`,',
  '      "2025 Numbeo-style reference dataset",',
  '    ],',
  '    cons: ["Verify tax and visa rules for your passport."],',
  '    tags: [continent],',
  '    visa: "Check nomad, work, or residency options.",',
  '    scores: breakdownScores(row),',
  '    aiInsight:',
  '      `${flag} ${row.name} #${rank} score ${Math.round(totalScore)}. Formula: tax/climate/housing/safety/health/nightlife terms only if slider 4-5.` +',
  '      ` Salary ${salary.toLocaleString()} ${currency}.`,',
  '  }',
  '}',
  '',
  'export function recommendCities(body: AnalyzeRequest): CityResult[] {',
  '  const priorities: UserPriorities = {',
  '    tax: normPriority(body.priorities.tax),',
  '    housing: normPriority(body.priorities.housing),',
  '    climate: normPriority(body.priorities.climate),',
  '    health: normPriority(body.priorities.health),',
  '    nightlife: normPriority(body.priorities.nightlife),',
  '    safety: normPriority(body.priorities.safety),',
  '  }',
  '  const ranked = CITIES.map((row) => ({',
  '    row,',
  '    total: scoreCity(row, priorities),',
  '  })).sort((a, b) => b.total - a.total)',
  '  return ranked',
  '    .slice(0, RESULT_COUNT)',
  '    .map((p, idx) =>',
  '      toCityResult(p.row, idx + 1, priorities, body.salary, body.currency, p.total)',
  '    )',
  '}',
]

const out = path.join(__dirname, '../lib/recommendation/index.ts')
fs.writeFileSync(out, lines.join('\n'))
console.log('Wrote', out, 'cities:', trimmed.length)
