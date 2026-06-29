import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export type CompareInsights = {
  savingsOver10Years: string
  healthcareAdvantage: string
  taxAdvantage: string
  matchScore: string
  topReason: string
  summary: string
}

type CityPayload = {
  name: string
  country: string
  monthlyCostOfLiving: number
  monthlyRent: number
  healthcareScore: number
  safetyScore: number
  taxScore: number
  climateScore: number
  airportScore: number
  internetScore: number
  walkabilityScore: number
  visaAccessScore: number
  overallRetirementScore: number
}

type CompareInsightsRequest = {
  cityA?: CityPayload
  cityB?: CityPayload
}

function isCityPayload(value: unknown): value is CityPayload {
  if (!value || typeof value !== 'object') return false
  const city = value as Record<string, unknown>
  return (
    typeof city.name === 'string' &&
    typeof city.country === 'string' &&
    typeof city.monthlyCostOfLiving === 'number' &&
    typeof city.monthlyRent === 'number' &&
    typeof city.healthcareScore === 'number' &&
    typeof city.safetyScore === 'number' &&
    typeof city.taxScore === 'number' &&
    typeof city.climateScore === 'number' &&
    typeof city.airportScore === 'number' &&
    typeof city.internetScore === 'number' &&
    typeof city.walkabilityScore === 'number' &&
    typeof city.visaAccessScore === 'number' &&
    typeof city.overallRetirementScore === 'number'
  )
}

function buildPrompt(cityA: CityPayload, cityB: CityPayload): string {
  return `You are a retirement relocation advisor. Compare these two cities for a US retiree considering moving abroad.

City A: ${cityA.name}, ${cityA.country}
${JSON.stringify(cityA, null, 2)}

City B: ${cityB.name}, ${cityB.country}
${JSON.stringify(cityB, null, 2)}

Scores are on a 0–100 scale (higher is better except monthly costs are in USD).
Determine which city is the better overall retirement destination based on the data.

Return ONLY valid JSON with exactly these keys:
{
  "savingsOver10Years": "$187,000",
  "healthcareAdvantage": "Healthcare quality 12% better",
  "taxAdvantage": "Tax burden 34% lower",
  "matchScore": "94%",
  "topReason": "one sentence why the winning city is better for retirees",
  "summary": "2-3 sentence personalized retirement analysis comparing both cities"
}

Rules:
- savingsOver10Years: estimate 10-year savings from lower monthly cost of living (winner vs loser), formatted like "$187,000". If costs are similar, use a modest realistic figure.
- healthcareAdvantage: compare healthcare scores as a percentage advantage for the winner.
- taxAdvantage: compare tax scores as a percentage advantage for the winner (higher tax score = lower burden).
- matchScore: retirement fit percentage for the winning city (typically 70–98%).
- topReason: one compelling sentence for the winner.
- summary: 2-3 sentences, personalized and specific to these cities.`
}

function parseInsights(raw: string): CompareInsights | null {
  try {
    const parsed = JSON.parse(raw) as Partial<CompareInsights>
    const required: (keyof CompareInsights)[] = [
      'savingsOver10Years',
      'healthcareAdvantage',
      'taxAdvantage',
      'matchScore',
      'topReason',
      'summary',
    ]
    for (const key of required) {
      if (typeof parsed[key] !== 'string' || !parsed[key]?.trim()) {
        return null
      }
    }
    return parsed as CompareInsights
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  let body: CompareInsightsRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isCityPayload(body.cityA) || !isCityPayload(body.cityB)) {
    return NextResponse.json({ error: 'cityA and cityB are required' }, { status: 400 })
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
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You compare international cities for retirees. Respond with valid JSON only, no markdown.',
          },
          {
            role: 'user',
            content: buildPrompt(body.cityA, body.cityB),
          },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('OpenAI compare-insights failed:', res.status, errText)
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 })
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 502 })
    }

    const insights = parseInsights(content)
    if (!insights) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, insights })
  } catch (err) {
    console.error('compare-insights error:', err)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}
