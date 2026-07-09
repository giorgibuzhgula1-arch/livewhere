'use client'

import Link from 'next/link'
import { useState } from 'react'
import { exportRetirementReport } from '@/lib/export-pdf'
import { formatPlanDate, type SavedRetirementPlan } from '@/lib/saved-plans'

type Props = {
  plans: SavedRetirementPlan[]
  loading: boolean
  isBlueprint: boolean
}

export default function MyDocuments({ plans, loading, isBlueprint }: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const documentPlans = isBlueprint ? plans : []

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

  if (loading) {
    return <p style={{ color: 'rgba(240,237,232,0.45)' }}>Loading your documents…</p>
  }

  if (documentPlans.length === 0) {
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
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          View Blueprint pricing
        </Link>
      </div>
    )
  }

  return (
    <>
      <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.55)', marginBottom: 20, lineHeight: 1.6 }}>
        Your Relocation Blueprint PDFs — built from each saved plan&apos;s city matches and budget.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    fontFamily: "'DM Sans', sans-serif",
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
                  fontFamily: "'DM Sans', sans-serif",
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
  )
}
