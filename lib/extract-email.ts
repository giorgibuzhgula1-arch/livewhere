const EMAIL_REGEX =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g

const BLOCKED_DOMAINS = new Set([
  'example.com',
  'email.com',
  'domain.com',
  'youremail.com',
])

export function extractEmailFromText(text: string | null | undefined): string | null {
  if (!text) return null
  const matches = text.match(EMAIL_REGEX)
  if (!matches?.length) return null

  for (const raw of matches) {
    const email = raw.toLowerCase()
    const domain = email.split('@')[1]
    if (!domain || BLOCKED_DOMAINS.has(domain)) continue
    if (domain.endsWith('.png') || domain.endsWith('.jpg')) continue
    return email
  }

  return null
}
