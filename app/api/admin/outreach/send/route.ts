import { NextRequest, NextResponse } from 'next/server'
import {
  adminNotConfiguredResponse,
  adminUnauthorizedResponse,
  getAdminSecret,
  isAdminAuthorized,
} from '@/lib/admin-auth'
import { activateAffiliate, createOrGetAffiliate } from '@/lib/create-affiliate'
import {
  generateOutreachIntro,
  outreachFirstName,
} from '@/lib/generate-outreach-intro'
import { sendInfluencerOutreachEmail } from '@/lib/send-influencer-outreach'
import { isLikelyCreatorEmail } from '@/lib/validate-creator-email'
import { getRecentTitlesForCreator } from '@/lib/youtube-recent-videos'

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!getAdminSecret()) return adminNotConfiguredResponse()
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse()
  return null
}

type OutreachRecipient = {
  channelId?: string
  channelName: string
  email: string
  keyword?: string
  profileUrl?: string
  platform?: 'youtube' | 'instagram' | 'tiktok'
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

      if (!channelName || !email) {
        failed.push({
          channelName: channelName || 'Unknown',
          email: email || '',
          error: 'Missing channel name or email',
        })
        continue
      }

      if (
        !isLikelyCreatorEmail(email, {
          channelName,
          profileUrl: item.profileUrl,
          platform: item.platform,
        })
      ) {
        failed.push({
          channelName,
          email,
          error: 'Email failed validation (unlikely to belong to this creator)',
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

        const videoTitles = await getRecentTitlesForCreator({
          channelId: item.channelId,
          channelName,
          profileUrl: item.profileUrl,
          platform: item.platform,
        })

        const personalizedIntro = await generateOutreachIntro({
          channelName,
          videoTitles,
        })

        const firstName = outreachFirstName(channelName)

        const emailResult = await sendInfluencerOutreachEmail({
          to: email,
          firstName,
          personalizedIntro,
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
