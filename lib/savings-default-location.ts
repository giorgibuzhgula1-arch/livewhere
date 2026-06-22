/** Default "Current location" for SavingsCalculator from Vercel geo header. */
export function defaultSavingsLocationFromCountry(
  countryCode: string | null | undefined
): string {
  if (countryCode === 'GB') return 'United Kingdom'
  if (countryCode === 'AU') return 'Australia'
  if (countryCode === 'CA') return 'Canada'
  return 'Florida'
}
