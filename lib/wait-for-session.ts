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

export async function waitForAuthSession(
  maxAttempts = 50,
  delayMs = 100
): Promise<Session | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return null
}
