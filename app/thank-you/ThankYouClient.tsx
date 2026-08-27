'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { trackPurchaseCompleted, type PremiumPlan } from '@/lib/analytics'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

const PLAN_UNLOCKS: Record<PremiumPlan, string[]> = {
  pro: [
    'All 12 personalized city matches',
    'Deeper relocation analysis',
    'Cost-of-living and tax comparisons',
    'Financial risk breakdowns',
    'Lifetime access to Pro',
  ],
  blueprint: [
    'All 12 personalized city matches',
    'Full relocation blueprint and deeper analysis',
    'Cost-of-living and tax comparisons',
    'Financial risk breakdowns',
    'Lifetime Blueprint access',
    'Monitor included for 12 months',
  ],
  blueprint_upgrade: [
    'Everything in your Pro plan, plus the full Blueprint',
    'Deeper relocation analysis and decision support',
    'Cost-of-living and tax comparisons',
    'Financial risk breakdowns',
    'Lifetime Blueprint access',
    'Monitor included for 12 months',
  ],
  monitor: [
    'Ongoing alerts on tax, cost of living, visa, and healthcare changes',
    'New countries matching your profile',
    'Add-on coverage for your existing plan',
  ],
}

function isPremiumPlan(value: string | null): value is PremiumPlan {
  return value === 'pro' || value === 'blueprint' || value === 'blueprint_upgrade' || value === 'monitor'
}

export default function ThankYouClient() {
  const searchParams = useSearchParams()
  const purchaseTrackedRef = useRef(false)

  const planParam = searchParams.get('plan')
  const plan: PremiumPlan = isPremiumPlan(planParam) ? planParam : 'pro'
  const unlocks = PLAN_UNLOCKS[plan]

  useEffect(() => {
    if (purchaseTrackedRef.current || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') !== 'true') return

    const sessionId = params.get('session_id')
    const trackedPlan = (params.get('plan') ?? 'pro') as PremiumPlan
    if (!sessionId) return

    purchaseTrackedRef.current = true
    trackPurchaseCompleted({ transactionId: sessionId, plan: trackedPlan })

    params.delete('upgraded')
    params.delete('session_id')
    params.delete('plan')
    const remaining = params.toString()
    window.history.replaceState(null, '', remaining ? `/thank-you?${remaining}` : '/thank-you')
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: fontFamilySans,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#c8f05a',
            fontWeight: 600,
            margin: '0 0 16px',
          }}
        >
          Order confirmed
        </p>
        <h1
          style={{
            fontFamily: fontFamilySerif,
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700,
            lineHeight: 1.2,
            color: '#f0ede8',
            margin: '0 0 16px',
          }}
        >
          Thank you for your purchase.
        </h1>
        <p
          style={{
            fontFamily: fontFamilySans,
            fontSize: 16,
            lineHeight: 1.6,
            color: 'rgba(240,237,232,0.7)',
            margin: '0 0 32px',
          }}
        >
          Your LiveWhere access is now active.
        </p>

        <ul
          style={{
            listStyle: 'none',
            margin: '0 0 36px',
            padding: 0,
            textAlign: 'left',
            background: '#12121a',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          {unlocks.map((item) => (
            <li
              key={item}
              style={{
                fontFamily: fontFamilySans,
                fontSize: 15,
                lineHeight: 1.5,
                color: 'rgba(240,237,232,0.85)',
                padding: '12px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/?reveal=snapshot"
          style={{
            display: 'inline-block',
            background: '#c8f05a',
            color: '#0a0a0f',
            borderRadius: 12,
            padding: '14px 28px',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: fontFamilySans,
            textDecoration: 'none',
          }}
        >
          View your results
        </Link>
      </div>
    </main>
  )
}
