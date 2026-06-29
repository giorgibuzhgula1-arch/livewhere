import type { Metadata } from 'next'
import { Suspense } from 'react'
import PlansView from './PlansView'

export const metadata: Metadata = {
  title: 'My Plans — LiveWhere',
  description: 'View and compare your saved retirement city plans.',
  alternates: {
    canonical: '/plans',
  },
}

export default function PlansPage() {
  return (
    <Suspense fallback={<main style={{ padding: 120, textAlign: 'center', color: 'rgba(240,237,232,0.5)' }}>Loading…</main>}>
      <PlansView />
    </Suspense>
  )
}
