import { NextRequest, NextResponse } from 'next/server'
import {
  affiliateReferralUrl,
  buildReferralCodeFromName,
  normalizeReferralCode,
} from '@/lib/affiliate'
import { getSiteUrl } from '@/lib/site-url'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function uniqueReferralCode(name: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = buildReferralCodeFromName(name)
    const { data } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle()
    if (!data) return code
  }
  return `lw-${Date.now().toString(36)}`
}

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

    const { data: existing } = await supabaseAdmin
      .from('affiliates')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      const referralUrl = affiliateReferralUrl(
        getSiteUrl(),
        existing.referral_code
      )
      return NextResponse.json({
        affiliate: existing,
        referralUrl,
        referralCode: existing.referral_code,
      })
    }

    const referralCode = await uniqueReferralCode(name)

    const { data: affiliate, error } = await supabaseAdmin
      .from('affiliates')
      .insert({
        name,
        email,
        referral_code: referralCode,
        status: 'pending',
      })
      .select()
      .single()

    if (error || !affiliate) {
      console.error('affiliate signup failed:', error)
      return NextResponse.json(
        { error: 'Could not create affiliate account' },
        { status: 500 }
      )
    }

    const referralUrl = affiliateReferralUrl(getSiteUrl(), referralCode)

    return NextResponse.json({
      affiliate,
      referralUrl,
      referralCode,
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

  let query = supabaseAdmin.from('affiliates').select('*')

  if (email) {
    query = query.eq('email', email)
  } else if (code) {
    query = query.eq('referral_code', normalizeReferralCode(code))
  }

  const { data: affiliate, error } = await query.maybeSingle()

  if (error || !affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  return NextResponse.json({
    affiliate,
    referralUrl: affiliateReferralUrl(getSiteUrl(), affiliate.referral_code),
    referralCode: affiliate.referral_code,
  })
}
