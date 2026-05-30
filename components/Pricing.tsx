'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props { onUpgrade: () => void }

export default function Pricing({ onUpgrade }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'report' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(checkoutType: 'pro' | 'report') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { onUpgrade(); return }
    setLoadingPlan(checkoutType)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ userId: user?.id, email: user?.email, checkoutType })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Unable to start Stripe checkout')
      if (data?.url) { window.location.assign(data.url); return }
      throw new Error('Stripe checkout URL not returned')
    } catch (err: any) {
      setError(err?.message || 'Unable to start Stripe checkout')
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans = [
    {
      name: 'Free', price: '$0', originalPrice: '', period: 'forever', sale: false,
      features: ['Top 3 city names only', '3 searches/month'],
      btn: 'Get started free', style: 'ghost', popular: false
    },
    {
      name: 'Pro', price: '$19/mo', originalPrice: '$49/mo', period: 'per month', sale: true,
      features: ['Top 12 cities full analysis', 'Real tax calculator', 'Unlimited searches', 'City comparisons', 'Visa difficulty scores'],
      btn: loadingPlan === 'pro' ? 'Loading...' : 'Start Pro — $19/mo', style: 'primary', popular: true
    },
    {
      name: 'Lifetime', price: '$149', originalPrice: '$299', period: 'one-time payment', sale: true,
      features: ['Top 12 cities full analysis', 'Lifetime access', 'PDF report', 'Unlimited re-runs', 'Priority support'],
      btn: loadingPlan === 'report' ? 'Loading...' : 'Get Lifetime Access', style: 'ghost', popular: false
    },
  ]

  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>✦ Pricing</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, marginBottom: 48 }}>Simple, honest pricing</h2>
      {error && <div style={{ maxWidth: 560, margin: '0 auto 24px', background: 'rgba(240,90,140,0.1)', border: '1px solid rgba(240,90,140,0.3)', borderRadius: 10, padding: '12px 16px', color: '#f05a8c', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 20 }}>
        {plans.map(plan => {
          const isProPlan = plan.name === 'Pro'
          const isLifetimePlan = plan.name === 'Lifetime'
          const isLoading = (isProPlan && loadingPlan === 'pro') || (isLifetimePlan && loadingPlan === 'report')
          return (
            <div key={plan.name} style={{ background: plan.popular ? 'rgba(200,240,90,0.05)' : '#12121a', border: plan.popular ? '1px solid rgba(200,240,90,0.3)' : '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 32, textAlign: 'left', position: 'relative', zIndex: 1 }}>
              {plan.popular && <div style={{ background: '#c8f05a', color: '#0a0a0f', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>Most Popular</div>}
              <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.45)', marginBottom: 8, fontWeight: 500 }}>{plan.name}</div>
              {plan.sale && plan.originalPrice && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: 'rgba(240,237,232,0.4)', textDecoration: 'line-through' }}>{plan.originalPrice}</span>
                  <span style={{ background: '#f05a8c', color: '#0a0a0f', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>Limited time</span>
                </div>
              )}
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900, marginBottom: 4 }}>{plan.price}</div>
              <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 24 }}>{plan.period}</div>
              <ul style={{ listStyle: 'none', marginBottom: 24 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, color: 'rgba(240,237,232,0.6)' }}>
                    <span style={{ color: '#c8f05a', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={isProPlan ? () => handleCheckout('pro') : isLifetimePlan ? () => handleCheckout('report') : undefined} disabled={isLoading} style={{ width: '100%', padding: 14, borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s', background: plan.style === 'primary' ? '#c8f05a' : '#1a1a26', color: plan.style === 'primary' ? '#0a0a0f' : '#f0ede8', position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
                {plan.btn}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
