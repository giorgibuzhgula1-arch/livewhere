import type { MetadataRoute } from 'next'
import { getAllPostsMeta } from '@/lib/blog'
import { getAllCities } from '@/lib/cities'

export const revalidate = 0

const BASE_URL = 'https://www.livewhere.io'

function lastModifiedFromDate(dateStr: string): Date | undefined {
  if (!dateStr.trim()) return undefined
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPostsMeta()
  const cityGuides = getAllCities()

  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/city-guides`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: lastModifiedFromDate(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...cityGuides.map((guide) => ({
      url: `${BASE_URL}/city-guides/${guide.slug}`,
      lastModified: lastModifiedFromDate(guide.date),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ]

  return routes
}
