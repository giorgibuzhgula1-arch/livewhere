/**
 * Circuit breaker for Supabase refresh_token requests.
 * Stops hammering /auth/v1/token when rate-limited (HTTP 429).
 */

import {
  isAuthSessionProbeUrl,
  isInvalidSessionHttpResponse,
  isRefreshTokenRequestUrl,
  recoverFromInvalidSession,
} from '@/lib/auth-session-recovery'

export { isAuthRateLimited, isRefreshTokenRequestUrl } from '@/lib/auth-session-recovery'

export const REFRESH_CIRCUIT_COOLDOWN_MS = 120_000

let blockedUntil = 0

export function isRefreshCircuitOpen(): boolean {
  return Date.now() < blockedUntil
}

export function openRefreshCircuit(cooldownMs = REFRESH_CIRCUIT_COOLDOWN_MS): void {
  blockedUntil = Date.now() + cooldownMs
}

export function resetRefreshCircuit(): void {
  blockedUntil = 0
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

    if (isAuthSessionProbeUrl(url) && !response.ok) {
      let body: unknown = null
      try {
        const text = await response.clone().text()
        body = text ? JSON.parse(text) : null
      } catch {
        body = null
      }

      if (isInvalidSessionHttpResponse(response.status, body, url)) {
        if (response.status === 429 && isRefreshTokenRequestUrl(url)) {
          openRefreshCircuit()
        }
        await recoverFromInvalidSession()
      }
    }

    return response
  }
}
