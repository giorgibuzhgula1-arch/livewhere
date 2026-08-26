import type { CookieOptions } from '@supabase/ssr'

export type CookiePair = { name: string; value: string }

export type ParsedAuthSession = {
  access_token: string
  refresh_token?: string
  expires_at?: number
  expires_in?: number
  token_type?: string
  user?: unknown
}

function decodeBase64Utf8(b64: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(b64, 'base64').toString('utf8')
    }
  } catch {
    /* fall through */
  }
  const binary = atob(b64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Normalize a single auth-cookie value (URI-encoded, quoted, or base64- prefix). */
export function decodeSupabaseCookieValue(raw: string): string {
  let value = raw.trim()
  if (!value) return value

  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
    value = value.slice(1, -1)
  }

  if (value.includes('%')) {
    try {
      value = decodeURIComponent(value)
    } catch {
      /* keep original decode attempt */
    }
  }

  if (value.startsWith('base64-')) {
    try {
      const decoded = decodeBase64Utf8(value.slice(7))
      if (decoded.startsWith('{') || decoded.startsWith('[')) {
        value = decoded
      }
    } catch {
      /* keep */
    }
  }

  return value
}

function sessionFromValue(raw: string | undefined): ParsedAuthSession | null {
  if (!raw) return null
  const decoded = decodeSupabaseCookieValue(raw)
  try {
    const parsed = JSON.parse(decoded) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as ParsedAuthSession).access_token === 'string' &&
      (parsed as ParsedAuthSession).access_token.length > 0
    ) {
      return parsed as ParsedAuthSession
    }
  } catch {
    /* not JSON */
  }
  return null
}

/**
 * Reassemble sb-*-auth-token or sb-*-auth-token.0 + .1 chunks.
 * Prefers whichever candidate actually parses as a session, so a stale
 * unchunked leftover cannot mask valid chunked cookies.
 */
export function combineCookieChunks(cookies: CookiePair[], key: string): string | undefined {
  const map = new Map<string, string>()
  for (const cookie of cookies) {
    map.set(cookie.name, cookie.value)
  }

  const baseRaw = map.get(key)
  const chunkParts: string[] = []
  for (let i = 0; ; i += 1) {
    const part = map.get(`${key}.${i}`)
    if (part === undefined) break
    chunkParts.push(part)
  }
  const joinedRaw = chunkParts.length > 0 ? chunkParts.join('') : undefined

  for (const candidate of [baseRaw, joinedRaw]) {
    if (!candidate) continue
    if (sessionFromValue(candidate)) {
      return decodeSupabaseCookieValue(candidate)
    }
  }

  if (joinedRaw) return decodeSupabaseCookieValue(joinedRaw)
  if (baseRaw) return decodeSupabaseCookieValue(baseRaw)
  return undefined
}

export function parseCookieHeader(header: string): CookiePair[] {
  if (!header.trim()) return []
  const pairs: CookiePair[] = []
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    pairs.push({
      name: trimmed.slice(0, eq).trim(),
      value: trimmed.slice(eq + 1),
    })
  }
  return pairs
}

export function parseSupabaseSessionFromCookies(
  cookies: CookiePair[],
  storageKey: string,
): ParsedAuthSession | null {
  const combined = combineCookieChunks(cookies, storageKey)
  return sessionFromValue(combined)
}

type CookieStoreLike = {
  getAll: () => CookiePair[]
  set?: (cookie: { name: string; value: string } & CookieOptions) => void
}

/** Cookie adapter for @supabase/ssr 0.3 createServerClient (get/set/remove). */
export function createSupabaseSsrCookieMethods(cookieStore: CookieStoreLike) {
  return {
    get(name: string) {
      return combineCookieChunks(cookieStore.getAll(), name)
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set?.({ name, value, ...options })
      } catch {
        /* read-only Server Component context */
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set?.({ name, value: '', ...options, maxAge: 0 })
      } catch {
        /* read-only Server Component context */
      }
    },
  }
}
