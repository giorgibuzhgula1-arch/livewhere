import { trackPurchaseCompleted, type PremiumPlan } from '@/lib/analytics'

function isPremiumPlan(value: string | null | undefined): value is PremiumPlan {
  return (
    value === 'pro' ||
    value === 'blueprint' ||
    value === 'blueprint_upgrade' ||
    value === 'monitor'
  )
}

/**
 * Confirm the Checkout Session with Stripe before firing `purchase`.
 * URL params alone are not trusted. Test/founder sessions are excluded.
 */
export async function confirmAndTrackPurchase(params: {
  sessionId: string
  plan: PremiumPlan | string
}): Promise<void> {
  try {
    const res = await fetch('/api/stripe/verify-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: params.sessionId }),
    })
    const data = (await res.json().catch(() => null)) as {
      verified?: boolean
      exclude?: boolean
      amountTotal?: number | null
      currency?: string
      plan?: string | null
    } | null

    if (!res.ok || !data?.verified || data.exclude) return

    const plan = isPremiumPlan(data.plan) ? data.plan : params.plan
    const value =
      typeof data.amountTotal === 'number' && data.amountTotal > 0
        ? data.amountTotal / 100
        : undefined

    trackPurchaseCompleted({
      transactionId: params.sessionId,
      plan,
      ...(value != null ? { value } : {}),
      ...(data.currency ? { currency: data.currency.toUpperCase() } : {}),
    })
  } catch (err) {
    console.error('[confirm-purchase] verify failed:', err)
  }
}
