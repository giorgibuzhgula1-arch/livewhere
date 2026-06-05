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

/** Static, curated relocation news (same list served by /api/news). */
const CURATED_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    title: 'Portugal Extends Digital Nomad Visa Program Through 2026',
    summary:
      'Portuguese immigration authority confirms the D8 visa program continues with streamlined processing times now averaging 3-4 weeks.',
    category: 'Visa News',
    source: 'Expat Arrivals',
    date: '2026-05-28',
    flag: '🇵🇹',
    link: '#',
  },
  {
    id: '2',
    title: 'Georgia Reaffirms 1% Small Business Tax for Foreign Remote Workers',
    summary:
      "Georgia's Virtual Zone and Individual Entrepreneur regimes keep their headline 1% turnover tax, cementing the country as a top base for low-tax digital nomads.",
    category: 'Tax Changes',
    source: 'Nomad List',
    date: '2026-05-26',
    flag: '🇬🇪',
    link: '#',
  },
  {
    id: '3',
    title: 'Thailand Expands LTR Visa Eligibility for Remote Professionals',
    summary:
      'The 10-year Long-Term Resident visa loosens income and savings thresholds, opening the door to more mid-career remote workers and their families.',
    category: 'Visa News',
    source: 'Expat Arrivals',
    date: '2026-05-24',
    flag: '🇹🇭',
    link: '#',
  },
  {
    id: '4',
    title: 'Mexico City Rents Cool Off After Two-Year Surge',
    summary:
      'New data shows rents in popular nomad neighborhoods like Roma and Condesa stabilizing in 2026, easing affordability concerns for incoming remote workers.',
    category: 'Cost of Living',
    source: 'Wise',
    date: '2026-05-22',
    flag: '🇲🇽',
    link: '#',
  },
  {
    id: '5',
    title: "Spain Cuts Digital Nomad Visa Processing to Under a Month",
    summary:
      'Spanish consulates report faster turnaround on the digital nomad visa, with many applicants now approved in 20-25 days under the updated Beckham Law framework.',
    category: 'Visa News',
    source: 'Nomad List',
    date: '2026-05-20',
    flag: '🇪🇸',
    link: '#',
  },
  {
    id: '6',
    title: 'Estonia Upgrades e-Residency Platform with Faster Company Setup',
    summary:
      'Estonia rolls out a revamped e-Residency portal, letting remote founders register and run an EU company fully online in as little as one business day.',
    category: 'New Destinations',
    source: 'Expat Arrivals',
    date: '2026-05-18',
    flag: '🇪🇪',
    link: '#',
  },
  {
    id: '7',
    title: 'UAE Remote Work Visa Sees Record Applications in 2026',
    summary:
      "Dubai's one-year virtual work visa hits new highs as zero income tax and world-class infrastructure draw high-earning remote professionals from Europe and Asia.",
    category: 'Visa News',
    source: 'Wise',
    date: '2026-05-15',
    flag: '🇦🇪',
    link: '#',
  },
  {
    id: '8',
    title: "Medellín's Nomad Community Keeps Growing as Colombia Eases Visa Rules",
    summary:
      "Colombia's digital nomad visa and a ~$685/month income floor fuel a booming remote-work scene in Medellín, with new coworking spaces opening across El Poblado and Laureles.",
    category: 'New Destinations',
    source: 'Nomad List',
    date: '2026-05-12',
    flag: '🇨🇴',
    link: '#',
  },
]

export function getNewsArticles(): NewsArticle[] {
  return CURATED_NEWS_ARTICLES
}

export function getNewsArticleById(id: string): NewsArticle | null {
  return CURATED_NEWS_ARTICLES.find((article) => article.id === id) ?? null
}

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
