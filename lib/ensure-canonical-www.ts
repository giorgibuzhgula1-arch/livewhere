import { getSiteUrl } from '@/lib/site-url'

/** If the user is on apex `livewhere.io`, hard-navigate to `www` before OAuth (PKCE cookies are host-scoped). */
export function redirectToWwwIfApex(): boolean {
  if (typeof window === 'undefined') return false
  const { hostname, protocol, pathname, search, hash } = window.location
  if (hostname !== 'livewhere.io') return false
  window.location.replace(`${protocol}//www.livewhere.io${pathname}${search}${hash}`)
  return true
}

/** Origin used in OAuth redirect URLs — always `www` on production apex/www hosts. */
export function oauthRedirectOrigin(): string {
  if (typeof window === 'undefined') return getSiteUrl()
  const { hostname, protocol } = window.location
  if (hostname === 'livewhere.io' || hostname === 'www.livewhere.io') {
    return `${protocol}//www.livewhere.io`
  }
  return window.location.origin
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
