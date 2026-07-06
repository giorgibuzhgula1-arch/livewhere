import {
  CANONICAL_PRODUCTION_ORIGIN,
  canonicalLivewhereOriginFromEnv,
  getSiteUrl,
} from '@/lib/site-url'

function isLivewhereHostname(hostname: string): boolean {
  return hostname === 'livewhere.io' || hostname === 'www.livewhere.io'
}

function isVercelPreviewHostname(hostname: string): boolean {
  return hostname.endsWith('.vercel.app')
}

/** If the user is on apex `livewhere.io`, hard-navigate to `www` before OAuth (PKCE cookies are host-scoped). */
export function redirectToWwwIfApex(): boolean {
  if (typeof window === 'undefined') return false
  const { hostname, protocol, pathname, search, hash } = window.location
  if (hostname !== 'livewhere.io') return false
  window.location.replace(`${protocol}//www.livewhere.io${pathname}${search}${hash}`)
  return true
}

/**
 * Origin for OAuth `redirectTo` / email callbacks.
 * Production (custom domain or VERCEL_ENV=production build): always www.livewhere.io.
 * Preview (*.vercel.app) or local: current origin so PKCE cookie and callback share the same host.
 */
export function oauthRedirectOrigin(): string {
  const canonicalFromEnv = canonicalLivewhereOriginFromEnv()

  if (typeof window !== 'undefined') {
    const { hostname } = window.location

    if (isLivewhereHostname(hostname)) {
      return CANONICAL_PRODUCTION_ORIGIN
    }

    // Preview deploy or localhost — callback must stay on the same host as the verifier cookie.
    if (isVercelPreviewHostname(hostname) || hostname === 'localhost' || hostname === '127.0.0.1') {
      return window.location.origin
    }
  }

  // Production Vercel build (inlined at compile time): never use VERCEL_URL / preview host.
  if (process.env.VERCEL_ENV === 'production') {
    return canonicalFromEnv ?? CANONICAL_PRODUCTION_ORIGIN
  }

  return canonicalFromEnv ?? getSiteUrl()
}

/** Poll until the PKCE verifier cookie is visible to `document.cookie` (auth-js reads from here). */
export function waitForPkceVerifierInDocumentCookie(
  storageKey: string,
  maxMs = 2000,
): Promise<boolean> {
  const cookieName = `${storageKey}-code-verifier`
  return new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      if (typeof document !== 'undefined' && document.cookie.includes(cookieName)) {
        resolve(true)
        return
      }
      if (Date.now() - started >= maxMs) {
        resolve(false)
        return
      }
      setTimeout(tick, 25)
    }
    tick()
  })
}
