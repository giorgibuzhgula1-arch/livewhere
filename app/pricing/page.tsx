import type { Metadata } from 'next'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = {
  title: 'Pricing — LiveWhere',
  description: 'Upgrade to unlock city comparisons, full retirement reports, and unlimited searches.',
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return <PricingPageClient />
}
