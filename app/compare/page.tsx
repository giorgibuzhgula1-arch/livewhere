import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getSiteUrl } from '@/lib/site-url'
import CompareView from './CompareView'
import styles from './compare.module.css'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Compare Cities — LiveWhere',
  description:
    'Compare relocation cities side by side — monthly cost, rent, healthcare, safety, tax, climate, and overall scores.',
  alternates: {
    canonical: '/compare',
  },
  openGraph: {
    title: 'Compare Cities — LiveWhere',
    description:
      'Compare relocation cities side by side — monthly cost, rent, healthcare, safety, tax, climate, and overall scores.',
    url: `${siteUrl}/compare`,
    siteName: 'LiveWhere',
    locale: 'en_US',
    type: 'website',
  },
}

function CompareFallback() {
  return (
    <main className={styles.page}>
      <p className={styles.kicker}>Compare</p>
      <h1 className={styles.title}>City comparison</h1>
      <p className={styles.subtitle}>Loading…</p>
    </main>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareFallback />}>
      <CompareView />
    </Suspense>
  )
}
