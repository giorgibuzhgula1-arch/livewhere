/** Canonical production origin (always www). */
export const CANONICAL_PRODUCTION_ORIGIN = 'https://www.livewhere.io'

function normalizeOrigin(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/$/, '')
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    return new URL(withScheme).origin
  } catch {
    return null
  }
}

/** If env points at livewhere.io / www.livewhere.io, return canonical www origin. */
export function canonicalLivewhereOriginFromEnv(): string | null {
  for (const raw of [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    const origin = raw ? normalizeOrigin(raw) : null
    if (!origin) continue
    const host = new URL(origin).hostname
    if (host === 'livewhere.io' || host === 'www.livewhere.io') {
      return CANONICAL_PRODUCTION_ORIGIN
    }
  }
  return null
}

/** Absolute site origin for Open Graph URLs and JSON-LD (no trailing slash). */
export function getSiteUrl(): string {
  const canonical = canonicalLivewhereOriginFromEnv()
  if (process.env.VERCEL_ENV === 'production') {
    return canonical ?? CANONICAL_PRODUCTION_ORIGIN
  }

  let base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'

  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base.replace(/^\/+/, '')}`
  }

  try {
    const url = new URL(base)
    return url.origin
  } catch {
    return 'http://localhost:3000'
  }
}
