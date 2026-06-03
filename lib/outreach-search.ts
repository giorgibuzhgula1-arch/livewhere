import type { OutreachInfluencer, OutreachPlatformFilter } from '@/lib/outreach-types'
import { searchInstagramInfluencers, searchTikTokInfluencers } from '@/lib/social-platform-search'
import { searchYouTubeInfluencers } from '@/lib/youtube-search'

export async function searchOutreachInfluencers(
  keyword: string,
  platform: OutreachPlatformFilter
): Promise<OutreachInfluencer[]> {
  const q = keyword.trim()
  if (!q) return []

  if (platform === 'youtube') {
    return searchYouTubeInfluencers(q)
  }
  if (platform === 'instagram') {
    return searchInstagramInfluencers(q)
  }
  if (platform === 'tiktok') {
    return searchTikTokInfluencers(q)
  }

  const [youtube, instagram, tiktok] = await Promise.all([
    searchYouTubeInfluencers(q),
    searchInstagramInfluencers(q),
    searchTikTokInfluencers(q),
  ])

  return [...youtube, ...instagram, ...tiktok]
}
