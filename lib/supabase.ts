import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(rawUrl && rawAnonKey)

const supabaseUrl = rawUrl || 'https://example.invalid'
const supabaseAnonKey = rawAnonKey || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
