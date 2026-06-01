import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllCities } from '@/lib/cities'
import { getSiteUrl } from '@/lib/site-url'
import styles from './cities.module.css'

export const dynamic = 'force-static'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'City Guides — LiveWhere',
  description:
    'Data-backed city guides for remote workers and expats—budget, safety, weather, taxes, and lifestyle compared side by side.',
  alternates: {
    canonical: '/cities',
  },
  openGraph: {
    title: 'City Guides — LiveWhere',
    description:
      'Data-backed city guides for remote workers and expats—budget, safety, weather, taxes, and lifestyle compared side by side.',
    url: `${siteUrl}/cities`,
    siteName: 'LiveWhere',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'City Guides — LiveWhere',
    description:
      'Data-backed city guides for remote workers and expats—budget, safety, weather, taxes, and lifestyle compared side by side.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function CitiesIndexPage() {
  const guides = getAllCities()

  return (
    <main className={styles.listPage}>
      <p className={styles.kicker}>Guides</p>
      <h1 className={styles.title}>City Guides</h1>
      <p
        style={{
          fontSize: 16,
          color: 'var(--muted)',
          marginBottom: 40,
          maxWidth: 520,
          lineHeight: 1.6,
        }}
      >
        Practical relocation guides with live city data—rent, safety, weather, taxes, and nomad
        scores pulled automatically from our database.
      </p>

      <div className={styles.grid}>
        {guides.map((guide) => (
          <Link key={guide.slug} href={`/cities/${guide.slug}`} className={styles.card}>
            <div className={styles.cardTitle}>{guide.title}</div>
            <div className={styles.cardMeta}>
              {guide.date
                ? new Date(guide.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
