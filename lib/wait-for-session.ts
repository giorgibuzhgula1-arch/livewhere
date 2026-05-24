import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export const OAUTH_RETURN_KEY = 'livewhere_oauth_return'

export function markOAuthReturn(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(OAUTH_RETURN_KEY, '1')
}

export function clearOAuthReturn(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(OAUTH_RETURN_KEY)
}

export function isOAuthReturnPending(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(OAUTH_RETURN_KEY) === '1'
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
