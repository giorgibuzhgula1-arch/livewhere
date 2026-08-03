import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { isAuthRateLimited, isRefreshCircuitOpen } from '@/lib/auth-refresh-circuit'
import { hasPendingAnalyze } from '@/lib/pending-analyze'
import { hasPendingResults } from '@/lib/pending-results'

export const OAUTH_RETURN_KEY = 'livewhere_oauth_return'
export const PENDING_AUTH_RESTORE_KEY = 'livewhere_pending_auth_restore'
export const OAUTH_NEXT_KEY = 'livewhere_oauth_next'

function readFlag(key: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(key) === '1' || sessionStorage.getItem(key) === '1'
}

function writeFlag(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, '1')
  sessionStorage.setItem(key, '1')
}

function clearFlag(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

export function markOAuthReturn(): void {
  writeFlag(OAUTH_RETURN_KEY)
}

export function clearOAuthReturn(): void {
  clearFlag(OAUTH_RETURN_KEY)
}

export function isOAuthReturnPending(): boolean {
  return readFlag(OAUTH_RETURN_KEY)
}

/** Set before Google redirect so callback knows to return to results. */
export function markPendingAuthRestore(): void {
  writeFlag(PENDING_AUTH_RESTORE_KEY)
}

export function clearPendingAuthRestore(): void {
  clearFlag(PENDING_AUTH_RESTORE_KEY)
}

export function shouldRestoreAfterAuth(): boolean {
  return (
    readFlag(PENDING_AUTH_RESTORE_KEY) ||
    hasPendingResults() ||
    hasPendingAnalyze()
  )
}

export function getPostAuthRedirectPath(): string {
  return shouldRestoreAfterAuth() ? '/?restore=results' : '/'
}

/** Persist post-login destination — Supabase strips query params from callback URL on mobile. */
export function saveOAuthNext(path: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(OAUTH_NEXT_KEY, path)
}

export function loadOAuthNext(): string {
  if (typeof window === 'undefined') return '/'
  return localStorage.getItem(OAUTH_NEXT_KEY) || getPostAuthRedirectPath()
}

export function clearOAuthNext(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(OAUTH_NEXT_KEY)
}

const SESSION_EVENTS = new Set(['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED'])

const MAX_POLL_DELAY_MS = 2000

type SessionReadResult = {
  session: Session | null
  /** Stop polling — rate limited or refresh circuit is open. */
  stop: boolean
}

/**
 * Single getSession read with circuit-breaker awareness.
 * Avoids pairing getSession + getUser on every poll (each can trigger refresh).
 */
async function readAuthSessionOnce(): Promise<SessionReadResult> {
  if (isRefreshCircuitOpen()) {
    return { session: null, stop: true }
  }

  const { data: { session }, error } = await supabase.auth.getSession()
  if (error && isAuthRateLimited(error)) {
    return { session: null, stop: true }
  }
  if (session?.user) {
    return { session, stop: false }
  }
  return { session: null, stop: false }
}

/**
 * Wait until Supabase has a user session. Listens for auth events and polls
 * getSession with exponential backoff (no overlapping interval callbacks).
 */
export async function waitForAuthSession(
  maxAttempts = 50,
  initialDelayMs = 250,
): Promise<Session | null> {
  const first = await readAuthSessionOnce()
  if (first.session?.user) return first.session
  if (first.stop) return null

  return new Promise((resolve) => {
    let attempts = 0
    let settled = false
    let delayMs = initialDelayMs
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const finish = (session: Session | null) => {
      if (settled) return
      settled = true
      subscription.unsubscribe()
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      resolve(session)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && SESSION_EVENTS.has(event)) {
        finish(session)
      }
    })

    const poll = async () => {
      if (settled) return
      attempts += 1

      const { session, stop } = await readAuthSessionOnce()
      if (session?.user) {
        finish(session)
        return
      }
      if (stop || attempts >= maxAttempts) {
        finish(null)
        return
      }

      delayMs = Math.min(Math.round(delayMs * 1.5), MAX_POLL_DELAY_MS)
      timeoutId = setTimeout(() => {
        void poll()
      }, delayMs)
    }

    timeoutId = setTimeout(() => {
      void poll()
    }, delayMs)
  })
}

export function clearPostAuthRestoreState(): void {
  clearOAuthReturn()
  clearPendingAuthRestore()
  clearOAuthNext()
}

/**
 * After exchangeCodeForSession, wait until getSession returns a user.
 * Uses backoff; stops immediately on rate limit / refresh circuit.
 */
export async function confirmAuthSessionReady(
  maxAttempts = 40,
  initialDelayMs = 250,
): Promise<Session | null> {
  let delayMs = initialDelayMs
  for (let i = 0; i < maxAttempts; i++) {
    const { session, stop } = await readAuthSessionOnce()
    if (session?.user) return session
    if (stop) return null
    await new Promise((r) => setTimeout(r, delayMs))
    delayMs = Math.min(Math.round(delayMs * 1.5), MAX_POLL_DELAY_MS)
  }
  return waitForAuthSession(20, initialDelayMs)
}
