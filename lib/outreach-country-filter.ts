/** ISO 3166-1 alpha-2 codes excluded from outreach results (India, Russia, Africa). */
export const OUTREACH_EXCLUDED_COUNTRY_CODES = new Set([
  'IN',
  'RU',
  'NG',
  'ZA',
  'GH',
  'KE',
  'EG',
  'ET',
  'TZ',
  'UG',
  'SN',
  'CI',
  'CM',
  'MG',
  'MZ',
  'AO',
  'ZM',
  'ZW',
  'BJ',
  'TG',
  'ML',
  'BF',
  'NE',
  'TD',
  'SD',
  'SO',
  'LY',
  'TN',
  'MA',
  'DZ',
  'MR',
  'GM',
  'SL',
  'LR',
  'GN',
  'GW',
  'ER',
  'DJ',
  'KM',
  'SC',
  'MU',
  'CV',
  'ST',
  'RE',
  'YT',
])

export const OUTREACH_COUNTRY_FILTER_NOTE =
  'Filtered out: India, Russia, Africa'

export function isExcludedOutreachCountry(country: string | null | undefined): boolean {
  if (!country) return false
  return OUTREACH_EXCLUDED_COUNTRY_CODES.has(country.trim().toUpperCase())
}

export function filterOutreachByCountry<T extends { country: string | null }>(
  rows: T[]
): T[] {
  return rows.filter((row) => {
    if (!row.country) return true
    return !isExcludedOutreachCountry(row.country)
  })
}
