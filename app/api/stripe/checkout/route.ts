import { NextRequest, NextResponse } from 'next/server'
import { REF_COOKIE_NAME, normalizeReferralCode } from '@/lib/affiliate'
import { stripe } from '@/lib/stripe'
import {
  BLUEPRINT_UPGRADE_CENTS,
  BLUEPRINT_MONITOR_TRIAL_DAYS,
  STRIPE_PRICE_BLUEPRINT_LIFETIME,
  STRIPE_PRICE_MONITOR_MONTHLY,
  STRIPE_PRICE_PRO_LIFETIME,
  type CheckoutType,
} from '@/lib/stripe-prices'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type Stripe from 'stripe'

function getAppUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL

  if (!configuredUrl) return null
  if (configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')) {
    return configuredUrl
  }
  return `https://${configuredUrl}`
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    if (!rawBody.trim()) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
    }

    let payload: { userId?: string; email?: string; checkoutType?: CheckoutType; planId?: string }
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { userId, email, checkoutType = 'pro', planId } = payload

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be signed in to complete this purchase.' },
        { status: 400 },
      )
    }

    if (!email) {
      return NextResponse.json({ error: 'Missing email for checkout' }, { status: 400 })
    }

    const appUrl = getAppUrl()
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim()

    if (!appUrl) {
      return NextResponse.json(
        {
          error:
            'App URL is not configured. Set NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL.',
        },
        { status: 500 },
      )
    }

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured: STRIPE_SECRET_KEY is missing.' },
        { status: 500 },
      )
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plan, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (checkoutType === 'blueprint_upgrade' && profile?.plan !== 'pro') {
      return NextResponse.json(
        { error: 'Blueprint upgrade is only available for Pro Lifetime members.' },
        { status: 400 },
      )
    }

    if (checkoutType === 'blueprint' && profile?.plan === 'lifetime') {
      return NextResponse.json(
        { error: 'You already have Blueprint Lifetime access.' },
        { status: 400 },
      )
    }

    let customerId = profile?.stripe_customer_id ?? null
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } })
      customerId = customer.id
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    const refRaw = req.cookies.get(REF_COOKIE_NAME)?.value
    const refCode = refRaw ? normalizeReferralCode(refRaw) : ''
    const sessionMetadata: Record<string, string> = {
      userId,
      checkoutType,
    }
    if (refCode) sessionMetadata.ref_code = refCode

    if (
      planId &&
      (checkoutType === 'blueprint' || checkoutType === 'blueprint_upgrade')
    ) {
      const { data: savedPlan } = await supabaseAdmin
        .from('saved_retirement_plans')
        .select('id')
        .eq('id', planId)
        .eq('user_id', userId)
        .maybeSingle()

      if (savedPlan?.id) {
        sessionMetadata.plan_id = savedPlan.id
      }
    }

    let mode: 'subscription' | 'payment' = checkoutType === 'monitor' ? 'subscription' : 'payment'
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    let subscriptionData: { metadata?: Record<string, string>; trial_period_days?: number } | undefined

    switch (checkoutType) {
      case 'pro':
        lineItems = [{ price: STRIPE_PRICE_PRO_LIFETIME, quantity: 1 }]
        break
      case 'blueprint':
        lineItems = [{ price: STRIPE_PRICE_BLUEPRINT_LIFETIME, quantity: 1 }]
        break
      case 'blueprint_upgrade':
        lineItems = [
          {
            price_data: {
              currency: 'usd',
              unit_amount: BLUEPRINT_UPGRADE_CENTS,
              product_data: {
                name: 'Blueprint Lifetime Upgrade',
                description: 'Upgrade from Pro Lifetime — pay only the difference.',
              },
            },
            quantity: 1,
          },
        ]
        break
      case 'monitor':
        lineItems = [{ price: STRIPE_PRICE_MONITOR_MONTHLY, quantity: 1 }]
        subscriptionData = { metadata: { userId, checkoutType: 'monitor' } }
        break
      default:
        return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: lineItems,
      success_url: `${appUrl}/?upgraded=true&session_id={CHECKOUT_SESSION_ID}&plan=${checkoutType}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        ...sessionMetadata,
        ...(checkoutType === 'blueprint'
          ? { includeMonitorTrial: String(BLUEPRINT_MONITOR_TRIAL_DAYS) }
          : {}),
      },
      ...(refCode && mode === 'payment'
        ? {
            payment_intent_data: {
              metadata: {
                ref_code: refCode,
                checkoutType,
                ...(sessionMetadata.plan_id ? { plan_id: sessionMetadata.plan_id } : {}),
              },
            },
          }
        : {}),
      ...(refCode && mode === 'subscription'
        ? {
            subscription_data: {
              ...subscriptionData,
              metadata: { ...subscriptionData?.metadata, ref_code: refCode, checkoutType },
            },
          }
        : subscriptionData
          ? { subscription_data: subscriptionData }
          : {}),
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const err = error as { message?: string; raw?: { message?: string } }
    const detail = err?.message || err?.raw?.message || 'Unknown error'
    console.error('Stripe checkout session error:', error)
    return NextResponse.json(
      { error: `Failed to create Stripe checkout session: ${detail}` },
      { status: 500 },
    )
  }
}
