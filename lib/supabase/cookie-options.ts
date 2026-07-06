import type { CookieOptions } from '@supabase/ssr'

/** Supabase auth storage key (PKCE verifier cookie name = `${storageKey}-code-verifier`). */
export function supabaseAuthStorageKey(supabaseUrl: string): string {
  try {
    const ref = new URL(supabaseUrl).hostname.split('.')[0]
    return `sb-${ref}-auth-token`
  } catch {
    return 'sb-auth-token'
  }
}

function isLivewhereHost(hostname: string): boolean {
  return hostname === 'livewhere.io' || hostname === 'www.livewhere.io'
}

/**
 * Cookie options for browser PKCE/session cookies.
 * Uses `.livewhere.io` only when the page is actually served on livewhere.io / www —
 * not from build-time env (preview builds also embed NEXT_PUBLIC_SITE_URL).
 */
export function getBrowserSupabaseCookieOptions(): CookieOptions {
  const isBrowser = typeof window !== 'undefined'
  const hostname = isBrowser ? window.location.hostname : ''
  const secure = isBrowser ? window.location.protocol === 'https:' : process.env.NODE_ENV === 'production'

  const options: CookieOptions = {
    path: '/',
    sameSite: 'lax',
    secure,
  }

  if (isLivewhereHost(hostname)) {
    options.domain = '.livewhere.io'
  }

  return options
}
