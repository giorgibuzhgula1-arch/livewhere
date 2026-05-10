import { AnalyzeRequest, CityResult } from '@/lib/types'

/**
 * Peel complete top-level `{ ... }` objects from a streamed JSON array.
 * Handles strings and escapes so `{`/`}` inside string values don't break depth.
 */
export function peelCompleteObjectsFromJsonArray(raw: string): unknown[] {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const bracket = cleaned.indexOf('[')
  if (bracket === -1) return []

  const s = cleaned
  let i = bracket + 1
  const out: unknown[] = []
  let depth = 0
  let inString = false
  let escape = false
  let objStart = -1

  while (i < s.length) {
    const c = s[i]
    if (inString) {
      if (escape) escape = false
      else if (c === '\\') escape = true
      else if (c === '"') inString = false
      i++
      continue
    }
    if (c === '"') {
      inString = true
      i++
      continue
    }
    if (c === '{') {
      if (depth === 0) objStart = i
      depth++
      i++
      continue
    }
    if (c === '}') {
      depth--
      i++
      if (depth === 0 && objStart !== -1) {
        const slice = s.slice(objStart, i)
        try {
          out.push(JSON.parse(slice))
        } catch {
          // Should not happen if brace matching is sound; skip
        }
        objStart = -1
        while (i < s.length && (s[i] === ',' || /\s/.test(s[i]))) i++
      }
      continue
    }
    i++
  }

  return out
}

function asNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string' && v.trim() !== '') return Number(v) || fallback
  return fallback
}

function normalizeScores(raw: unknown): CityResult['scores'] {
  if (!raw || typeof raw !== 'object') {
    return { tax: 0, housing: 0, climate: 0, health: 0, nightlife: 0, safety: 0 }
  }
  const o = raw as Record<string, unknown>
  return {
    tax: asNum(o.tax),
    housing: asNum(o.housing),
    climate: asNum(o.climate),
    health: asNum(o.health),
    nightlife: asNum(o.nightlife),
    safety: asNum(o.safety),
  }
}

/**
 * Normalize a peeled object into CityResult when enough fields exist to render a card.
 */
export function normalizePeeledCity(raw: unknown, salary: number): CityResult | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const name = o.name
  if (typeof name !== 'string' || !name.trim()) return null

  const taxRate = asNum(o.taxRate)
  const monthlyRent = asNum(o.monthlyRent)
  const monthlyCost = asNum(o.monthlyCost)
  const score = asNum(o.score, 50)

  const takeHomeYearly = Math.round(salary * (1 - taxRate / 100))
  const takeHomeMonthly = Math.round(takeHomeYearly / 12)
  const monthlySavings = takeHomeMonthly - monthlyCost

  const pros = Array.isArray(o.pros) ? o.pros.filter((x): x is string => typeof x === 'string') : []
  const cons = Array.isArray(o.cons) ? o.cons.filter((x): x is string => typeof x === 'string') : []
  const tags = Array.isArray(o.tags) ? o.tags.filter((x): x is string => typeof x === 'string') : []

  return {
    name,
    country: typeof o.country === 'string' ? o.country : '—',
    continent: typeof o.continent === 'string' ? o.continent : 'Other',
    flag: typeof o.flag === 'string' ? o.flag : '🏙️',
    score,
    taxRate,
    monthlyRent,
    monthlyCost,
    takeHomeMonthly,
    monthlySavings,
    pros,
    cons,
    tags,
    visa: typeof o.visa === 'string' ? o.visa : '',
    scores: normalizeScores(o.scores),
    aiInsight: typeof o.aiInsight === 'string' ? o.aiInsight : '',
  }
}

export function parseStreamingBufferToCities(raw: string, body: AnalyzeRequest): CityResult[] {
  const peeled = peelCompleteObjectsFromJsonArray(raw)
  const seen = new Map<string, CityResult>()
  for (const obj of peeled) {
    const city = normalizePeeledCity(obj, body.salary)
    if (city) seen.set(`${city.name}|${city.country}`, city)
  }
  return Array.from(seen.values()).sort((a, b) => b.score - a.score)
}
