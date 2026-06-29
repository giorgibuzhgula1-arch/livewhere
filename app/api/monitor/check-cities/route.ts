import { NextRequest, NextResponse } from 'next/server'
import { runMonitorCheck } from '@/lib/city-monitor-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/** Require `Authorization: Bearer <CRON_SECRET>`. */
function requireCronAuth(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) {
    return unauthorized()
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized()
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (token !== cronSecret) {
    return unauthorized()
  }

  return null
}

async function handleCheck(req: NextRequest) {
  const authError = requireCronAuth(req)
  if (authError) return authError

  let userId: string | undefined
  try {
    const body = await req.json().catch(() => null)
    if (body && typeof body === 'object' && typeof (body as { user_id?: unknown }).user_id === 'string') {
      userId = (body as { user_id: string }).user_id
    }
  } catch {
    /* GET has no body */
  }

  const urlUserId = req.nextUrl.searchParams.get('user_id')
  if (urlUserId) userId = urlUserId

  try {
    const results = await runMonitorCheck(userId)
    const totals = results.reduce(
      (acc, r) => ({
        citiesChecked: acc.citiesChecked + r.citiesChecked,
        alertsCreated: acc.alertsCreated + r.alertsCreated,
        emailsSent: acc.emailsSent + r.emailsSent,
      }),
      { citiesChecked: 0, alertsCreated: 0, emailsSent: 0 },
    )

    return NextResponse.json({
      ok: true,
      usersProcessed: results.length,
      ...totals,
      results,
    })
  } catch (err) {
    console.error('[monitor/check-cities]', err)
    return NextResponse.json({ error: 'Monitor check failed' }, { status: 500 })
  }
}

/** Vercel Cron invokes GET every Monday 9:00 UTC. */
export async function GET(req: NextRequest) {
  return handleCheck(req)
}

/** Manual trigger with optional { user_id } body. */
export async function POST(req: NextRequest) {
  return handleCheck(req)
}
