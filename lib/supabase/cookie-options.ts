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

/** Cookie options for browser PKCE/session cookies. Uses `.livewhere.io` in production so apex + www share the verifier. */
export function getBrowserSupabaseCookieOptions(): CookieOptions {
  const isBrowser = typeof window !== 'undefined'
  const hostname = isBrowser ? window.location.hostname : ''
  const secure = isBrowser ? window.location.protocol === 'https:' : process.env.NODE_ENV === 'production'

  const options: CookieOptions = {
    path: '/',
    sameSite: 'lax',
    secure,
  }

  const onLivewhere =
    isLivewhereHost(hostname) ||
    process.env.NEXT_PUBLIC_SITE_URL?.includes('livewhere.io') ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('livewhere.io')

  if (onLivewhere) {
    options.domain = '.livewhere.io'
  }

  return options
}
