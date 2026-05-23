import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const checkoutType = session.metadata?.checkoutType
    if (userId && session.mode === 'subscription' && checkoutType !== 'report') {
      await supabaseAdmin
        .from('profiles')
        .update({
          plan: 'pro',
          stripe_subscription_id: session.subscription as string,
        })
        .eq('id', userId)
    }

    if (userId && session.mode === 'payment' && checkoutType === 'report') {
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'lifetime' })
        .eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabaseAdmin
      .from('profiles')
      .update({ plan: 'free' })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
