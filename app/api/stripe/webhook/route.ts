import { waitUntil } from '@vercel/functions'
import { NextRequest, NextResponse } from 'next/server'
import {
  conversionFromCheckoutSession,
  recordAffiliateConversion,
} from '@/lib/record-affiliate-conversion'
import { generateRetirementReportPdf } from '@/lib/retirement-report-core'
import { stripe } from '@/lib/stripe'
import {
  BLUEPRINT_MONITOR_TRIAL_DAYS,
  STRIPE_PRICE_MONITOR_MONTHLY,
  type CheckoutType,
} from '@/lib/stripe-prices'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { AnalyzeRequest, CityResult } from '@/lib/types'
import Stripe from 'stripe'

// jsPDF + Stripe require Node.js — do not switch to Edge runtime.
export const runtime = 'nodejs'

// Background work (PDF, Supabase, Stripe API) runs via waitUntil after 200 is returned.
export const maxDuration = 60

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

async function processStripeEvent(event: Stripe.Event): Promise<void> {
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
      return
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

          const quizInput = savedPlan.quiz_input as AnalyzeRequest
          const cityResults = (savedPlan.city_results as CityResult[]) ?? []
          const exportCities = cityResults.filter((city) => !city.locked)
          const budget =
            typeof quizInput?.monthlyBudget === 'number' && quizInput.monthlyBudget > 0
              ? quizInput.monthlyBudget
              : 0

          let downloadUrl: string | null = null

          try {
            const pdf = generateRetirementReportPdf(exportCities, budget, { lifetime: true })
            console.log('[webhook] Blueprint retirement PDF generated:', {
              planId: savedPlan.id,
              byteLength: pdf.byteLength,
              exportCityCount: exportCities.length,
            })

            const filePath = `${savedPlan.user_id}/${savedPlan.id}/blueprint-report.pdf`
            const { error: uploadError } = await supabaseAdmin.storage
              .from('blueprint-reports')
              .upload(filePath, pdf, {
                contentType: 'application/pdf',
                upsert: true,
              })

            if (uploadError) {
              console.error('[webhook] Blueprint PDF upload failed:', uploadError)
            } else {
              console.log('[webhook] Blueprint PDF uploaded:', filePath)

              const { data: signedData, error: signedUrlError } = await supabaseAdmin.storage
                .from('blueprint-reports')
                .createSignedUrl(filePath, 60 * 60 * 24 * 7)

              if (signedUrlError) {
                console.error('[webhook] Signed URL creation failed:', signedUrlError)
              } else {
                downloadUrl = signedData.signedUrl
                console.log('[webhook] Blueprint PDF signed URL created:', {
                  planId: savedPlan.id,
                  hasUrl: !!downloadUrl,
                })
              }
            }
          } catch (pdfError) {
            console.error('[webhook] Blueprint retirement PDF generation failed:', pdfError)
          }
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
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  waitUntil(
    processStripeEvent(event).catch((err) => {
      console.error('[webhook] Background processing failed:', err)
    }),
  )

  return NextResponse.json({ received: true }, { status: 200 })
}
