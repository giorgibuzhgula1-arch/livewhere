import { supabase } from '@/lib/supabase'
import { trackCheckoutStarted } from '@/lib/analytics'

export async function startBlueprintUpgradeCheckout(location = 'monitor_tab'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Sign in required')
  }

  trackCheckoutStarted({ plan: 'blueprint_upgrade', location })

  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ userId: user.id, email: user.email, checkoutType: 'blueprint_upgrade' }),
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
