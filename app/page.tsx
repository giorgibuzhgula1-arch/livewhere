import { headers } from 'next/headers'
import HomePageClient from '@/components/HomePageClient'
import { defaultSavingsLocationFromCountry } from '@/lib/savings-default-location'

export default function Home() {
  const country = headers().get('x-vercel-ip-country')
  return (
    <HomePageClient
      defaultSavingsLocation={defaultSavingsLocationFromCountry(country)}
    />
  )
}
