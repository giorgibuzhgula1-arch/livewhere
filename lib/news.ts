/** Shared types + RSS/Atom parsing and categorization for the News feed. */

export const NEWS_CATEGORIES = [
  'Visa News',
  'Tax Changes',
  'New Destinations',
  'Cost of Living',
] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export interface NewsArticle {
  id: string
  title: string
  source: string
  category: NewsCategory
  date: string | null
  summary: string
  link: string
  flag?: string
}

export interface NewsFeedSource {
  name: string
  url: string
}

export const NEWS_SOURCES: NewsFeedSource[] = [
  { name: 'Nomad List', url: 'https://nomadlist.com/blog/feed' },
  { name: 'Expat Arrivals', url: 'https://www.expatarrivals.com/rss.xml' },
  { name: 'Wise', url: 'https://wise.com/us/blog/feed' },
]

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  'Visa News': [
    'visa', 'residency', 'resident permit', 'permit', 'passport', 'immigration',
    'citizenship', 'nomad visa', 'green card', 'border', 'deport',
  ],
  'Tax Changes': [
    'tax', 'taxes', 'taxation', 'vat', 'irs', 'fiscal', 'levy', 'deduction',
    'income tax', 'capital gains', 'duty', 'tariff',
  ],
  'Cost of Living': [
    'cost of living', 'rent', 'rental', 'inflation', 'price', 'prices', 'cheap',
    'cheapest', 'expensive', 'affordable', 'budget', 'salary', 'wage', 'currency',
    'exchange rate', 'mortgage',
  ],
  'New Destinations': [
    'destination', 'best place', 'best cities', 'best countries', 'move to',
    'relocat', 'expat hub', 'guide to', 'living in', 'moving to', 'top cities',
    'new city', 'beach', 'island',
  ],
}

function decodeEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function stripHtml(input: string): string {
  return decodeEntities(input.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function unwrapCdata(input: string): string {
  const match = input.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return match ? match[1] : input
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const match = block.match(re)
  if (!match) return null
  return unwrapCdata(match[1]).trim()
}

/** Atom <link href="..."/> or RSS <link>...</link>. */
function extractLink(block: string): string {
  const hrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i)
  if (hrefMatch) return hrefMatch[1].trim()
  const textMatch = extractTag(block, 'link')
  return textMatch ?? ''
}

export function categorizeArticle(title: string, summary: string): NewsCategory {
  const haystack = `${title} ${summary}`.toLowerCase()
  let best: NewsCategory = 'New Destinations'
  let bestCount = 0
  for (const category of NEWS_CATEGORIES) {
    let count = 0
    for (const keyword of CATEGORY_KEYWORDS[category]) {
      if (haystack.includes(keyword)) count += 1
    }
    if (count > bestCount) {
      bestCount = count
      best = category
    }
  }
  return best
}

function blocksFor(xml: string, tag: 'item' | 'entry'): string[] {
  const re = new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, 'gi')
  return xml.match(re) ?? []
}

export function parseFeed(xml: string, sourceName: string): NewsArticle[] {
  const items = blocksFor(xml, 'item')
  const entries = items.length ? items : blocksFor(xml, 'entry')

  return entries
    .map((block, index): NewsArticle | null => {
      const rawTitle = extractTag(block, 'title')
      if (!rawTitle) return null
      const title = stripHtml(rawTitle)
      if (!title) return null

      const rawSummary =
        extractTag(block, 'description') ??
        extractTag(block, 'summary') ??
        extractTag(block, 'content:encoded') ??
        extractTag(block, 'content') ??
        ''
      const summaryFull = stripHtml(rawSummary)
      const summary = summaryFull.length > 220 ? `${summaryFull.slice(0, 217)}…` : summaryFull

      const dateRaw =
        extractTag(block, 'pubDate') ??
        extractTag(block, 'published') ??
        extractTag(block, 'updated') ??
        extractTag(block, 'dc:date')
      let date: string | null = null
      if (dateRaw) {
        const parsed = new Date(dateRaw)
        date = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
      }

      const link = stripHtml(extractLink(block))

      return {
        id: `${sourceName}-${index}-${link || title}`.slice(0, 200),
        title,
        source: sourceName,
        category: categorizeArticle(title, summaryFull),
        date,
        summary,
        link,
      }
    })
    .filter((a): a is NewsArticle => a !== null)
}
