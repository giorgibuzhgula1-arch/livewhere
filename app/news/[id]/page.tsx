import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNewsArticleById, getNewsArticles } from '@/lib/news'
import { getSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-static'

type Props = {
  params: { id: string }
}

const siteUrl = getSiteUrl()

export async function generateStaticParams() {
  return getNewsArticles().map((article) => ({ id: article.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getNewsArticleById(params.id)
  if (!article) {
    return { title: 'Article not found' }
  }

  const description = article.summary?.trim() || `${article.title} — LiveWhere relocation news.`
  const url = `${siteUrl}/news/${article.id}`

  return {
    title: `${article.title} — LiveWhere News`,
    description,
    alternates: { canonical: `/news/${article.id}` },
    openGraph: {
      title: article.title,
      description,
      url,
      siteName: 'LiveWhere',
      type: 'article',
      publishedTime: article.date || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function NewsArticlePage({ params }: Props) {
  const article = getNewsArticleById(params.id)
  if (!article) notFound()

  const formattedDate = formatDate(article.date)

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '120px 20px 80px' }}>
      <Link
        href="/news"
        style={{
          fontSize: 13,
          color: 'rgba(240,237,232,0.55)',
          textDecoration: 'none',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Back to news
      </Link>

      <p
        style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#c8f05a',
          marginTop: 24,
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        {article.category}
      </p>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(28px,4vw,40px)',
          fontWeight: 700,
          marginBottom: 12,
          lineHeight: 1.25,
        }}
      >
        {article.title}
      </h1>
      {formattedDate && (
        <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.45)', marginBottom: 24 }}>{formattedDate}</p>
      )}
      <p style={{ fontSize: 16, color: 'rgba(240,237,232,0.75)', lineHeight: 1.7, marginBottom: 24 }}>
        {article.summary}
      </p>
      <p style={{ fontSize: 13, color: '#c8f05a', fontWeight: 600 }}>
        {article.flag ? `${article.flag} ` : ''}
        {article.source}
      </p>
      {article.link && article.link !== '#' && (
        <p style={{ marginTop: 24 }}>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#c8f05a', fontSize: 14, fontWeight: 600 }}
          >
            Read full story →
          </a>
        </p>
      )}
    </main>
  )
}
