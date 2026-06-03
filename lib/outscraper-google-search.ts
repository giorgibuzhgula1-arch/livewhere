const GOOGLE_SEARCH_ENDPOINT = 'https://api.outscraper.com/google-search-v3'
const REQUESTS_ENDPOINT = 'https://api.outscraper.com/requests'

export type OutscraperGoogleSearchResponse = {
  status?: string
  data?: unknown
  error?: boolean
  errorMessage?: string
  id?: string
}

export type SerpOrganicEntry = {
  link?: string
  title?: string
  description?: string
  snippet?: string
}

export type OutscraperGoogleSearchOptions = {
  /**
   * Number of Google result pages to scrape per query (Outscraper `pagesPerQuery`).
   * ~10 organic links per page. No separate limit/count param on this endpoint.
   */
  pagesPerQuery?: number
}

function getOutscraperApiKey(): string {
  const key = process.env.OUTSCRAPER_API_KEY?.trim()
  if (!key) throw new Error('OUTSCRAPER_API_KEY is not configured')
  return key
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

async function waitForOutscraperRequest(requestId: string): Promise<unknown> {
  const pollIntervalMs = 2000
  const maxAttempts = 90

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(pollIntervalMs)

    const res = await fetch(`${REQUESTS_ENDPOINT}/${requestId}`, {
      headers: { 'X-API-KEY': getOutscraperApiKey() },
      cache: 'no-store',
    })

    const body = (await res.json()) as OutscraperGoogleSearchResponse & {
      status?: string
    }

    if (!res.ok) {
      const msg = body.errorMessage || `Outscraper poll error (${res.status})`
      throw new Error(msg)
    }

    const status = body.status
    if (status === 'Success') {
      return body.data
    }
    if (status === 'Failed' || status === 'Error') {
      throw new Error(body.errorMessage || 'Outscraper request failed')
    }
  }

  throw new Error('Outscraper request timed out')
}

/** Run Outscraper Google Search v3 for a single query string. */
export async function fetchOutscraperGoogleSearch(
  query: string,
  options?: OutscraperGoogleSearchOptions
): Promise<OutscraperGoogleSearchResponse> {
  const q = query.trim()
  if (!q) throw new Error('Search query is required')

  const pagesPerQuery = Math.max(1, Math.min(40, options?.pagesPerQuery ?? 1))
  const useAsync = pagesPerQuery > 1

  const url = new URL(GOOGLE_SEARCH_ENDPOINT)
  url.searchParams.set('query', q)
  url.searchParams.set('pagesPerQuery', String(pagesPerQuery))
  url.searchParams.set('async', useAsync ? 'true' : 'false')

  const res = await fetch(url.toString(), {
    headers: { 'X-API-KEY': getOutscraperApiKey() },
    cache: 'no-store',
  })

  const payload = (await res.json()) as OutscraperGoogleSearchResponse

  if (!res.ok) {
    const msg = payload.errorMessage || `Outscraper error (${res.status})`
    throw new Error(msg)
  }

  if (payload.error) {
    throw new Error(payload.errorMessage || 'Outscraper request failed')
  }

  if (useAsync && payload.id) {
    const data = await waitForOutscraperRequest(payload.id)
    return { status: 'Success', data }
  }

  return payload
}

export function collectOrganicResults(
  payload: OutscraperGoogleSearchResponse
): SerpOrganicEntry[] {
  const entries: SerpOrganicEntry[] = []
  const rows = flattenOutscraperData(payload.data)

  for (const row of rows) {
    const organic = row.organic_results
    if (!Array.isArray(organic)) continue
    for (const item of organic) {
      if (item && typeof item === 'object') {
        entries.push(item as SerpOrganicEntry)
      }
    }
  }

  return entries
}

export function collectSerpTextBlocks(payload: OutscraperGoogleSearchResponse): string[] {
  const blocks: string[] = []
  for (const entry of collectOrganicResults(payload)) {
    for (const field of ['title', 'description', 'snippet', 'link'] as const) {
      const value = entry[field]
      if (typeof value === 'string' && value.trim()) blocks.push(value)
    }
  }
  return blocks
}
