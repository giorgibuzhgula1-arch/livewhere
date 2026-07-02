import { supabase } from '@/lib/supabase'
import { trackCheckoutStarted } from '@/lib/analytics'
import {
  ensureSavedPlanForBlueprintCheckout,
  type BlueprintCheckoutContext,
} from '@/lib/saved-plans'
import type { CheckoutType } from '@/lib/stripe-prices'

type BlueprintCheckoutType = Extract<CheckoutType, 'blueprint' | 'blueprint_upgrade'>

export async function startBlueprintCheckout(params: {
  checkoutType: BlueprintCheckoutType
  location: string
  checkoutContext?: BlueprintCheckoutContext
}): Promise<void> {
  const { checkoutType, location, checkoutContext } = params
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Sign in required')
  }

  trackCheckoutStarted({ plan: checkoutType, location })

  const savedPlanId = await ensureSavedPlanForBlueprintCheckout(checkoutContext)

  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      checkoutType,
      ...(savedPlanId ? { planId: savedPlanId } : {}),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Unable to start Stripe checkout')
  }
  if (!data?.url) {
    throw new Error('Stripe checkout URL not returned')
  }

  window.location.assign(data.url)
}
