import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ipAddress } from '@vercel/functions'
import { streamRecommendCities, buildTeaserCities } from '@/lib/recommendation'
import { resultCountForPlan, isPaidPlan, FREE_UNLOCKED_COUNT, FREE_DETAILED_COUNT, FREE_SEARCHES_PER_DAY, FREE_ANONYMOUS_SEARCHES_PER_MONTH } from '@/lib/plan'
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

const FREE_SEARCH_LIMIT_MESSAGE =
  'Free plan limit reached. Continue to Pro for unlimited exploration.'

/** Local/dev only — set ANALYZE_BYPASS_RATE_LIMIT=1 in .env.local. Never honored in production. */
function shouldBypassAnalyzeRateLimitLocal(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.ANALYZE_BYPASS_RATE_LIMIT === '1'
}

/**
 * Temporary OAuth-restore test bypass (remove after testing).
 * Honored when env is set — including production/preview:
 * - ANALYZE_TEST_BYPASS_EMAIL matches the logged-in user's email, or
 * - ?test_bypass= matches ANALYZE_TEST_BYPASS_TOKEN
 */
function shouldBypassSearchLimitsForTest(
  req: NextRequest,
  userEmail?: string | null,
): boolean {
  if (shouldBypassAnalyzeRateLimitLocal()) return true

  const token = process.env.ANALYZE_TEST_BYPASS_TOKEN?.trim()
  if (token) {
    const provided = req.nextUrl.searchParams.get('test_bypass')?.trim()
    if (provided && provided === token) return true
  }

  const allowEmail = process.env.ANALYZE_TEST_BYPASS_EMAIL?.trim().toLowerCase()
  if (allowEmail && userEmail?.trim().toLowerCase() === allowEmail) return true

  return false
}

/** Strict cap when no usable client IP — avoids one shared "unknown" bucket. */
const FREE_ANONYMOUS_NO_IP_SEARCHES_PER_MONTH = 2

function isUsableClientIp(ip: string): boolean {
  const value = ip.trim().toLowerCase()
  return value !== '' && value !== '::1' && value !== '127.0.0.1' && value !== 'unknown'
}

/**
 * Resolve client IP for anonymous rate limiting.
 * Primary: Vercel `ipAddress` (x-real-ip). Never returns loopback / "unknown".
 */
function getClientIp(req: NextRequest): string | null {
  try {
    const fromVercel = ipAddress(req)
    if (fromVercel && isUsableClientIp(fromVercel)) {
      return fromVercel.trim()
    }
  } catch {
    // Fall through to header parsing; never fail the request here.
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp && isUsableClientIp(realIp)) {
    return realIp.trim()
  }

  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    for (const part of forwarded.split(',')) {
      const candidate = part.trim()
      if (candidate && isUsableClientIp(candidate)) {
        return candidate
      }
    }
  }

  return null
}

/** Rate-limit key + monthly cap for anonymous analyze. */
function anonymousSearchBucket(req: NextRequest): { ipKey: string; limit: number } {
  const clientIp = getClientIp(req)
  if (clientIp) {
    return { ipKey: clientIp, limit: FREE_ANONYMOUS_SEARCHES_PER_MONTH }
  }

  // Safer than a global "unknown" key: coarse UA/lang fingerprint, very low cap.
  const ua = req.headers.get('user-agent') ?? ''
  const lang = req.headers.get('accept-language') ?? ''
  const digest = createHash('sha256')
    .update(`nofp\0${ua}\0${lang}`)
    .digest('hex')
    .slice(0, 32)
  return { ipKey: `nofp:${digest}`, limit: FREE_ANONYMOUS_NO_IP_SEARCHES_PER_MONTH }
}

function getSearchDayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function getSearchMonth(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
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
  let userEmail: string | null = null
  let plan = 'free'
  let searchesToday = 0
  const today = getSearchDayUtc()

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (user) {
      userId = user.id
      userEmail = user.email ?? null
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('plan, searches_today, search_day')
        .eq('id', user.id)
        .single()

      plan = profile?.plan || 'free'
      searchesToday =
        profile?.search_day === today ? (profile?.searches_today ?? 0) : 0

      if (
        !shouldBypassSearchLimitsForTest(req, userEmail) &&
        plan === 'free' &&
        searchesToday >= FREE_SEARCHES_PER_DAY
      ) {
        return NextResponse.json(
          { error: FREE_SEARCH_LIMIT_MESSAGE },
          { status: 403 },
        )
      }
    }
  }

  if (!userId) {
    if (!shouldBypassSearchLimitsForTest(req, userEmail)) {
      const { ipKey, limit } = anonymousSearchBucket(req)
      const month = getSearchMonth()

      const { data: anonRow, error: readError } = await supabaseAdmin
        .from('anonymous_searches')
        .select('count')
        .eq('ip', ipKey)
        .eq('month', month)
        .maybeSingle()

      if (readError) {
        console.error('anonymous_searches read error:', readError)
        return NextResponse.json({ error: 'Could not verify usage limit. Please try again.' }, { status: 500 })
      }

      const anonCount = anonRow?.count ?? 0
      if (anonCount >= limit) {
        return NextResponse.json({ error: FREE_SEARCH_LIMIT_MESSAGE }, { status: 403 })
      }

      const { error: upsertError } = await supabaseAdmin
        .from('anonymous_searches')
        .upsert({ ip: ipKey, month, count: anonCount + 1 }, { onConflict: 'ip,month' })

      if (upsertError) {
        console.error('anonymous_searches upsert error:', upsertError)
        return NextResponse.json({ error: 'Could not record usage limit. Please try again.' }, { status: 500 })
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
        const paid = isPaidPlan(plan)
        const resultCount = resultCountForPlan(plan)
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
            .update({ searches_today: searchesToday + 1, search_day: today })
            .eq('id', userId)
        }

        send({ type: 'done', cities: clientCities })
      } catch (err) {
        console.error('Recommendation error:', err)
        send({ type: 'error', error: 'Could not build your matches. Please try again.' })
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
