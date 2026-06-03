import { NextRequest, NextResponse } from 'next/server'
import {
  adminNotConfiguredResponse,
  adminUnauthorizedResponse,
  getAdminSecret,
  isAdminAuthorized,
} from '@/lib/admin-auth'
import { searchOutreachInfluencers } from '@/lib/outreach-search'
import type { OutreachPlatformFilter } from '@/lib/outreach-types'

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!getAdminSecret()) return adminNotConfiguredResponse()
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse()
  return null
}

function parsePlatform(value: unknown): OutreachPlatformFilter {
  if (value === 'youtube' || value === 'instagram' || value === 'tiktok' || value === 'all') {
    return value
  }
  return 'youtube'
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  try {
    const body = (await req.json()) as { keyword?: string; platform?: string }
    const keyword = body.keyword?.trim()
    const platform = parsePlatform(body.platform)

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    if (
      (platform === 'instagram' || platform === 'tiktok' || platform === 'all') &&
      !process.env.OUTSCRAPER_API_KEY?.trim()
    ) {
      return NextResponse.json(
        { error: 'OUTSCRAPER_API_KEY is required for Instagram and TikTok search' },
        { status: 503 }
      )
    }

    const influencers = await searchOutreachInfluencers(keyword, platform)

    return NextResponse.json({
      influencers,
      count: influencers.length,
      platform,
      filters: { minSubscribers: 5000, maxSubscribers: 200000 },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    console.error('Outreach search failed:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
