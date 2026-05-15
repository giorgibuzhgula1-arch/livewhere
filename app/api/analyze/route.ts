import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AnalyzeRequest, UserPriorities } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const dynamic = 'force-dynamic'

/** User prioritized low taxes (High/Max on the tax slider). */
function isLowTaxPriority(priorities: UserPriorities): boolean {
  return priorities.tax >= 4
}

function buildTaxRulesSection(body: AnalyzeRequest): string {
  const { salary, currency, priorities } = body
  const lowTaxFocus = isLowTaxPriority(priorities)

  const base = `
TAX DATA (mandatory — never guess or round loosely):
- "taxRate" = realistic effective personal income tax % for a remote worker with ~${salary} ${currency}/year living/working in that city under current (2024–2025) national rules. Use documented statutory rates, flat-tax regimes, or widely cited effective rates from tax authorities — not ballpark estimates.
- Cross-check each city: if you cannot cite a defensible published rate for that jurisdiction, exclude that city and substitute another you can justify.
- Examples of realistic bands (verify before using): UAE 0%; Georgia ~1% on small business/foreign income paths; Paraguay ~10%; Bulgaria 10% flat; Romania ~10% for micro; Portugal NHR ended — do not use outdated 0% claims; US cities must reflect US federal+state if applicable, or the foreign host country rate for a tax resident there.
- "scores.tax" must align with taxRate (lower taxRate → higher scores.tax when user cares about taxes).`

  if (!lowTaxFocus) return base

  return `${base}
- LOW-TAX PRIORITY (user rated Low taxes ${priorities.tax}/5): Every recommended city MUST have taxRate strictly under 10 (integer 0–9 only). Do not include any city at 10% or above. Prefer well-known low-tax hubs (e.g. UAE, Georgia, Paraguay, Bulgaria, Romania, Malaysia MM2H context, Panama, etc.) that genuinely qualify. All 12 cities in the array must satisfy taxRate < 10.`
}

function enforceLowTaxCities<T extends { taxRate?: unknown }>(cities: T[], priorities: UserPriorities): T[] {
  if (!isLowTaxPriority(priorities)) return cities
  return cities.filter((c) => {
    const rate = Number(c.taxRate)
    return Number.isFinite(rate) && rate < 10
  })
}

function buildPrompt(body: AnalyzeRequest) {
  const { salary, currency, priorities, lifestyle } = body
  const taxRules = buildTaxRulesSection(body)

  return `You are a world-class relocation advisor and financial analyst.

STRICT RULES (never violate):
- Recommendations MUST follow only this user's salary, priorities, and lifestyle—not generic “best cities” stereotypes or places commonly repeated for remote workers unless they objectively win on THIS weighted profile.
- #1 must be the strongest weighted match for THIS user's numbers and ratings; do not pick a habitual default or famous hub without proving stronger fit than alternatives across their highest-rated priorities.
- Weight each dimension by the user's priority ratings (5 = strongest influence on match score). Cities that shine only on dimensions the user rated low must NOT outrank cities that satisfy dimensions they rated high.
- Rank by: (1) weighted priority fit, (2) affordability vs salary and taxes, (3) visa realism for remote workers where relevant, (4) lifestyle-tag alignment.
- Pick 12 cities across continents where plausible; geographic spread must not override honest ranking for this profile.
- Lisbon, Portugal: Do NOT place it in the top 3 positions (ranks 1–3) unless, after applying this user's weighted priorities and salary, Lisbon objectively beats every other candidate that could occupy those slots—i.e. it genuinely scores highest among all cities for this profile in those positions. If another city fits this user's top-rated priorities better, rank Lisbon fourth or lower. When in doubt, deprioritize Lisbon relative to stronger profile-specific matches.

User profile:
- Annual salary: ${salary} ${currency} (remote worker / location independent)
- Priorities (1-5 scale, 5 = most important)—use these as weights:
  * Low taxes: ${priorities.tax}/5
  * Affordable housing: ${priorities.housing}/5
  * Good climate: ${priorities.climate}/5
  * Healthcare quality: ${priorities.health}/5
  * Nightlife & culture: ${priorities.nightlife}/5
  * Safety: ${priorities.safety}/5
- Lifestyle preferences: ${lifestyle.join(', ')}

Recommend exactly 12 cities worldwide (spread across continents where plausible).
For each city return a JSON object. Return ONLY a valid JSON array, no markdown, no explanation.

Each city object must have exactly these fields:
{
  "name": "City name",
  "country": "Country name",
  "continent": "Europe|Americas|Asia|Other",
  "flag": "emoji flag",
  "score": <0-100 integer, personalized match score based on user priorities>,
  "taxRate": <effective income tax % as integer>,
  "monthlyRent": <average 1-bed apartment rent in USD>,
  "monthlyCost": <total monthly living cost in USD including rent>,
  "pros": ["pro 1", "pro 2", "pro 3", "pro 4"],
  "cons": ["con 1", "con 2", "con 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "visa": "visa difficulty description",
  "scores": {
    "tax": <0-100>,
    "housing": <0-100>,
    "climate": <0-100>,
    "health": <0-100>,
    "nightlife": <0-100>,
    "safety": <0-100>
  },
  "aiInsight": "2-sentence personalized insight for this specific user about why this city matches their profile"
}

Sort by score descending (highest match first). The first row must be the single best weighted match for THIS user—not a generic popular pick.
${taxRules}
Use plausible real-world cost-of-living figures; keep each city's "scores" object consistent with how well that city serves each dimension for this user.
`
}

const FREE_MAX_CITIES = 3

/** Pro users get the full list; free users get the top three cities by score only. */
function applyPlanResultLimit<T extends { score?: unknown }>(enriched: T[], plan: string): T[] {
  const sorted = [...enriched].sort((a, b) => Number(b.score) - Number(a.score))
  if (plan === 'pro') return sorted
  return sorted.slice(0, FREE_MAX_CITIES)
}

const CLEAN_JSON_FENCE = /```json|```/gi

function stripAndParseJsonArray(raw: string): unknown[] | null {
  const clean = raw.replace(CLEAN_JSON_FENCE, '').trim()
  try {
    const v = JSON.parse(clean)
    return Array.isArray(v) ? v : null
  } catch {
    return null
  }
}

/** Full non-streaming completion when the streamed response is truncated or invalid JSON. */
async function fetchCityArrayNonStreaming(prompt: string): Promise<unknown[] | null> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 2000,
  })
  const content = res.choices[0]?.message?.content ?? ''
  return stripAndParseJsonArray(content)
}

export async function POST(req: NextRequest) {
  let body: AnalyzeRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const authHeader = req.headers.get('Authorization')
  let userId: string | null = null
  let plan = 'free'

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (user) {
      userId = user.id
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('plan, searches_this_month')
        .eq('id', user.id)
        .single()

      plan = profile?.plan || 'free'

      if (plan === 'free' && (profile?.searches_this_month || 0) >= 3) {
        return NextResponse.json(
          { error: 'Free plan limit reached. Upgrade to Pro for unlimited searches.' },
          { status: 403 }
        )
      }
    }
  }

  const { salary, currency, priorities, lifestyle } = body
  const prompt = buildPrompt(body)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        send({
          type: 'limits',
          maxCities: plan === 'pro' ? null : FREE_MAX_CITIES,
        })

        const aiStream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: isLowTaxPriority(priorities) ? 0.4 : 0.6,
          max_tokens: 2000,
          stream: true,
        })

        let full = ''
        let finishReason: string | null = null
        for await (const chunk of aiStream) {
          const choice = chunk.choices[0]
          if (choice?.finish_reason) finishReason = choice.finish_reason
          const piece = choice?.delta?.content ?? ''
          if (piece) {
            full += piece
            send({ type: 'delta', text: piece })
          }
        }

        let cities = stripAndParseJsonArray(full)
        const truncated = finishReason === 'length'
        const parseFailed = cities === null

        if (truncated || parseFailed) {
          cities = await fetchCityArrayNonStreaming(prompt)
        }

        if (cities === null) {
          send({ type: 'error', error: 'Could not parse AI response' })
          return
        }

        const taxFiltered = enforceLowTaxCities(
          cities as { taxRate?: unknown }[],
          priorities
        )

        const enriched = taxFiltered.map((city: unknown) => {
          const row = city as Record<string, unknown>
          const c = row as { taxRate: number; monthlyCost: number }
          const takeHomeYearly = Math.round(salary * (1 - Number(c.taxRate) / 100))
          const takeHomeMonthly = Math.round(takeHomeYearly / 12)
          const monthlySavings = takeHomeMonthly - Number(c.monthlyCost)
          return { ...row, takeHomeMonthly, monthlySavings }
        })

        const resultsForClient = applyPlanResultLimit(enriched as { score?: unknown }[], plan) as typeof enriched

        if (userId) {
          await supabaseAdmin.from('searches').insert({
            user_id: userId,
            salary,
            currency,
            priorities,
            lifestyle,
            results: resultsForClient,
          })

          await supabaseAdmin
            .from('profiles')
            .update({ searches_this_month: supabaseAdmin.rpc('increment', { x: 1 }) })
            .eq('id', userId)
        }

        send({ type: 'done', cities: resultsForClient })
      } catch (err) {
        console.error('OpenAI error:', err)
        send({ type: 'error', error: 'AI analysis failed' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
