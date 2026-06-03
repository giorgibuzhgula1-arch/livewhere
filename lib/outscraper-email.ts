import { extractEmailFromText } from '@/lib/extract-email'

const OUTSCRAPER_ENDPOINT = 'https://api.outscraper.com/emails-and-contacts'

type OutscraperEmailEntry = { value?: string }
type OutscraperResultRow = {
  query?: string
  emails?: OutscraperEmailEntry[]
}

type OutscraperResponse = {
  status?: string
  data?: OutscraperResultRow[]
  error?: boolean
  errorMessage?: string
}

function getOutscraperApiKey(): string {
  const key = process.env.OUTSCRAPER_API_KEY?.trim()
  if (!key) throw new Error('OUTSCRAPER_API_KEY is not configured')
  return key
}

export function parseOutscraperEmailPayload(payload: OutscraperResponse): string | null {
  const rows = payload.data ?? []
  for (const row of rows) {
    for (const entry of row.emails ?? []) {
      const raw = entry.value?.trim()
      if (!raw) continue
      const normalized = extractEmailFromText(raw) ?? raw.toLowerCase()
      if (normalized.includes('@')) return normalized
    }
  }
  return null
}

/** Find contact email via Outscraper (query: domain, site, or YouTube channel URL). */
export async function findEmailViaOutscraper(query: string): Promise<string | null> {
  const q = query.trim()
  if (!q) return null

  const url = new URL(OUTSCRAPER_ENDPOINT)
  url.searchParams.set('query', q)
  url.searchParams.set('limit', '1')
  url.searchParams.set('async', 'false')

  const res = await fetch(url.toString(), {
    headers: { 'X-API-KEY': getOutscraperApiKey() },
    cache: 'no-store',
  })

  const payload = (await res.json()) as OutscraperResponse

  if (!res.ok) {
    const msg = payload.errorMessage || `Outscraper error (${res.status})`
    throw new Error(msg)
  }

  if (payload.error) {
    throw new Error(payload.errorMessage || 'Outscraper request failed')
  }

  return parseOutscraperEmailPayload(payload)
}

export function youtubeChannelUrl(channelId: string): string {
  return `https://youtube.com/channel/${channelId}`
}
