import { headers } from 'next/headers'
import HomePageClient from '@/components/HomePageClient'
import { defaultSavingsLocationFromCountry } from '@/lib/savings-default-location'

export default function Home({
  searchParams,
}: {
  searchParams?: { restore?: string | string[] }
}) {
  const country = headers().get('x-vercel-ip-country')
  const restoreRaw = searchParams?.restore
  const restoreValue = Array.isArray(restoreRaw) ? restoreRaw[0] : restoreRaw
  // ONLY exact value "results" — not truthy checks, not other keys
  const initialPostOAuthRestore = restoreValue === 'results'

  return (
    <HomePageClient
      defaultSavingsLocation={defaultSavingsLocationFromCountry(country)}
      initialPostOAuthRestore={initialPostOAuthRestore}
      paywallV2Enabled={process.env.PAYWALL_V2_ENABLED === 'true'}
    />
  )
}
