/**
 * Patch lib/recommendation/index.ts CITIES rows: nightlife -> stability_score.
 * Run: node scripts/patch-cities-stability.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const path = join(__dirname, '../lib/recommendation/index.ts')
let src = readFileSync(path, 'utf8')

const wgiSrc = readFileSync(join(__dirname, '../lib/wgi-stability.ts'), 'utf8')
const wgiBlock = wgiSrc.match(/export const WGI_POLITICAL_STABILITY_PERCENTILE[^=]*=\s*\{([\s\S]*?)\n\}/)
if (!wgiBlock) throw new Error('Could not parse WGI map from lib/wgi-stability.ts')
const wgiMap = Object.fromEntries(
  [...wgiBlock[1].matchAll(/"([^"]+)":\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]),
)

function stabilityForCountry(country) {
  return wgiMap[country] ?? 50
}

src = src.replace(/nightlife: number/, 'stability_score: number')

const rowRe =
  /\{\s*name:\s*"([^"]+)",\s*country:\s*"([^"]+)",\s*avg_temp:\s*(\d+),\s*tax_rate:\s*(\d+),\s*rent_usd:\s*(\d+),\s*safety:\s*(\d+),\s*healthcare:\s*(\d+),\s*nightlife:\s*(\d+)\s*\}/g

let count = 0
src = src.replace(rowRe, (_m, name, country, temp, tax, rent, safety, healthcare) => {
  count++
  const stability = stabilityForCountry(country)
  return `{ name: ${JSON.stringify(name)}, country: ${JSON.stringify(country)}, avg_temp: ${temp}, tax_rate: ${tax}, rent_usd: ${rent}, safety: ${safety}, healthcare: ${healthcare}, stability_score: ${stability} }`
})

writeFileSync(path, src, 'utf8')
console.log('Patched', count, 'CITIES rows in lib/recommendation/index.ts')
