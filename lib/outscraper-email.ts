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

export type OutscraperDebugInfo = {
  requestQuery: string
  parsedEmail: string | null
  textBlocksSample: string[]
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

/** Find contact email via Outscraper Google Search v3. */
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
