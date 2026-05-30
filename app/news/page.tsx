import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteUrl } from '@/lib/site-url'
import Newsfeed from '@/components/Newsfeed'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Nomad & Expat News — LiveWhere',
  description:
    'The latest relocation news for digital nomads and expats: visa changes, tax updates, cost of living, and new destinations — refreshed daily.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'Nomad & Expat News — LiveWhere',
    description: 'Visa changes, tax updates, cost of living, and new destinations — refreshed daily.',
    url: `${siteUrl}/news`,
    siteName: 'LiveWhere',
    type: 'website',
  },
}

export default function NewsPage() {
  return (
    <main style={{ position: 'relative' }}>
      <header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, padding: '20px 40px', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(10,10,15,0.95), transparent)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link
          href="/"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: 'inherit', textDecoration: 'none' }}
        >
          Live<span style={{ color: '#c8f05a' }}>Where</span>
        </Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/blog" style={{ fontSize: 13, color: 'rgba(240,237,232,0.55)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
            Blog
          </Link>
          <Link href="/news" style={{ fontSize: 13, color: '#c8f05a', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            News
          </Link>
        </div>
      </header>
      <Newsfeed />
    </main>
  )
}
