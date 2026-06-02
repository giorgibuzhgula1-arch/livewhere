import { NextRequest, NextResponse } from 'next/server'
import { affiliateReferralUrl, normalizeReferralCode } from '@/lib/affiliate'
import { createOrGetAffiliate, getAffiliateByEmail } from '@/lib/create-affiliate'
import { getSiteUrl } from '@/lib/site-url'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name?: string; email?: string }
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const { affiliate, referralUrl } = await createOrGetAffiliate(name, email)

    return NextResponse.json({
      affiliate,
      referralUrl,
      referralCode: affiliate.referral_code,
    })
  } catch (err) {
    console.error('affiliate signup error:', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  const code = req.nextUrl.searchParams.get('code')?.trim()

  if (!email && !code) {
    return NextResponse.json({ error: 'email or code required' }, { status: 400 })
  }

  let affiliate = null

  if (email) {
    affiliate = await getAffiliateByEmail(email)
  } else if (code) {
    const { data } = await supabaseAdmin
      .from('affiliates')
      .select('*')
      .eq('referral_code', normalizeReferralCode(code))
      .maybeSingle()
    affiliate = data
  }

  if (!affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  return NextResponse.json({
    affiliate,
    referralUrl: affiliateReferralUrl(getSiteUrl(), affiliate.referral_code),
    referralCode: affiliate.referral_code,
  })
}
