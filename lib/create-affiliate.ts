import { affiliateReferralUrl, buildReferralCodeFromName } from '@/lib/affiliate'
import { getSiteUrl } from '@/lib/site-url'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type AffiliateRecord = {
  id: string
  name: string
  email: string
  referral_code: string
  commission_rate: number
  total_earnings: number
  total_clicks: number
  total_conversions: number
  status: string
  created_at: string
}

async function uniqueReferralCode(name: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = buildReferralCodeFromName(name)
    const { data } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle()
    if (!data) return code
  }
  return `lw-${Date.now().toString(36)}`
}

export async function getAffiliateByEmail(
  email: string
): Promise<AffiliateRecord | null> {
  const { data } = await supabaseAdmin
    .from('affiliates')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  return data as AffiliateRecord | null
}

export async function createOrGetAffiliate(
  name: string,
  email: string,
  options?: { status?: string }
): Promise<{ affiliate: AffiliateRecord; referralUrl: string; created: boolean }> {
  const normalizedEmail = email.trim().toLowerCase()
  const trimmedName = name.trim()

  const existing = await getAffiliateByEmail(normalizedEmail)
  if (existing) {
    return {
      affiliate: existing,
      referralUrl: affiliateReferralUrl(getSiteUrl(), existing.referral_code),
      created: false,
    }
  }

  const referralCode = await uniqueReferralCode(trimmedName)

  const { data: affiliate, error } = await supabaseAdmin
    .from('affiliates')
    .insert({
      name: trimmedName,
      email: normalizedEmail,
      referral_code: referralCode,
      status: options?.status ?? 'pending',
    })
    .select()
    .single()

  if (error || !affiliate) {
    throw new Error(error?.message || 'Could not create affiliate')
  }

  return {
    affiliate: affiliate as AffiliateRecord,
    referralUrl: affiliateReferralUrl(getSiteUrl(), referralCode),
    created: true,
  }
}

export async function listAffiliates(): Promise<AffiliateRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AffiliateRecord[]
}

export async function activateAffiliate(id: string): Promise<void> {
  await supabaseAdmin.from('affiliates').update({ status: 'active' }).eq('id', id)
}
