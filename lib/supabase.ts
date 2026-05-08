import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

/** True when both public Supabase env vars are set (not empty). */
export const isSupabaseConfigured = Boolean(rawUrl && rawAnonKey)

// Valid URL + non-empty key strings so the client never calls fetch(undefined / "").
// When env is missing, auth and data calls fail at the network/API layer instead of
// throwing "Failed to execute 'fetch' on 'Window': Invalid value".
const supabaseUrl =
  rawUrl ||
  'https://example.invalid'
const supabaseAnonKey =
  rawAnonKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIn0.placeholder'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && !isSupabaseConfigured) {
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing; using placeholders. Auth will not work until they are set.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
