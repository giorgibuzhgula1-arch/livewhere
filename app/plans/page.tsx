import type { Metadata } from 'next'
import PlansView from './PlansView'

export const metadata: Metadata = {
  title: 'My Plans — LiveWhere',
  description: 'View and compare your saved retirement city plans.',
  alternates: {
    canonical: '/plans',
  },
}

export default function PlansPage() {
  return <PlansView />
}
