/** Absolute site origin for Open Graph URLs and JSON-LD (no trailing slash). */
export function getSiteUrl(): string {
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
