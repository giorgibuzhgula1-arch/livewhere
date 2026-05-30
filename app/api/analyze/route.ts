import { NextRequest, NextResponse } from 'next/server'
import { streamRecommendCities } from '@/lib/recommendation'
import { resultCountForPlan, isPaidPlan, FREE_UNLOCKED_COUNT } from '@/lib/plan'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AnalyzeRequest, CityResult, UserPriorities } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * For free users, every city past the unlocked preview is rendered as a
 * locked/blurred teaser. Strip the premium fields server-side so the full
 * analysis never reaches the client over the network — only enough to show
 * the identity and a teaser match score remains.
 */
function sanitizeLockedCity(city: CityResult): CityResult {
  return {
    name: city.name,
    country: city.country,
    continent: city.continent,
    flag: city.flag,
    score: city.score,
    taxRate: 0,
    monthlyRent: 0,
    monthlyCost: 0,
    takeHomeMonthly: 0,
    monthlySavings: 0,
    pros: [],
    cons: [],
    tags: [],
    visa: '',
    scores: { tax: 0, housing: 0, climate: 0, health: 0, nightlife: 0, safety: 0 },
    aiInsight: '',
    locked: true,
  }
}

function normPriorities(p: UserPriorities): UserPriorities {
  const c = (x: unknown) => Math.max(1, Math.min(5, Math.round(Number(x) || 3)))
  return {
    tax: c(p.tax),
    housing: c(p.housing),
    climate: c(p.climate),
    health: c(p.health),
    nightlife: c(p.nightlife),
    safety: c(p.safety),
  }
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

  const priorities = normPriorities(body.priorities)
  const request = { ...body, priorities }
  const { salary, currency, lifestyle } = request
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        const resultCount = resultCountForPlan(plan)
        send({ type: 'limits', maxCities: resultCount })
        send({ type: 'status', text: 'Finding your top city matches…' })

        const paid = isPaidPlan(plan)

        // During streaming we don't yet know which city has the highest score,
        // so free users get locked teasers for every city. The authoritative
        // `done` payload below reveals the true #1 match in full.
        const cities = await streamRecommendCities(request, resultCount, {
          onCity(city) {
            send({
              type: 'city',
              city: paid ? { ...city, locked: false } : sanitizeLockedCity(city),
            })
          },
        })

        let clientCities: CityResult[]
        if (paid) {
          clientCities = cities.map((city) => ({ ...city, locked: false }))
        } else {
          // Highest score first; only the top FREE_UNLOCKED_COUNT stay unlocked.
          const sorted = [...cities].sort((a, b) => b.score - a.score)
          clientCities = sorted.map((city, index) =>
            index < FREE_UNLOCKED_COUNT ? { ...city, locked: false } : sanitizeLockedCity(city)
          )
        }

        if (userId) {
          await supabaseAdmin.from('searches').insert({
            user_id: userId,
            salary,
            currency,
            priorities,
            lifestyle,
            results: cities,
          })

          await supabaseAdmin
            .from('profiles')
            .update({ searches_this_month: supabaseAdmin.rpc('increment', { x: 1 }) })
            .eq('id', userId)
        }

        send({ type: 'done', cities: clientCities })
      } catch (err) {
        console.error('Recommendation error:', err)
        send({ type: 'error', error: 'OpenAI could not generate recommendations. Please try again.' })
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
