import { NextRequest, NextResponse } from 'next/server'
import { affiliateReferralUrl } from '@/lib/affiliate'
import {
  adminNotConfiguredResponse,
  adminUnauthorizedResponse,
  getAdminSecret,
  isAdminAuthorized,
} from '@/lib/admin-auth'
import {
  activateAffiliate,
  createOrGetAffiliate,
  listAffiliates,
} from '@/lib/create-affiliate'
import { getSiteUrl } from '@/lib/site-url'
import { sendAffiliateWelcomeEmail } from '@/lib/send-affiliate-welcome'

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!getAdminSecret()) return adminNotConfiguredResponse()
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse()
  return null
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  try {
    const affiliates = await listAffiliates()
    const rows = affiliates.map((a) => ({
      ...a,
      referralUrl: affiliateReferralUrl(getSiteUrl(), a.referral_code),
      commission_rate: Number(a.commission_rate ?? 0.4),
      total_earnings: Number(a.total_earnings ?? 0),
    }))
    return NextResponse.json({ affiliates: rows })
  } catch (err) {
    console.error('admin affiliates list failed:', err)
    return NextResponse.json({ error: 'Failed to load affiliates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

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

    const { affiliate, referralUrl, created } = await createOrGetAffiliate(
      name,
      email,
      { status: 'active' }
    )

    if (!created) {
      await activateAffiliate(affiliate.id)
    }

    const commissionRate = Number(affiliate.commission_rate ?? 0.4)
    const emailResult = await sendAffiliateWelcomeEmail({
      to: affiliate.email,
      name: affiliate.name,
      referralUrl,
      commissionRate,
    })

    if (!emailResult.ok) {
      return NextResponse.json(
        {
          error: emailResult.error,
          affiliate: {
            ...affiliate,
            referralUrl,
            commission_rate: commissionRate,
            total_earnings: Number(affiliate.total_earnings ?? 0),
          },
          emailSent: false,
          created,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      affiliate: {
        ...affiliate,
        status: 'active',
        referralUrl,
        commission_rate: commissionRate,
        total_earnings: Number(affiliate.total_earnings ?? 0),
      },
      emailSent: true,
      emailId: emailResult.id,
      created,
    })
  } catch (err) {
    console.error('admin affiliate invite failed:', err)
    return NextResponse.json({ error: 'Invite failed' }, { status: 500 })
  }
}
