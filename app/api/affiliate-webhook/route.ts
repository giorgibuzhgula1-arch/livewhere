import { NextRequest, NextResponse } from 'next/server'
import { normalizeReferralCode } from '@/lib/affiliate'
import {
  conversionFromCheckoutSession,
  recordAffiliateConversion,
  referralCodeFromStripeMetadata,
} from '@/lib/record-affiliate-conversion'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const input = conversionFromCheckoutSession({
      id: session.id,
      metadata: session.metadata ?? null,
      amount_total: session.amount_total,
      payment_intent: session.payment_intent,
    })
    if (input) {
      await recordAffiliateConversion(input)
    }
    return NextResponse.json({ received: true })
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const referralCode = referralCodeFromStripeMetadata(paymentIntent.metadata)
    if (!referralCode) {
      return NextResponse.json({ received: true })
    }

    const amount = paymentIntent.amount / 100
    const planType =
      paymentIntent.metadata?.checkoutType ||
      paymentIntent.metadata?.plan_type ||
      null

    await recordAffiliateConversion({
      referralCode: normalizeReferralCode(referralCode),
      stripePaymentIntentId: paymentIntent.id,
      amount,
      planType,
    })
  }

  return NextResponse.json({ received: true })
}
