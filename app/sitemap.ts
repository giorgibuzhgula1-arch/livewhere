import fs from 'fs'
import path from 'path'
import type { MetadataRoute } from 'next'
import { getAllPostsMeta } from '@/lib/blog'
import { getNewsArticles } from '@/lib/news'
import { getSiteUrl } from '@/lib/site-url'

export const revalidate = 0

const cityGuidesDirectory = path.join(process.cwd(), 'content/city-guides')

function getCityGuideSlugs(): string[] {
  if (!fs.existsSync(cityGuidesDirectory)) return []
  return fs
    .readdirSync(cityGuidesDirectory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''))
}

function lastModifiedFromDate(dateStr: string): Date | undefined {
  if (!dateStr.trim()) return undefined
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const posts = getAllPostsMeta()
  const cityGuideSlugs = getCityGuideSlugs()
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
    ...cityGuideSlugs.map((slug) => ({
      url: `${base}/city-guides/${slug}`,
      lastModified: fs.statSync(path.join(cityGuidesDirectory, `${slug}.md`)).mtime,
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
