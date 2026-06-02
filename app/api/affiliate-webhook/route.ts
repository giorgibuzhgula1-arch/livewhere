import { NextRequest, NextResponse } from 'next/server'
import { normalizeReferralCode } from '@/lib/affiliate'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
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

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true })
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const rawRef =
    paymentIntent.metadata?.ref_code || paymentIntent.metadata?.ref || null
  if (!rawRef) {
    return NextResponse.json({ received: true })
  }

  const referralCode = normalizeReferralCode(rawRef)
  if (!referralCode) {
    return NextResponse.json({ received: true })
  }

  const { data: existing } = await supabaseAdmin
    .from('referral_conversions')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true })
  }

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('id, commission_rate, total_earnings, total_conversions')
    .eq('referral_code', referralCode)
    .maybeSingle()

  if (!affiliate) {
    return NextResponse.json({ received: true })
  }

  const amount = paymentIntent.amount / 100
  const rate = Number(affiliate.commission_rate ?? 0.4)
  const commissionAmount = Math.round(amount * rate * 100) / 100
  const planType =
    paymentIntent.metadata?.checkoutType ||
    paymentIntent.metadata?.plan_type ||
    null

  const { error: insertError } = await supabaseAdmin
    .from('referral_conversions')
    .insert({
      referral_code: referralCode,
      stripe_payment_intent_id: paymentIntent.id,
      amount,
      commission_amount: commissionAmount,
      plan_type: planType,
      status: 'pending',
    })

  if (insertError) {
    console.error('referral_conversions insert failed:', insertError)
    return NextResponse.json({ error: 'Failed to record conversion' }, { status: 500 })
  }

  const totalEarnings = Number(affiliate.total_earnings ?? 0) + commissionAmount
  const totalConversions = (affiliate.total_conversions ?? 0) + 1

  await supabaseAdmin
    .from('affiliates')
    .update({
      total_earnings: totalEarnings,
      total_conversions: totalConversions,
    })
    .eq('id', affiliate.id)

  return NextResponse.json({ received: true })
}
