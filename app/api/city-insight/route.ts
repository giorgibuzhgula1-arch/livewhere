import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export type CityInsight = {
  savingsOver10Years: string
  healthcareNote: string
  taxNote: string
  matchSummary: string
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function pickNumber(city: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = asNumber(city[key])
    if (value != null) return value
  }
  const scores = city.scores
  if (scores && typeof scores === 'object') {
    const scoreRecord = scores as Record<string, unknown>
    for (const key of keys) {
      const value = asNumber(scoreRecord[key])
      if (value != null) return value
    }
  }
  return 0
}

function normalizeCity(city: Record<string, unknown>) {
  return {
    name: String(city.name ?? 'Unknown city').trim(),
    country: String(city.country ?? 'Unknown country').trim(),
    score: pickNumber(city, ['score', 'matchScore', 'match_score']),
    monthlyCost: pickNumber(city, ['monthlyCost', 'monthly_cost', 'monthlyCostOfLiving']),
    monthlySavings: pickNumber(city, ['monthlySavings', 'monthly_savings']),
    taxRate: pickNumber(city, ['taxRate', 'tax_rate']),
    healthcareScore: pickNumber(city, ['healthcareScore', 'healthcare_score', 'health']),
    safetyScore: pickNumber(city, ['safetyScore', 'safety_score', 'safety']),
  }
}

function hasCityName(city: unknown): city is Record<string, unknown> {
  if (!city || typeof city !== 'object') return false
  const name = (city as Record<string, unknown>).name
  return typeof name === 'string' && name.trim().length > 0
}

function formatUsd(amount: number): string {
  return `$${Math.round(Math.abs(amount)).toLocaleString('en-US')}`
}

function buildPrompt(city: ReturnType<typeof normalizeCity>): string {
  const tenYearSavings = Math.round(city.monthlySavings * 12 * 10)
  const savingsLabel =
    tenYearSavings >= 0
      ? formatUsd(tenYearSavings)
      : `-${formatUsd(tenYearSavings)}`

  return `Analyze this specific retirement city match. Use ONLY the numbers below — do not invent or reuse placeholder figures.

CITY DATA (use these exact values):
- City: ${city.name}, ${city.country}
- Match score: ${city.score}/100
- Monthly cost of living: ${formatUsd(city.monthlyCost)}/mo
- Monthly savings vs US baseline: ${city.monthlySavings >= 0 ? '+' : ''}${formatUsd(city.monthlySavings)}/mo
- Estimated 10-year savings: ${savingsLabel} (monthly savings × 120 months)
- Tax rate: ${city.taxRate}%
- Healthcare score: ${city.healthcareScore}/100
- Safety score: ${city.safetyScore}/100

Return ONLY valid JSON with these keys (no markdown):
{
  "savingsOver10Years": "<formatted dollar amount derived from the 10-year savings figure above>",
  "healthcareNote": "<short phrase referencing ${city.name}'s healthcare score of ${city.healthcareScore}/100>",
  "taxNote": "<short phrase referencing ${city.name}'s ${city.taxRate}% tax rate and how it compares for retirees>",
  "matchSummary": "<one sentence naming ${city.name} and why its ${city.score}/100 match score fits this retiree>"
}

Rules:
- savingsOver10Years must reflect the estimated 10-year savings (${savingsLabel}), formatted like "$42,000" or "-$12,000".
- healthcareNote must mention the healthcare score (${city.healthcareScore}/100) in context.
- taxNote must reference the ${city.taxRate}% tax rate specifically.
- matchSummary must include the city name "${city.name}" and be unique to this city's data.
- Never copy example numbers from instructions; every value must come from the CITY DATA above.`
}

function parseInsight(raw: string): CityInsight | null {
  try {
    const parsed = JSON.parse(raw) as Partial<CityInsight>
    const required: (keyof CityInsight)[] = [
      'savingsOver10Years',
      'healthcareNote',
      'taxNote',
      'matchSummary',
    ]
    for (const key of required) {
      if (typeof parsed[key] !== 'string' || !parsed[key]?.trim()) {
        return null
      }
    }
    return parsed as CityInsight
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  console.log('[city-insight] received body:', JSON.stringify(body, null, 2))

  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const rawCity = record?.city ?? record

  if (!hasCityName(rawCity)) {
    return NextResponse.json({ error: 'city.name is required' }, { status: 400 })
  }

  const city = normalizeCity(rawCity)

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You write city-specific retirement insights. Always use the exact numbers provided in the user message. Never return generic or identical text across different cities. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: buildPrompt(city),
          },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('OpenAI city-insight failed:', res.status, errText)
      return NextResponse.json({ error: 'AI insight failed' }, { status: 502 })
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 502 })
    }

    const insight = parseInsight(content)
    if (!insight) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, insight })
  } catch (err) {
    console.error('city-insight error:', err)
    return NextResponse.json({ error: 'AI insight failed' }, { status: 500 })
  }
}
