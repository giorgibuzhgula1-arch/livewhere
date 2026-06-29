'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CityResult } from '@/lib/types'
import { compareHrefForCity } from '@/lib/compare'
import { fetchUserPlan, isPaidPlan } from '@/lib/plan'
import { visaScoreForCountry, visaScoreColor } from '@/lib/visa-data'

interface Props {
  city: CityResult
  rank: number
  onClick: () => void
  locked?: boolean
  onUnlock?: () => void
  /** When set, show a link to the /compare page with this city pre-selected. */
  showCompareLink?: boolean
}

function getScoreColor(score: number) {
  if (score >= 80) return '#c8f05a'
  if (score >= 65) return '#f0c85a'
  return '#f05a8c'
}

function fmt(n: number, currency = 'USD') {
  const sym: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' }
  return (sym[currency] || '$') + n.toLocaleString()
}

function cardShellStyle(rank: number, cursor: string) {
  return {
    background: rank === 1 ? 'rgba(200,240,90,0.04)' : '#1a1a26',
    border: `1px solid ${rank === 1 ? 'rgba(200,240,90,0.3)' : rank === 2 ? 'rgba(90,240,200,0.2)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 18,
    padding: 24,
    cursor,
    transition: 'all 0.2s',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }
}

function CityDetails({ city, color, showCompareLink = false }: { city: CityResult; color: string; showCompareLink?: boolean }) {
  return (
    <>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color, width: `${city.score}%`, transition: 'width 0.5s ease',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ fontSize: 32 }}>{city.flag}</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
            {city.score}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>
            match score
          </div>
        </div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{city.name}</div>
      <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 16 }}>
        {city.country} · {city.continent}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Take-home/mo', val: fmt(city.takeHomeMonthly) },
          { label: 'Monthly cost', val: fmt(city.monthlyCost) },
          { label: 'Tax rate', val: `${city.taxRate}%` },
          { label: 'Monthly saving', val: `${city.monthlySavings > 0 ? '+' : ''}${fmt(Math.abs(city.monthlySavings))}`, color: city.monthlySavings > 0 ? '#c8f05a' : '#f05a8c' },
        ].map(({ label, val, color: vc }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: vc }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {city.tags.slice(0, 2).map(tag => (
          <span key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(200,240,90,0.1)', color: '#c8f05a' }}>{tag}</span>
        ))}
        <VisaBadge country={city.country} />
      </div>
      {showCompareLink && (
        <Link
          href={compareHrefForCity(city.name)}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 14,
            textAlign: 'center',
            background: '#1a1a26',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#c8f05a',
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Compare
        </Link>
      )}
    </>
  )
}

function VisaBadge({ country }: { country: string }) {
  const score = visaScoreForCountry(country)
  if (score == null) return null
  const c = visaScoreColor(score)
  return (
    <span
      title={`Visa access score: ${score}/100`}
      style={{
        fontSize: 11, padding: '4px 10px', borderRadius: 20,
        background: `${c}1f`, border: `1px solid ${c}55`, color: c,
        display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600,
      }}
    >
      🛂 Visa {score}
    </span>
  )
}

type CityInsight = {
  savingsOver10Years: string
  healthcareNote: string
  taxNote: string
  matchSummary: string
}

function toInsightPayload(city: CityResult) {
  console.log('[WhyThisMatchesYou] city prop:', city)
  return {
    name: city.name,
    country: city.country,
    continent: city.continent,
    flag: city.flag,
    score: city.score,
    taxRate: city.taxRate,
    monthlyRent: city.monthlyRent,
    monthlyCost: city.monthlyCost,
    takeHomeMonthly: city.takeHomeMonthly,
    monthlySavings: city.monthlySavings,
    healthcare: city.healthcare,
    visa: city.visa,
    tags: city.tags,
    scores: city.scores,
    aiInsight: city.aiInsight,
  }
}

const insightShimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'cityInsightShimmer 1.4s ease-in-out infinite',
  borderRadius: 8,
}

function InsightSkeleton() {
  return (
    <div style={{ marginTop: 4 }}>
      <style>{`
        @keyframes cityInsightShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ ...insightShimmer, width: '55%', height: 10, marginBottom: 12 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ ...insightShimmer, width: `${90 - i * 8}%`, height: 12, marginBottom: 8 }} />
      ))}
      <div style={{ ...insightShimmer, width: '100%', height: 12, marginTop: 4, marginBottom: 6 }} />
      <div style={{ ...insightShimmer, width: '72%', height: 12 }} />
    </div>
  )
}

function WhyThisMatchesYou({ city }: { city: CityResult }) {
  const [paid, setPaid] = useState(false)
  const [insight, setInsight] = useState<CityInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchUserPlan().then((plan) => {
      if (!cancelled) setPaid(isPaidPlan(plan))
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setInsight(null)

    const payload = toInsightPayload(city)
    console.log('[WhyThisMatchesYou] API payload:', payload)

    void fetch('/api/city-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: payload }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean; insight?: CityInsight; error?: string }
        if (!res.ok || !data.ok || !data.insight) {
          throw new Error(data.error ?? 'Failed to load insight')
        }
        return data.insight
      })
      .then((result) => {
        if (!cancelled) setInsight(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load insight')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [
    city.name,
    city.country,
    city.score,
    city.monthlyCost,
    city.monthlySavings,
    city.taxRate,
    city.scores,
    city.healthcare,
  ])

  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 18,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: '#c8f05a',
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        Why this matches you
      </p>

      {loading && <InsightSkeleton />}

      {!loading && error && (
        <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', margin: 0 }}>{error}</p>
      )}

      {!loading && insight && (
        <div style={{ position: 'relative' }}>
          <div
            style={
              !paid
                ? { filter: 'blur(7px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.85 }
                : undefined
            }
          >
            <ul
              style={{
                margin: '0 0 12px',
                padding: '0 0 0 18px',
                fontSize: 13,
                lineHeight: 1.55,
                color: 'rgba(240,237,232,0.78)',
              }}
            >
              <li style={{ marginBottom: 6 }}>
                <span style={{ color: '#c8f05a', fontWeight: 600 }}>Savings:</span>{' '}
                {insight.savingsOver10Years} over 10 years
              </li>
              <li style={{ marginBottom: 6 }}>
                <span style={{ color: '#c8f05a', fontWeight: 600 }}>Healthcare:</span>{' '}
                {insight.healthcareNote}
              </li>
              <li>
                <span style={{ color: '#c8f05a', fontWeight: 600 }}>Taxes:</span>{' '}
                {insight.taxNote}
              </li>
            </ul>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: 'rgba(240,237,232,0.88)',
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              {insight.matchSummary}
            </p>
          </div>

          {!paid && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Link
                href="/pricing"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#c8f05a',
                  color: '#0a0a0f',
                  textDecoration: 'none',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                Unlock — Upgrade to Pro
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CityCard({ city, rank, onClick, locked = false, onUnlock, showCompareLink = false }: Props) {
  const color = getScoreColor(city.score)

  if (locked) {
    const region = city.continent && city.continent !== 'Other' ? city.continent : 'another region'
    return (
      <div style={cardShellStyle(rank, 'default')}>
        {/* Header: hidden identity (continent only) + visible match score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
              color: 'rgba(240,237,232,0.55)', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: 6,
            }}>
              🔒 Locked
            </span>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f0ede8', marginTop: 10, lineHeight: 1.2 }}>
              City in {region}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
              {city.score}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>
              match score
            </div>
          </div>
        </div>

        {/* Blurred placeholder stats teaser */}
        <div aria-hidden style={{ filter: 'blur(7px)', opacity: 0.25, userSelect: 'none', pointerEvents: 'none', marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['Take-home/mo', 'Monthly cost', 'Tax rate', 'Monthly saving'].map((label) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>$0,000</div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUnlock?.() }}
          style={{ width: '100%', background: '#c8f05a', color: '#0a0a0f', border: 'none', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          Get My Retirement Plan — $49
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={cardShellStyle(rank, 'pointer')}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      <CityDetails city={city} color={color} showCompareLink={showCompareLink} />
      <WhyThisMatchesYou city={city} />
    </div>
  )
}