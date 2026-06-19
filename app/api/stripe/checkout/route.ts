import { NextRequest, NextResponse } from 'next/server'
import { REF_COOKIE_NAME, normalizeReferralCode } from '@/lib/affiliate'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    let payload: { userId?: string; email?: string; checkoutType?: 'pro' | 'report' }
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { userId, email, checkoutType = 'pro' } = payload

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be signed in to complete this purchase.' },
        { status: 400 }
      )
    }

    if (checkoutType === 'pro' && !email) {
      return NextResponse.json({ error: 'Missing userId or email for pro checkout' }, { status: 400 })
    }

    const appUrl = getAppUrl()
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID?.trim()

    if (!appUrl) {
      return NextResponse.json(
        {
          error:
            'App URL is not configured. Set one of NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_VERCEL_URL, VERCEL_PROJECT_PRODUCTION_URL, or VERCEL_URL',
        },
        { status: 500 }
      )
    }

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured: STRIPE_SECRET_KEY is missing.' },
        { status: 500 }
      )
    }

    if (checkoutType === 'pro' && !proPriceId) {
      return NextResponse.json(
        { error: 'Stripe env vars are not configured. Required: STRIPE_PRO_PRICE_ID' },
        { status: 500 }
      )
    }

    // Resolve the checkout mode from the actual Stripe price. The Pro plan is
    // meant to be a recurring subscription, but if STRIPE_PRO_PRICE_ID points at
    // a one-time price, Stripe rejects `mode: 'subscription'`. Inspect the price
    // and pick the matching mode so a mis-typed price still produces a working
    // checkout (and surface a clear error if the price doesn't exist).
    let mode: 'subscription' | 'payment' = checkoutType === 'report' ? 'payment' : 'subscription'

    if (checkoutType === 'pro' && proPriceId) {
      let price: import('stripe').Stripe.Price
      try {
        price = await stripe.prices.retrieve(proPriceId)
      } catch (err) {
        const e = err as { code?: string; statusCode?: number }
        if (e?.code === 'resource_missing' || e?.statusCode === 404) {
          const keyMode = secretKey.startsWith('sk_live_')
            ? 'live'
            : secretKey.startsWith('sk_test_')
              ? 'test'
              : 'unknown'
          return NextResponse.json(
            {
              error: `Stripe price "${proPriceId}" was not found for the configured API key (${keyMode} mode). Ensure STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID are from the SAME Stripe mode (both live or both test).`,
            },
            { status: 500 }
          )
        }
        throw err
      }

      if (!price.active) {
        return NextResponse.json(
          { error: `Stripe price "${proPriceId}" is archived/inactive. Use an active recurring price for the Pro plan.` },
          { status: 500 }
        )
      }

      mode = price.recurring ? 'subscription' : 'payment'
    }

    let customerId: string | null = null

    if (userId && email) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id
      } else {
        const customer = await stripe.customers.create({ email, metadata: { userId } })
        customerId = customer.id
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId)
      }
    }

    const lineItems =
      checkoutType === 'report'
        ? [{ price: 'price_1TjciyD753169kynku8SCht0', quantity: 1 }]
        : [{ price: proPriceId!, quantity: 1 }]

    const refRaw = req.cookies.get(REF_COOKIE_NAME)?.value
    const refCode = refRaw ? normalizeReferralCode(refRaw) : ''
    const sessionMetadata: Record<string, string> = {
      userId: userId ?? '',
      checkoutType,
    }
    if (refCode) {
      sessionMetadata.ref_code = refCode
    }

    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : {}),
      ...(!customerId && email ? { customer_email: email } : {}),
      mode,
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${appUrl}/?upgraded=true`,
      cancel_url: `${appUrl}/`,
      metadata: sessionMetadata,
      ...(checkoutType === 'report'
        ? { discounts: [{ coupon: 'ddUocJ8X' }] }
        : {}),
      ...(refCode
        ? {
            payment_intent_data: {
              metadata: { ref_code: refCode, checkoutType },
            },
            ...(mode === 'subscription'
              ? {
                  subscription_data: {
                    metadata: { ref_code: refCode, checkoutType },
                  },
                }
              : {}),
          }
        : {}),
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const err = error as {
      message?: string
      type?: string
      code?: string
      statusCode?: number
      param?: string
      raw?: { message?: string }
    }
    const detail = err?.message || err?.raw?.message || 'Unknown error'

    console.error('Stripe checkout session error:', {
      message: detail,
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
      param: err?.param,
    })
    console.error('Stripe checkout full error:', error)

    return NextResponse.json(
      { error: `Failed to create Stripe checkout session: ${detail}` },
      { status: 500 }
    )
  }
}
