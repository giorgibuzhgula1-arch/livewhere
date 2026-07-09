import type { CityCompareMetrics } from '@/lib/compare'
import type { UserPriorities } from '@/lib/types'

export type CompareMetricKey =
  | 'cost'
  | 'rent'
  | 'healthcare'
  | 'safety'
  | 'tax'
  | 'climate'
  | 'airport'
  | 'internet'
  | 'walkability'
  | 'visa'
  | 'overall'

export type CompareMetricDef = {
  key: CompareMetricKey
  label: string
  shortLabel: string
  getValue: (m: CityCompareMetrics) => number
  formatValue: (value: number) => string
  higherIsBetter: boolean
  priorityKeys: (keyof UserPriorities)[]
  /** Minimum absolute gap to surface in the Difference section. */
  differenceThreshold: number
}

function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

export const COMPARE_METRICS: CompareMetricDef[] = [
  {
    key: 'cost',
    label: 'Monthly cost of living',
    shortLabel: 'Cost of living',
    getValue: (m) => m.monthlyCostOfLiving,
    formatValue: (v) => fmtUsd(v),
    higherIsBetter: false,
    priorityKeys: ['housing'],
    differenceThreshold: 75,
  },
  {
    key: 'rent',
    label: 'Monthly rent',
    shortLabel: 'Rent',
    getValue: (m) => m.monthlyRent,
    formatValue: (v) => fmtUsd(v),
    higherIsBetter: false,
    priorityKeys: ['housing'],
    differenceThreshold: 50,
  },
  {
    key: 'healthcare',
    label: 'Healthcare score',
    shortLabel: 'Healthcare',
    getValue: (m) => m.healthcareScore,
    formatValue: formatScore,
    higherIsBetter: true,
    priorityKeys: ['health'],
    differenceThreshold: 4,
  },
  {
    key: 'safety',
    label: 'Safety score',
    shortLabel: 'Safety',
    getValue: (m) => m.safetyScore,
    formatValue: formatScore,
    higherIsBetter: true,
    priorityKeys: ['safety', 'stability'],
    differenceThreshold: 4,
  },
  {
    key: 'tax',
    label: 'Tax score',
    shortLabel: 'Tax efficiency',
    getValue: (m) => m.taxScore,
    formatValue: formatScore,
    higherIsBetter: true,
    priorityKeys: ['tax'],
    differenceThreshold: 4,
  },
  {
    key: 'climate',
    label: 'Climate score',
    shortLabel: 'Climate',
    getValue: (m) => m.climateScore,
    formatValue: formatScore,
    higherIsBetter: true,
    priorityKeys: ['climate'],
    differenceThreshold: 4,
  },
  {
    key: 'airport',
    label: 'Airport access score',
    shortLabel: 'Airport access',
    getValue: (m) => m.airportScore,
    formatValue: formatScore,
    higherIsBetter: true,
    priorityKeys: ['stability'],
    differenceThreshold: 5,
  },
  {
    key: 'internet',
    label: 'Internet score',
    shortLabel: 'Internet',
    getValue: (m) => m.internetScore,
    formatValue: formatScore,
    higherIsBetter: true,
    priorityKeys: ['expat_community'],
    differenceThreshold: 5,
  },
  {
    key: 'walkability',
    label: 'Walkability score',
    shortLabel: 'Walkability',
    getValue: (m) => m.walkabilityScore,
    formatValue: formatScore,
    higherIsBetter: true,
    priorityKeys: ['housing'],
    differenceThreshold: 5,
  },
  {
    key: 'visa',
    label: 'Visa access score',
    shortLabel: 'Visa access',
    getValue: (m) => m.visaAccessScore,
    formatValue: formatScore,
    higherIsBetter: true,
    priorityKeys: ['visa_residency'],
    differenceThreshold: 5,
  },
  {
    key: 'overall',
    label: 'Overall relocation score',
    shortLabel: 'Overall score',
    getValue: (m) => m.overallRetirementScore,
    formatValue: formatScore,
    higherIsBetter: true,
    priorityKeys: ['tax', 'housing', 'health', 'safety', 'climate'],
    differenceThreshold: 3,
  },
]

export type MetricDifference = {
  key: CompareMetricKey
  label: string
  text: string
  favors: 'a' | 'b'
}

export type MetricContribution = {
  key: CompareMetricKey
  label: string
  favors: 'a' | 'b'
  weightedImpact: number
  rawGap: number
}

export type ComparisonAnalysis = {
  weightedScoreA: number
  weightedScoreB: number
  isTie: boolean
  winner: 'a' | 'b' | null
  contributions: MetricContribution[]
  winnerStrengths: MetricContribution[]
  loserStrengths: MetricContribution[]
  usedPriorities: boolean
  topPriorityLabels: string[]
}

function metricWeight(def: CompareMetricDef, priorities: UserPriorities | null | undefined): number {
  if (!priorities) return 1
  const total = def.priorityKeys.reduce((sum, key) => sum + (priorities[key] ?? 0), 0)
  return total / def.priorityKeys.length
}

function normalizeWeights(
  metrics: CompareMetricDef[],
  priorities: UserPriorities | null | undefined,
): Map<CompareMetricKey, number> {
  const raw = new Map<CompareMetricKey, number>()
  let sum = 0
  for (const def of metrics) {
    const w = metricWeight(def, priorities)
    raw.set(def.key, w)
    sum += w
  }
  const normalized = new Map<CompareMetricKey, number>()
  for (const def of metrics) {
    normalized.set(def.key, sum > 0 ? (raw.get(def.key) ?? 0) / sum : 1 / metrics.length)
  }
  return normalized
}

function advantageForA(valueA: number, valueB: number, higherIsBetter: boolean): number {
  const span = Math.max(Math.abs(valueA), Math.abs(valueB), 1)
  const delta = higherIsBetter ? valueA - valueB : valueB - valueA
  return Math.max(-1, Math.min(1, delta / span))
}

function topPriorityLabels(priorities: UserPriorities): string[] {
  const labels: Record<keyof UserPriorities, string> = {
    tax: 'tax efficiency',
    housing: 'housing and living costs',
    climate: 'climate fit',
    health: 'healthcare quality',
    stability: 'political stability',
    safety: 'personal safety',
    expat_community: 'expat community',
    visa_residency: 'visa and residency access',
  }
  return (Object.keys(priorities) as (keyof UserPriorities)[])
    .sort((a, b) => priorities[b] - priorities[a])
    .slice(0, 2)
    .map((key) => labels[key])
}

function joinNatural(parts: string[]): string {
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

export function analyzeComparison(
  metricsA: CityCompareMetrics,
  metricsB: CityCompareMetrics,
  priorities?: UserPriorities | null,
): ComparisonAnalysis {
  const weights = normalizeWeights(COMPARE_METRICS, priorities)
  const contributions: MetricContribution[] = []
  let weightedScoreA = 0
  let weightedScoreB = 0

  for (const def of COMPARE_METRICS) {
    const valueA = def.getValue(metricsA)
    const valueB = def.getValue(metricsB)
    const advantage = advantageForA(valueA, valueB, def.higherIsBetter)
    const weight = weights.get(def.key) ?? 0
    const impact = Math.abs(advantage) * weight

    if (advantage > 0) weightedScoreA += impact
    else if (advantage < 0) weightedScoreB += impact

    if (Math.abs(valueA - valueB) >= def.differenceThreshold * 0.5) {
      contributions.push({
        key: def.key,
        label: def.shortLabel,
        favors: advantage >= 0 ? 'a' : 'b',
        weightedImpact: impact,
        rawGap: valueA - valueB,
      })
    }
  }

  const sorted = [...contributions].sort((a, b) => b.weightedImpact - a.weightedImpact)
  const margin = Math.abs(weightedScoreA - weightedScoreB)
  const isTie = margin < 0.04

  let winner: 'a' | 'b' | null = null
  if (!isTie) {
    winner = weightedScoreA > weightedScoreB ? 'a' : 'b'
  }

  const winnerStrengths = isTie
    ? sorted.slice(0, 2)
    : sorted.filter((c) => c.favors === winner).slice(0, 3)

  const loserSide: 'a' | 'b' | null = isTie ? null : winner === 'a' ? 'b' : 'a'
  const loserStrengths = isTie
    ? sorted.slice(2, 4)
    : sorted.filter((c) => c.favors === loserSide).slice(0, 2)

  return {
    weightedScoreA,
    weightedScoreB,
    isTie,
    winner,
    contributions: sorted,
    winnerStrengths: isTie ? sorted.slice(0, 2) : winnerStrengths,
    loserStrengths: isTie ? sorted.slice(2, 4) : loserStrengths,
    usedPriorities: Boolean(priorities),
    topPriorityLabels: priorities ? topPriorityLabels(priorities) : [],
  }
}

export function buildMetricDifferences(
  metricsA: CityCompareMetrics,
  metricsB: CityCompareMetrics,
): MetricDifference[] {
  const nameA = metricsA.city.name
  const nameB = metricsB.city.name
  const differences: MetricDifference[] = []

  for (const def of COMPARE_METRICS) {
    const valueA = def.getValue(metricsA)
    const valueB = def.getValue(metricsB)
    const gap = Math.abs(valueA - valueB)
    if (gap < def.differenceThreshold) continue

    const favorsB = def.higherIsBetter ? valueB > valueA : valueB < valueA
    const favors: 'a' | 'b' = favorsB ? 'b' : 'a'
    const winnerName = favors === 'a' ? nameA : nameB

    let text: string
    if (def.key === 'cost' || def.key === 'rent') {
      text = `${def.shortLabel}: ${winnerName} is ${fmtUsd(gap)}/mo ${favors === 'a' ? 'cheaper' : 'lower'}`
    } else if (def.key === 'tax') {
      text = `${def.shortLabel}: ${winnerName} scores ${formatScore(gap)} points higher on tax efficiency`
    } else {
      text = `${def.shortLabel}: ${winnerName} scores ${formatScore(gap)} points higher`
    }

    differences.push({ key: def.key, label: def.shortLabel, text, favors })
  }

  return differences.sort((a, b) => {
    const rank: Record<CompareMetricKey, number> = {
      cost: 0,
      overall: 1,
      healthcare: 2,
      safety: 3,
      tax: 4,
      climate: 5,
      rent: 6,
      visa: 7,
      airport: 8,
      internet: 9,
      walkability: 10,
    }
    return rank[a.key] - rank[b.key]
  })
}

export function generateCompareVerdict(
  metricsA: CityCompareMetrics,
  metricsB: CityCompareMetrics,
  priorities?: UserPriorities | null,
): string {
  const analysis = analyzeComparison(metricsA, metricsB, priorities)
  const nameA = metricsA.city.name
  const nameB = metricsB.city.name

  if (analysis.isTie) {
    const splitA = analysis.contributions.filter((c) => c.favors === 'a').map((c) => c.label)
    const splitB = analysis.contributions.filter((c) => c.favors === 'b').map((c) => c.label)
    const priorityNote = analysis.usedPriorities
      ? ` With your quiz weighting ${joinNatural(analysis.topPriorityLabels)} highest, neither city separates clearly enough to call a confident winner.`
      : ' With equal weighting across metrics, neither city separates clearly enough to call a confident winner.'
    return `${nameA} and ${nameB} trade advantages in a tight matchup.${priorityNote} ${nameA} leads on ${joinNatural(splitA.slice(0, 2)) || 'a few secondary metrics'}, while ${nameB} answers back on ${joinNatural(splitB.slice(0, 2)) || 'comparable strengths'}. Treat this as a draw on paper and use lifestyle fit, visa practicality, and an on-the-ground trial to break the tie.`
  }

  const winnerMetrics = analysis.winner === 'a' ? metricsA : metricsB
  const loserMetrics = analysis.winner === 'a' ? metricsB : metricsA
  const winnerName = winnerMetrics.city.name
  const loserName = loserMetrics.city.name
  const strengthLabels = analysis.winnerStrengths.map((c) => c.label)

  let verdict = `${winnerName} is the stronger relocation pick overall when measured against ${loserName}.`

  if (strengthLabels.length > 0) {
    const driverPhrase = analysis.usedPriorities
      ? `, which align with the priorities you set in your quiz`
      : ''
    verdict += ` The edge is built on ${joinNatural(strengthLabels)}${driverPhrase}.`
  }

  if (analysis.loserStrengths.length > 0) {
    const tradeoffLabels = analysis.loserStrengths.map((c) => c.label)
    verdict += ` ${loserName} still deserves consideration if ${joinNatural(tradeoffLabels)} rank higher in your personal trade-off stack.`
  }

  const costDef = COMPARE_METRICS.find((d) => d.key === 'cost')!
  const costGap = Math.abs(costDef.getValue(metricsA) - costDef.getValue(metricsB))
  if (costGap >= costDef.differenceThreshold) {
    const cheaper = costDef.getValue(metricsA) < costDef.getValue(metricsB) ? nameA : nameB
    verdict += ` On monthly living costs alone, ${cheaper} runs about ${fmtUsd(costGap)} less per month.`
  }

  if (analysis.usedPriorities) {
    verdict += ` Because you weighted ${joinNatural(analysis.topPriorityLabels)} most heavily, those categories carried extra influence in this verdict.`
  } else {
    verdict += ` No quiz priority profile was loaded, so each metric was weighted equally—complete the LiveWhere quiz for a verdict tuned to your stated preferences.`
  }

  return verdict
}
