import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPostBySlug, getPostSlugs } from '@/lib/blog'
import { getSiteUrl } from '@/lib/site-url'
import styles from '../blog.module.css'

export const dynamic = 'force-static'

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
  return getPostSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) {
    return { title: 'Post not found' }
  }

  const description =
    post.description?.trim() ||
    `${post.title} — LiveWhere guides for living and retiring abroad.`
  const url = `${siteUrl}/blog/${post.slug}`

  return {
    title: `${post.title} | LiveWhere Blog`,
    description,
    alternates: {
      canonical: `https://www.livewhere.io/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: 'LiveWhere',
      locale: 'en_US',
      type: 'article',
      publishedTime: post.date || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date || undefined,
    description:
      post.description?.trim() ||
      `${post.title} — LiveWhere guides for living and retiring abroad.`,
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

      <Link href="/blog" className={styles.back}>
        ← Back to blog
      </Link>

      <p className={styles.kicker}>Article</p>
      <h1 className={styles.title}>{post.title}</h1>
      {formattedDate && <p className={styles.date}>{formattedDate}</p>}

      <div className={styles.body}>
        {post.content.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {post.content}
          </ReactMarkdown>
        ) : null}
      </div>
    </article>
  )
}
