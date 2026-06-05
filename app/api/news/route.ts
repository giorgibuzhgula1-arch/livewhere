import { NextResponse } from 'next/server'
import { getNewsArticles } from '@/lib/news'

/** Static, curated relocation news. Revalidate daily for cache-control parity. */
export const revalidate = 86400

export async function GET() {
  return NextResponse.json(
    { articles: getNewsArticles(), updatedAt: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    }
  )
}
