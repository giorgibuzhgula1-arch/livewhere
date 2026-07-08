/** Shown when Supabase auth returns HTTP 429 (rate limited). */
export const AUTH_RATE_LIMIT_MESSAGE =
  'Too many sign-in attempts. Please wait a few minutes and try again.'

type AuthErrorLike = {
  status?: number
  message?: string
  code?: string
}

export function isAuthRateLimited(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as AuthErrorLike
  if (e.status === 429) return true
  const msg = (e.message ?? '').toLowerCase()
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  )
}

export function userFacingAuthErrorMessage(
  error: unknown,
  fallback = 'Sign-in failed. Please try again.',
): string {
  if (isAuthRateLimited(error)) return AUTH_RATE_LIMIT_MESSAGE
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: string }).message
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  return fallback
}
