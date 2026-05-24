import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://example.invalid'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder'

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
)

const isSecure =
  typeof window !== 'undefined' ? window.location.protocol === 'https:' : true

/** Browser client — session + PKCE verifier stored in cookies for OAuth. */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    path: '/',
    sameSite: 'lax',
    secure: isSecure,
  },
})

export function createClient() {
  return supabase
}
