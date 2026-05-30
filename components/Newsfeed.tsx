'use client'

import { useEffect, useMemo, useState } from 'react'
import { NEWS_CATEGORIES, type NewsArticle, type NewsCategory } from '@/lib/news'

type Filter = 'All' | NewsCategory

const CATEGORY_COLOR: Record<NewsCategory, string> = {
  'Visa News': '#7ab3ff',
  'Tax Changes': '#f0c85a',
  'New Destinations': '#c8f05a',
  'Cost of Living': '#5af0c8',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function CategoryChip({ category }: { category: NewsCategory }) {
  const c = CATEGORY_COLOR[category]
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: c, background: `${c}1f`,
      border: `1px solid ${c}55`, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {category}
    </span>
  )
}

function ArticleCard({ article }: { article: NewsArticle }) {
  const inner = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <CategoryChip category={article.category} />
        <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.45)' }}>{formatDate(article.date)}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#f0ede8', lineHeight: 1.35, marginBottom: 10 }}>
        {article.title}
      </div>
      {article.summary && (
        <p style={{ fontSize: 13.5, color: 'rgba(240,237,232,0.6)', lineHeight: 1.6, marginBottom: 14 }}>
          {article.summary}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#c8f05a', fontWeight: 600 }}>
          {article.flag ? `${article.flag} ` : ''}{article.source}
        </span>
        {article.link && article.link !== '#' && (
          <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.45)' }}>Read →</span>
        )}
      </div>
    </>
  )

  const baseStyle: React.CSSProperties = {
    background: '#1a1a26', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 22, textDecoration: 'none', display: 'block',
    color: 'inherit', height: '100%',
  }

  if (article.link && article.link !== '#') {
    return (
      <a href={article.link} target="_blank" rel="noopener noreferrer" style={baseStyle}>
        {inner}
      </a>
    )
  }
  return <div style={baseStyle}>{inner}</div>
}

export default function Newsfeed() {
  const [articles, setArticles] = useState<NewsArticle[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('All')

  useEffect(() => {
    let cancelled = false
    fetch('/api/news')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load news')
        return res.json()
      })
      .then((data: { articles: NewsArticle[] }) => {
        if (!cancelled) setArticles(data.articles ?? [])
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the news feed right now. Please try again later.')
      })
    return () => { cancelled = true }
  }, [])

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of articles ?? []) map[a.category] = (map[a.category] ?? 0) + 1
    return map
  }, [articles])

  const filters: Filter[] = ['All', ...NEWS_CATEGORIES]
  const visible = (articles ?? []).filter((a) => filter === 'All' || a.category === filter)

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 20px 80px', position: 'relative', zIndex: 1 }}>
      <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ Relocation News
      </p>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, marginBottom: 12 }}>
        Nomad &amp; Expat News
      </h1>
      <p style={{ fontSize: 16, color: 'rgba(240,237,232,0.55)', maxWidth: 560, lineHeight: 1.6, marginBottom: 32 }}>
        The latest on visas, taxes, cost of living, and new destinations — aggregated from trusted relocation sources and refreshed daily.
      </p>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {filters.map((f) => {
          const active = filter === f
          const count = f === 'All' ? (articles?.length ?? 0) : (counts[f] ?? 0)
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                background: active ? 'rgba(200,240,90,0.1)' : '#1a1a26',
                border: active ? '1px solid #c8f05a' : '1px solid rgba(255,255,255,0.07)',
                color: active ? '#c8f05a' : 'rgba(240,237,232,0.55)',
              }}
            >
              {f}{articles ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {error && (
        <div style={{
          background: 'rgba(240,90,140,0.1)', border: '1px solid rgba(240,90,140,0.3)',
          borderRadius: 12, padding: '14px 18px', color: '#f05a8c', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {!error && articles === null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 0' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #1a1a26', borderTopColor: '#c8f05a', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: 14 }}>Loading the latest news…</p>
        </div>
      )}

      {!error && articles !== null && visible.length === 0 && (
        <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: 14, padding: '40px 0' }}>
          No articles in this category right now. Check back soon.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
        {visible.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}
