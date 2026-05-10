import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AnalyzeRequest } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const dynamic = 'force-dynamic'

function buildPrompt(body: AnalyzeRequest) {
  const { salary, currency, priorities, lifestyle } = body

  return `You are a world-class relocation advisor and financial analyst.

A user wants to find their perfect city to live in. Here is their profile:
- Annual salary: ${salary} ${currency} (remote worker / location independent)
- Priorities (1-5 scale, 5 = most important):
  * Low taxes: ${priorities.tax}/5
  * Affordable housing: ${priorities.housing}/5
  * Good climate: ${priorities.climate}/5
  * Healthcare quality: ${priorities.health}/5
  * Nightlife & culture: ${priorities.nightlife}/5
  * Safety: ${priorities.safety}/5
- Lifestyle preferences: ${lifestyle.join(', ')}

Based on this profile, recommend exactly 12 cities from around the world, ensuring diversity across all continents.
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

Sort by score descending. Ensure geographic diversity. Be accurate with real tax rates and costs.`
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
        const aiStream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        })

        let full = ''
        for await (const chunk of aiStream) {
          const piece = chunk.choices[0]?.delta?.content ?? ''
          if (piece) {
            full += piece
            send({ type: 'delta', text: piece })
          }
        }

        const clean = full.replace(/```json|```/g, '').trim()
        let cities: unknown
        try {
          cities = JSON.parse(clean)
        } catch {
          send({ type: 'error', error: 'Could not parse AI response' })
          return
        }

        if (!Array.isArray(cities)) {
          send({ type: 'error', error: 'AI response was not a city list' })
          return
        }

        const enriched = cities.map((city: Record<string, unknown>) => {
          const c = city as {
            taxRate: number
            monthlyCost: number
          }
          const takeHomeYearly = Math.round(salary * (1 - Number(c.taxRate) / 100))
          const takeHomeMonthly = Math.round(takeHomeYearly / 12)
          const monthlySavings = takeHomeMonthly - Number(c.monthlyCost)
          return { ...city, takeHomeMonthly, monthlySavings }
        })

        if (userId) {
          await supabaseAdmin.from('searches').insert({
            user_id: userId,
            salary,
            currency,
            priorities,
            lifestyle,
            results: enriched,
          })

          await supabaseAdmin
            .from('profiles')
            .update({ searches_this_month: supabaseAdmin.rpc('increment', { x: 1 }) })
            .eq('id', userId)
        }

        send({ type: 'done', cities: enriched })
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
