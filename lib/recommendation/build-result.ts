import {
  computeDimensionScores,
  computeWeightedScore,
  type DimensionScores,
} from '@/lib/recommendation/scoring'
import type { CityRecord } from '@/lib/recommendation/city-database'
import type { AnalyzeRequest, CityResult } from '@/lib/types'

function buildPros(city: CityRecord, dimensions: DimensionScores): string[] {
  const pros: string[] = [
    `${city.taxRate}% effective income tax (2025–2026, ${city.country})`,
    `1-bed rent $${city.monthlyRent.toLocaleString()}/mo · total ~$${city.monthlyCost.toLocaleString()}/mo (Numbeo 2025)`,
    `Safety ${city.safetyIndex}/100 · crime index ${city.crimeIndex} (Numbeo)`,
    `Healthcare index ${city.healthcareIndex} · ~${city.avgTempC}°C mean annual temp`,
  ]
  if (dimensions.nightlife >= 80) pros.push('Strong nightlife & culture scene')
  return pros.slice(0, 4)
}

function buildCons(city: CityRecord, dimensions: DimensionScores): string[] {
  const cons: string[] = []
  if (city.taxRate > 25) cons.push(`Higher income tax (${city.taxRate}%) for remote earners`)
  if (city.monthlyRent >= 1200) cons.push(`Rent above nomad budget tier ($${city.monthlyRent}/mo)`)
  if (city.crimeIndex >= 45) cons.push(`Crime index ${city.crimeIndex} — research neighborhoods carefully`)
  if (dimensions.climate < 55) cons.push(`Climate (${city.avgTempC}°C avg) may not match warm/cool preferences`)
  if (city.healthcareIndex < 65) cons.push(`Healthcare index ${city.healthcareIndex} — confirm insurance & providers`)
  if (cons.length < 2) cons.push('Visa and tax residency depend on your passport — verify locally')
  return cons.slice(0, 3)
}

export function buildCityResult(
  city: CityRecord,
  body: AnalyzeRequest,
  rank: number
): CityResult {
  const { salary, currency, priorities, lifestyle } = body
  const dimensions = computeDimensionScores(city, priorities, lifestyle)
  const takeHomeYearly = Math.round(salary * (1 - city.taxRate / 100))
  const takeHomeMonthly = Math.round(takeHomeYearly / 12)
  const monthlySavings = takeHomeMonthly - city.monthlyCost
  const score = computeWeightedScore(dimensions, priorities, monthlySavings, salary)

  return {
    name: city.name,
    country: city.country,
    continent: city.continent,
    flag: city.flag,
    score,
    taxRate: city.taxRate,
    monthlyRent: city.monthlyRent,
    monthlyCost: city.monthlyCost,
    takeHomeMonthly,
    monthlySavings,
    pros: buildPros(city, dimensions),
    cons: buildCons(city, dimensions),
    tags: city.tags,
    visa: city.visaNote,
    scores: dimensions,
    aiInsight: `${city.flag} ${city.name} ranks #${rank} (${score}/100). At ${salary.toLocaleString()} ${currency}/yr you keep ~$${takeHomeMonthly.toLocaleString()}/mo after ${city.taxRate}% tax vs ~$${city.monthlyCost.toLocaleString()}/mo living costs — ${city.avgTempC}°C climate, crime index ${city.crimeIndex}, healthcare ${city.healthcareIndex}.`,
  }
}
