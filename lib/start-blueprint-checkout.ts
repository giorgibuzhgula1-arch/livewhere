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

  try {
    console.error('[blueprint-checkout] step: start', {
      checkoutType,
      location,
      hasCheckoutContext: Boolean(checkoutContext),
      contextCityCount: checkoutContext?.cities?.length ?? 0,
    })

    const { data: { user } } = await supabase.auth.getUser()
    console.error('[blueprint-checkout] step: after getUser', {
      hasUser: Boolean(user),
      userId: user?.id ?? null,
    })

    if (!user) {
      throw new Error('Sign in required')
    }

    trackCheckoutStarted({ plan: checkoutType, location })

    console.error('[blueprint-checkout] step: before auto-save')
    const savedPlanId = await ensureSavedPlanForBlueprintCheckout(checkoutContext)
    console.error('[blueprint-checkout] step: after auto-save success', {
      savedPlanId,
    })

    const { data: { session } } = await supabase.auth.getSession()
    console.error('[blueprint-checkout] step: after getSession', {
      hasSession: Boolean(session),
      hasAccessToken: Boolean(session?.access_token),
    })

    console.error('[blueprint-checkout] step: before checkout fetch', {
      checkoutType,
      savedPlanId,
    })
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

    console.error('[blueprint-checkout] step: after checkout fetch', {
      ok: res.ok,
      status: res.status,
    })

    const data = await res.json()
    console.error('[blueprint-checkout] step: after checkout json', {
      hasUrl: Boolean(data?.url),
      error: data?.error ?? null,
    })

    if (!res.ok) {
      throw new Error(data?.error || 'Unable to start Stripe checkout')
    }
    if (!data?.url) {
      throw new Error('Stripe checkout URL not returned')
    }

    console.error('[blueprint-checkout] step: redirecting', { url: data.url })
    window.location.assign(data.url)
  } catch (err) {
    console.error('[blueprint-checkout] step: catch', err)
    throw err
  }
}
