import {
  collectSerpTextBlocks,
  fetchOutscraperGoogleSearch,
  type OutscraperGoogleSearchResponse,
} from '@/lib/outscraper-google-search'
import {
  extractCreatorEmailFromText,
  sanitizeCreatorEmail,
  type CreatorEmailContext,
} from '@/lib/validate-creator-email'

const YOUTUBE_CHANNELS_ENDPOINT = 'https://api.outscraper.com/youtube/channels'

export type OutscraperDebugInfo = {
  requestQuery: string
  parsedEmail: string | null
  textBlocksSample: string[]
}

type OutscraperYouTubeChannelsResponse = {
  data?: unknown
  error?: boolean
  errorMessage?: string
}

function getOutscraperApiKey(): string | null {
  return process.env.OUTSCRAPER_API_KEY?.trim() || null
}

function flattenOutscraperRows(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return []
  const rows: Record<string, unknown>[] = []
  for (const item of data) {
    if (Array.isArray(item)) {
      for (const nested of item) {
        if (nested && typeof nested === 'object') {
          rows.push(nested as Record<string, unknown>)
        }
      }
    } else if (item && typeof item === 'object') {
      rows.push(item as Record<string, unknown>)
    }
  }
  return rows
}

function extractEmailFromYouTubeChannelsData(data: unknown): string | null {
  for (const row of flattenOutscraperRows(data)) {
    const email = row.email
    if (typeof email === 'string' && email.trim()) return email.trim()
  }
  return null
}

/** Extract the first valid creator email from Google Search API JSON. */
export function extractEmailFromGoogleSearchPayload(
  payload: OutscraperGoogleSearchResponse,
  ctx: CreatorEmailContext
): string | null {
  const blocks = collectSerpTextBlocks(payload)
  const combined = blocks.join('\n')
  return extractCreatorEmailFromText(combined, ctx)
}

/** Outscraper Google Search query: "{channelName} email contact" */
export function buildOutscraperEnrichQuery(channelName: string): string {
  const name = channelName.trim()
  return `${name} email contact`
}

/** Find contact email via Outscraper YouTube Channels API. */
export async function findEmailViaYouTubeChannel(
  channelId: string
): Promise<string | null> {
  const id = channelId.trim()
  if (!id) return null

  const apiKey = getOutscraperApiKey()
  if (!apiKey) return null

  const url = new URL(YOUTUBE_CHANNELS_ENDPOINT)
  url.searchParams.set('channelId', id)
  url.searchParams.set('async', 'false')

  console.log('[outscraper] youtube/channels:', url.toString())

  try {
    const res = await fetch(url.toString(), {
      headers: { 'X-API-KEY': apiKey },
      cache: 'no-store',
    })

    const payload = (await res.json()) as OutscraperYouTubeChannelsResponse

    if (!res.ok) {
      const msg =
        payload.errorMessage || `Outscraper YouTube channels error (${res.status})`
      throw new Error(msg)
    }

    if (payload.error) {
      throw new Error(payload.errorMessage || 'Outscraper YouTube channels request failed')
    }

    const rawEmail = extractEmailFromYouTubeChannelsData(payload.data)
    const ctx: CreatorEmailContext = { channelName: id }
    return sanitizeCreatorEmail(rawEmail, ctx)
  } catch (err) {
    console.error('[outscraper] youtube/channels failed:', err)
    throw err
  }
}

/** Find contact email via Outscraper Google Search v3 (fallback for non-YouTube or when Channels API misses). */
export async function findEmailViaOutscraper(
  query: string,
  ctx: CreatorEmailContext,
  options?: { debug?: boolean }
): Promise<string | null> {
  const q = query.trim()
  if (!q) return null

  const payload = await fetchOutscraperGoogleSearch(q)
  const rawEmail = extractEmailFromGoogleSearchPayload(payload, ctx)
  const parsedEmail = sanitizeCreatorEmail(rawEmail, ctx)

  if (options?.debug) {
    const blocks = collectSerpTextBlocks(payload)
    const debugInfo: OutscraperDebugInfo = {
      requestQuery: q,
      parsedEmail,
      textBlocksSample: blocks.slice(0, 12),
    }
    console.log('[Outscraper debug] google-search-v3', JSON.stringify(debugInfo, null, 2))
  }

  return parsedEmail
}
