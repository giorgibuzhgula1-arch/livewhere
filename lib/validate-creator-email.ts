import type { OutreachPlatform } from '@/lib/outreach-types'

const EMAIL_REGEX =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'official',
  'channel',
  'youtube',
  'instagram',
  'tiktok',
  'videos',
  'video',
  'page',
  'account',
  'creator',
  'tv',
  'live',
  'shorts',
  'reels',
  'podcast',
  'show',
])

const GENERIC_LOCAL_PARTS = new Set([
  'info',
  'contact',
  'contacts',
  'support',
  'help',
  'hello',
  'hi',
  'admin',
  'office',
  'team',
  'sales',
  'press',
  'media',
  'pr',
  'marketing',
  'business',
  'enquiries',
  'inquiry',
  'inquiries',
  'careers',
  'jobs',
  'hr',
  'billing',
  'legal',
  'privacy',
  'security',
  'newsletter',
  'subscribe',
  'mail',
  'email',
  'webmaster',
  'postmaster',
  'noreply',
  'no-reply',
  'donotreply',
  'customerservice',
  'customer',
  'service',
  'general',
  'reception',
  'booking',
])

const BLOCKED_DOMAIN_EXACT = new Set([
  'example.com',
  'email.com',
  'domain.com',
  'youremail.com',
  'google.com',
  'youtube.com',
  'instagram.com',
  'tiktok.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'wikipedia.org',
  'googleusercontent.com',
])

const BLOCKED_DOMAIN_SUBSTRINGS = [
  'embassy',
  'consulate',
  'diplomat',
  'government',
  'gov.',
  '.gov.',
  'gouv.',
  'minister',
  'ministry',
  'maec.es',
  'state.gov',
  'whitehouse',
  'parliament',
  'senate',
  'congress',
  'foreignaffairs',
  'foreign-affairs',
  'immigration',
  'passport.',
  'un.org',
  'who.int',
  'nhs.uk',
  'police.',
  'court.',
  'judiciary',
  'tax.',
  'revenue.',
  'customs.',
]

const BLOCKED_TLD_SUFFIXES = ['.gov', '.mil', '.int', '.edu', '.ac.uk', '.gob', '.gouv']

export type CreatorEmailContext = {
  channelName: string
  profileUrl?: string
  platform?: OutreachPlatform
}

function normalizeToken(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function channelNameTokens(channelName: string): string[] {
  const words = channelName
    .toLowerCase()
    .replace(/[^a-z0-9\s@._-]/g, ' ')
    .split(/\s+/)
    .map(normalizeToken)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))

  const unique = Array.from(new Set(words))

  const joined = normalizeToken(
    channelName.replace(/[^a-z0-9]/gi, '')
  )
  if (joined.length >= 4) unique.push(joined)

  return unique
}

function handleFromProfileUrl(profileUrl: string | undefined): string | null {
  if (!profileUrl) return null
  try {
    const url = new URL(profileUrl)
    const host = url.hostname
    const parts = url.pathname.split('/').filter(Boolean)

    if (host.includes('instagram.com') && parts[0]) {
      return normalizeToken(parts[0].replace(/^@/, ''))
    }
    if (host.includes('tiktok.com')) {
      const match = url.pathname.match(/^\/@([A-Za-z0-9._]+)/)
      if (match?.[1]) return normalizeToken(match[1])
    }
    if (host.includes('youtube.com')) {
      const at = parts.find((p) => p.startsWith('@'))
      if (at) return normalizeToken(at.replace(/^@/, ''))
      if (parts[0] === 'channel' && parts[1]) return null
      if (parts[0]) return normalizeToken(parts[0].replace(/^@/, ''))
    }
  } catch {
    return null
  }
  return null
}

function identifierTokens(ctx: CreatorEmailContext): string[] {
  const tokens = channelNameTokens(ctx.channelName)
  const handle = handleFromProfileUrl(ctx.profileUrl)
  if (handle && handle.length >= 3) tokens.push(handle)
  return Array.from(new Set(tokens))
}

function domainLooksBlocked(domain: string): boolean {
  const d = domain.toLowerCase()
  if (BLOCKED_DOMAIN_EXACT.has(d)) return true
  if (d.endsWith('.vis')) return true
  if (BLOCKED_TLD_SUFFIXES.some((suffix) => d.endsWith(suffix) || d.includes(suffix))) {
    return true
  }
  return BLOCKED_DOMAIN_SUBSTRINGS.some((part) => d.includes(part))
}

function localPartLooksGeneric(local: string): boolean {
  const l = local.toLowerCase().split('+')[0]
  if (GENERIC_LOCAL_PARTS.has(l)) return true
  if (l.startsWith('noreply') || l.startsWith('no-reply') || l.startsWith('donotreply')) {
    return true
  }
  if (/^(info|contact|support|admin|sales|press|media|help)[0-9]*$/.test(l)) return true
  return false
}

function tokenMatchesInEmailPart(token: string, part: string): boolean {
  if (token.length < 3) return false
  const normalized = part.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (normalized.includes(token)) return true
  if (token.length >= 5 && normalized.length >= 5) {
    return token.slice(0, 4) === normalized.slice(0, 4) || normalized.includes(token.slice(0, 4))
  }
  return false
}

function matchesCreatorIdentity(
  local: string,
  domain: string,
  tokens: string[]
): boolean {
  if (tokens.length === 0) return false

  const localNorm = local.toLowerCase().replace(/[^a-z0-9]/g, '')
  const domainBase = domain.split('.')[0]?.toLowerCase() ?? ''
  const domainNorm = domain.toLowerCase().replace(/[^a-z0-9]/g, '')

  for (const token of tokens) {
    if (tokenMatchesInEmailPart(token, localNorm)) return true
    if (tokenMatchesInEmailPart(token, domainBase)) return true
    if (token.length >= 4 && tokenMatchesInEmailPart(token, domainNorm)) return true
  }

  return false
}

/** Returns true when the email likely belongs to this creator (not gov/institutional/unrelated). */
export function isLikelyCreatorEmail(
  email: string,
  ctx: CreatorEmailContext
): boolean {
  const trimmed = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return false

  const at = trimmed.indexOf('@')
  if (at <= 0) return false

  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  if (!domain.includes('.')) return false

  if (domainLooksBlocked(domain)) return false
  if (localPartLooksGeneric(local)) return false

  const tokens = identifierTokens(ctx)
  if (!matchesCreatorIdentity(local, domain, tokens)) return false

  return true
}

export function sanitizeCreatorEmail(
  email: string | null | undefined,
  ctx: CreatorEmailContext
): string | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  return isLikelyCreatorEmail(normalized, ctx) ? normalized : null
}

/** Pick the first email in text that passes creator validation. */
export function extractCreatorEmailFromText(
  text: string | null | undefined,
  ctx: CreatorEmailContext
): string | null {
  if (!text) return null
  const matches = text.match(EMAIL_REGEX)
  if (!matches?.length) return null

  for (const raw of matches) {
    const email = raw.toLowerCase()
    if (sanitizeCreatorEmail(email, ctx)) return email
  }

  return null
}
