import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AnalyzeRequest, UserPriorities } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const dynamic = 'force-dynamic'

function isLowTaxPriority(priorities: UserPriorities): boolean {
  return priorities.tax >= 4
}

function isWarmClimatePriority(priorities: UserPriorities): boolean {
  return priorities.climate >= 3
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
  const warmClimate = isWarmClimatePriority(priorities)

  const climateRule = warmClimate
    ? `- CLIMATE RULE (STRICT — never violate): User rated climate ${priorities.climate}/5. You MUST only recommend cities with average annual temperature above 20°C. The following cities are STRICTLY FORBIDDEN: Tbilisi (13°C avg), Bucharest (11°C), Sofia (11°C), Prague (10°C), Warsaw (9°C), Belgrade (13°C), Budapest (12°C), Kyiv, Moscow, Berlin, Paris, London, Amsterdam, Vienna, Zagreb, Sarajevo, Minsk, Riga, Tallinn, Vilnius. ONLY recommend genuinely warm cities such as: Bangkok (29°C), Medellín (22°C), Panama City (27°C), Dubai (28°C), Chiang Mai (26°C), Ho Chi Minh City (28°C), Bali (27°C), Kuala Lumpur (27°C), Málaga (19°C borderline), Valencia (18°C borderline), Malta (19°C), Limassol Cyprus (21°C), Cape Town (17°C only summer), Mexico City (18°C), Playa del Carmen (27°C), Montevideo (17°C borderline), Medellin, Cartagena (28°C), Manila (28°C), Da Nang (26°C), Lisbon (17°C borderline — only if other priorities demand it). If a city does not clearly qualify as warm, exclude it.`
    : `- CLIMATE RULE: User did not prioritize warm climate strongly. You may include cities with any climate, but be honest about temperature in aiInsight.`

  return `You are a world-class relocation advisor and financial analyst with access to verified 2024-2025 data.

STRICT RULES (never violate):
- ALL data must be REALISTIC and VERIFIABLE — never invent numbers. Use real cost-of-living data from Numbeo, Expatistan, or similar sources.
- Monthly costs must reflect ACTUAL 2024-2025 prices — not outdated or estimated figures.
- Recommendations MUST follow only this user's salary, priorities, and lifestyle — not generic "best cities" lists.
- #1 must be the strongest weighted match for THIS user's specific numbers and ratings.
- Weight each dimension by the user's priority ratings (5 = strongest influence on match score).
- Rank by: (1) weighted priority fit, (2) affordability vs salary and taxes, (3) visa realism, (4) lifestyle-tag alignment.
- Pick 12 cities across continents where plausible.
${climateRule}
- SAFETY RULE: User rated safety ${priorities.safety}/5. ${priorities.safety >= 4 ? 'Avoid cities with high crime rates. Do NOT recommend: Medellín (high crime), Caracas, San Pedro Sula, Cape Town (high crime), Johannesburg, Manila (high crime areas), Mexico City (kidnapping risk). Prefer cities with low crime indexes.' : 'Safety is not a top priority but mention significant safety concerns in cons.'}
- HOUSING RULE: User rated affordable housing ${priorities.housing}/5. ${priorities.housing >= 4 ? 'Monthly rent for 1-bed apartment must be under $1,200. Exclude expensive cities like Dubai Marina, Singapore, Tokyo unless outer neighborhoods qualify.' : 'Include realistic rent figures from Numbeo 2024.'}
- HEALTHCARE RULE: User rated healthcare ${priorities.health}/5. ${priorities.health >= 4 ? 'Only recommend cities with reliable international-standard healthcare. Avoid cities where healthcare quality is poor for expats.' : 'Mention healthcare quality honestly in pros/cons.'}
- Lisbon: Do NOT place in top 3 unless it objectively beats all alternatives for this specific profile.
- aiInsight must be specific to THIS user — mention their salary, their priorities, real numbers. Never write generic travel-blog text.

User profile:
- Annual salary: ${salary} ${currency} (remote worker / location independent)
- Priorities (1-5 scale, 5 = most important):
  * Low taxes: ${priorities.tax}/5
  * Affordable housing: ${priorities.housing}/5
  * Good climate: ${priorities.climate}/5
  * Healthcare quality: ${priorities.health}/5
  * Nightlife & culture: ${priorities.nightlife}/5
  * Safety: ${priorities.safety}/5
- Lifestyle preferences: ${lifestyle.join(', ')}

Recommend exactly 12 cities worldwide.
Return ONLY a valid JSON array, no markdown, no explanation, no text before or after.

Each city object must have exactly these fields:
{
  "name": "City name",
  "country": "Country name",
  "continent": "Europe|Americas|Asia|Other",
  "flag": "emoji flag",
  "score": <0-100 integer>,
  "taxRate": <effective income tax % as integer>,
  "monthlyRent": <average 1-bed apartment rent in USD, from Numbeo 2024>,
  "monthlyCost": <total monthly living cost in USD including rent, from Numbeo 2024>,
  "pros": ["specific pro with real data", "specific pro with real data", "specific pro with real data", "specific pro with real data"],
  "cons": ["specific con with real data", "specific con with real data", "specific con with real data"],
  "tags": ["tag1", "tag2", "tag3"],
  "visa": "specific visa situation for remote workers from most countries",
  "scores": {
    "tax": <0-100>,
    "housing": <0-100>,
    "climate": <0-100>,
    "health": <0-100>,
    "nightlife": <0-100>,
    "safety": <0-100>
  },
  "aiInsight": "2-sentence insight referencing THIS user's salary of ${salary} ${currency} and their specific priorities"
}

Sort by score descending.
${taxRules}
`
}

const FREE_MAX_CITIES = 3

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

async function fetchCityArrayNonStreaming(prompt: string): Promise<unknown[] | null> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 4000,
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
          temperature: 0.3,
          max_tokens: 4000,
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