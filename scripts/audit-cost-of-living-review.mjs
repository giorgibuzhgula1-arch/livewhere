/**
 * Cost-of-living review table for manual dataset correction.
 * Run: node scripts/audit-cost-of-living-review.mjs
 *
 * cost_of_living = round(rent_usd × 1.72) — same as scoreCity.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const RENT_TO_LIVING = 1.72
const __dirname = dirname(fileURLToPath(import.meta.url))

/** World Bank FY2025 income group (July 2024 thresholds), by country name in CITIES */
const WB_INCOME = {
  // High income
  'United States': 'high',
  Canada: 'high',
  'United Kingdom': 'high',
  Germany: 'high',
  France: 'high',
  Italy: 'high',
  Spain: 'high',
  Portugal: 'high',
  Netherlands: 'high',
  Belgium: 'high',
  Switzerland: 'high',
  Austria: 'high',
  Sweden: 'high',
  Norway: 'high',
  Denmark: 'high',
  Finland: 'high',
  Ireland: 'high',
  Iceland: 'high',
  Luxembourg: 'high',
  Greece: 'high',
  Cyprus: 'high',
  Japan: 'high',
  'South Korea': 'high',
  Singapore: 'high',
  Australia: 'high',
  'New Zealand': 'high',
  Israel: 'high',
  'United Arab Emirates': 'high',
  Qatar: 'high',
  Kuwait: 'high',
  Bahrain: 'high',
  Oman: 'high',
  'Saudi Arabia': 'high',
  'Hong Kong': 'high',
  Taiwan: 'high',
  Macau: 'high',
  Chile: 'high',
  Uruguay: 'high',
  Croatia: 'high',
  'Czech Republic': 'high',
  Estonia: 'high',
  Slovenia: 'high',
  Poland: 'high',
  'Puerto Rico': 'high',
  // Upper middle income
  Mexico: 'upper_middle',
  Brazil: 'upper_middle',
  Argentina: 'upper_middle',
  Colombia: 'upper_middle',
  Peru: 'upper_middle',
  Ecuador: 'upper_middle',
  Panama: 'upper_middle',
  'Costa Rica': 'upper_middle',
  Cuba: 'upper_middle',
  Jamaica: 'upper_middle',
  'Dominican Republic': 'upper_middle',
  Guatemala: 'upper_middle',
  Honduras: 'upper_middle',
  'El Salvador': 'upper_middle',
  Nicaragua: 'upper_middle',
  Bolivia: 'upper_middle',
  Paraguay: 'upper_middle',
  China: 'upper_middle',
  Malaysia: 'upper_middle',
  Thailand: 'upper_middle',
  Russia: 'upper_middle',
  Kazakhstan: 'upper_middle',
  Azerbaijan: 'upper_middle',
  Georgia: 'upper_middle',
  Serbia: 'upper_middle',
  Romania: 'upper_middle',
  Bulgaria: 'upper_middle',
  Hungary: 'upper_middle',
  Latvia: 'upper_middle',
  Lithuania: 'upper_middle',
  'South Africa': 'upper_middle',
  Mongolia: 'upper_middle',
  // Lower middle income
  Armenia: 'lower_middle',
  Ukraine: 'lower_middle',
  Vietnam: 'lower_middle',
  Indonesia: 'lower_middle',
  Philippines: 'lower_middle',
  Egypt: 'lower_middle',
  Morocco: 'lower_middle',
  Tunisia: 'lower_middle',
  Jordan: 'lower_middle',
  Lebanon: 'lower_middle',
  'Sri Lanka': 'lower_middle',
  Uzbekistan: 'lower_middle',
  Kenya: 'lower_middle',
  Tanzania: 'lower_middle',
  Nigeria: 'lower_middle',
  Nepal: 'lower_middle',
  // Low income
  Ethiopia: 'low',
}

const TIER_LABEL = {
  high: 'High income',
  upper_middle: 'Upper-middle income',
  lower_middle: 'Lower-middle income',
  low: 'Low income',
  unclassified: 'Unclassified',
}

function tierMismatchNote(tier, rent, col) {
  const notes = []
  if (tier === 'low') {
    if (col >= 600) notes.push('LOW-INCOME country but COL ≥ $600 — review (likely too high for tier)')
    else if (col >= 500) notes.push('LOW-INCOME country but COL ≥ $500 — verify')
  }
  if (tier === 'lower_middle') {
    if (col >= 1300) notes.push('LOWER-MIDDLE country but COL ≥ $1,300 — likely too expensive vs tier')
    else if (col >= 1100) notes.push('LOWER-MIDDLE country but COL ≥ $1,100 — review vs tier peers')
    if (col <= 550 && rent <= 320) notes.push('LOWER-MIDDLE country but COL ≤ $550 — verify not understating')
  }
  if (tier === 'upper_middle') {
    if (col >= 4200) notes.push('UPPER-MIDDLE country but COL ≥ $4,200 — review (approaching high-income city costs)')
    if (col <= 400) notes.push('UPPER-MIDDLE country but COL ≤ $400 — suspiciously cheap')
  }
  if (tier === 'high') {
    if (col <= 948) notes.push('HIGH-INCOME country but COL ≤ $948 — suspiciously cheap vs tier')
    if (col <= 1200 && rent <= 700) notes.push('HIGH-INCOME country but very low rent/COL — review')
  }
  return notes
}

const indexSrc = readFileSync(join(__dirname, '../lib/recommendation/index.ts'), 'utf8')
const cities = [...indexSrc.matchAll(
  /\{\s*name:\s*"([^"]+)",\s*country:\s*"([^"]+)",\s*avg_temp:\s*(\d+),\s*tax_rate:\s*(\d+),\s*rent_usd:\s*(\d+),\s*safety:\s*(\d+),\s*healthcare:\s*(\d+),\s*nightlife:\s*(\d+)\s*\}/g,
)].map((m) => {
  const rent = +m[5]
  const col = Math.round(rent * RENT_TO_LIVING)
  const tier = WB_INCOME[m[2]] ?? 'unclassified'
  return {
    name: m[1],
    country: m[2],
    rent_usd: rent,
    cost_of_living: col,
    income_tier: tier,
    income_tier_label: TIER_LABEL[tier],
  }
})

// Bucket detection within income tier (exact COL)
const colBuckets = new Map()
for (const c of cities) {
  const key = `${c.income_tier}|${c.cost_of_living}`
  if (!colBuckets.has(key)) colBuckets.set(key, [])
  colBuckets.get(key).push(c)
}

// Near-identical: same tier, COL within $34 (~$20 rent step)
function nearIdenticalPeers(c) {
  return cities.filter(
    (o) =>
      o.income_tier === c.income_tier &&
      o.name !== c.name &&
      Math.abs(o.cost_of_living - c.cost_of_living) <= 34,
  )
}

const rows = cities.map((c) => {
  const tierNotes = tierMismatchNote(c.income_tier, c.rent_usd, c.cost_of_living)
  const exactPeers = colBuckets.get(`${c.income_tier}|${c.cost_of_living}`) ?? []
  const exactPeerNames =
    exactPeers.length > 1
      ? exactPeers.filter((p) => p.name !== c.name || p.country !== c.country)
      : []
  const nearPeers = nearIdenticalPeers(c)

  const bucketFlags = []
  if (exactPeers.length >= 3) {
    bucketFlags.push(
      `BUCKET: ${exactPeers.length} cities in ${c.income_tier_label} share identical COL $${c.cost_of_living} (rent $${c.rent_usd})`,
    )
  } else if (exactPeers.length === 2) {
    bucketFlags.push(`PAIR: identical COL $${c.cost_of_living} with ${exactPeerNames[0]?.name}`)
  }

  if (nearPeers.length >= 4 && exactPeers.length < 3) {
    bucketFlags.push(`NEAR-BUCKET: ${nearPeers.length + 1} cities in tier within ±$34 COL of $${c.cost_of_living}`)
  }

  // Popular round rents creating systemic bands
  const sameRentInTier = cities.filter(
    (o) => o.income_tier === c.income_tier && o.rent_usd === c.rent_usd,
  )
  if (sameRentInTier.length >= 4) {
    bucketFlags.push(`RENT-BUCKET: ${sameRentInTier.length} cities in tier share rent $${c.rent_usd}`)
  }

  const allFlags = [...tierNotes, ...bucketFlags]
  let suspicion = 0
  if (tierNotes.length) suspicion += 50 * tierNotes.length
  if (exactPeers.length >= 5) suspicion += 40 + exactPeers.length * 5
  else if (exactPeers.length >= 3) suspicion += 30 + exactPeers.length * 3
  else if (exactPeers.length === 2) suspicion += 10
  if (sameRentInTier.length >= 4) suspicion += 15 + sameRentInTier.length * 2
  if (nearPeers.length >= 6) suspicion += 12
  if (c.income_tier === 'unclassified') suspicion += 5

  return {
    ...c,
    monthly_rent_usd: c.rent_usd,
    review_flags: allFlags.join(' | ') || '—',
    suspicion_score: suspicion,
    bucket_size_exact: exactPeers.length,
    tier_peer_count_same_rent: sameRentInTier.length,
  }
})

rows.sort((a, b) => {
  if (b.suspicion_score !== a.suspicion_score) return b.suspicion_score - a.suspicion_score
  if (b.bucket_size_exact !== a.bucket_size_exact) return b.bucket_size_exact - a.bucket_size_exact
  return a.name.localeCompare(b.name)
})

function csvEscape(s) {
  const t = String(s ?? '')
  return t.includes(',') || t.includes('"') || t.includes('\n') ? `"${t.replace(/"/g, '""')}"` : t
}

const header = [
  'suspicion_rank',
  'suspicion_score',
  'city',
  'country',
  'monthly_rent_usd',
  'cost_of_living_usd',
  'income_tier',
  'review_flags',
]

const csvLines = [
  header.join(','),
  ...rows.map((r, i) =>
    [
      i + 1,
      r.suspicion_score,
      csvEscape(r.name),
      csvEscape(r.country),
      r.monthly_rent_usd,
      r.cost_of_living,
      csvEscape(r.income_tier_label),
      csvEscape(r.review_flags),
    ].join(','),
  ),
]

const outDir = join(__dirname, '../data/reviews')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'cost-of-living-review.csv')
writeFileSync(outPath, csvLines.join('\n'), 'utf8')

console.log(`Wrote ${rows.length} rows → ${outPath}\n`)
console.log('Top 25 most suspicious (full CSV has all 200, same sort):\n')
console.log(
  '| Rank | Score | City | Country | Rent | COL | Income tier | Flags |',
)
console.log('|------|-------|------|---------|------|-----|-------------|-------|')
for (const r of rows.slice(0, 25)) {
  const flags = r.review_flags.length > 80 ? r.review_flags.slice(0, 77) + '…' : r.review_flags
  console.log(
    `| ${rows.indexOf(r) + 1} | ${r.suspicion_score} | ${r.name} | ${r.country} | $${r.monthly_rent_usd} | $${r.cost_of_living} | ${r.income_tier_label} | ${flags.replace(/\|/g, '\\|')} |`,
  )
}

console.log('\n=== Tier mismatch only (all) ===')
for (const r of rows.filter((x) => x.review_flags.includes('country but'))) {
  console.log(`  ${r.name}, ${r.country} — COL $${r.cost_of_living} — ${r.review_flags.split(' | ').filter((f) => f.includes('country but')).join('; ')}`)
}

console.log('\n=== Largest exact-COL buckets by tier ===')
const bucketSummary = new Map()
for (const [key, list] of colBuckets) {
  if (list.length >= 3) bucketSummary.set(key, list)
}
for (const [key, list] of [...bucketSummary.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 12)) {
  const [tier, col] = key.split('|')
  console.log(`  ${TIER_LABEL[tier] ?? tier} COL $${col} (rent $${Math.round(+col / RENT_TO_LIVING)}) × ${list.length}: ${list.map((c) => c.name).join(', ')}`)
}
