/** Parse follower/subscriber counts from SERP snippets (e.g. "12.5K followers", "120,000 Followers"). */
export function parseFollowerCount(text: string | null | undefined): number {
  if (!text) return 0

  const normalized = text.replace(/,/g, ' ')
  const match = normalized.match(
    /(\d+(?:\.\d+)?)\s*([kKmMbB])?\s*(?:followers?|subscribers?|following)?/i
  )
  if (!match) return 0

  let value = parseFloat(match[1])
  const suffix = match[2]?.toLowerCase()
  if (suffix === 'k') value *= 1_000
  else if (suffix === 'm' || suffix === 'b') value *= 1_000_000

  return Math.round(value)
}
