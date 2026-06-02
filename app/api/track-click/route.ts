import { NextRequest, NextResponse } from 'next/server'
import { REF_COOKIE_MAX_AGE, REF_COOKIE_NAME, normalizeReferralCode } from '@/lib/affiliate'
import { supabaseAdmin } from '@/lib/supabase-admin'

function resolveReferralCode(req: NextRequest): string | null {
  const fromQuery = req.nextUrl.searchParams.get('ref')
  if (fromQuery) return normalizeReferralCode(fromQuery)

  const fromCookie = req.cookies.get(REF_COOKIE_NAME)?.value
  if (fromCookie) return normalizeReferralCode(fromCookie)

  return null
}

async function recordClick(referralCode: string, req: NextRequest) {
  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('id, total_clicks')
    .eq('referral_code', referralCode)
    .maybeSingle()

  if (!affiliate) return false

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null
  const userAgent = req.headers.get('user-agent')

  await supabaseAdmin.from('referral_clicks').insert({
    referral_code: referralCode,
    ip_address: ip,
    user_agent: userAgent,
  })

  await supabaseAdmin
    .from('affiliates')
    .update({ total_clicks: (affiliate.total_clicks ?? 0) + 1 })
    .eq('id', affiliate.id)

  return true
}

function withRefCookie(res: NextResponse, referralCode: string) {
  res.cookies.set(REF_COOKIE_NAME, referralCode, {
    maxAge: REF_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}

export async function GET(req: NextRequest) {
  const referralCode = resolveReferralCode(req)
  if (!referralCode) {
    return NextResponse.json({ ok: false, error: 'Missing referral code' }, { status: 400 })
  }

  await recordClick(referralCode, req)
  return withRefCookie(NextResponse.json({ ok: true }), referralCode)
}

export async function POST(req: NextRequest) {
  const referralCode = resolveReferralCode(req)
  if (!referralCode) {
    return NextResponse.json({ ok: false, error: 'Missing referral code' }, { status: 400 })
  }

  await recordClick(referralCode, req)
  return withRefCookie(NextResponse.json({ ok: true }), referralCode)
}
