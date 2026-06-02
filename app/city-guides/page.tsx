import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllCities, getSalaryClusterGuides } from '@/lib/cities'
import { SALARY_CLUSTER_NAME } from '@/lib/salary-cluster'
import { getSiteUrl } from '@/lib/site-url'
import styles from './city-guides.module.css'

export const dynamic = 'force-static'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'City Guides — LiveWhere',
  description:
    'Data-backed city guides for remote workers and expats—budget, safety, weather, taxes, and lifestyle compared side by side.',
  alternates: {
    canonical: '/city-guides',
  },
  openGraph: {
    title: 'City Guides — LiveWhere',
    description:
      'Data-backed city guides for remote workers and expats—budget, safety, weather, taxes, and lifestyle compared side by side.',
    url: `${siteUrl}/city-guides`,
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

export default function CityGuidesIndexPage() {
  const guides = getAllCities().filter((guide) => guide.cluster !== SALARY_CLUSTER_NAME)
  const salaryCluster = getSalaryClusterGuides()

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

      {salaryCluster.length > 0 && (
        <>
          <p className={styles.kicker}>Salary Cluster</p>
          <div className={styles.grid} style={{ marginBottom: guides.length > 0 ? 32 : 0 }}>
            {salaryCluster.map((guide) => (
              <Link key={guide.slug} href={`/city-guides/${guide.slug}`} className={styles.card}>
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
        </>
      )}

      {guides.length > 0 && (
      <div className={styles.grid}>
        {guides.map((guide) => (
          <Link key={guide.slug} href={`/city-guides/${guide.slug}`} className={styles.card}>
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
      )}
    </main>
  )
}
