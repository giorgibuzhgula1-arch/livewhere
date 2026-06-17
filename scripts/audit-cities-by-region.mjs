/**
 * Regional / income-tier distribution audit for CITIES quality scores.
 * Run: node scripts/audit-cities-by-region.mjs
 */
import { readFileSync } from 'fs'

const indexSrc = readFileSync('lib/recommendation/index.ts', 'utf8')

const cities = [...indexSrc.matchAll(
  /\{\s*name:\s*"([^"]+)",\s*country:\s*"([^"]+)",\s*avg_temp:\s*(\d+),\s*tax_rate:\s*(\d+),\s*rent_usd:\s*(\d+),\s*safety:\s*(\d+),\s*healthcare:\s*(\d+),\s*nightlife:\s*(\d+)\s*\}/g,
)].map((m) => ({
  name: m[1],
  country: m[2],
  safety: +m[6],
  healthcare: +m[7],
  nightlife: +m[8],
  safetyScore: +m[6] * 10,
  healthcareScore: +m[7] * 10,
  nightlifeScore: +m[8] * 10,
}))

const display = [...indexSrc.matchAll(/"([^"]+\|[^"]+)":\s*\{\s*continent:\s*"([^"]+)"/g)]
const continentByKey = new Map(display.map((m) => [m[1], m[2]]))

for (const c of cities) {
  c.continent = continentByKey.get(`${c.name}|${c.country}`) ?? 'Other'
}

/** World Bank 2024-style simplified income tier by country */
const INCOME_TIER = {
  'United States': 'high', Canada: 'high', 'United Kingdom': 'high', Germany: 'high',
  France: 'high', Italy: 'high', Spain: 'high', Portugal: 'high', Netherlands: 'high',
  Belgium: 'high', Switzerland: 'high', Austria: 'high', Sweden: 'high', Norway: 'high',
  Denmark: 'high', Finland: 'high', Ireland: 'high', Iceland: 'high', Luxembourg: 'high',
  Japan: 'high', 'South Korea': 'high', Singapore: 'high', Australia: 'high',
  'New Zealand': 'high', Israel: 'high', 'United Arab Emirates': 'high', Qatar: 'high',
  Kuwait: 'high', Bahrain: 'high', Oman: 'high', 'Saudi Arabia': 'high', 'Hong Kong': 'high',
  Taiwan: 'high', Macau: 'high',
  Mexico: 'upper_middle', Brazil: 'upper_middle', Argentina: 'upper_middle', Chile: 'upper_middle',
  Colombia: 'upper_middle', Peru: 'upper_middle', Ecuador: 'upper_middle', Uruguay: 'upper_middle',
  Panama: 'upper_middle', 'Costa Rica': 'upper_middle', China: 'upper_middle', Malaysia: 'upper_middle',
  Thailand: 'upper_middle', Turkey: 'upper_middle', Russia: 'upper_middle', Poland: 'upper_middle',
  'Czech Republic': 'upper_middle', Hungary: 'upper_middle', Croatia: 'upper_middle', Romania: 'upper_middle',
  Bulgaria: 'upper_middle', Serbia: 'upper_middle', Slovenia: 'upper_middle', Estonia: 'upper_middle',
  Latvia: 'upper_middle', Lithuania: 'upper_middle', Kazakhstan: 'upper_middle', Azerbaijan: 'upper_middle',
  'South Africa': 'upper_middle', Botswana: 'upper_middle',
  Georgia: 'lower_middle', Armenia: 'lower_middle', Ukraine: 'lower_middle', Moldova: 'lower_middle',
  Vietnam: 'lower_middle', Indonesia: 'lower_middle', Philippines: 'lower_middle', India: 'lower_middle',
  Egypt: 'lower_middle', Morocco: 'lower_middle', Tunisia: 'lower_middle', Jordan: 'lower_middle',
  Lebanon: 'lower_middle', 'Sri Lanka': 'lower_middle', Mongolia: 'lower_middle', Uzbekistan: 'lower_middle',
  Guatemala: 'lower_middle', Honduras: 'lower_middle', 'El Salvador': 'lower_middle', Nicaragua: 'lower_middle',
  Bolivia: 'lower_middle', Paraguay: 'lower_middle', Kenya: 'lower_middle', Tanzania: 'lower_middle',
  Nigeria: 'lower_middle', Ethiopia: 'lower_middle', Nepal: 'lower_middle', Cambodia: 'lower_middle',
  Cuba: 'lower_middle', Jamaica: 'lower_middle', 'Dominican Republic': 'lower_middle', 'Puerto Rico': 'high',
  Greece: 'high', Cyprus: 'high',
}

/** Custom sub-regions for pattern detection */
function subRegion(c) {
  const gulf = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman']
  const caucasus = ['Georgia', 'Armenia', 'Azerbaijan']
  const balkans = ['Serbia', 'Bulgaria', 'Romania', 'Croatia', 'Slovenia', 'North Macedonia']
  const centralEU = ['Poland', 'Czech Republic', 'Hungary', 'Slovakia']
  const baltic = ['Estonia', 'Latvia', 'Lithuania']
  const latam = ['Mexico', 'Colombia', 'Brazil', 'Argentina', 'Chile', 'Peru', 'Ecuador', 'Uruguay', 'Panama', 'Costa Rica']
  const sea = ['Thailand', 'Vietnam', 'Malaysia', 'Indonesia', 'Philippines', 'Singapore']
  if (gulf.includes(c.country)) return 'Gulf / GCC'
  if (caucasus.includes(c.country)) return 'Caucasus'
  if (balkans.includes(c.country)) return 'Balkans'
  if (centralEU.includes(c.country)) return 'Central Europe'
  if (baltic.includes(c.country)) return 'Baltic'
  if (latam.includes(c.country)) return 'Latin America'
  if (sea.includes(c.country)) return 'Southeast Asia'
  if (['United States', 'Canada'].includes(c.country)) return 'North America'
  if (['United Kingdom', 'Ireland'].includes(c.country)) return 'British Isles'
  if (['France', 'Germany', 'Netherlands', 'Belgium', 'Luxembourg', 'Switzerland', 'Austria'].includes(c.country)) return 'Western Europe core'
  if (['Spain', 'Portugal', 'Italy', 'Greece', 'Cyprus'].includes(c.country)) return 'Southern Europe'
  if (['Japan', 'South Korea', 'China', 'Taiwan', 'Hong Kong', 'Macau'].includes(c.country)) return 'East Asia'
  if (['Australia', 'New Zealand'].includes(c.country)) return 'Oceania'
  if (['Egypt', 'Morocco', 'Tunisia', 'Jordan', 'Lebanon', 'Israel'].includes(c.country)) return 'Middle East / North Africa (non-GCC)'
  if (['Kenya', 'Nigeria', 'Ethiopia', 'Tanzania', 'South Africa'].includes(c.country)) return 'Sub-Saharan Africa'
  return c.continent
}

function stats(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((a, b) => a + b, 0)
  const mean = sum / values.length
  const median = sorted[Math.floor(sorted.length / 2)]
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const unique = new Set(values).size
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length
  return { n: values.length, min, max, mean: +mean.toFixed(1), median, unique, stdev: +Math.sqrt(variance).toFixed(1) }
}

function flagSuspicious(groupName, cities, field) {
  const scores = cities.map((c) => c[field])
  const s = stats(scores)
  if (!s || s.n < 2) return null
  const flags = []
  if (s.unique === 1) flags.push(`ALL IDENTICAL (${s.min})`)
  if (s.max - s.min <= 10 && s.n >= 4) flags.push(`narrow range ${s.min}-${s.max}`)
  if (field === 'nightlifeScore' && scores.every((v) => v === 60)) flags.push('100% default nightlife=6 bucket')
  if (field === 'nightlifeScore' && s.unique <= 2 && s.n >= 5) flags.push(`only ${s.unique} distinct values`)
  if (field === 'healthcareScore' && s.max - s.min <= 20 && s.n >= 4 && s.mean >= 55 && s.mean <= 75)
    flags.push(`clustered mid-tier mean=${s.mean}`)
  return flags.length ? { group: groupName, field, ...s, flags } : null
}

function printGroupTable(title, groupFn) {
  console.log(`\n${'='.repeat(72)}`)
  console.log(title)
  console.log('='.repeat(72))
  const groups = new Map()
  for (const c of cities) {
    const g = groupFn(c)
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(c)
  }

  const rows = []
  for (const [name, list] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const hc = stats(list.map((c) => c.healthcareScore))
    const nl = stats(list.map((c) => c.nightlifeScore))
    const sf = stats(list.map((c) => c.safetyScore))
    const nl6pct = Math.round((list.filter((c) => c.nightlife === 6).length / list.length) * 100)
    rows.push({ name, n: list.length, hc, nl, sf, nl6pct, list })
  }

  console.log(
    'Group'.padEnd(28) +
    'N'.padStart(4) +
    '  HC min-max (μ)'.padStart(18) +
    '  NL min-max (μ)'.padStart(18) +
    '  SF min-max (μ)'.padStart(18) +
    '  NL=6%'.padStart(8),
  )
  console.log('-'.repeat(96))
  for (const r of rows) {
    console.log(
      r.name.padEnd(28) +
      String(r.n).padStart(4) +
      `  ${String(r.hc.min).padStart(2)}-${String(r.hc.max).padStart(2)} (${String(r.hc.mean).padStart(4)})`.padStart(18) +
      `  ${String(r.nl.min).padStart(2)}-${String(r.nl.max).padStart(2)} (${String(r.nl.mean).padStart(4)})`.padStart(18) +
      `  ${String(r.sf.min).padStart(2)}-${String(r.sf.max).padStart(2)} (${String(r.sf.mean).padStart(4)})`.padStart(18) +
      `${String(r.nl6pct).padStart(6)}%`.padStart(8),
    )
  }

  const suspicious = []
  for (const r of rows) {
    for (const field of ['healthcareScore', 'nightlifeScore', 'safetyScore']) {
      const f = flagSuspicious(r.name, r.list, field)
      if (f) suspicious.push(f)
    }
  }

  if (suspicious.length) {
    console.log('\n⚠ Suspicious clusters:')
    for (const f of suspicious) {
      console.log(`  [${f.group}] ${f.field}: n=${f.n} range ${f.min}-${f.max} μ=${f.mean} → ${f.flags.join('; ')}`)
    }
  }
  return rows
}

console.log('CITIES dataset regional audit —', cities.length, 'rows')
console.log('Global nightlife=6 default rate:', Math.round(cities.filter((c) => c.nightlife === 6).length / cities.length * 100) + '%')

printGroupTable('BY SUB-REGION', subRegion)
printGroupTable('BY CONTINENT (DISPLAY metadata)', (c) => c.continent)
printGroupTable('BY INCOME TIER', (c) => INCOME_TIER[c.country] ?? 'unclassified')

// Healthcare value histogram
console.log('\n=== Healthcare score (0-100) global histogram ===')
const hcHist = {}
for (const c of cities) hcHist[c.healthcareScore] = (hcHist[c.healthcareScore] ?? 0) + 1
console.log([...Object.entries(hcHist)].sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}: ${v}`).join(' | '))

console.log('\n=== Nightlife score (0-100) global histogram ===')
const nlHist = {}
for (const c of cities) nlHist[c.nightlifeScore] = (nlHist[c.nightlifeScore] ?? 0) + 1
console.log([...Object.entries(nlHist)].sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}: ${v}`).join(' | '))

// Same healthcare/nightlife triplets within regions
console.log('\n=== Gulf cities detail ===')
for (const c of cities.filter((c) => subRegion(c) === 'Gulf / GCC')) {
  console.log(`  ${c.name.padEnd(16)} HC=${c.healthcareScore} NL=${c.nightlifeScore} SF=${c.safetyScore}`)
}

console.log('\n=== Caucasus cities detail ===')
for (const c of cities.filter((c) => subRegion(c) === 'Caucasus')) {
  console.log(`  ${c.name.padEnd(16)} HC=${c.healthcareScore} NL=${c.nightlifeScore} SF=${c.safetyScore}`)
}

console.log('\n=== Central Europe cities detail ===')
for (const c of cities.filter((c) => subRegion(c) === 'Central Europe')) {
  console.log(`  ${c.name.padEnd(16)} HC=${c.healthcareScore} NL=${c.nightlifeScore} SF=${c.safetyScore}`)
}

// gen-cities healthIdx range by subregion
const genSrc = readFileSync('scripts/gen-cities-db.mjs', 'utf8')
const genRows = [...genSrc.matchAll(/\['([^']+)',\s*'([^']+)',\s*'[^']+',\s*'[^']+',\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]/g)]
const genByKey = new Map(genRows.map((m) => [`${m[1]}|${m[2]}`, { healthIdx: +m[7], safetyIdx: +m[6] }]))

console.log('\n=== gen-cities-db raw healthIdx by sub-region ===')
const genGroups = new Map()
for (const c of cities) {
  const g = subRegion(c)
  const raw = genByKey.get(`${c.name}|${c.country}`)
  if (!raw) continue
  if (!genGroups.has(g)) genGroups.set(g, [])
  genGroups.get(g).push(raw.healthIdx)
}
for (const [name, vals] of [...genGroups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const s = stats(vals)
  console.log(`  ${name.padEnd(28)} n=${s.n} healthIdx ${s.min}-${s.max} μ=${s.mean} unique=${s.unique}`)
}
