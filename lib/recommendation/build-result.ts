import type { EnrichedCityData, DimensionScores } from '@/lib/recommendation/score'
import { computeDimensionScores, computeWeightedScore } from '@/lib/recommendation/score'
import type { AnalyzeRequest, CityResult } from '@/lib/types'

function buildPros(data: EnrichedCityData, dimensions: DimensionScores): string[] {
  const { candidate, numbeo, avgTempC, taxRate } = data
  const pros: string[] = []

  if (taxRate <= 10) pros.push(`${taxRate}% effective income tax (${candidate.country}, verified rate table)`)
  else pros.push(`${taxRate}% effective tax rate for ${candidate.country}`)

  pros.push(`1-bed rent ~$${numbeo.monthlyRent.toLocaleString()}/mo (Numbeo)`)
  pros.push(`Safety index ${numbeo.safetyIndex}/100 · crime index ${numbeo.crimeIndex} (Numbeo)`)
  pros.push(`Mean annual temperature ~${avgTempC}°C (Open-Meteo climate data)`)

  if (dimensions.health >= 85) pros.push('Internationally rated healthcare hub')
  if (dimensions.nightlife >= 85) pros.push('Strong nightlife & cultural scene')
  if (numbeo.monthlyCost < 1500) pros.push(`Total living costs ~$${numbeo.monthlyCost.toLocaleString()}/mo`)

  return pros.slice(0, 4)
}

function buildCons(data: EnrichedCityData, dimensions: DimensionScores): string[] {
  const { candidate, numbeo, taxRate } = data
  const cons: string[] = []

  if (taxRate > 25) cons.push(`Higher income tax (${taxRate}%) vs low-tax hubs`)
  if (numbeo.monthlyRent >= 1200) cons.push(`Rent above budget nomad average ($${numbeo.monthlyRent}/mo)`)
  if (dimensions.safety < 55) cons.push('Safety index below top-tier expat cities')
  if (dimensions.climate < 60) cons.push('Cooler year-round climate — not a tropical base')
  if (candidate.healthcareTier === 'average' || candidate.healthcareTier === 'poor') {
    cons.push('Healthcare quality varies; private insurance recommended')
  }
  if (cons.length < 3) cons.push('Visa and tax residency rules depend on your nationality — verify locally')

  return cons.slice(0, 3)
}

export function buildCityResult(
  data: EnrichedCityData,
  body: AnalyzeRequest,
  rank: number
): CityResult {
  const { candidate, numbeo, taxRate, avgTempC } = data
  const { salary, currency, priorities } = body

  const dimensions = computeDimensionScores(data, priorities)
  const takeHomeYearly = Math.round(salary * (1 - taxRate / 100))
  const takeHomeMonthly = Math.round(takeHomeYearly / 12)
  const monthlySavings = takeHomeMonthly - numbeo.monthlyCost
  const score = computeWeightedScore(dimensions, priorities, monthlySavings, salary)

  const highPriorities = (Object.entries(priorities) as [keyof typeof priorities, number][])
    .filter(([, v]) => v >= 4)
    .map(([k]) => k)

  const insightParts: string[] = []
  insightParts.push(
    `${candidate.flag} ${candidate.name} ranks #${rank} with a ${score}/100 match for your profile.`
  )
  if (highPriorities.length > 0) {
    insightParts.push(
      `It meets your high-priority criteria (${highPriorities.join(', ')}) using live Numbeo cost/safety data, Open-Meteo climate (${avgTempC}°C avg), and verified ${taxRate}% tax for ${candidate.country}.`
    )
  } else {
    insightParts.push(
      `On ${salary.toLocaleString()} ${currency}/yr you keep ~$${takeHomeMonthly.toLocaleString()}/mo after tax vs ~$${numbeo.monthlyCost.toLocaleString()} living costs (Numbeo).`
    )
  }

  return {
    name: candidate.name,
    country: candidate.country,
    continent: candidate.continent,
    flag: candidate.flag,
    score,
    taxRate,
    monthlyRent: numbeo.monthlyRent,
    monthlyCost: numbeo.monthlyCost,
    takeHomeMonthly,
    monthlySavings,
    pros: buildPros(data, dimensions),
    cons: buildCons(data, dimensions),
    tags: candidate.tags,
    visa: candidate.visaNote,
    scores: dimensions,
    aiInsight: insightParts.join(' '),
  }
}
