import { NextRequest, NextResponse } from 'next/server'
import { isPaidPlan } from '@/lib/plan'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase/server'
import { getAnalyzeSearchSnapshot, isPaywallV2Enabled } from '@/lib/paywall-v2'

export const dynamic = 'force-dynamic'

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (user) return user.id
  }
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  if (!isPaywallV2Enabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const userId = await resolveUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .maybeSingle()

  if (!isPaidPlan(profile?.plan)) {
    return NextResponse.json({ error: 'Paid plan required' }, { status: 403 })
  }

  const searchId = req.nextUrl.searchParams.get('searchId')
  const snapshot = await getAnalyzeSearchSnapshot({ searchId, userId })
  return NextResponse.json({ snapshot })
}
