/** Default "Current location" for SavingsCalculator from Vercel geo header. */
export function defaultSavingsLocationFromCountry(
  countryCode: string | null | undefined
): string {
  return countryCode === 'GB' ? 'United Kingdom' : 'Florida'
}
