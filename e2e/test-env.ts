/** Public Supabase project URL + anon key (safe to commit; RLS protects data). */
export const E2E_SUPABASE_URL = 'https://iwuevhuwnmhunrrqnzqt.supabase.co'
export const E2E_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dWV2aHV3bm1odW5ycnFuenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzcxNTIsImV4cCI6MjA5MzQxMzE1Mn0.TGSwy3a2_-i1u_nLMZKjVCRiPZi3At1UB7Z6KrHaqso'

export const E2E_STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || 'whsec_e2e_regression_test_secret'

export const CANONICAL_PRODUCTION_ORIGIN = 'https://www.livewhere.io'
/** Localhost uses the same oauthRedirectOrigin branch as *.vercel.app previews. */
export const E2E_LOCAL_PREVIEW_ORIGIN = `http://127.0.0.1:${process.env.PORT || '3000'}`
