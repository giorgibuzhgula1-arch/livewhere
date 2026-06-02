import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { SALARY_CLUSTER_NAME } from '@/lib/salary-cluster'

const citiesDirectory = path.join(process.cwd(), 'content/city-guides')

export type CityGuideMeta = {
  slug: string
  title: string
  date: string
  description: string
  city_slugs: string[]
  cluster?: string
}

export type CityGuide = CityGuideMeta & {
  content: string
}

function readMarkdownFiles(): string[] {
  if (!fs.existsSync(citiesDirectory)) return []
  return fs.readdirSync(citiesDirectory).filter((f) => f.endsWith('.md'))
}

function parseCitySlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function getCitySlugs(): string[] {
  return readMarkdownFiles().map((f) => f.replace(/\.md$/, ''))
}

export function getCityBySlug(slug: string): CityGuide | null {
  const fullPath = path.join(citiesDirectory, `${slug}.md`)
  if (!fs.existsSync(fullPath)) return null
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)
  const title = typeof data.title === 'string' ? data.title : slug
  const date = typeof data.date === 'string' ? data.date : ''
  const description =
    typeof data.description === 'string' ? data.description : ''
  const cluster = typeof data.cluster === 'string' ? data.cluster : undefined

  return {
    slug,
    title,
    date,
    description,
    city_slugs: parseCitySlugs(data.city_slugs),
    cluster,
    content,
  }
}

export function getAllCities(): CityGuideMeta[] {
  const slugs = getCitySlugs()
  const guides = slugs
    .map((slug) => {
      const guide = getCityBySlug(slug)
      if (!guide) return null
      return {
        slug: guide.slug,
        title: guide.title,
        date: guide.date,
        description: guide.description,
        city_slugs: guide.city_slugs,
        ...(guide.cluster ? { cluster: guide.cluster } : {}),
      }
    })
    .filter((x): x is CityGuideMeta => x !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return guides
}

export function getSalaryClusterGuides(): CityGuideMeta[] {
  return getAllCities().filter((guide) => guide.cluster === SALARY_CLUSTER_NAME)
}
