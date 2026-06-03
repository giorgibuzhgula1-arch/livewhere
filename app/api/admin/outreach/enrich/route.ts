import { NextRequest, NextResponse } from 'next/server'
import {
  adminNotConfiguredResponse,
  adminUnauthorizedResponse,
  getAdminSecret,
  isAdminAuthorized,
} from '@/lib/admin-auth'
import { findEmailViaOutscraper, youtubeChannelUrl } from '@/lib/outscraper-email'

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!getAdminSecret()) return adminNotConfiguredResponse()
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse()
  return null
}

type EnrichInput = { channelId: string; channelName: string }

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  if (!process.env.OUTSCRAPER_API_KEY?.trim()) {
    return NextResponse.json(
      { error: 'OUTSCRAPER_API_KEY is not configured' },
      { status: 503 }
    )
  }

  try {
    const body = (await req.json()) as { channels?: EnrichInput[] }
    const channels = (body.channels ?? []).filter(
      (c) => c.channelId && c.channelName?.trim()
    )

    if (channels.length === 0) {
      return NextResponse.json({ error: 'No channels to enrich' }, { status: 400 })
    }

    const enriched: { channelId: string; email: string | null }[] = []
    let foundCount = 0

    for (let i = 0; i < channels.length; i++) {
      const { channelId, channelName } = channels[i]
      let email: string | null = null

      try {
        email = await findEmailViaOutscraper(youtubeChannelUrl(channelId))
        if (email) foundCount++
      } catch (err) {
        console.error(`Outscraper enrich failed for ${channelName}:`, err)
      }

      enriched.push({ channelId, email })

      if (i < channels.length - 1) {
        await new Promise((r) => setTimeout(r, 400))
      }
    }

    return NextResponse.json({
      enriched,
      foundCount,
      processedCount: channels.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Enrichment failed'
    console.error('outreach enrich failed:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
