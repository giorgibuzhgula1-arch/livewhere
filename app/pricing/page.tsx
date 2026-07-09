import type { Metadata } from 'next'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = {
  title: 'Pricing — LiveWhere',
  description: 'Continue to unlock city comparisons, full relocation blueprints, and unlimited exploration.',
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return <PricingPageClient />
}
