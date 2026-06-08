import { NextRequest, NextResponse } from 'next/server'
import {
  adminNotConfiguredResponse,
  adminUnauthorizedResponse,
  getAdminSecret,
  isAdminAuthorized,
} from '@/lib/admin-auth'
import {
  buildOutscraperEnrichQuery,
  findEmailViaOutscraper,
} from '@/lib/outscraper-email'
import type { OutreachPlatform } from '@/lib/outreach-types'

export const maxDuration = 300

const MAX_CHANNELS_PER_REQUEST = 3

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!getAdminSecret()) return adminNotConfiguredResponse()
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse()
  return null
}

type EnrichInput = {
  channelId: string
  channelName: string
  profileUrl?: string
  platform?: OutreachPlatform
}

export async function POST(req: NextRequest) {
  console.log('[enrich] route hit, OUTSCRAPER_API_KEY present:', !!process.env.OUTSCRAPER_API_KEY?.trim())

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
    const channels = (body.channels ?? [])
      .filter((c) => c.channelId && c.channelName?.trim())
      .slice(0, MAX_CHANNELS_PER_REQUEST)

    if (channels.length === 0) {
      return NextResponse.json({ error: 'No channels to enrich' }, { status: 400 })
    }

    const enriched: { channelId: string; email: string | null }[] = []
    let foundCount = 0
    let rejectedCount = 0

    for (let i = 0; i < channels.length; i++) {
      const { channelId, channelName, profileUrl, platform } = channels[i]
      let email: string | null = null

      try {
        const outscraperQuery = buildOutscraperEnrichQuery(channelName)
        const ctx = {
          channelName: channelName.trim(),
          profileUrl,
          platform,
        }
        email = await findEmailViaOutscraper(outscraperQuery, ctx, { debug: i === 0 })
        if (!email) rejectedCount++
        if (i === 0) {
          console.log('[Outscraper enrich] first channel', {
            channelId,
            channelName,
            outscraperQuery,
            email,
          })
        }
        if (email) foundCount++
      } catch (err) {
        console.error(`Outscraper enrich failed for ${channelName}:`, err)
      }

      enriched.push({ channelId, email })

      if (i < channels.length - 1) {
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    return NextResponse.json({
      enriched,
      foundCount,
      rejectedCount,
      processedCount: channels.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Enrichment failed'
    console.error('outreach enrich failed:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
