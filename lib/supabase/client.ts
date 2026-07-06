import { createBrowserClient } from '@supabase/ssr'
import { getBrowserSupabaseCookieOptions, supabaseAuthStorageKey } from '@/lib/supabase/cookie-options'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://example.invalid'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder'

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
)

export const supabaseAuthStorageKeyName = supabaseAuthStorageKey(supabaseUrl)

/** Browser client — session + PKCE verifier stored in cookies for OAuth. */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: getBrowserSupabaseCookieOptions(),
  auth: {
    // Callback page calls exchangeCodeForSession manually; auto-detect races and can clear the verifier.
    detectSessionInUrl: false,
  },
})

export function createClient() {
  return supabase
}
