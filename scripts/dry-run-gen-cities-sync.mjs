/**
 * Dry-run: gen-cities-db healthIdx vs index.ts healthcare_score.
 * Run from repo root: node scripts/dry-run-gen-cities-sync.mjs
 */
import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { rows } = await import(pathToFileURL(join(__dirname, 'gen-cities-db.mjs')).href)

const SYNCED = new Set([
  'Tbilisi|Georgia',
  'Baku|Azerbaijan',
  'Yerevan|Armenia',
  'Abu Dhabi|United Arab Emirates',
  'Dubai|United Arab Emirates',
  'Doha|Qatar',
  'Manama|Bahrain',
  'Kuwait City|Kuwait',
  'Muscat|Oman',
  'Riyadh|Saudi Arabia',
  'Jeddah|Saudi Arabia',
  'Batumi|Georgia',
])

function to10(n) {
  return Math.max(1, Math.min(10, Math.round(Number(n) / 10)))
}

const indexSrc = readFileSync(join(__dirname, '../lib/recommendation/index.ts'), 'utf8')
const rowRe =
  /\{\s*name:\s*"([^"]+)",\s*country:\s*"([^"]+)",\s*avg_temp:\s*(\d+),\s*tax_rate:\s*(\d+),\s*rent_usd:\s*(\d+),\s*safety:\s*(\d+),\s*healthcare:\s*([\d.]+),\s*stability_score:\s*(\d+)\s*\}/g

const indexByKey = new Map()
for (const m of indexSrc.matchAll(rowRe)) {
  indexByKey.set(`${m[1]}|${m[2]}`, {
    healthcareScore: Math.round(+m[7] * 10 * 10) / 10,
    healthcare: +m[7],
  })
}

const genByKey = new Map(rows.map((r) => [`${r[0]}|${r[1]}`, { name: r[0], healthIdx: r[8] }]))

let mismatches = 0
for (const key of SYNCED) {
  const g = genByKey.get(key)
  const i = indexByKey.get(key)
  if (g.healthIdx !== i.healthcareScore) mismatches++
}
console.log(mismatches === 0 ? 'OK: healthIdx sync' : `FAIL: ${mismatches} mismatches`)
