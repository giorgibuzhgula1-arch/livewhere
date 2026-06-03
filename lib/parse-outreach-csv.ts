import { parseFollowerCount } from '@/lib/parse-follower-count'
import type { OutreachInfluencer, OutreachPlatform } from '@/lib/outreach-types'
import { parseYouTubeChannelId } from '@/lib/youtube-recent-videos'

export type ParseOutreachCsvResult = {
  influencers: OutreachInfluencer[]
  skipped: number
  errors: string[]
}

const CHANNEL_NAME_KEYS = [
  'channel_name',
  'channel_title',
  'channel',
  'name',
  'title',
  'channelname',
]

const CHANNEL_ID_KEYS = ['channel_id', 'channelid', 'youtube_channel_id', 'id']

const PROFILE_URL_KEYS = [
  'channel_url',
  'channel_link',
  'channel_uri',
  'url',
  'link',
  'profile_url',
  'youtube_url',
]

const EMAIL_KEYS = ['email', 'emails', 'business_email', 'contact_email', 'e_mail']

const SUBSCRIBER_KEYS = [
  'subscribers',
  'subscriber_count',
  'subscribers_count',
  'number_of_subscribers',
  'subs',
  'followers',
  'follower_count',
]

const COUNTRY_KEYS = ['country', 'country_code', 'location', 'region']

const KEYWORD_KEYS = ['keyword', 'query', 'search_query', 'search']

const PLATFORM_KEYS = ['platform']

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && next === '\n') i++
      row.push(field)
      field = ''
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((cell) => cell.trim() !== '')) rows.push(row)
  }

  return rows
}

function pickField(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value?.trim()) return value.trim()
  }
  return ''
}

function rowToRecord(headers: string[], cells: string[]): Record<string, string> {
  const record: Record<string, string> = {}
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]
    if (!header) continue
    record[header] = (cells[i] ?? '').trim()
  }
  return record
}

function parseSubscriberValue(raw: string): number {
  const t = raw.trim()
  if (!t) return 0
  const fromText = parseFollowerCount(t)
  if (fromText > 0) return fromText
  const digits = Number.parseInt(t.replace(/[,\s]/g, ''), 10)
  return Number.isNaN(digits) ? 0 : digits
}

function parsePlatform(raw: string, profileUrl: string): OutreachPlatform {
  const value = raw.trim().toLowerCase()
  if (value.includes('instagram') || profileUrl.includes('instagram.com')) return 'instagram'
  if (value.includes('tiktok') || profileUrl.includes('tiktok.com')) return 'tiktok'
  return 'youtube'
}

function youtubeHandleFromUrl(profileUrl: string): string | null {
  try {
    const url = new URL(profileUrl)
    if (!url.hostname.includes('youtube.com')) return null
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0]?.startsWith('@')) return parts[0].slice(1)
    if (parts[0] === 'user' && parts[1]) return parts[1]
    if (parts[0] === 'c' && parts[1]) return parts[1]
  } catch {
    return null
  }
  return null
}

function buildProfileUrl(
  platform: OutreachPlatform,
  rawUrl: string,
  ytChannelId: string | null,
  handle: string | null,
  channelName: string
): string {
  if (rawUrl) {
    try {
      const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
      return url.toString()
    } catch {
      /* fall through */
    }
  }

  if (platform === 'instagram' && handle) {
    return `https://www.instagram.com/${handle}/`
  }
  if (platform === 'tiktok' && handle) {
    return `https://www.tiktok.com/@${handle}`
  }
  if (ytChannelId) {
    return `https://www.youtube.com/channel/${ytChannelId}`
  }
  if (handle) {
    return `https://www.youtube.com/@${handle}`
  }

  const slug = channelName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(channelName || slug)}`
}

function buildChannelId(
  platform: OutreachPlatform,
  rawId: string,
  profileUrl: string,
  handle: string | null,
  channelName: string
): string {
  const id = rawId.trim()
  if (id.startsWith('youtube:') || id.startsWith('instagram:') || id.startsWith('tiktok:')) {
    return id
  }

  if (platform === 'youtube') {
    if (/^UC[\w-]{10,}$/i.test(id)) return `youtube:${id}`
    const fromUrl = parseYouTubeChannelId(undefined, profileUrl)
    if (fromUrl) return `youtube:${fromUrl}`
    if (handle) return `youtube:@${handle.toLowerCase()}`
    const slug = channelName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '')
      .slice(0, 64)
    return `youtube:csv:${slug || 'unknown'}`
  }

  if (handle) return `${platform}:${handle.toLowerCase()}`
  const slug = channelName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '')
    .slice(0, 64)
  return `${platform}:csv:${slug || 'unknown'}`
}

function extractEmailFromRow(row: Record<string, string>): string | null {
  const direct = pickField(row, EMAIL_KEYS)
  if (direct) {
    const match = direct.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/)
    if (match) return match[0].toLowerCase()
  }

  for (const value of Object.values(row)) {
    const match = value.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/)
    if (match) return match[0].toLowerCase()
  }

  return null
}

function rowToInfluencer(
  row: Record<string, string>,
  defaultKeyword: string
): OutreachInfluencer | null {
  const channelName = pickField(row, CHANNEL_NAME_KEYS)
  if (!channelName) return null

  const profileUrlRaw = pickField(row, PROFILE_URL_KEYS)
  const platform = parsePlatform(pickField(row, PLATFORM_KEYS), profileUrlRaw)

  let handle: string | null = null
  if (platform === 'instagram' && profileUrlRaw.includes('instagram.com')) {
    const m = profileUrlRaw.match(/instagram\.com\/([A-Za-z0-9._]+)/i)
    handle = m?.[1]?.replace(/^@/, '') ?? null
  } else if (platform === 'tiktok' && profileUrlRaw.includes('tiktok.com')) {
    const m = profileUrlRaw.match(/tiktok\.com\/@([A-Za-z0-9._]+)/i)
    handle = m?.[1] ?? null
  } else {
    handle = youtubeHandleFromUrl(profileUrlRaw)
  }

  const rawChannelId = pickField(row, CHANNEL_ID_KEYS)
  const ytId =
    platform === 'youtube'
      ? parseYouTubeChannelId(
          rawChannelId ? `youtube:${rawChannelId.replace(/^youtube:/, '')}` : undefined,
          profileUrlRaw
        ) ?? (/^UC[\w-]{10,}$/i.test(rawChannelId) ? rawChannelId : null)
      : null

  const profileUrl = buildProfileUrl(platform, profileUrlRaw, ytId, handle, channelName)
  const channelId = buildChannelId(platform, rawChannelId, profileUrl, handle, channelName)

  const keyword = pickField(row, KEYWORD_KEYS) || defaultKeyword
  const countryRaw = pickField(row, COUNTRY_KEYS)
  const country =
    countryRaw.length === 2 ? countryRaw.toUpperCase() : countryRaw || null

  return {
    channelId,
    channelName,
    platform,
    subscribers: parseSubscriberValue(pickField(row, SUBSCRIBER_KEYS)),
    country,
    email: extractEmailFromRow(row),
    profileUrl,
    keyword,
  }
}

/** Parse Outscraper / export CSV into outreach influencers (deduped by channelId). */
export function parseOutreachCsv(
  csvText: string,
  defaultKeyword = 'csv import'
): ParseOutreachCsvResult {
  const errors: string[] = []
  const matrix = parseCsv(csvText.replace(/^\uFEFF/, ''))

  if (matrix.length < 2) {
    return {
      influencers: [],
      skipped: 0,
      errors: ['CSV must include a header row and at least one data row'],
    }
  }

  const headers = matrix[0].map(normalizeHeader)
  const hasNameColumn = CHANNEL_NAME_KEYS.some((k) => headers.includes(k))
  if (!hasNameColumn) {
    errors.push(
      `Missing channel name column (expected one of: ${CHANNEL_NAME_KEYS.slice(0, 4).join(', ')}, …)`
    )
  }

  const byId = new Map<string, OutreachInfluencer>()
  let skipped = 0

  for (let i = 1; i < matrix.length; i++) {
    const record = rowToRecord(headers, matrix[i])
    const influencer = rowToInfluencer(record, defaultKeyword)
    if (!influencer) {
      skipped++
      continue
    }
    byId.set(influencer.channelId, influencer)
  }

  const influencers = Array.from(byId.values()).sort((a, b) => b.subscribers - a.subscribers)

  if (influencers.length === 0 && errors.length === 0) {
    errors.push('No valid rows found. Check channel name and CSV format.')
  }

  return { influencers, skipped, errors }
}
