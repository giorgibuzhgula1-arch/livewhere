import { extractEmailFromText } from '@/lib/extract-email'

const GOOGLE_SEARCH_ENDPOINT = 'https://api.outscraper.com/google-search-v3'

type OutscraperGoogleSearchResponse = {
  status?: string
  data?: unknown
  error?: boolean
  errorMessage?: string
}

function getOutscraperApiKey(): string {
  const key = process.env.OUTSCRAPER_API_KEY?.trim()
  if (!key) throw new Error('OUTSCRAPER_API_KEY is not configured')
  return key
}

function flattenOutscraperData(data: unknown): Record<string, unknown>[] {
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

const SERP_TEXT_FIELDS = ['title', 'description', 'snippet', 'link'] as const
const SERP_SECTIONS = [
  'organic_results',
  'ads',
  'shopping_results',
  'related_questions',
  'local_results',
  'news_results',
] as const

/** Collect text from Google Search SERP blocks for email regex extraction. */
function collectGoogleSearchTextBlocks(payload: OutscraperGoogleSearchResponse): string[] {
  const blocks: string[] = []
  const rows = flattenOutscraperData(payload.data)

  for (const row of rows) {
    for (const sectionKey of SERP_SECTIONS) {
      const section = row[sectionKey]
      if (!Array.isArray(section)) continue
      for (const item of section) {
        if (!item || typeof item !== 'object') continue
        const entry = item as Record<string, unknown>
        for (const field of SERP_TEXT_FIELDS) {
          const value = entry[field]
          if (typeof value === 'string' && value.trim()) {
            blocks.push(value)
          }
        }
      }
    }
  }

  if (blocks.length === 0) {
    collectAllStrings(payload, blocks)
  }

  return blocks
}

function collectAllStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    if (value.includes('@') || value.toLowerCase().includes('email')) {
      out.push(value)
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectAllStrings(v, out))
    return
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectAllStrings(v, out))
  }
}

/** Extract the first valid email from Google Search API JSON via regex on result text. */
export function extractEmailFromGoogleSearchPayload(
  payload: OutscraperGoogleSearchResponse
): string | null {
  const blocks = collectGoogleSearchTextBlocks(payload)
  for (const text of blocks) {
    const email = extractEmailFromText(text)
    if (email) return email
  }
  return null
}

export type OutscraperDebugInfo = {
  requestQuery: string
  requestUrl: string
  httpStatus: number
  rawResponse: OutscraperGoogleSearchResponse
  parsedEmail: string | null
  textBlocksSample: string[]
}

/** Outscraper Google Search query: "{channelName} email contact" */
export function buildOutscraperEnrichQuery(channelName: string): string {
  const name = channelName.trim()
  return `${name} email contact`
}

/** Find contact email via Outscraper Google Search v3. */
export async function findEmailViaOutscraper(
  query: string,
  options?: { debug?: boolean }
): Promise<string | null> {
  const q = query.trim()
  if (!q) return null

  const url = new URL(GOOGLE_SEARCH_ENDPOINT)
  url.searchParams.set('query', q)
  url.searchParams.set('pagesPerQuery', '1')
  url.searchParams.set('async', 'false')

  const res = await fetch(url.toString(), {
    headers: { 'X-API-KEY': getOutscraperApiKey() },
    cache: 'no-store',
  })

  const payload = (await res.json()) as OutscraperGoogleSearchResponse
  const parsedEmail = extractEmailFromGoogleSearchPayload(payload)

  if (options?.debug) {
    const blocks = collectGoogleSearchTextBlocks(payload)
    const debugInfo: OutscraperDebugInfo = {
      requestQuery: q,
      requestUrl: url.toString(),
      httpStatus: res.status,
      rawResponse: payload,
      parsedEmail,
      textBlocksSample: blocks.slice(0, 12),
    }
    console.log('[Outscraper debug] google-search-v3', JSON.stringify(debugInfo, null, 2))
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
