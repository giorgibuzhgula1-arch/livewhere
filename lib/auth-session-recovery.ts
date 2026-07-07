/**
 * Detect invalid / corrupted Supabase sessions and clear local cookies
 * automatically — without treating transient network or 5xx errors as logout.
 */

type SignOutLocal = () => Promise<unknown>

let signOutLocalHandler: SignOutLocal | null = null
let localSignOutInFlight = false

/** GoTrue error codes that mean the stored session cannot be recovered. */
const INVALID_SESSION_ERROR_CODES = new Set([
  'session_not_found',
  'refresh_token_not_found',
  'invalid_refresh_token',
  'refresh_token_already_used',
  'invalid_grant',
  'user_not_found',
  'bad_jwt',
  'jwt_expired',
])

const TRANSIENT_HTTP_STATUSES = new Set([0, 408, 425, 502, 503, 504, 520, 521, 522, 523, 524, 530])

export function registerSessionRecoverySignOut(handler: SignOutLocal): void {
  signOutLocalHandler = handler
}

export function isAuthRateLimited(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { status?: number; message?: string }
  if (e.status === 429) return true
  const msg = (e.message ?? '').toLowerCase()
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  )
}

function isTransientAuthHttpStatus(status: number): boolean {
  if (TRANSIENT_HTTP_STATUSES.has(status)) return true
  return status >= 500 && status <= 599
}

function matchesInvalidSessionMessage(message: string): boolean {
  const msg = message.toLowerCase()
  if (!msg) return false
  const patterns = [
    'invalid refresh token',
    'refresh token not found',
    'refresh token already used',
    'session not found',
    'session_not_found',
    'invalid jwt',
    'jwt expired',
    'token is expired',
    'token has expired',
    'invalid claim',
    'user not found',
    'invalid grant',
    'invalid token',
    'refresh_token',
    'session missing',
    'auth session missing',
  ]
  return patterns.some((p) => msg.includes(p))
}

function parseAuthErrorPayload(body: unknown): { message: string; code?: string } {
  if (!body || typeof body !== 'object') return { message: '' }
  const b = body as Record<string, unknown>
  const message = String(
    b.error_description ?? b.message ?? b.msg ?? (typeof b.error === 'string' ? b.error : '') ?? '',
  )
  const code =
    typeof b.code === 'string'
      ? b.code
      : typeof b.error_code === 'string'
        ? b.error_code
        : typeof b.error === 'string' && b.error.includes('_')
          ? b.error
          : undefined
  return { message, code }
}

export function isRefreshTokenRequestUrl(url: string): boolean {
  return url.includes('/token?') && url.includes('grant_type=refresh_token')
}

function isAuthUserRequestUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname
    return /\/auth\/v1\/user\/?$/.test(path)
  } catch {
    return url.includes('/auth/v1/user')
  }
}

export function isAuthSessionProbeUrl(url: string): boolean {
  return isRefreshTokenRequestUrl(url) || isAuthUserRequestUrl(url)
}

export function isTransientAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { name?: string; status?: number; message?: string }
  if (e.name === 'AuthRetryableFetchError') return true
  if (e.status !== undefined && isTransientAuthHttpStatus(e.status)) return true
  const msg = (e.message ?? '').toLowerCase()
  return (
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('aborted')
  )
}

export function isInvalidSessionAuthError(error: unknown): boolean {
  if (!error) return false
  if (isTransientAuthError(error)) return false

  const e = error as { name?: string; status?: number; message?: string; code?: string }

  if (e.name === 'AuthSessionMissingError') return true
  if (isAuthRateLimited(error)) return true
  if (e.code && INVALID_SESSION_ERROR_CODES.has(e.code)) return true

  if (matchesInvalidSessionMessage(e.message ?? '')) return true

  if (e.status === 400 || e.status === 401 || e.status === 403 || e.status === 422) {
    return matchesInvalidSessionMessage(e.message ?? '') || Boolean(e.code)
  }

  return false
}

export function isInvalidSessionHttpResponse(status: number, body: unknown, url: string): boolean {
  if (isTransientAuthHttpStatus(status)) return false
  if (status === 429) return true

  const { message, code } = parseAuthErrorPayload(body)
  if (code && INVALID_SESSION_ERROR_CODES.has(code)) return true
  if (matchesInvalidSessionMessage(message)) return true

  if (isRefreshTokenRequestUrl(url) && (status === 400 || status === 401 || status === 403 || status === 422)) {
    return true
  }

  if (isAuthUserRequestUrl(url) && status === 401) {
    return matchesInvalidSessionMessage(message) || Boolean(code)
  }

  return false
}

export async function recoverFromInvalidSession(): Promise<void> {
  if (localSignOutInFlight || !signOutLocalHandler) return
  localSignOutInFlight = true
  try {
    await signOutLocalHandler()
  } catch {
    // Best-effort local cookie clear.
  } finally {
    localSignOutInFlight = false
  }
}

function hasSupabaseAuthCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((part) => {
    const name = part.trim().split('=')[0] ?? ''
    return name.startsWith('sb-') && name.includes('auth-token')
  })
}

/**
 * On page load: if cookies hold a broken session, clear them silently.
 * Returns true when local session was cleared.
 */
export async function reconcileStaleBrowserSession(
  getSession: () => Promise<{ data: { session: { user?: unknown } | null }; error: unknown }>,
): Promise<boolean> {
  const { data: { session }, error } = await getSession()

  if (session?.user && !error) return false

  if (error && isInvalidSessionAuthError(error)) {
    await recoverFromInvalidSession()
    return true
  }

  if (!session?.user && hasSupabaseAuthCookie()) {
    await recoverFromInvalidSession()
    return true
  }

  return false
}
