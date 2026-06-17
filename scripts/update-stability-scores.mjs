/**
 * Fetch World Bank WGI Political Stability (GOV_WGI_PV.EST) estimates, print
 * country → stability_score (0–100), and patch lib/recommendation/index.ts.
 *
 *   node scripts/update-stability-scores.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INDEX_PATH = join(__dirname, '../lib/recommendation/index.ts')

const ISO2_CODES = [
  'PT', 'ES', 'IT', 'FR', 'GR', 'CY', 'MT', 'CH', 'AT', 'NL', 'BE', 'LU', 'DK', 'NO', 'DE',
  'SI', 'HR', 'CZ', 'PL', 'EE', 'LV', 'LT', 'MX', 'CR', 'PA', 'UY', 'CL', 'AR', 'DO', 'CO',
  'EC', 'PE', 'JP', 'KR', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'NZ', 'AU', 'AE', 'QA', 'BH',
  'OM', 'IL', 'MA', 'ZA', 'MU', 'SC',
]

/** ISO2 → country names used in lib/recommendation/index.ts */
const ISO2_TO_COUNTRY = {
  PT: 'Portugal',
  ES: 'Spain',
  IT: 'Italy',
  FR: 'France',
  GR: 'Greece',
  CY: 'Cyprus',
  MT: 'Malta',
  CH: 'Switzerland',
  AT: 'Austria',
  NL: 'Netherlands',
  BE: 'Belgium',
  LU: 'Luxembourg',
  DK: 'Denmark',
  NO: 'Norway',
  DE: 'Germany',
  SI: 'Slovenia',
  HR: 'Croatia',
  CZ: 'Czech Republic',
  PL: 'Poland',
  EE: 'Estonia',
  LV: 'Latvia',
  LT: 'Lithuania',
  MX: 'Mexico',
  CR: 'Costa Rica',
  PA: 'Panama',
  UY: 'Uruguay',
  CL: 'Chile',
  AR: 'Argentina',
  DO: 'Dominican Republic',
  CO: 'Colombia',
  EC: 'Ecuador',
  PE: 'Peru',
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  MY: 'Malaysia',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  ID: 'Indonesia',
  NZ: 'New Zealand',
  AU: 'Australia',
  AE: 'United Arab Emirates',
  QA: 'Qatar',
  BH: 'Bahrain',
  OM: 'Oman',
  IL: 'Israel',
  MA: 'Morocco',
  ZA: 'South Africa',
  MU: 'Mauritius',
  SC: 'Seychelles',
}

function rawToScore(raw) {
  return Math.round(((raw + 2.5) / 5) * 100)
}

async function fetchStabilityScores() {
  const codes = ISO2_CODES.join(';')
  const url = `https://api.worldbank.org/v2/country/${codes}/indicator/GOV_WGI_PV.EST?format=json&mrv=1&per_page=100`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`World Bank API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  const rows = json[1] ?? []
  const byIso2 = new Map()

  for (const row of rows) {
    if (row.value == null) continue
    const iso2 = String(row.country?.id ?? '').toUpperCase()
    if (!iso2) continue
    byIso2.set(iso2, row.value)
  }

  return byIso2
}

const byIso2 = await fetchStabilityScores()
const scores = {}

for (const iso2 of ISO2_CODES) {
  const country = ISO2_TO_COUNTRY[iso2]
  const raw = byIso2.get(iso2)
  if (raw == null) {
    console.warn(`No PV.EST value for ${country} (${iso2})`)
    continue
  }
  scores[country] = rawToScore(raw)
}

for (const [country, score] of Object.entries(scores).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`${country} → ${score}`)
}

const rowRe = /(\{ name: "[^"]+", country: "([^"]+)", .+? stability_score: )\d+/g
let src = readFileSync(INDEX_PATH, 'utf8')
let updated = 0
const missingCountries = new Set()

src = src.replace(rowRe, (match, prefix, country) => {
  const score = scores[country]
  if (score == null) {
    missingCountries.add(country)
    return match
  }
  updated++
  return `${prefix}${score}`
})

writeFileSync(INDEX_PATH, src, 'utf8')
console.log(`Updated ${updated} CITIES rows in lib/recommendation/index.ts`)
if (missingCountries.size) {
  console.warn('No World Bank score for countries (left unchanged):', [...missingCountries].sort().join(', '))
}
