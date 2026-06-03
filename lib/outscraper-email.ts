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

export type OutscraperDebugInfo = {
  requestQuery: string
  requestUrl: string
  httpStatus: number
  rawResponse: OutscraperResponse
  parsedEmail: string | null
  responseQuery?: string
}

/** Build Outscraper search query for influencer email discovery. */
export function buildOutscraperEnrichQuery(channelName: string): string {
  const name = channelName.trim()
  return `${name} contact email site:youtube.com OR site:twitter.com OR site:instagram.com`
}

/** Find contact email via Outscraper. */
export async function findEmailViaOutscraper(
  query: string,
  options?: { debug?: boolean }
): Promise<string | null> {
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
  const parsedEmail = parseOutscraperEmailPayload(payload)

  if (options?.debug) {
    const debugInfo: OutscraperDebugInfo = {
      requestQuery: q,
      requestUrl: url.toString(),
      httpStatus: res.status,
      rawResponse: payload,
      parsedEmail,
      responseQuery: payload.data?.[0]?.query,
    }
    console.log('[Outscraper debug] emails-and-contacts', JSON.stringify(debugInfo, null, 2))
  }

  if (!res.ok) {
    const msg = payload.errorMessage || `Outscraper error (${res.status})`
    throw new Error(msg)
  }

  if (payload.error) {
    throw new Error(payload.errorMessage || 'Outscraper request failed')
  }

  return parsedEmail
}

export function youtubeChannelUrl(channelId: string): string {
  return `https://youtube.com/channel/${channelId}`
}
