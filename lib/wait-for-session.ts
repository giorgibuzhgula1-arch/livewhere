import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { hasPendingAnalyze } from '@/lib/pending-analyze'
import { hasPendingResults } from '@/lib/pending-results'

export const OAUTH_RETURN_KEY = 'livewhere_oauth_return'
export const PENDING_AUTH_RESTORE_KEY = 'livewhere_pending_auth_restore'

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

const SESSION_EVENTS = new Set(['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED'])

/**
 * Wait until Supabase has a user session. Polls getSession/getUser and also
 * resolves immediately on auth state events (needed on mobile after OAuth redirect).
 */
export async function waitForAuthSession(
  maxAttempts = 50,
  delayMs = 100
): Promise<Session | null> {
  const { data: { session: initial } } = await supabase.auth.getSession()
  if (initial?.user) return initial

  return new Promise((resolve) => {
    let attempts = 0
    let settled = false

    const finish = (session: Session | null) => {
      if (settled) return
      settled = true
      subscription.unsubscribe()
      clearInterval(intervalId)
      resolve(session)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && SESSION_EVENTS.has(event)) {
        finish(session)
      }
    })

    const intervalId = setInterval(async () => {
      attempts += 1

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        finish(session)
        return
      }

      const { data: { user }, error } = await supabase.auth.getUser()
      if (user && !error) {
        const { data: { session: refreshed } } = await supabase.auth.getSession()
        finish(refreshed)
        return
      }

      if (attempts >= maxAttempts) {
        finish(null)
      }
    }, delayMs)
  })
}

export function clearPostAuthRestoreState(): void {
  clearOAuthReturn()
  clearPendingAuthRestore()
}
