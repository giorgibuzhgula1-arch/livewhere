import { CITIES } from '../lib/recommendation/index.ts'

type CityIssue = {
  name: string
  country: string
  issue: string
  fields: Record<string, unknown>
}

const issues: CityIssue[] = []

for (const c of CITIES) {
  const f = {
    stability_score: c.stability_score,
    healthcare: c.healthcare,
    safety: c.safety,
    tax_rate: c.tax_rate,
    rent_usd: c.rent_usd,
  }
  if (c.stability_score > 60 && (c.healthcare < 5 || c.safety < 5)) {
    issues.push({
      name: c.name,
      country: c.country,
      issue: 'High stability (>60) but low healthcare (<5) or safety (<5)',
      fields: f,
    })
  }
  if (c.stability_score < 30 && (c.healthcare > 7 || c.safety > 7)) {
    issues.push({
      name: c.name,
      country: c.country,
      issue: 'Low stability (<30) but high healthcare (>7) or safety (>7)',
      fields: f,
    })
  }
}

const byCountry = new Map<string, typeof CITIES>()
for (const c of CITIES) {
  if (!byCountry.has(c.country)) byCountry.set(c.country, [])
  byCountry.get(c.country)!.push(c)
}

const THRESHOLDS: Record<string, number> = {
  stability_score: 15,
  healthcare: 2,
  safety: 2,
  tax_rate: 10,
  rent_usd: 400,
}

for (const [country, cities] of byCountry) {
  if (cities.length < 2) continue
  for (const field of ['stability_score', 'healthcare', 'safety', 'tax_rate', 'rent_usd'] as const) {
    const vals = cities.map((c) => c[field])
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const spread = max - min
    if (spread >= THRESHOLDS[field]) {
      const detail = cities.map((c) => `${c.name}=${c[field]}`).join(', ')
      issues.push({
        name: cities.map((c) => c.name).join(' / '),
        country,
        issue: `Same country, large spread in ${field} (min ${min}, max ${max}, spread ${spread})`,
        fields: { detail },
      })
    }
  }
}

const WESTERN_EU = new Set([
  'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria',
  'Switzerland', 'Norway', 'Sweden', 'Denmark', 'Finland', 'Ireland', 'United Kingdom',
  'Luxembourg', 'Iceland', 'Portugal', 'Greece', 'Czech Republic', 'Poland',
  'Hungary', 'Croatia', 'Slovenia', 'Slovakia', 'Estonia', 'Latvia', 'Lithuania',
  'Romania', 'Bulgaria', 'Serbia', 'Montenegro', 'Albania', 'North Macedonia',
  'Bosnia and Herzegovina', 'Malta', 'Cyprus',
])
const LOW_COST = new Set([
  'India', 'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Vietnam', 'Cambodia',
  'Laos', 'Myanmar', 'Philippines', 'Indonesia', 'Egypt', 'Morocco', 'Tunisia',
  'Algeria', 'Kenya', 'Tanzania', 'Uganda', 'Ethiopia', 'Ghana', 'Nigeria',
  'Bolivia', 'Paraguay', 'Nicaragua', 'Honduras', 'Guatemala', 'El Salvador',
  'Cuba', 'Ukraine', 'Moldova', 'Georgia', 'Armenia', 'Azerbaijan', 'Kazakhstan',
  'Uzbekistan', 'Kyrgyzstan', 'Tajikistan', 'Mongolia',
])
const HIGH_COST = new Set([
  'United States', 'United Kingdom', 'Switzerland', 'Norway', 'Denmark', 'Sweden',
  'Finland', 'Iceland', 'Luxembourg', 'Monaco', 'Singapore', 'Hong Kong', 'Japan',
  'Australia', 'New Zealand', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain',
  'Israel', 'Canada', 'France', 'Germany', 'Netherlands', 'Belgium', 'Austria',
  'Ireland', 'South Korea',
])
const CAPITALS_LOW_RENT = new Set([
  'Paris', 'London', 'Zurich', 'Geneva', 'Oslo', 'Copenhagen', 'Stockholm', 'Helsinki',
  'Dublin', 'Amsterdam', 'Brussels', 'Vienna', 'Rome', 'Madrid', 'Barcelona', 'Munich',
  'Frankfurt', 'Berlin', 'Tokyo', 'Sydney', 'Melbourne', 'Singapore', 'Hong Kong',
  'New York', 'San Francisco', 'Los Angeles', 'Washington', 'Boston', 'Seattle',
  'Toronto', 'Vancouver', 'Dubai', 'Abu Dhabi', 'Doha', 'Tel Aviv', 'Seoul',
])
const CHEAP_EU_SECONDARY = new Set([
  'Sofia', 'Bucharest', 'Belgrade', 'Sarajevo', 'Tirana', 'Skopje', 'Chisinau',
])
const CHEAP_HIGH_COST_SECONDARY = new Set([
  'Gothenburg', 'Bergen', 'Aarhus', 'Tampere', 'Christchurch',
])

for (const c of CITIES) {
  const f = {
    stability_score: c.stability_score,
    healthcare: c.healthcare,
    safety: c.safety,
    tax_rate: c.tax_rate,
    rent_usd: c.rent_usd,
  }
  if (CAPITALS_LOW_RENT.has(c.name) && c.rent_usd < 800) {
    issues.push({
      name: c.name,
      country: c.country,
      issue: `Major/high-cost city with suspiciously low rent_usd (<800): ${c.rent_usd}`,
      fields: f,
    })
  }
  if (WESTERN_EU.has(c.country) && c.rent_usd < 300 && !CHEAP_EU_SECONDARY.has(c.name)) {
    issues.push({
      name: c.name,
      country: c.country,
      issue: `Western/European country with rent_usd under 300: ${c.rent_usd}`,
      fields: f,
    })
  }
  if (LOW_COST.has(c.country) && c.rent_usd > 2000) {
    issues.push({
      name: c.name,
      country: c.country,
      issue: `Low-cost country with rent_usd over 2000: ${c.rent_usd}`,
      fields: f,
    })
  }
  if (HIGH_COST.has(c.country) && c.rent_usd < 400 && !CHEAP_HIGH_COST_SECONDARY.has(c.name)) {
    issues.push({
      name: c.name,
      country: c.country,
      issue: `High-cost country with rent_usd under 400: ${c.rent_usd}`,
      fields: f,
    })
  }
}

for (const c of CITIES) {
  const f = {
    stability_score: c.stability_score,
    healthcare: c.healthcare,
    safety: c.safety,
    tax_rate: c.tax_rate,
    rent_usd: c.rent_usd,
  }
  const zeros: string[] = []
  if (!c.safety || c.safety === 0) zeros.push('safety')
  if (!c.healthcare || c.healthcare === 0) zeros.push('healthcare')
  if (!c.stability_score || c.stability_score === 0) zeros.push('stability_score')
  if (c.tax_rate === undefined || c.tax_rate === null || Number.isNaN(c.tax_rate)) {
    zeros.push('tax_rate')
  } else if (c.tax_rate === 0) {
    zeros.push('tax_rate=0 (may be intentional tax-free)')
  }
  if (zeros.length) {
    issues.push({
      name: c.name,
      country: c.country,
      issue: `Missing or zero: ${zeros.join(', ')}`,
      fields: f,
    })
  }
}

console.log('\n=== EXTRA: stability<30 but healthcare/safety>7 ===')
for (const c of CITIES) {
  if (c.stability_score < 30 && (c.healthcare > 7 || c.safety > 7)) {
    console.log(
      `${c.country} | ${c.name} | stability=${c.stability_score} healthcare=${c.healthcare} safety=${c.safety} tax=${c.tax_rate} rent=${c.rent_usd}`,
    )
  }
}

console.log('\n=== EXTRA: identical stability_score for all cities in country ===')
for (const [country, cities] of byCountry) {
  const stabs = new Set(cities.map((c) => c.stability_score))
  if (stabs.size === 1 && cities.length > 1) {
    for (const c of cities) {
      console.log(
        `${country} | ${c.name} | stability=${c.stability_score} healthcare=${c.healthcare} safety=${c.safety} tax=${c.tax_rate} rent=${c.rent_usd} [uniform country stability]`,
      )
    }
  }
}

console.log('\n=== EXTRA: identical healthcare+safety for 3+ cities in country ===')
for (const [country, cities] of byCountry) {
  if (cities.length < 3) continue
  const hc = new Set(cities.map((c) => c.healthcare))
  const saf = new Set(cities.map((c) => c.safety))
  if (hc.size === 1 && saf.size === 1) {
    for (const c of cities) {
      console.log(
        `${country} | ${c.name} | stability=${c.stability_score} healthcare=${c.healthcare} safety=${c.safety} tax=${c.tax_rate} rent=${c.rent_usd} [uniform hc+safety]`,
      )
    }
  }
}

console.log('\n=== EXTRA: rent extremes (<=250 or >=3500) ===')
for (const c of CITIES) {
  if (c.rent_usd >= 3500 || c.rent_usd <= 250) {
    console.log(
      `${c.country} | ${c.name} | stability=${c.stability_score} healthcare=${c.healthcare} safety=${c.safety} tax=${c.tax_rate} rent=${c.rent_usd}`,
    )
  }
}

console.log(`\nTOTAL CITIES: ${CITIES.length}`)
console.log(`TOTAL FLAGS: ${issues.length}`)
console.log('---')
for (const i of issues) {
  console.log(`${i.country} | ${i.name}`)
  console.log(`  ISSUE: ${i.issue}`)
  if (i.fields.detail) {
    console.log(`  DETAIL: ${i.fields.detail}`)
  } else {
    console.log(
      `  DATA: stability=${i.fields.stability_score} healthcare=${i.fields.healthcare} safety=${i.fields.safety} tax=${i.fields.tax_rate} rent=${i.fields.rent_usd}`,
    )
  }
}
