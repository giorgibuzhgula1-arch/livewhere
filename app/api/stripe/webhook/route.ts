import { NextRequest, NextResponse } from 'next/server'
import {
  conversionFromCheckoutSession,
  recordAffiliateConversion,
} from '@/lib/record-affiliate-conversion'
import { stripe } from '@/lib/stripe'
import {
  BLUEPRINT_MONITOR_TRIAL_DAYS,
  STRIPE_PRICE_MONITOR_MONTHLY,
  type CheckoutType,
} from '@/lib/stripe-prices'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'

async function grantMonitorSubscription(
  customerId: string,
  userId: string,
  trialDays?: number,
): Promise<string | null> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: STRIPE_PRICE_MONITOR_MONTHLY }],
      ...(trialDays ? { trial_period_days: trialDays } : {}),
      metadata: { userId, checkoutType: trialDays ? 'blueprint_bundle' : 'monitor' },
    })
    return subscription.id
  } catch (err) {
    console.error('[webhook] Failed to create monitor subscription:', err)
    return null
  }
}

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
    const checkoutType = session.metadata?.checkoutType as CheckoutType | undefined

    const affiliateInput = conversionFromCheckoutSession({
      id: session.id,
      metadata: session.metadata ?? null,
      amount_total: session.amount_total,
      payment_intent: session.payment_intent,
    })
    if (affiliateInput) {
      await recordAffiliateConversion(affiliateInput)
    }

    if (!userId) {
      return NextResponse.json({ received: true })
    }

    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null

    if (checkoutType === 'monitor') {
      const subId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null

      await supabaseAdmin
        .from('profiles')
        .update({
          monitor_active: true,
          ...(subId ? { stripe_monitor_subscription_id: subId } : {}),
        })
        .eq('id', userId)
    } else if (checkoutType === 'blueprint' || checkoutType === 'blueprint_upgrade') {
      let monitorSubId: string | null = null
      if (customerId) {
        monitorSubId = await grantMonitorSubscription(
          customerId,
          userId,
          BLUEPRINT_MONITOR_TRIAL_DAYS,
        )
      }

      const monitorUntil = new Date()
      monitorUntil.setDate(monitorUntil.getDate() + BLUEPRINT_MONITOR_TRIAL_DAYS)

      await supabaseAdmin
        .from('profiles')
        .update({
          plan: 'lifetime',
          monitor_active: true,
          monitor_until: monitorUntil.toISOString(),
          ...(monitorSubId ? { stripe_monitor_subscription_id: monitorSubId } : {}),
        })
        .eq('id', userId)

      const planId = session.metadata?.plan_id
      if (planId) {
        const { data: savedPlan, error: planError } = await supabaseAdmin
          .from('saved_retirement_plans')
          .select('id, user_id, name, quiz_input, city_results, max_cities, created_at')
          .eq('id', planId)
          .eq('user_id', userId)
          .maybeSingle()

        if (planError) {
          console.error('[webhook] Failed to fetch saved plan for Blueprint checkout:', planError)
        } else if (savedPlan) {
          console.log('[webhook] Blueprint checkout saved plan retrieved:', {
            planId: savedPlan.id,
            userId: savedPlan.user_id,
            planName: savedPlan.name,
            cityCount: Array.isArray(savedPlan.city_results) ? savedPlan.city_results.length : 0,
            monthlyBudget: (savedPlan.quiz_input as { monthlyBudget?: number })?.monthlyBudget,
            createdAt: savedPlan.created_at,
          })
        } else {
          console.warn('[webhook] Blueprint checkout plan_id not found for user:', { planId, userId })
        }
      } else {
        console.warn('[webhook] Blueprint checkout completed without plan_id metadata:', { userId })
      }
    } else if (checkoutType === 'pro') {
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('id', userId)
    }
  }

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.created'
  ) {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.userId
    const isMonitor = sub.metadata?.checkoutType === 'monitor' || sub.metadata?.checkoutType === 'blueprint_bundle'

    if (userId && isMonitor && (sub.status === 'active' || sub.status === 'trialing')) {
      await supabaseAdmin
        .from('profiles')
        .update({
          monitor_active: true,
          stripe_monitor_subscription_id: sub.id,
        })
        .eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const isMonitor =
      sub.metadata?.checkoutType === 'monitor' || sub.metadata?.checkoutType === 'blueprint_bundle'

    if (isMonitor) {
      await supabaseAdmin
        .from('profiles')
        .update({
          monitor_active: false,
          stripe_monitor_subscription_id: null,
        })
        .eq('stripe_monitor_subscription_id', sub.id)
    } else {
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free' })
        .eq('stripe_subscription_id', sub.id)
    }
  }

  return NextResponse.json({ received: true })
}
