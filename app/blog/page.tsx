import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPostsMeta } from '@/lib/blog'
import { getSiteUrl } from '@/lib/site-url'
import styles from './blog.module.css'

export const dynamic = 'force-static'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Blog — LiveWhere',
  description:
    'Guides on retiring abroad, taxes for Americans overseas, and the best places to live in Europe and beyond.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Blog — LiveWhere',
    description:
      'Guides on retiring abroad, taxes for Americans overseas, and the best places to live.',
    url: `${siteUrl}/blog`,
    siteName: 'LiveWhere',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — LiveWhere',
    description:
      'Guides on retiring abroad, taxes for Americans overseas, and the best places to live.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function BlogIndexPage() {
  const posts = getAllPostsMeta()

  return (
    <main className={styles.listPage}>
      <p className={styles.kicker}>Journal</p>
      <h1 className={styles.title}>Blog</h1>
      <p
        style={{
          fontSize: 16,
          color: 'var(--muted)',
          marginBottom: 40,
          maxWidth: 520,
          lineHeight: 1.6,
        }}
      >
        Practical guides on relocation, cost of living, and where to retire—written for global
        remote workers and retirees.
      </p>

      <div className={styles.grid}>
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
            <div className={styles.cardTitle}>{post.title}</div>
            <div className={styles.cardMeta}>
              {post.date
                ? new Date(post.date).toLocaleDateString('en-US', {
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
