import { extractEmailFromText } from '@/lib/extract-email'
import {
  collectSerpTextBlocks,
  fetchOutscraperGoogleSearch,
  type OutscraperGoogleSearchResponse,
} from '@/lib/outscraper-google-search'

export type OutscraperDebugInfo = {
  requestQuery: string
  parsedEmail: string | null
  textBlocksSample: string[]
}

/** Extract the first valid email from Google Search API JSON via regex on result text. */
export function extractEmailFromGoogleSearchPayload(
  payload: OutscraperGoogleSearchResponse
): string | null {
  const blocks = collectSerpTextBlocks(payload)
  for (const text of blocks) {
    const email = extractEmailFromText(text)
    if (email) return email
  }
  return null
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

  const payload = await fetchOutscraperGoogleSearch(q)
  const parsedEmail = extractEmailFromGoogleSearchPayload(payload)

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
