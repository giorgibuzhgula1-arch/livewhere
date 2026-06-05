import type { MetadataRoute } from 'next'
import { getAllPostsMeta } from '@/lib/blog'
import { getAllCities } from '@/lib/cities'
import { getNewsArticles } from '@/lib/news'
import { getSiteUrl } from '@/lib/site-url'

function lastModifiedFromDate(dateStr: string): Date | undefined {
  if (!dateStr.trim()) return undefined
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const posts = getAllPostsMeta()
  const cityGuides = getAllCities()
  const newsArticles = getNewsArticles()

  const latestNewsDate = newsArticles.reduce<string>((latest, article) => {
    if (!article.date) return latest
    return !latest || article.date > latest ? article.date : latest
  }, '')

  const routes: MetadataRoute.Sitemap = [
    {
      url: base,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/city-guides`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/news`,
      lastModified: lastModifiedFromDate(latestNewsDate),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: lastModifiedFromDate(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...cityGuides.map((guide) => ({
      url: `${base}/city-guides/${guide.slug}`,
      lastModified: lastModifiedFromDate(guide.date),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...newsArticles.map((article) => ({
      url: `${base}/news/${article.id}`,
      lastModified: lastModifiedFromDate(article.date ?? ''),
      changeFrequency: 'daily' as const,
      priority: 0.65,
    })),
  ]

  return routes
}
