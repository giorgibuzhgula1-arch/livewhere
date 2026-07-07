import { createBrowserClient } from '@supabase/ssr'
import {
  createAuthGuardedFetch,
  registerRefreshCircuitSignOut,
  resetRefreshCircuit,
} from '@/lib/auth-refresh-circuit'
import { getBrowserSupabaseCookieOptions, supabaseAuthStorageKey } from '@/lib/supabase/cookie-options'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://example.invalid'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder'

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
)

export const supabaseAuthStorageKeyName = supabaseAuthStorageKey(supabaseUrl)

const guardedFetch = createAuthGuardedFetch()

/** Browser client — session + PKCE verifier stored in cookies for OAuth. */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: guardedFetch },
  cookieOptions: getBrowserSupabaseCookieOptions(),
  auth: {
    // Callback page calls exchangeCodeForSession manually; auto-detect races and can clear the verifier.
    detectSessionInUrl: false,
  },
})

registerRefreshCircuitSignOut(() => supabase.auth.signOut({ scope: 'local' }))

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    resetRefreshCircuit()
  }
})

export function createClient() {
  return supabase
}
