import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'content/blog')

export type BlogPostMeta = {
  slug: string
  title: string
  date: string
  description: string
}

export type BlogPost = BlogPostMeta & {
  content: string
}

function readMarkdownFiles(): string[] {
  if (!fs.existsSync(postsDirectory)) return []
  return fs.readdirSync(postsDirectory).filter((f) => f.endsWith('.md'))
}

export function getPostSlugs(): string[] {
  return readMarkdownFiles().map((f) => f.replace(/\.md$/, ''))
}

export function getPostBySlug(slug: string): BlogPost | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`)
  if (!fs.existsSync(fullPath)) return null
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)
  const title = typeof data.title === 'string' ? data.title : slug
  const date = typeof data.date === 'string' ? data.date : ''
  const description =
    typeof data.description === 'string' ? data.description : ''

  return {
    slug,
    title,
    date,
    description,
    content,
  }
}

export function getAllPostsMeta(): BlogPostMeta[] {
  const slugs = getPostSlugs()
  const posts = slugs
    .map((slug) => {
      const p = getPostBySlug(slug)
      if (!p) return null
      return {
        slug: p.slug,
        title: p.title,
        date: p.date,
        description: p.description,
      }
    })
    .filter((x): x is BlogPostMeta => x !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return posts
}
