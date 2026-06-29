'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { CityCompareMetrics } from '@/lib/compare'
import styles from './compare.module.css'

export type CompareInsights = {
  savingsOver10Years: string
  healthcareAdvantage: string
  taxAdvantage: string
  matchScore: string
  topReason: string
  summary: string
}

type Props = {
  cityA: CityCompareMetrics
  cityB: CityCompareMetrics
  paid: boolean
}

type CityPayload = {
  name: string
  country: string
  monthlyCostOfLiving: number
  monthlyRent: number
  healthcareScore: number
  safetyScore: number
  taxScore: number
  climateScore: number
  airportScore: number
  internetScore: number
  walkabilityScore: number
  visaAccessScore: number
  overallRetirementScore: number
}

function toPayload(metrics: CityCompareMetrics): CityPayload {
  return {
    name: metrics.city.name,
    country: metrics.city.country,
    monthlyCostOfLiving: metrics.monthlyCostOfLiving,
    monthlyRent: metrics.monthlyRent,
    healthcareScore: metrics.healthcareScore,
    safetyScore: metrics.safetyScore,
    taxScore: metrics.taxScore,
    climateScore: metrics.climateScore,
    airportScore: metrics.airportScore,
    internetScore: metrics.internetScore,
    walkabilityScore: metrics.walkabilityScore,
    visaAccessScore: metrics.visaAccessScore,
    overallRetirementScore: metrics.overallRetirementScore,
  }
}

const sectionStyle: React.CSSProperties = {
  marginTop: 32,
  position: 'relative',
}

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 14,
  marginBottom: 14,
}

const statCardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '18px 20px',
  textAlign: 'left',
}

const statIconStyle: React.CSSProperties = {
  fontSize: 22,
  marginBottom: 10,
  lineHeight: 1,
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: 'rgba(240, 237, 232, 0.45)',
  fontWeight: 600,
  marginBottom: 6,
}

const statValueStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: '#f0ede8',
  lineHeight: 1.35,
}

const textCardStyle: React.CSSProperties = {
  ...statCardStyle,
  marginBottom: 14,
}

const skeletonPulse: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'aiInsightShimmer 1.4s ease-in-out infinite',
  borderRadius: 12,
}

function LoadingSkeleton() {
  return (
    <div>
      <style>{`
        @keyframes aiInsightShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={statGridStyle}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={statCardStyle}>
            <div style={{ ...skeletonPulse, width: 28, height: 28, marginBottom: 12 }} />
            <div style={{ ...skeletonPulse, width: '60%', height: 10, marginBottom: 8 }} />
            <div style={{ ...skeletonPulse, width: '85%', height: 18 }} />
          </div>
        ))}
      </div>
      <div style={{ ...textCardStyle, marginBottom: 14 }}>
        <div style={{ ...skeletonPulse, width: '30%', height: 10, marginBottom: 10 }} />
        <div style={{ ...skeletonPulse, width: '100%', height: 14, marginBottom: 8 }} />
        <div style={{ ...skeletonPulse, width: '75%', height: 14 }} />
      </div>
      <div style={textCardStyle}>
        <div style={{ ...skeletonPulse, width: '25%', height: 10, marginBottom: 10 }} />
        <div style={{ ...skeletonPulse, width: '100%', height: 14, marginBottom: 8 }} />
        <div style={{ ...skeletonPulse, width: '92%', height: 14, marginBottom: 8 }} />
        <div style={{ ...skeletonPulse, width: '68%', height: 14 }} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={statCardStyle}>
      <div style={statIconStyle} aria-hidden>
        {icon}
      </div>
      <p style={statLabelStyle}>{label}</p>
      <p style={statValueStyle}>{value}</p>
    </div>
  )
}

function InsightsContent({ insights }: { insights: CompareInsights }) {
  return (
    <>
      <div style={statGridStyle}>
        <StatCard icon="💰" label="10-Year Savings" value={insights.savingsOver10Years} />
        <StatCard icon="🏥" label="Healthcare" value={insights.healthcareAdvantage} />
        <StatCard icon="📊" label="Tax Advantage" value={insights.taxAdvantage} />
        <StatCard icon="🎯" label="Retirement Match" value={insights.matchScore} />
      </div>

      <div style={textCardStyle}>
        <p style={statLabelStyle}>Top Reason</p>
        <p style={{ ...statValueStyle, fontSize: 16, fontWeight: 600 }}>{insights.topReason}</p>
      </div>

      <div style={textCardStyle}>
        <p style={statLabelStyle}>Analysis</p>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            color: 'rgba(240, 237, 232, 0.82)',
            margin: 0,
          }}
        >
          {insights.summary}
        </p>
      </div>
    </>
  )
}

export default function AIRetirementInsights({ cityA, cityB, paid }: Props) {
  const [insights, setInsights] = useState<CompareInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setInsights(null)

    void fetch('/api/compare-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cityA: toPayload(cityA),
        cityB: toPayload(cityB),
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean; insights?: CompareInsights; error?: string }
        if (!res.ok || !data.ok || !data.insights) {
          throw new Error(data.error ?? 'Failed to load analysis')
        }
        return data.insights
      })
      .then((result) => {
        if (!cancelled) setInsights(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load analysis')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    cityA.city.name,
    cityA.city.country,
    cityB.city.name,
    cityB.city.country,
  ])

  return (
    <section style={sectionStyle} aria-labelledby="ai-retirement-analysis">
      <p className={styles.overallKicker} id="ai-retirement-analysis">
        AI Retirement Analysis
      </p>
      <p
        style={{
          fontSize: 14,
          color: 'var(--muted)',
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        Personalized insights for {cityA.city.name} vs {cityB.city.name}
      </p>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <div
          style={{
            ...textCardStyle,
            color: 'rgba(240, 237, 232, 0.6)',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {!loading && insights && (
        <div style={{ position: 'relative' }}>
          <div className={!paid ? styles.lockedContent : undefined}>
            <InsightsContent insights={insights} />
          </div>

          {!paid && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                zIndex: 2,
              }}
            >
              <div className={styles.paywallCard}>
                <h2 className={styles.paywallTitle}>Unlock Full Analysis — Upgrade to Pro</h2>
                <Link href="/pricing" className={styles.paywallBtn}>
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
