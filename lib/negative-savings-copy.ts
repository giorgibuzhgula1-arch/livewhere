import type { CityResult } from '@/lib/types'

const FACTOR_LABELS: Array<{ key: keyof CityResult['scores']; label: string }> = [
  { key: 'health', label: 'healthcare' },
  { key: 'safety', label: 'safety' },
  { key: 'tax', label: 'low taxes' },
  { key: 'housing', label: 'affordable housing' },
  { key: 'stability', label: 'long-term stability' },
  { key: 'climate', label: 'climate' },
  { key: 'expat', label: 'expat community' },
]

const GENERIC =
  'This city scores well on your selected priorities but living costs may exceed your stated budget.'

/** Highest city sub-scores — the same fields already on each card. */
export function negativeSavingsExplanation(city: CityResult): string | null {
  if (!(city.monthlySavings < 0)) return null

  const top = FACTOR_LABELS
    .map(({ key, label }) => ({ label, value: Number(city.scores?.[key] ?? 0) }))
    .filter((row) => Number.isFinite(row.value) && row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((row) => row.label)

  if (top.length === 0) return GENERIC
  if (top.length === 1) {
    return `This city scores well on ${top[0]} but living costs may exceed your stated budget.`
  }
  return `This city scores well on ${top[0]} and ${top[1]} but living costs may exceed your stated budget.`
}
