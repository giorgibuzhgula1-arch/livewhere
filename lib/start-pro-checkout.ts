import { supabase } from '@/lib/supabase'

export async function startProCheckout(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Sign in required')
  }

  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ userId: user.id, email: user.email, checkoutType: 'pro' }),
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
