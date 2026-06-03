import { NextRequest, NextResponse } from 'next/server'
import {
  adminNotConfiguredResponse,
  adminUnauthorizedResponse,
  getAdminSecret,
  isAdminAuthorized,
} from '@/lib/admin-auth'
import { searchYouTubeInfluencers } from '@/lib/youtube-search'

function requireAdmin(req: NextRequest): NextResponse | null {
  if (!getAdminSecret()) return adminNotConfiguredResponse()
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse()
  return null
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  try {
    const body = (await req.json()) as { keyword?: string }
    const keyword = body.keyword?.trim()

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const influencers = await searchYouTubeInfluencers(keyword)

    return NextResponse.json({
      influencers,
      count: influencers.length,
      filters: { minSubscribers: 5000, maxSubscribers: 200000 },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    console.error('YouTube outreach search failed:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
