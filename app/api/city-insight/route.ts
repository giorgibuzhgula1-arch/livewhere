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

type CityInsightPayload = {
  name: string
  country: string
  score: number
  taxRate: number
  monthlyCost: number
  monthlyRent: number
  monthlySavings: number
  takeHomeMonthly: number
  scores: {
    tax: number
    housing: number
    climate: number
    health: number
    stability: number
    safety: number
    expat?: number
  }
}

type CityInsightRequest = {
  city?: CityInsightPayload
}

function isCityInsightPayload(value: unknown): value is CityInsightPayload {
  if (!value || typeof value !== 'object') return false
  const city = value as Record<string, unknown>
  const scores = city.scores
  if (!scores || typeof scores !== 'object') return false
  const s = scores as Record<string, unknown>
  return (
    typeof city.name === 'string' &&
    typeof city.country === 'string' &&
    typeof city.score === 'number' &&
    typeof city.taxRate === 'number' &&
    typeof city.monthlyCost === 'number' &&
    typeof city.monthlyRent === 'number' &&
    typeof city.monthlySavings === 'number' &&
    typeof city.takeHomeMonthly === 'number' &&
    typeof s.tax === 'number' &&
    typeof s.housing === 'number' &&
    typeof s.climate === 'number' &&
    typeof s.health === 'number' &&
    typeof s.stability === 'number' &&
    typeof s.safety === 'number'
  )
}

function buildPrompt(city: CityInsightPayload): string {
  return `You are a retirement relocation advisor. Analyze this city match for a US retiree.

City: ${city.name}, ${city.country}
${JSON.stringify(city, null, 2)}

The match score (0–100) reflects how well this city fits the user's priorities.
Sub-scores (tax, housing, climate, health, stability, safety) are also 0–100.

Return ONLY valid JSON with exactly these keys:
{
  "savingsOver10Years": "$187,000",
  "healthcareNote": "Healthcare 12% better than average matches",
  "taxNote": "Tax burden 18% lower",
  "matchSummary": "One sentence why this city matches the user"
}

Rules:
- savingsOver10Years: estimate 10-year savings based on monthlySavings and monthlyCost, formatted like "$187,000".
- healthcareNote: short phrase about healthcare fit using the health score (e.g. "Healthcare 12% better than average matches").
- taxNote: short phrase about tax advantage using taxRate and tax score (e.g. "Tax burden 18% lower").
- matchSummary: one compelling personalized sentence for why this city matches the user.`
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
  let body: CityInsightRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isCityInsightPayload(body.city)) {
    return NextResponse.json({ error: 'city is required' }, { status: 400 })
  }

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
        temperature: 0.6,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You personalize retirement city matches. Respond with valid JSON only, no markdown.',
          },
          {
            role: 'user',
            content: buildPrompt(body.city),
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
