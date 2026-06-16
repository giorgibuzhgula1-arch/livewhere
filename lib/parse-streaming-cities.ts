import { AnalyzeRequest, CityResult } from '@/lib/types'

function stripForJsonPeel(raw: string): string {
  return raw.replace(/^\uFEFF/, '').replace(/```json|```/gi, '').trim()
}

/** Prefer the opening bracket of a top-level `[ { ...` city array over stray `[` in prose. */
function findArrayBracket(cleaned: string): number {
  const hint = cleaned.match(/\[\s*\{/)
  if (hint?.index !== undefined) return hint.index
  return cleaned.indexOf('[')
}

function dedupeAndSort(items: unknown[], monthlyBudget: number): CityResult[] {
  const seen = new Map<string, CityResult>()
  for (const obj of items) {
    const city = normalizePeeledCity(obj, monthlyBudget)
    if (city) seen.set(`${city.name}|${city.country}`, city)
  }
  return Array.from(seen.values()).sort((a, b) => b.score - a.score)
}

/**
 * Peel complete top-level `{ ... }` objects from a streamed JSON array.
 * Handles strings and escapes so `{`/`}` inside string values don't break depth.
 */
export function peelCompleteObjectsFromJsonArray(raw: string): unknown[] {
  const cleaned = stripForJsonPeel(raw)
  const bracket = findArrayBracket(cleaned)
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
    if (c === ']' && depth === 0 && objStart === -1) {
      break
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

/** Rescale a 0–10 rating to 0–100 (the model sometimes returns 9 instead of 90). */
function scale100(n: number): number {
  const scaled = n > 0 && n <= 10 ? n * 10 : n
  return Math.max(0, Math.min(100, Math.round(scaled)))
}

function normalizeScores(raw: unknown): CityResult['scores'] {
  if (!raw || typeof raw !== 'object') {
    return { tax: 0, housing: 0, climate: 0, health: 0, stability: 0, safety: 0 }
  }
  const o = raw as Record<string, unknown>
  return {
    tax: scale100(asNum(o.tax)),
    housing: scale100(asNum(o.housing)),
    climate: scale100(asNum(o.climate)),
    health: scale100(asNum(o.health)),
    stability: scale100(asNum(o.stability, asNum(o.nightlife))),
    safety: scale100(asNum(o.safety)),
  }
}

/**
 * Normalize a peeled object into CityResult when enough fields exist to render a card.
 */
export function normalizePeeledCity(raw: unknown, monthlyBudget: number): CityResult | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const name = o.name
  if (typeof name !== 'string' || !name.trim()) return null

  const taxRate = asNum(o.taxRate)
  const monthlyRent = asNum(o.monthlyRent)
  const monthlyCost = asNum(o.monthlyCost)
  const score = scale100(asNum(o.score, 50))

  const takeHomeMonthly = Math.round(asNum(o.takeHomeMonthly, monthlyBudget))
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
  const cleaned = stripForJsonPeel(raw)
  if (cleaned) {
    try {
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) {
        return dedupeAndSort(parsed, body.monthlyBudget)
      }
    } catch {
      /* Incomplete stream or leading prose — use incremental peel */
    }
  }
  return dedupeAndSort(peelCompleteObjectsFromJsonArray(raw), body.monthlyBudget)
}
