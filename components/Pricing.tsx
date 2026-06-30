'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchUserProfile, isProPlan, type UserPlan } from '@/lib/plan'
import type { CheckoutType } from '@/lib/stripe-prices'
import {
  trackCheckoutStarted,
  trackPremiumButtonClicked,
  trackPricingViewed,
  type PremiumPlan,
} from '@/lib/analytics'

interface Props {
  onUpgrade: () => void
}

type PlanFeature = {
  text: string
  included?: boolean
  highlighted?: boolean
}

type PricingTier = {
  id: string
  name: string
  price: string
  period: string
  features: PlanFeature[]
  btn: string
  style: 'primary' | 'ghost'
  popular?: boolean
  note?: string
  valueSummary?: string
  checkoutType?: CheckoutType
  action?: 'signup'
}

export default function Pricing({ onUpgrade }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<CheckoutType | 'signup' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<UserPlan>('free')
  const [plansLoaded, setPlansLoaded] = useState(false)

  useEffect(() => {
    void fetchUserProfile().then((p) => {
      setUserPlan(p.plan)
      setPlansLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!plansLoaded) return
    trackPricingViewed()
  }, [plansLoaded])

  async function handleCheckout(checkoutType: CheckoutType) {
    if (loadingPlan) return
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      onUpgrade()
      return
    }
    setLoadingPlan(checkoutType)
    trackCheckoutStarted({ plan: checkoutType, location: 'pricing_page' })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, email: user.email, checkoutType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Unable to start Stripe checkout')
      if (data?.url) {
        window.location.assign(data.url)
        return
      }
      throw new Error('Stripe checkout URL not returned')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to start Stripe checkout')
    } finally {
      setLoadingPlan(null)
    }
  }

  const isProUpgrade = isProPlan(userPlan)
  const blueprintCheckout: CheckoutType = isProUpgrade ? 'blueprint_upgrade' : 'blueprint'
  const blueprintBtn =
    loadingPlan === 'blueprint' || loadingPlan === 'blueprint_upgrade'
      ? 'Loading…'
      : isProUpgrade
        ? 'Upgrade to Blueprint — $100'
        : 'Get Retirement Blueprint'

  const tiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        { text: '3 searches/day' },
        { text: 'Top 3 recommendations' },
        { text: 'Basic country scores' },
        { text: 'Basic city pages' },
        { text: 'Save 1 plan' },
        { text: 'Newsletter' },
      ],
      btn: 'Get started free',
      style: 'ghost',
      action: 'signup',
    },
    {
      id: 'pro',
      name: 'Pro Lifetime',
      price: '$49',
      period: 'one-time',
      popular: true,
      features: [
        { text: 'Unlimited searches' },
        { text: 'All 200+ cities' },
        { text: 'Compare Cities' },
        { text: 'AI Retirement Insights' },
        { text: 'Full City Details' },
        { text: 'Save Unlimited Plans' },
        { text: 'AI Plan Summary' },
        { text: 'Future updates included' },
        { text: 'Retirement Monitor', included: false },
        { text: 'PDF Blueprint', included: false },
      ],
      btn: loadingPlan === 'pro' ? 'Loading…' : 'Get My Retirement Plan',
      style: 'primary',
      checkoutType: 'pro',
      note: 'Already have Pro? Upgrade to Blueprint — pay only $100 more.',
    },
    {
      id: 'blueprint',
      name: 'Blueprint Lifetime',
      price: isProUpgrade ? '$100' : '$149',
      period: 'one-time',
      features: [
        {
          text: 'Includes 12 months of Retirement Monitor — $120 value',
          highlighted: true,
        },
        { text: 'Everything in Pro +' },
        { text: 'Personalized 30–50 page PDF Blueprint' },
        { text: '10-Year Financial Projection' },
        { text: 'Tax strategy & Visa roadmap' },
        { text: 'Move checklist & Risk analysis' },
        { text: 'AI Retirement Twin (coming soon)' },
        { text: 'Priority Support' },
        { text: '12 months Retirement Monitor included free' },
        { text: 'Future Blueprint updates' },
      ],
      btn: blueprintBtn,
      style: 'ghost',
      checkoutType: blueprintCheckout,
      valueSummary: isProUpgrade ? undefined : 'Total value: $269 — yours for $149',
      note: isProUpgrade
        ? "Pro member price — you've already paid $49. Total value: $269"
        : undefined,
    },
    {
      id: 'monitor',
      name: 'Monitor',
      price: '$9.99',
      period: '/month',
      features: [
        { text: 'Weekly city alerts' },
        { text: 'Tax & Visa changes' },
        { text: 'Healthcare changes' },
        { text: 'Cost of living changes' },
        { text: 'New retirement programs' },
        { text: 'Better city recommendations' },
        { text: 'AI notifications' },
      ],
      btn: loadingPlan === 'monitor' ? 'Loading…' : 'Start Monitoring',
      style: 'ghost',
      checkoutType: 'monitor',
      note: 'Add-on for Pro users. Included free for 12 months with Blueprint.',
    },
  ]

  function handleTierClick(tier: PricingTier) {
    if (tier.action === 'signup') {
      onUpgrade()
      return
    }
    if (tier.checkoutType) {
      trackPremiumButtonClicked({
        plan: tier.checkoutType as PremiumPlan,
        location: 'pricing_page',
      })
      void handleCheckout(tier.checkoutType)
    }
  }

  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 20px',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#c8f05a',
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        ✦ Pricing
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(32px,4vw,52px)',
          fontWeight: 700,
          marginBottom: 48,
        }}
      >
        Simple, honest pricing
      </h2>
      {error && (
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto 24px',
            background: 'rgba(240,90,140,0.1)',
            border: '1px solid rgba(240,90,140,0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#f05a8c',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}
      >
        {tiers.map((tier) => {
          const isLoading = tier.checkoutType && loadingPlan === tier.checkoutType
          return (
            <div
              key={tier.id}
              style={{
                background: tier.popular ? 'rgba(200,240,90,0.05)' : '#12121a',
                border: tier.popular
                  ? '1px solid rgba(200,240,90,0.3)'
                  : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: 28,
                textAlign: 'left',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {tier.popular && (
                <div
                  style={{
                    background: '#c8f05a',
                    color: '#0a0a0f',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 20,
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 16,
                    alignSelf: 'flex-start',
                  }}
                >
                  Most Popular
                </div>
              )}
              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(240,237,232,0.45)',
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                {tier.name}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 42,
                  fontWeight: 900,
                  marginBottom: 4,
                }}
              >
                {tier.price}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(240,237,232,0.45)',
                  marginBottom: 24,
                }}
              >
                {tier.period}
              </div>
              <ul style={{ listStyle: 'none', marginBottom: tier.valueSummary ? 12 : 24, flex: 1 }}>
                {tier.features.map((f) => (
                  <li
                    key={f.text}
                    style={{
                      fontSize: 13,
                      padding: f.highlighted ? '10px 12px' : '8px 0',
                      marginBottom: f.highlighted ? 10 : 0,
                      borderBottom: f.highlighted
                        ? 'none'
                        : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: f.highlighted ? 10 : undefined,
                      background: f.highlighted ? 'rgba(200,240,90,0.1)' : undefined,
                      border: f.highlighted
                        ? '1px solid rgba(200,240,90,0.35)'
                        : undefined,
                      display: 'flex',
                      gap: 8,
                      alignItems: f.highlighted ? 'flex-start' : 'center',
                      color:
                        f.highlighted
                          ? '#c8f05a'
                          : f.included === false
                            ? 'rgba(240,237,232,0.35)'
                            : 'rgba(240,237,232,0.6)',
                      fontWeight: f.highlighted ? 600 : 400,
                    }}
                  >
                    {f.highlighted ? (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: 0.6,
                          textTransform: 'uppercase',
                          color: '#0a0a0f',
                          background: '#c8f05a',
                          padding: '3px 6px',
                          borderRadius: 4,
                          flexShrink: 0,
                          lineHeight: 1.2,
                          marginTop: 1,
                        }}
                      >
                        Bonus
                      </span>
                    ) : (
                      <span
                        style={{
                          color: f.included === false ? '#f05a8c' : '#c8f05a',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {f.included === false ? '✕' : '✓'}
                      </span>
                    )}
                    <span style={{ lineHeight: 1.45 }}>{f.text}</span>
                  </li>
                ))}
              </ul>
              {tier.valueSummary && (
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#c8f05a',
                    marginBottom: 20,
                    padding: '10px 12px',
                    background: 'rgba(200,240,90,0.06)',
                    borderRadius: 10,
                    border: '1px solid rgba(200,240,90,0.15)',
                    lineHeight: 1.5,
                  }}
                >
                  {tier.valueSummary}
                </p>
              )}
              <button
                type="button"
                onClick={() => handleTierClick(tier)}
                disabled={Boolean(isLoading)}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isLoading ? 'wait' : 'pointer',
                  border: 'none',
                  background: tier.style === 'primary' ? '#c8f05a' : '#1a1a26',
                  color: tier.style === 'primary' ? '#0a0a0f' : '#f0ede8',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {tier.btn}
              </button>
              {tier.note && (
                <p
                  style={{
                    fontSize: 11,
                    color: 'rgba(240,237,232,0.4)',
                    marginTop: 10,
                    lineHeight: 1.5,
                    marginBottom: 0,
                  }}
                >
                  {tier.note}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
