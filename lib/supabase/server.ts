import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAuthStorageKey } from '@/lib/supabase/cookie-options'
import { createSupabaseSsrCookieMethods } from '@/lib/supabase/session-cookie'

export function createClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: {
      name: supabaseAuthStorageKey(supabaseUrl),
    },
    cookies: createSupabaseSsrCookieMethods({
      getAll: () => cookieStore.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value })),
      set: ({ name, value, ...options }) => {
        cookieStore.set({ name, value, ...options })
      },
    }),
  })
}
