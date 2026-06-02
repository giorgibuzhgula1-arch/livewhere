import { normalizeReferralCode } from '@/lib/affiliate'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type AffiliateConversionInput = {
  referralCode: string
  stripePaymentIntentId: string
  amount: number
  planType?: string | null
}

/** Idempotent affiliate conversion — returns true when a new row was created. */
export async function recordAffiliateConversion(
  input: AffiliateConversionInput
): Promise<boolean> {
  const referralCode = normalizeReferralCode(input.referralCode)
  if (!referralCode || input.amount <= 0 || !input.stripePaymentIntentId) {
    return false
  }

  const { data: existing } = await supabaseAdmin
    .from('referral_conversions')
    .select('id')
    .eq('stripe_payment_intent_id', input.stripePaymentIntentId)
    .maybeSingle()

  if (existing) return false

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('id, commission_rate, total_earnings, total_conversions')
    .eq('referral_code', referralCode)
    .maybeSingle()

  if (!affiliate) return false

  const rate = Number(affiliate.commission_rate ?? 0.4)
  const commissionAmount = Math.round(input.amount * rate * 100) / 100

  const { error: insertError } = await supabaseAdmin
    .from('referral_conversions')
    .insert({
      referral_code: referralCode,
      stripe_payment_intent_id: input.stripePaymentIntentId,
      amount: input.amount,
      commission_amount: commissionAmount,
      plan_type: input.planType ?? null,
      status: 'pending',
    })

  if (insertError) {
    console.error('referral_conversions insert failed:', insertError)
    return false
  }

  await supabaseAdmin
    .from('affiliates')
    .update({
      total_earnings: Number(affiliate.total_earnings ?? 0) + commissionAmount,
      total_conversions: (affiliate.total_conversions ?? 0) + 1,
    })
    .eq('id', affiliate.id)

  return true
}

export function referralCodeFromStripeMetadata(
  metadata: Record<string, string> | null | undefined
): string | null {
  if (!metadata) return null
  const raw = metadata.ref_code || metadata.ref
  if (!raw || typeof raw !== 'string') return null
  const code = normalizeReferralCode(raw)
  return code || null
}

export function conversionFromCheckoutSession(session: {
  id: string
  metadata: Record<string, string> | null
  amount_total: number | null
  payment_intent: string | { id: string } | null
}): AffiliateConversionInput | null {
  const referralCode = referralCodeFromStripeMetadata(session.metadata)
  if (!referralCode) return null

  const amount = (session.amount_total ?? 0) / 100
  if (amount <= 0) return null

  const pi = session.payment_intent
  const stripePaymentIntentId =
    typeof pi === 'string' ? pi : pi && typeof pi === 'object' && 'id' in pi ? pi.id : `cs_${session.id}`

  const planType = session.metadata?.checkoutType ?? session.metadata?.plan_type ?? null

  return { referralCode, stripePaymentIntentId, amount, planType }
}
