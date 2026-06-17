/**
 * One-off audit: CITIES dataset quality patterns.
 * Run: node scripts/audit-cities-data.mjs
 */
import { readFileSync } from 'fs'

const indexSrc = readFileSync('lib/recommendation/index.ts', 'utf8')
const cities = [...indexSrc.matchAll(
  /\{\s*name:\s*"([^"]+)",\s*country:\s*"([^"]+)",\s*avg_temp:\s*(\d+),\s*tax_rate:\s*(\d+),\s*rent_usd:\s*(\d+),\s*safety:\s*(\d+),\s*healthcare:\s*(\d+),\s*nightlife:\s*(\d+)\s*\}/g,
)].map((m) => ({
  name: m[1],
  country: m[2],
  avg_temp: +m[3],
  tax_rate: +m[4],
  rent_usd: +m[5],
  safety: +m[6],
  healthcare: +m[7],
  nightlife: +m[8],
}))

const genSrc = readFileSync('scripts/gen-cities-db.mjs', 'utf8')
const genRows = [...genSrc.matchAll(/\['([^']+)',\s*'([^']+)',\s*'[^']+',\s*'[^']+',\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]/g)]
const genByKey = new Map(genRows.map((m) => [`${m[1]}|${m[2]}`, {
  name: m[1], country: m[2], temp: +m[3], tax: +m[4], rent: +m[5],
  safetyIdx: +m[6], healthIdx: +m[7],
}]))

function showCity(label, name, country) {
  const c = cities.find((x) => x.name === name && x.country === country)
  const g = genByKey.get(`${name}|${country}`)
  console.log(`\n=== ${label}: ${name}, ${country} ===`)
  console.log('CITIES row (0-10 scale):', JSON.stringify(c, null, 2))
  if (c) {
    console.log('Derived 0-100 scores:')
    console.log('  healthcare_score:', c.healthcare * 10)
    console.log('  safety_score:', c.safety * 10)
    console.log('  nightlife_score:', c.nightlife * 10)
  }
  if (g) {
    console.log('gen-cities-db.mjs raw (0-100 indices):', JSON.stringify(g, null, 2))
    console.log('  → to10 conversion: safety', Math.round(g.safetyIdx / 10), 'healthcare', Math.round(g.healthIdx / 10))
  }
}

showCity('RAW', 'Batumi', 'Georgia')
showCity('RAW', 'Abu Dhabi', 'United Arab Emirates')

// Nightlife distribution
const nlDist = {}
for (const c of cities) nlDist[c.nightlife] = (nlDist[c.nightlife] ?? 0) + 1
console.log('\n=== Nightlife distribution (0-10) ===')
console.log(nlDist)

const nl6 = cities.filter((c) => c.nightlife === 6)
const nl9 = cities.filter((c) => c.nightlife === 9)
console.log(`\nDefault nightlife=6: ${nl6.length} cities (${Math.round(nl6.length / cities.length * 100)}%)`)
console.log(`Strong nightlife=9: ${nl9.length} cities`)

const gulf = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman']
console.log('\n=== Gulf cities nightlife ===')
for (const c of cities.filter((x) => gulf.includes(x.country))) {
  console.log(`  ${c.name}, ${c.country}: nightlife=${c.nightlife}, healthcare=${c.healthcare}, safety=${c.safety}`)
}

// Identical triplets (safety, healthcare, nightlife)
const triplet = new Map()
for (const c of cities) {
  const k = `${c.safety}|${c.healthcare}|${c.nightlife}`
  if (!triplet.has(k)) triplet.set(k, [])
  triplet.get(k).push(`${c.name}|${c.country}`)
}
const suspiciousTriplets = [...triplet.entries()]
  .filter(([, list]) => list.length >= 4)
  .sort((a, b) => b[1].length - a[1].length)

console.log('\n=== Identical (safety|healthcare|nightlife) clusters (4+ cities) ===')
for (const [k, list] of suspiciousTriplets.slice(0, 15)) {
  console.log(`  [${k}] × ${list.length}: ${list.slice(0, 6).join(', ')}${list.length > 6 ? '…' : ''}`)
}

// Identical healthcare only
const hc = new Map()
for (const c of cities) {
  const k = c.healthcare
  if (!hc.has(k)) hc.set(k, [])
  hc.get(k).push(c.name)
}
console.log('\n=== Healthcare value frequency (0-10) ===')
console.log([...hc.entries()].sort((a, b) => b[1].length - a[1].length).map(([v, list]) => `${v}: ${list.length} cities`).join('\n'))

// Coastal/resort cities with healthcare >= 7
const coastalNames = /batumi|phuket|bali|cancun|playa|cartagena|malaga|faro|split|durban|miami|honolulu|macau|doha|abu dhabi|dubai|muscat|manama|jeddah|riyadh/i
console.log('\n=== Coastal/resort/Gulf with healthcare >= 7 (0-10) ===')
for (const c of cities.filter((x) => coastalNames.test(x.name) && x.healthcare >= 7)) {
  console.log(`  ${c.name}, ${c.country}: healthcare=${c.healthcare} (score ${c.healthcare * 10})`)
}

// gen-cities health index clusters
const healthIdxClusters = new Map()
for (const [, g] of genByKey) {
  const k = g.healthIdx
  if (!healthIdxClusters.has(k)) healthIdxClusters.set(k, [])
  healthIdxClusters.get(k).push(g.name)
}
console.log('\n=== gen-cities health index (0-100) — most common values ===')
console.log([...healthIdxClusters.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 12).map(([v, list]) => `${v}: ${list.length} cities (${list.slice(0, 4).join(', ')})`).join('\n'))

// Round-number safety in gen (ends in 0 or 2)
console.log('\n=== gen-cities safety index ending in 0/2/8 (possible templating) ===')
const roundSafety = [...genByKey.values()].filter((g) => g.safetyIdx % 2 === 0)
console.log(`${roundSafety.length}/${genByKey.size} cities have even safety indices`)

// Cities where healthcare 0-10 doesn't match gen healthIdx/10 (data drift?)
console.log('\n=== CITIES vs gen-cities drift (healthcare/safety mismatch) ===')
let drift = 0
for (const c of cities) {
  const g = genByKey.get(`${c.name}|${c.country}`)
  if (!g) { console.log('  MISSING in gen:', c.name); continue }
  const expH = Math.max(1, Math.min(10, Math.round(g.healthIdx / 10)))
  const expS = Math.max(1, Math.min(10, Math.round(g.safetyIdx / 10)))
  if (c.healthcare !== expH || c.safety !== expS) {
    drift++
    console.log(`  ${c.name}: gen health ${g.healthIdx}→${expH} vs CITIES ${c.healthcare}; safety ${g.safetyIdx}→${expS} vs ${c.safety}`)
  }
}
if (drift === 0) console.log('  None — CITIES matches gen-cities to10 conversion')
