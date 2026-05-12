import type { MetadataRoute } from 'next'
import { getAllPostsMeta } from '@/lib/blog'
import { getSiteUrl } from '@/lib/site-url'

function lastModifiedFromDate(dateStr: string): Date | undefined {
  if (!dateStr.trim()) return undefined
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const posts = getAllPostsMeta()

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
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: lastModifiedFromDate(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  return routes
}
