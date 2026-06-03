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

/** Find a contact email for a channel/brand name via Outscraper. */
export async function findEmailViaOutscraper(
  channelName: string
): Promise<string | null> {
  const query = channelName.trim()
  if (!query) return null

  const url = new URL(OUTSCRAPER_ENDPOINT)
  url.searchParams.set('query', query)
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

/** Throttle sequential Outscraper lookups to reduce rate-limit errors. */
export async function findEmailsViaOutscraperBatch(
  channelNames: string[],
  options?: { delayMs?: number }
): Promise<Map<string, string | null>> {
  const delayMs = options?.delayMs ?? 400
  const results = new Map<string, string | null>()

  for (const name of channelNames) {
    try {
      const email = await findEmailViaOutscraper(name)
      results.set(name, email)
    } catch (err) {
      console.error(`Outscraper failed for "${name}":`, err)
      results.set(name, null)
    }
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return results
}
