import { extractCreatorEmailFromText } from '@/lib/validate-creator-email'
import type { OutreachInfluencer } from '@/lib/outreach-types'

const MIN_SUBSCRIBERS = 5_000
const MAX_SUBSCRIBERS = 200_000
/** Target number of influencers returned after subscriber filtering. */
const TARGET_RESULTS = 50
/** YouTube search.list allows up to 50 results per page. */
const SEARCH_PAGE_SIZE = 50
/** Cap search pages to avoid excessive API quota usage. */
const MAX_SEARCH_PAGES = 15
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

function channelToInfluencer(channel: ChannelItem, keyword: string): OutreachInfluencer | null {
  if (channel.statistics?.hiddenSubscriberCount) return null

  const subscribers = parseInt(channel.statistics?.subscriberCount ?? '0', 10)
  if (
    Number.isNaN(subscribers) ||
    subscribers < MIN_SUBSCRIBERS ||
    subscribers > MAX_SUBSCRIBERS
  ) {
    return null
  }

  const channelName = channel.snippet?.title ?? 'Unknown channel'
  const profileUrl = channelUrl(channel)

  return {
    channelId: `youtube:${channel.id}`,
    channelName,
    platform: 'youtube',
    subscribers,
    country: channel.snippet?.country ?? null,
    email: extractCreatorEmailFromText(channel.snippet?.description, {
      channelName,
      profileUrl,
      platform: 'youtube',
    }),
    profileUrl,
    keyword,
  }
}

async function fetchChannelsByIds(ids: string[]): Promise<ChannelItem[]> {
  const channels: ChannelItem[] = []
  for (let i = 0; i < ids.length; i += SEARCH_PAGE_SIZE) {
    const batch = ids.slice(i, i + SEARCH_PAGE_SIZE)
    const channelsData = await youtubeFetch<{ items?: ChannelItem[] }>('/channels', {
      part: 'snippet,statistics',
      id: batch.join(','),
    })
    channels.push(...(channelsData.items ?? []))
  }
  return channels
}

export async function searchYouTubeInfluencers(
  keyword: string
): Promise<OutreachInfluencer[]> {
  const q = keyword.trim()
  if (!q) return []

  const seenChannelIds = new Set<string>()
  const results: OutreachInfluencer[] = []
  let pageToken: string | undefined
  let pagesFetched = 0

  while (results.length < TARGET_RESULTS && pagesFetched < MAX_SEARCH_PAGES) {
    pagesFetched += 1

    const searchData = await youtubeFetch<{
      items?: SearchItem[]
      nextPageToken?: string
    }>('/search', {
      part: 'snippet',
      type: 'channel',
      q,
      maxResults: String(SEARCH_PAGE_SIZE),
      order: 'relevance',
      ...(pageToken ? { pageToken } : {}),
    })

    const newIds: string[] = []
    for (const item of searchData.items ?? []) {
      const id = item.id?.channelId ?? item.snippet?.channelId
      if (id && !seenChannelIds.has(id)) {
        seenChannelIds.add(id)
        newIds.push(id)
      }
    }

    if (newIds.length > 0) {
      const channels = await fetchChannelsByIds(newIds)
      for (const channel of channels) {
        if (results.length >= TARGET_RESULTS) break
        const influencer = channelToInfluencer(channel, q)
        if (influencer) results.push(influencer)
      }
    }

    pageToken = searchData.nextPageToken
    if (!pageToken) break
  }

  results.sort((a, b) => b.subscribers - a.subscribers)
  return results.slice(0, TARGET_RESULTS)
}
