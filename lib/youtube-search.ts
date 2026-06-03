import { extractEmailFromText } from '@/lib/extract-email'
import type { OutreachInfluencer } from '@/lib/outreach-types'

const MIN_SUBSCRIBERS = 5_000
const MAX_SUBSCRIBERS = 200_000
const SEARCH_MAX_RESULTS = 50
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

type SearchItem = {
  id?: { channelId?: string }
  snippet?: { channelId?: string; title?: string }
}

type ChannelItem = {
  id: string
  snippet?: {
    title?: string
    description?: string
    country?: string
    customUrl?: string
  }
  statistics?: {
    subscriberCount?: string
    hiddenSubscriberCount?: boolean
  }
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY?.trim()
  if (!key) throw new Error('YOUTUBE_API_KEY is not configured')
  return key
}

async function youtubeFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${YOUTUBE_API}${path}`)
  url.searchParams.set('key', getApiKey())
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  const data = await res.json()

  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } })?.error?.message ||
      `YouTube API error (${res.status})`
    throw new Error(message)
  }

  return data as T
}

function channelUrl(channel: ChannelItem): string {
  const custom = channel.snippet?.customUrl
  if (custom) {
    return custom.startsWith('@')
      ? `https://www.youtube.com/${custom}`
      : `https://www.youtube.com/@${custom}`
  }
  return `https://www.youtube.com/channel/${channel.id}`
}

export async function searchYouTubeInfluencers(
  keyword: string
): Promise<OutreachInfluencer[]> {
  const q = keyword.trim()
  if (!q) return []

  const channelIdSet = new Set<string>()
  let pageToken: string | undefined

  while (channelIdSet.size < SEARCH_MAX_RESULTS) {
    const remaining = SEARCH_MAX_RESULTS - channelIdSet.size
    const searchData = await youtubeFetch<{
      items?: SearchItem[]
      nextPageToken?: string
    }>('/search', {
      part: 'snippet',
      type: 'channel',
      q,
      maxResults: String(Math.min(50, remaining)),
      order: 'relevance',
      ...(pageToken ? { pageToken } : {}),
    })

    for (const item of searchData.items ?? []) {
      const id = item.id?.channelId ?? item.snippet?.channelId
      if (id) channelIdSet.add(id)
    }

    pageToken = searchData.nextPageToken
    if (!pageToken || channelIdSet.size >= SEARCH_MAX_RESULTS) break
  }

  const uniqueIds = Array.from(channelIdSet).slice(0, SEARCH_MAX_RESULTS)
  if (uniqueIds.length === 0) return []

  const allChannels: ChannelItem[] = []
  for (let i = 0; i < uniqueIds.length; i += 50) {
    const batch = uniqueIds.slice(i, i + 50)
    const channelsData = await youtubeFetch<{ items?: ChannelItem[] }>('/channels', {
      part: 'snippet,statistics',
      id: batch.join(','),
    })
    allChannels.push(...(channelsData.items ?? []))
  }

  const results: OutreachInfluencer[] = []

  for (const channel of allChannels) {
    if (channel.statistics?.hiddenSubscriberCount) continue

    const subscribers = parseInt(channel.statistics?.subscriberCount ?? '0', 10)
    if (
      Number.isNaN(subscribers) ||
      subscribers < MIN_SUBSCRIBERS ||
      subscribers > MAX_SUBSCRIBERS
    ) {
      continue
    }

    results.push({
      channelId: `youtube:${channel.id}`,
      channelName: channel.snippet?.title ?? 'Unknown channel',
      platform: 'youtube',
      subscribers,
      country: channel.snippet?.country ?? null,
      email: extractEmailFromText(channel.snippet?.description),
      profileUrl: channelUrl(channel),
      keyword: q,
    })
  }

  results.sort((a, b) => b.subscribers - a.subscribers)
  return results
}
