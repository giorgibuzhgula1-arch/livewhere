import { NextResponse } from 'next/server'
import type { NewsArticle } from '@/lib/news'

/** Static, curated relocation news. Revalidate daily for cache-control parity. */
export const revalidate = 86400

const ARTICLES: NewsArticle[] = [
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

export async function GET() {
  return NextResponse.json(
    { articles: ARTICLES, updatedAt: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    }
  )
}
