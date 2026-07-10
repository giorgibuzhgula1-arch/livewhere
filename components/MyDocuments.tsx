'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { exportRetirementReport } from '@/lib/export-pdf'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'
import { fetchUserProfile, isBlueprintPlan } from '@/lib/plan'
import { formatPlanDate, type SavedRetirementPlan } from '@/lib/saved-plans'

type Props = {
  plans: SavedRetirementPlan[]
  loading: boolean
  isBlueprint: boolean
}

const OUTCOME_BULLETS = [
  'Know exactly which city fits your life',
  'Avoid unexpected tax surprises before you move',
  "Understand the real healthcare quality you'll receive",
  'Know what daily life actually feels like',
] as const

export default function MyDocuments({ plans, loading, isBlueprint }: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [hasBlueprintAccess, setHasBlueprintAccess] = useState(isBlueprint)

  useEffect(() => {
    let cancelled = false

    void fetchUserProfile().then((profile) => {
      if (cancelled) return
      setHasBlueprintAccess(isBlueprintPlan(profile.plan))
      setProfileLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const documentPlans = hasBlueprintAccess ? plans : []

  async function handleDownloadBlueprint(plan: SavedRetirementPlan) {
    if (downloadingId) return
    const exportCities = plan.city_results.filter((city) => !city.locked)
    if (exportCities.length === 0) return

    const budget =
      typeof plan.quiz_input.monthlyBudget === 'number' && plan.quiz_input.monthlyBudget > 0
        ? plan.quiz_input.monthlyBudget
        : 0

    setDownloadingId(plan.id)
    try {
      await exportRetirementReport(exportCities, budget, { lifetime: true })
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading || profileLoading) {
    return <p style={{ color: 'rgba(240,237,232,0.45)' }}>Loading your documents…</p>
  }

  if (!hasBlueprintAccess) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 28,
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'rgba(240,237,232,0.6)', marginBottom: 16, lineHeight: 1.6 }}>
          No documents yet. Upgrade to Blueprint to unlock personalized relocation documents.
        </p>
        <Link
          href="/pricing"
          style={{
            display: 'inline-block',
            background: '#c8f05a',
            color: '#0a0a0f',
            textDecoration: 'none',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: fontFamilySans,
          }}
        >
          View Blueprint pricing
        </Link>
      </div>
    )
  }

  return (
    <>
      <header style={{ marginBottom: 40, maxWidth: 720 }}>
        <h1
          style={{
            fontFamily: fontFamilySerif,
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#f0ede8',
            margin: '0 0 16px',
          }}
        >
          Your Complete Relocation Strategy
        </h1>
        <p
          style={{
            fontFamily: fontFamilySans,
            fontSize: 16,
            lineHeight: 1.7,
            color: 'rgba(240,237,232,0.65)',
            margin: '0 0 32px',
          }}
        >
          Everything you need to confidently choose where to live before making one of the biggest
          financial decisions of your life.
        </p>

        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {OUTCOME_BULLETS.map((item) => (
            <li
              key={item}
              style={{
                fontFamily: fontFamilySans,
                fontSize: 15,
                lineHeight: 1.55,
                color: 'rgba(240,237,232,0.75)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ color: '#c8f05a', fontWeight: 700, flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </header>

      {documentPlans.length === 0 ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 28,
            textAlign: 'center',
            marginBottom: 56,
          }}
        >
          <p style={{ color: 'rgba(240,237,232,0.6)', marginBottom: 0, lineHeight: 1.6 }}>
            No saved plans yet. Complete the quiz and save a plan to generate your relocation
            blueprint documents.
          </p>
        </div>
      ) : (
        <>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(240,237,232,0.55)',
              marginBottom: 20,
              lineHeight: 1.6,
              fontFamily: fontFamilySans,
            }}
          >
            Your Relocation Blueprint PDFs — built from each saved plan&apos;s city matches and
            budget.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56 }}>
            {documentPlans.map((plan) => {
              const exportableCount = plan.city_results.filter((city) => !city.locked).length
              const isDownloading = downloadingId === plan.id

              return (
                <div
                  key={plan.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '18px 20px',
                  }}
                >
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 17,
                        marginBottom: 4,
                        fontFamily: fontFamilySans,
                      }}
                    >
                      {plan.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.45)' }}>
                      {formatPlanDate(plan.created_at)} · {exportableCount} cities
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadBlueprint(plan)}
                    disabled={isDownloading || exportableCount === 0}
                    style={{
                      background: isDownloading ? 'rgba(200,240,90,0.08)' : 'rgba(200,240,90,0.1)',
                      border: '1px solid rgba(200,240,90,0.35)',
                      color: '#c8f05a',
                      padding: '10px 18px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: isDownloading || exportableCount === 0 ? 'not-allowed' : 'pointer',
                      fontFamily: fontFamilySans,
                      opacity: isDownloading || exportableCount === 0 ? 0.7 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {isDownloading ? 'Building your blueprint…' : 'Download Blueprint'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      <section
        style={{
          marginTop: 8,
          paddingTop: 56,
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: fontFamilySerif,
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            color: '#f0ede8',
            margin: '0 auto 16px',
            maxWidth: 520,
          }}
        >
          Your relocation strategy doesn&apos;t end today.
        </p>
        <p
          style={{
            fontFamily: fontFamilySans,
            fontSize: 15,
            lineHeight: 1.7,
            color: 'rgba(240,237,232,0.6)',
            margin: '0 auto 28px',
            maxWidth: 560,
          }}
        >
          We&apos;ll continue monitoring taxes, healthcare, visas, cost of living and new
          opportunities as they change.
        </p>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            display: 'inline-block',
            background: '#c8f05a',
            color: '#0a0a0f',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            fontFamily: fontFamilySans,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Activate Live Monitor
        </a>
      </section>
    </>
  )
}
