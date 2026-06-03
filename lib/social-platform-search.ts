import { extractCreatorEmailFromText } from '@/lib/validate-creator-email'
import type { OutreachInfluencer, OutreachPlatform } from '@/lib/outreach-types'
import {
  collectOrganicResults,
  fetchOutscraperGoogleSearch,
} from '@/lib/outscraper-google-search'
import { parseFollowerCount } from '@/lib/parse-follower-count'

const MIN_FOLLOWERS = 5_000
const MAX_FOLLOWERS = 200_000
/** Target creators returned after parsing/filtering (cap). */
const MAX_RESULTS = 50
/**
 * Outscraper `pagesPerQuery` for IG/TikTok discovery (~10 Google organic links/page).
 * Passed to google-search-v3; there is no separate results limit/count param.
 */
export const SOCIAL_OUTSCRAPER_PAGES_PER_QUERY = 5

const INSTAGRAM_BLOCK =
  /^(p|reel|reels|explore|stories|tv|accounts|about|developer|directory|legal)$/i

function passesFollowerFilter(count: number): boolean {
  if (count <= 0) return true
  return count >= MIN_FOLLOWERS && count <= MAX_FOLLOWERS
}

function cleanDisplayName(title: string, username: string): string {
  let name = title.trim()
  name = name.replace(/\s*[-|•·]\s*Instagram.*$/i, '')
  name = name.replace(/\s*[-|•·]\s*TikTok.*$/i, '')
  name = name.replace(/\s*\(@?[A-Za-z0-9._]+\)\s*/g, ' ')
  name = name.replace(/\s+/g, ' ').trim()
  return name || username
}

function parseInstagramUsername(link: string): string | null {
  try {
    const url = new URL(link)
    if (!url.hostname.includes('instagram.com')) return null
    const segment = url.pathname.split('/').filter(Boolean)[0]
    if (!segment || INSTAGRAM_BLOCK.test(segment)) return null
    return segment.replace(/^@/, '')
  } catch {
    const match = link.match(/instagram\.com\/(?!p\/|reel|reels\/|explore\/)([A-Za-z0-9._]+)/i)
    return match?.[1]?.replace(/^@/, '') ?? null
  }
}

function parseTikTokUsername(link: string): string | null {
  try {
    const url = new URL(link)
    if (!url.hostname.includes('tiktok.com')) return null
    const match = url.pathname.match(/^\/@([A-Za-z0-9._]+)/)
    return match?.[1] ?? null
  } catch {
    const match = link.match(/tiktok\.com\/@([A-Za-z0-9._]+)/i)
    return match?.[1] ?? null
  }
}

function organicToInfluencers(
  platform: 'instagram' | 'tiktok',
  keyword: string,
  organic: ReturnType<typeof collectOrganicResults>
): OutreachInfluencer[] {
  const q = keyword.trim()
  const seen = new Set<string>()
  const results: OutreachInfluencer[] = []

  for (const entry of organic) {
    if (results.length >= MAX_RESULTS) break
    const link = entry.link?.trim()
    if (!link) continue

    const username =
      platform === 'instagram'
        ? parseInstagramUsername(link)
        : parseTikTokUsername(link)
    if (!username) continue

    const handleKey = username.toLowerCase()
    if (seen.has(handleKey)) continue
    seen.add(handleKey)

    const blob = [entry.title, entry.description, entry.snippet].filter(Boolean).join(' ')
    const subscribers = parseFollowerCount(blob)
    if (!passesFollowerFilter(subscribers)) continue

    const profileUrl =
      platform === 'instagram'
        ? `https://www.instagram.com/${username}/`
        : `https://www.tiktok.com/@${username}`

    const channelName = cleanDisplayName(entry.title ?? '', username)

    results.push({
      channelId: `${platform}:${handleKey}`,
      channelName,
      platform,
      subscribers,
      country: null,
      email: extractCreatorEmailFromText(blob, {
        channelName,
        profileUrl,
        platform,
      }),
      profileUrl,
      keyword: q,
    })
  }

  results.sort((a, b) => b.subscribers - a.subscribers)
  return results
}

async function fetchOrganicForQueries(queries: string[]) {
  const payloads = await Promise.all(
    queries.map((searchQuery) =>
      fetchOutscraperGoogleSearch(searchQuery, {
        pagesPerQuery: SOCIAL_OUTSCRAPER_PAGES_PER_QUERY,
      })
    )
  )
  return payloads.flatMap((payload) => collectOrganicResults(payload))
}

async function searchInstagramViaGoogle(keyword: string): Promise<OutreachInfluencer[]> {
  const q = keyword.trim()
  if (!q) return []

  const queries = [`${q} site:instagram.com`, `${q} creator site:instagram.com`]
  const organic = await fetchOrganicForQueries(queries)
  return organicToInfluencers('instagram', q, organic)
}

async function searchTikTokViaGoogle(keyword: string): Promise<OutreachInfluencer[]> {
  const q = keyword.trim()
  if (!q) return []

  const organic = await fetchOrganicForQueries([`${q} influencer site:tiktok.com`])
  return organicToInfluencers('tiktok', q, organic)
}

export async function searchInstagramInfluencers(
  keyword: string
): Promise<OutreachInfluencer[]> {
  return searchInstagramViaGoogle(keyword)
}

export async function searchTikTokInfluencers(
  keyword: string
): Promise<OutreachInfluencer[]> {
  return searchTikTokViaGoogle(keyword)
}
