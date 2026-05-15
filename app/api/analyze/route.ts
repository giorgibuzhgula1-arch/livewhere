import { NextRequest, NextResponse } from 'next/server'
import { normalizePriorities } from '@/lib/recommendation/normalize-priorities'
import { recommendCities, RESULT_COUNT } from '@/lib/recommendation/recommend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AnalyzeRequest } from '@/lib/types'

export const dynamic = 'force-dynamic'

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

  const priorities = normalizePriorities(body.priorities)
  const request = { ...body, priorities }
  const { salary, currency, lifestyle } = request
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        send({
          type: 'limits',
          maxCities: RESULT_COUNT,
        })

        send({
          type: 'status',
          text: 'Ranking cities for your profile…',
        })

        const cities = await recommendCities(request)

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

        send({ type: 'done', cities })
      } catch (err) {
        console.error('Recommendation error:', err)
        send({ type: 'done', cities: await recommendCities(request) })
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
