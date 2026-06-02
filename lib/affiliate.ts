export const REF_COOKIE_NAME = 'ref_code'
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
}

export function buildReferralCodeFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
  const suffix = Math.random().toString(36).slice(2, 6)
  return base ? `${base}-${suffix}` : `partner-${suffix}`
}

export function affiliateReferralUrl(siteUrl: string, referralCode: string): string {
  const base = siteUrl.replace(/\/$/, '')
  return `${base}/?ref=${encodeURIComponent(referralCode)}`
}
