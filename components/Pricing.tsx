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
import { startBlueprintCheckout } from '@/lib/start-blueprint-checkout'
import type { BlueprintCheckoutContext } from '@/lib/saved-plans'

interface Props {
  onUpgrade: () => void
  checkoutContext?: BlueprintCheckoutContext
}

type PlanFeature = {
  text: string
}

type PricingTier = {
  id: string
  tierLabel: string
  headline: string
  price: string
  period: string
  subheadline?: string
  features: PlanFeature[]
  whoIsThisFor?: string
  btn: string
  style: 'primary' | 'ghost'
  popular?: boolean
  note?: string
  valueSummary?: string
  checkoutType?: CheckoutType
  action?: 'signup'
}

export default function Pricing({ onUpgrade, checkoutContext }: Props) {
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

    if (checkoutType === 'blueprint' || checkoutType === 'blueprint_upgrade') {
      setLoadingPlan(checkoutType)
      try {
        await startBlueprintCheckout({
          checkoutType,
          location: 'pricing_page',
          checkoutContext,
        })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to start Stripe checkout')
        setLoadingPlan(null)
      }
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
        ? 'Continue to Blueprint — $70'
        : 'Build My Relocation Strategy'

  const tiers: PricingTier[] = [
    {
      id: 'free',
      tierLabel: 'FREE',
      headline: 'Start Exploring',
      price: '$0',
      period: 'forever',
      subheadline: "Perfect if you're just beginning your relocation research.",
      features: [
        { text: 'Discover your Top 3 matches' },
        { text: 'See your relocation score' },
        { text: 'Preview estimated monthly costs' },
        { text: 'Explore one relocation scenario' },
      ],
      whoIsThisFor: "I'm exploring.",
      btn: 'Start Free Analysis',
      style: 'ghost',
      action: 'signup',
    },
    {
      id: 'pro',
      tierLabel: 'PRO',
      headline: 'Make Your Decision With Confidence',
      price: '$79',
      period: 'one-time',
      subheadline: 'One-time payment. Lifetime access.',
      popular: true,
      features: [
        { text: 'See every city that matches you' },
        { text: 'Compare every destination side by side' },
        { text: 'Discover hidden financial risks' },
        { text: 'See your complete cost breakdown' },
        { text: 'Calculate long-term purchasing power' },
        { text: 'Save unlimited relocation plans' },
        { text: 'AI explains WHY each city fits you' },
        { text: 'Free future updates' },
      ],
      whoIsThisFor: "I already know I'm moving.",
      btn: loadingPlan === 'pro' ? 'Loading…' : 'Unlock My Full Analysis',
      style: 'primary',
      checkoutType: 'pro',
      note: 'Already have Pro? Continue to Blueprint — pay only $70 more.',
    },
    {
      id: 'blueprint',
      tierLabel: 'BLUEPRINT',
      headline: 'Your Personal Relocation Strategy',
      price: isProUpgrade ? '$70' : '$149',
      period: 'one-time',
      features: [
        { text: 'Personalized relocation blueprint' },
        { text: 'Ten-year financial projection' },
        { text: 'Country-by-country tax comparison' },
        { text: 'Healthcare analysis' },
        { text: 'Safety analysis' },
        { text: 'Visa strategy' },
        { text: 'Risk assessment' },
        { text: 'AI Relocation Strategy' },
        { text: 'Relocation action plan' },
        { text: '12 months of monitoring included' },
      ],
      whoIsThisFor: "I'm making a life-changing decision.",
      btn: blueprintBtn,
      style: 'ghost',
      checkoutType: blueprintCheckout,
      valueSummary: isProUpgrade ? undefined : 'Total value: $269 — yours for $149',
      note: isProUpgrade
        ? "Pro member price — you've already paid $79. Total value: $269"
        : undefined,
    },
    {
      id: 'monitor',
      tierLabel: 'MONITOR',
      headline: 'Stay Ahead Of Every Change',
      price: '$9.99',
      period: '/month',
      subheadline: 'Never be surprised by',
      features: [
        { text: 'Tax changes' },
        { text: 'Cost of living' },
        { text: 'Visa rules' },
        { text: 'Healthcare' },
        { text: 'Better relocation opportunities' },
        { text: 'New countries matching your profile' },
      ],
      btn: loadingPlan === 'monitor' ? 'Loading…' : 'Protect My Plan',
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
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          marginBottom: 56,
          maxWidth: 820,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        Choose How Confident You Want To Be Before You Move.
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 24,
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
                padding: 32,
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
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: '#c8f05a',
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                {tier.tierLabel}
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize:
                    tier.id === 'blueprint' || tier.id === 'monitor'
                      ? 'clamp(17px, 1.85vw, 20px)'
                      : 'clamp(20px, 2.2vw, 24px)',
                  fontWeight: 700,
                  lineHeight: tier.id === 'blueprint' || tier.id === 'monitor' ? 1.35 : 1.2,
                  letterSpacing: '-0.01em',
                  color: '#f0ede8',
                  margin: '0 0 20px',
                  flexShrink: 0,
                  overflow: 'visible',
                  whiteSpace: 'normal',
                }}
              >
                {tier.headline}
              </h3>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 42,
                  fontWeight: 900,
                  marginBottom: 4,
                  lineHeight: 1,
                }}
              >
                {tier.price}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(240,237,232,0.45)',
                  marginBottom: tier.subheadline ? 12 : 20,
                }}
              >
                {tier.period}
              </div>
              {tier.subheadline && (
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: 'rgba(240,237,232,0.55)',
                    margin: '0 0 20px',
                  }}
                >
                  {tier.subheadline}
                </p>
              )}
              <ul style={{ listStyle: 'none', margin: '0 0 20px', padding: 0, flex: 1 }}>
                {tier.features.map((f) => (
                  <li
                    key={f.text}
                    style={{
                      fontSize: 13,
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      color: 'rgba(240,237,232,0.65)',
                      lineHeight: 1.45,
                    }}
                  >
                    <span
                      style={{
                        color: '#c8f05a',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <span>{f.text}</span>
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
              {tier.whoIsThisFor && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'rgba(240,237,232,0.4)',
                    fontStyle: 'italic',
                    margin: '0 0 16px',
                    lineHeight: 1.5,
                  }}
                >
                  {tier.whoIsThisFor}
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
                  marginTop: 'auto',
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
