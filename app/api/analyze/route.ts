import { NextRequest, NextResponse } from 'next/server'
import { streamRecommendCities, buildTeaserCities } from '@/lib/recommendation'
import { resultCountForPlan, isPaidPlan, FREE_UNLOCKED_COUNT, FREE_DETAILED_COUNT } from '@/lib/plan'
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
    healthcare: '',
    scores: { tax: 0, housing: 0, climate: 0, health: 0, stability: 0, safety: 0 },
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
    stability: c(p.stability),
    safety: c(p.safety),
    expat_community: c(p.expat_community),
    visa_residency: c(p.visa_residency),
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
  let searchesThisMonth = 0

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
      searchesThisMonth = profile?.searches_this_month ?? 0

      if (plan === 'free' && searchesThisMonth >= 3) {
        return NextResponse.json(
          { error: 'Free plan limit reached. Upgrade to Pro for unlimited searches.' },
          { status: 403 }
        )
      }
    }
  }

  const priorities = normPriorities(body.priorities)
  const request = { ...body, priorities }
  const { monthlyBudget, currency, lifestyle } = request
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        const resultCount = resultCountForPlan(plan)
        const paid = isPaidPlan(plan)
        // Free users only ever see ONE city in full, so we generate a small
        // detailed set instead of all 12 rich objects (the cause of the ~1 min
        // analyses). The locked grid is padded with cheap teasers below.
        const detailedCount = paid ? resultCount : FREE_DETAILED_COUNT

        send({ type: 'limits', maxCities: resultCount })
        send({ type: 'status', text: 'Scoring cities and writing your personalized insights…' })

        // Stream the #1 match unlocked the moment it parses so the free user
        // sees their top card within a few seconds; later matches stream as
        // locked teasers. Paid users get every city unlocked progressively.
        let emitted = 0
        const cities = await streamRecommendCities(request, detailedCount, {
          onCity(city) {
            const unlock = paid || emitted < FREE_UNLOCKED_COUNT
            send({
              type: 'city',
              city: unlock ? { ...city, locked: false } : sanitizeLockedCity(city),
            })
            emitted++
          },
        })

        let clientCities: CityResult[]
        if (paid) {
          clientCities = cities.map((city) => ({ ...city, locked: false }))
        } else {
          // Keep the first generated match as the unlocked #1 (matches what we
          // streamed, so the top card never flashes), then sanitize the rest
          // and pad the grid up to the full count with locked teasers.
          const unlocked = cities
            .slice(0, FREE_UNLOCKED_COUNT)
            .map((city) => ({ ...city, locked: false }))
          const lockedReal = cities.slice(FREE_UNLOCKED_COUNT).map(sanitizeLockedCity)
          const used = new Set(cities.map((c) => `${c.name}|${c.country}`))
          const padCount = Math.max(0, resultCount - unlocked.length - lockedReal.length)
          const topScore = unlocked[0]?.score ?? 90
          const teasers = buildTeaserCities(used, padCount, topScore - 4)
          clientCities = [...unlocked, ...lockedReal, ...teasers]
        }

        if (userId) {
          await supabaseAdmin.from('searches').insert({
            user_id: userId,
            salary: monthlyBudget,
            currency,
            priorities,
            lifestyle,
            results: cities,
          })

          await supabaseAdmin
            .from('profiles')
            .update({ searches_this_month: searchesThisMonth + 1 })
            .eq('id', userId)
        }

        send({ type: 'done', cities: clientCities })
      } catch (err) {
        console.error('Recommendation error:', err)
        send({ type: 'error', error: 'Could not generate recommendations. Please try again.' })
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
