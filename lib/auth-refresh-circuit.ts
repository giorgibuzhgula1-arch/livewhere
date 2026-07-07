/**
 * Circuit breaker for Supabase refresh_token requests.
 * Stops hammering /auth/v1/token when rate-limited (HTTP 429).
 */

export const REFRESH_CIRCUIT_COOLDOWN_MS = 120_000

let blockedUntil = 0
let localSignOutInFlight = false

export function isRefreshCircuitOpen(): boolean {
  return Date.now() < blockedUntil
}

export function openRefreshCircuit(cooldownMs = REFRESH_CIRCUIT_COOLDOWN_MS): void {
  blockedUntil = Date.now() + cooldownMs
}

export function resetRefreshCircuit(): void {
  blockedUntil = 0
}

export function isRefreshTokenRequestUrl(url: string): boolean {
  return url.includes('/token?') && url.includes('grant_type=refresh_token')
}

export function isAuthRateLimited(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { status?: number; message?: string }
  if (e.status === 429) return true
  const msg = (e.message ?? '').toLowerCase()
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  )
}

type SignOutLocal = () => Promise<unknown>

let signOutLocalHandler: SignOutLocal | null = null

/** Register once from the browser Supabase client to clear stale cookies after 429. */
export function registerRefreshCircuitSignOut(handler: SignOutLocal): void {
  signOutLocalHandler = handler
}

async function clearLocalSessionOnce(): Promise<void> {
  if (localSignOutInFlight || !signOutLocalHandler) return
  localSignOutInFlight = true
  try {
    await signOutLocalHandler()
  } catch {
    // Best-effort — circuit still blocks further refresh attempts.
  } finally {
    localSignOutInFlight = false
  }
}

export function createAuthGuardedFetch(
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): typeof fetch {
  return async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url

    if (isRefreshTokenRequestUrl(url) && isRefreshCircuitOpen()) {
      return new Response(
        JSON.stringify({
          error: 'refresh_circuit_open',
          error_description: 'Too many token refresh attempts; cooling down.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const response = await fetchImpl(input, init)

    if (response.status === 429 && isRefreshTokenRequestUrl(url)) {
      openRefreshCircuit()
      await clearLocalSessionOnce()
    }

    return response
  }
}
