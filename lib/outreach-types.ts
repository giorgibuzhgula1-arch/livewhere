export type OutreachPlatform = 'youtube' | 'instagram' | 'tiktok'
export type OutreachPlatformFilter = OutreachPlatform | 'all'

export type OutreachInfluencer = {
  channelId: string
  channelName: string
  platform: OutreachPlatform
  subscribers: number
  country: string | null
  email: string | null
  profileUrl: string
  keyword: string
}

export function platformLabel(platform: OutreachPlatform): string {
  if (platform === 'youtube') return 'YouTube'
  if (platform === 'instagram') return 'Instagram'
  return 'TikTok'
}
