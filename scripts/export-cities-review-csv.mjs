/**
 * Export CITIES dataset for manual review in Excel/Sheets.
 * Run: node scripts/export-cities-review-csv.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const RENT_TO_LIVING = 1.72
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const indexSrc = readFileSync(join(root, 'lib/recommendation/index.ts'), 'utf8')
const cities = [...indexSrc.matchAll(
  /\{\s*name:\s*"([^"]+)",\s*country:\s*"([^"]+)",\s*avg_temp:\s*(\d+),\s*tax_rate:\s*(\d+),\s*rent_usd:\s*(\d+),\s*safety:\s*(\d+),\s*healthcare:\s*(\d+),\s*stability_score:\s*(\d+)\s*\}/g,
)].map((m) => {
  const rent = +m[5]
  return {
    city: m[1],
    country: m[2],
    rent_usd: rent,
    healthcare_score: +m[7] * 10,
    stability_score: +m[8],
    safety_score: +m[6] * 10,
    current_cost_of_living_bucket: Math.round(rent * RENT_TO_LIVING),
  }
})

function csvEscape(s) {
  const t = String(s ?? '')
  return t.includes(',') || t.includes('"') || t.includes('\n') ? `"${t.replace(/"/g, '""')}"` : t
}

const header = [
  'city',
  'country',
  'rent_usd',
  'healthcare_score',
  'stability_score',
  'safety_score',
  'current_cost_of_living_bucket',
]

const lines = [
  header.join(','),
  ...cities.map((c) =>
    [
      csvEscape(c.city),
      csvEscape(c.country),
      c.rent_usd,
      c.healthcare_score,
      c.stability_score,
      c.safety_score,
      c.current_cost_of_living_bucket,
    ].join(','),
  ),
]

const outPath = join(root, 'cities-review.csv')
writeFileSync(outPath, lines.join('\n') + '\n', 'utf8')
console.log(`Wrote ${cities.length} rows to ${outPath}`)
