import { NextRequest, NextResponse } from 'next/server'
import {
  adminNotConfiguredResponse,
  adminUnauthorizedResponse,
  getAdminSecret,
  isAdminAuthorized,
} from '@/lib/admin-auth'
import { activateAffiliate, createOrGetAffiliate } from '@/lib/create-affiliate'
import { sendInfluencerOutreachEmail } from '@/lib/send-influencer-outreach'

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!getAdminSecret()) return adminNotConfiguredResponse()
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse()
  return null
}

type OutreachRecipient = {
  channelName: string
  email: string
  keyword: string
  youtubeUrl?: string
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  try {
    const body = (await req.json()) as { recipients?: OutreachRecipient[] }
    const recipients = body.recipients ?? []

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients selected' }, { status: 400 })
    }

    const sent: { channelName: string; email: string; referralUrl: string }[] = []
    const failed: { channelName: string; email: string; error: string }[] = []

    for (const item of recipients) {
      const channelName = item.channelName?.trim()
      const email = item.email?.trim().toLowerCase()
      const niche = item.keyword?.trim() || 'remote work'

      if (!channelName || !email) {
        failed.push({
          channelName: channelName || 'Unknown',
          email: email || '',
          error: 'Missing channel name or email',
        })
        continue
      }

      try {
        const { affiliate, referralUrl, created } = await createOrGetAffiliate(
          channelName,
          email,
          { status: 'active' }
        )

        if (!created) {
          await activateAffiliate(affiliate.id)
        }

        const emailResult = await sendInfluencerOutreachEmail({
          to: email,
          channelName,
          niche,
          referralUrl,
        })

        if (!emailResult.ok) {
          failed.push({ channelName, email, error: emailResult.error })
          continue
        }

        sent.push({ channelName, email, referralUrl })
      } catch (err) {
        failed.push({
          channelName,
          email,
          error: err instanceof Error ? err.message : 'Send failed',
        })
      }
    }

    return NextResponse.json({
      sent,
      failed,
      sentCount: sent.length,
      failedCount: failed.length,
    })
  } catch (err) {
    console.error('outreach send failed:', err)
    return NextResponse.json({ error: 'Outreach send failed' }, { status: 500 })
  }
}
