import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getCityBySlug, getCitySlugs } from '@/lib/cities'
import { getCitiesBySlugs, type CityData } from '@/lib/cities-data'
import { SALARY_CLUSTER_NAME } from '@/lib/salary-cluster'
import { getSiteUrl } from '@/lib/site-url'
import styles from '../city-guides.module.css'

export const dynamic = 'force-static'

const TABLE_MARKER = '<!-- CITY_TABLE -->'

const markdownComponents = {
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className={styles.bodyTableWrap}>
      <table {...props} />
    </div>
  ),
}

type Props = {
  params: { slug: string }
}

const siteUrl = getSiteUrl()

export async function generateStaticParams() {
  return getCitySlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getCityBySlug(params.slug)
  if (!guide) {
    return { title: 'Guide not found' }
  }

  const description =
    guide.description?.trim() ||
    `${guide.title} — LiveWhere city guides for living and working abroad.`
  const url = `${siteUrl}/city-guides/${guide.slug}`

  return {
    title: `${guide.title} | LiveWhere`,
    description,
    alternates: {
      canonical: `/city-guides/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description,
      url,
      siteName: 'LiveWhere',
      locale: 'en_US',
      type: 'article',
      publishedTime: guide.date || undefined,
      ...(guide.cluster === SALARY_CLUSTER_NAME
        ? { section: SALARY_CLUSTER_NAME }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

function splitGuideContent(content: string): { intro: string; conclusion: string } {
  const parts = content.split(TABLE_MARKER)
  return {
    intro: parts[0]?.trim() ?? '',
    conclusion: parts.slice(1).join(TABLE_MARKER).trim(),
  }
}

function scoreClass(score: number): string {
  if (score >= 8) return styles.scoreHigh
  if (score >= 6) return styles.scoreMid
  return styles.scoreLow
}

function CityComparisonTable({ cities }: { cities: CityData[] }) {
  if (cities.length === 0) return null

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>City</th>
            <th>Rent/mo</th>
            <th>Safety</th>
            <th>Weather</th>
            <th>Internet</th>
            <th>Tax</th>
            <th>Introvert</th>
            <th>Nomad</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <tr key={city.slug}>
              <td>
                <div className={styles.cityCell}>{city.name}</div>
                <div className={styles.citySub}>
                  {city.country} · {city.continent}
                </div>
              </td>
              <td>${city.monthly_rent_usd.toLocaleString()}</td>
              <td className={scoreClass(city.safety_score)}>{city.safety_score}/10</td>
              <td className={scoreClass(city.weather_score)}>{city.weather_score}/10</td>
              <td>{city.internet_speed_mbps} Mbps</td>
              <td>{city.tax_rate_percent}%</td>
              <td>{city.introvert_friendly ? 'Yes' : 'No'}</td>
              <td className={scoreClass(city.digital_nomad_score)}>
                {city.digital_nomad_score}/10
              </td>
              <td>
                <div className={styles.tagList}>
                  {city.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GuideCta() {
  return (
    <section className={styles.cta}>
      <h2 className={styles.ctaTitle}>Want a match tailored to your salary?</h2>
      <p className={styles.ctaText}>
        These guides are a starting point. LiveWhere analyzes your income, priorities, and
        lifestyle to rank cities just for you.
      </p>
      <Link href="/tool" className={styles.ctaButton}>
        Find my perfect city →
      </Link>
    </section>
  )
}

export default function CityGuidePage({ params }: Props) {
  const guide = getCityBySlug(params.slug)
  if (!guide) notFound()

  const { intro, conclusion } = splitGuideContent(guide.content)
  const cities = getCitiesBySlugs(guide.city_slugs)

  const formattedDate = guide.date
    ? new Date(guide.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    datePublished: guide.date || undefined,
    description:
      guide.description?.trim() ||
      `${guide.title} — LiveWhere city guides for living and working abroad.`,
    ...(guide.cluster === SALARY_CLUSTER_NAME
      ? { articleSection: SALARY_CLUSTER_NAME }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: 'LiveWhere',
      url: siteUrl,
    },
  }

  return (
    <article className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/city-guides" className={styles.back}>
        ← Back to city guides
      </Link>

      <p className={styles.kicker}>
        {guide.cluster === SALARY_CLUSTER_NAME ? SALARY_CLUSTER_NAME : 'City Guide'}
      </p>
      <h1 className={styles.title}>{guide.title}</h1>
      {formattedDate && <p className={styles.date}>{formattedDate}</p>}

      {intro ? (
        <div className={styles.body}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {intro}
          </ReactMarkdown>
        </div>
      ) : null}

      <CityComparisonTable cities={cities} />

      {conclusion ? (
        <div className={styles.body}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {conclusion}
          </ReactMarkdown>
        </div>
      ) : null}

      <GuideCta />
    </article>
  )
}
