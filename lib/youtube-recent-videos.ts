const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

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

/** Parse YouTube channel ID from outreach `channelId` or profile URL. */
export function parseYouTubeChannelId(
  channelId?: string,
  profileUrl?: string
): string | null {
  if (channelId?.startsWith('youtube:')) {
    return channelId.slice('youtube:'.length) || null
  }

  if (!profileUrl) return null
  try {
    const url = new URL(profileUrl)
    if (!url.hostname.includes('youtube.com')) return null
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] === 'channel' && parts[1]) return parts[1]
  } catch {
    return null
  }

  return null
}

/** Resolve a channel ID from a display name when the creator is not stored as YouTube. */
export async function findYouTubeChannelIdByName(
  channelName: string
): Promise<string | null> {
  const q = channelName.trim()
  if (!q) return null

  const data = await youtubeFetch<{
    items?: { id?: { channelId?: string } }[]
  }>('/search', {
    part: 'snippet',
    type: 'channel',
    q,
    maxResults: '1',
  })

  return data.items?.[0]?.id?.channelId ?? null
}

/** Last N video titles from a channel's uploads (newest first). */
export async function getRecentYouTubeVideoTitles(
  channelId: string,
  limit = 5
): Promise<string[]> {
  const channelData = await youtubeFetch<{
    items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[]
  }>('/channels', {
    part: 'contentDetails',
    id: channelId,
  })

  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploadsPlaylistId) return []

  const playlistData = await youtubeFetch<{
    items?: { snippet?: { title?: string } }[]
  }>('/playlistItems', {
    part: 'snippet',
    playlistId: uploadsPlaylistId,
    maxResults: String(limit),
  })

  return (playlistData.items ?? [])
    .map((item) => item.snippet?.title?.trim())
    .filter((title): title is string => Boolean(title))
}

export async function getRecentTitlesForCreator(options: {
  channelId?: string
  channelName: string
  profileUrl?: string
  platform?: string
}): Promise<string[]> {
  let ytId = parseYouTubeChannelId(options.channelId, options.profileUrl)

  if (!ytId) {
    ytId = await findYouTubeChannelIdByName(options.channelName)
  }

  if (!ytId) return []

  try {
    return await getRecentYouTubeVideoTitles(ytId, 5)
  } catch (err) {
    console.error('getRecentYouTubeVideoTitles failed:', err)
    return []
  }
}
