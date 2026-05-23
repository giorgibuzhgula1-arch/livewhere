/** ISO 3166-1 alpha-2 from a regional-indicator flag emoji (e.g. 🇵🇹 → PT). */
export function countryCodeFromFlag(flag: string): string {
  const chars = [...flag]
  if (chars.length < 2) return '—'
  const cpA = chars[0].codePointAt(0)
  const cpB = chars[1].codePointAt(0)
  if (cpA === undefined || cpB === undefined) return '—'
  const a = cpA - 0x1f1e6
  const b = cpB - 0x1f1e6
  if (a < 0 || a > 25 || b < 0 || b > 25) return '—'
  return String.fromCharCode(65 + a, 65 + b)
}
