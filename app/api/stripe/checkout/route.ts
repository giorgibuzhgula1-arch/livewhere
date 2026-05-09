import { NextRequest, NextResponse } from 'next/server'
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

    if (checkoutType === 'pro' && (!userId || !email)) {
      return NextResponse.json({ error: 'Missing userId or email for pro checkout' }, { status: 400 })
    }

    const appUrl = getAppUrl()
    const priceId =
      checkoutType === 'report' ? process.env.STRIPE_REPORT_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID

    if (!priceId || !appUrl) {
      return NextResponse.json(
        {
          error:
            'Stripe env vars are not configured. Required: STRIPE_PRO_PRICE_ID (for pro) or STRIPE_REPORT_PRICE_ID (for report), and one of NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_VERCEL_URL, VERCEL_PROJECT_PRODUCTION_URL, or VERCEL_URL',
        },
        { status: 500 }
      )
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

    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : {}),
      ...(!customerId && email ? { customer_email: email } : {}),
      mode: checkoutType === 'report' ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?upgraded=true`,
      cancel_url: `${appUrl}/`,
      metadata: { userId: userId ?? '', checkoutType },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout session error:', error)
    return NextResponse.json({ error: 'Failed to create Stripe checkout session' }, { status: 500 })
  }
}
