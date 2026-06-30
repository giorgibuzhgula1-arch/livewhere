import { supabase } from '@/lib/supabase'

/** `lifetime` = Blueprint Lifetime in product copy. */
export type UserPlan = 'free' | 'pro' | 'lifetime'

export type UserProfile = {
  plan: UserPlan
  monitorUntil: string | null
  monitorActive: boolean
  stripeMonitorSubscriptionId: string | null
}

export const PAID_RESULT_COUNT = 12
export const BLUEPRINT_RESULT_COUNT = 25
export const FREE_RESULT_COUNT = 12
export const FREE_UNLOCKED_COUNT = 3
export const FREE_DETAILED_COUNT = 3
export const FREE_SEARCHES_PER_DAY = 10
/** Anonymous (no account) searches allowed per client IP per UTC calendar month. */
export const FREE_ANONYMOUS_SEARCHES_PER_MONTH = 10
export const FREE_SAVED_PLANS_LIMIT = 1

export function isProPlan(plan: UserPlan | string | null | undefined): boolean {
  return plan === 'pro'
}

export function isBlueprintPlan(plan: UserPlan | string | null | undefined): boolean {
  return plan === 'lifetime'
}

/** Pro or Blueprint — paid city access, compare, unlimited saves, etc. */
export function isPaidPlan(plan: UserPlan | string | null | undefined): boolean {
  return plan === 'pro' || plan === 'lifetime'
}

export function hasMonitorAccess(profile: UserProfile): boolean {
  if (profile.monitorActive) return true
  if (profile.monitorUntil) {
    return new Date(profile.monitorUntil).getTime() > Date.now()
  }
  return false
}

export function savedPlansLimit(plan: UserPlan): number | null {
  return isPaidPlan(plan) ? null : FREE_SAVED_PLANS_LIMIT
}

export function resultCountForPlan(plan: UserPlan | string | null | undefined): number {
  if (isBlueprintPlan(plan)) return BLUEPRINT_RESULT_COUNT
  if (isPaidPlan(plan)) return PAID_RESULT_COUNT
  return FREE_RESULT_COUNT
}

export function isCardUnlocked(
  plan: UserPlan | string | null | undefined,
  index: number,
): boolean {
  return isPaidPlan(plan) || index < FREE_UNLOCKED_COUNT
}

function normalizePlan(raw: string | null | undefined): UserPlan {
  if (raw === 'pro' || raw === 'lifetime') return raw
  return 'free'
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      plan: 'free',
      monitorUntil: null,
      monitorActive: false,
      stripeMonitorSubscriptionId: null,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, monitor_until, monitor_active, stripe_monitor_subscription_id')
    .eq('id', user.id)
    .single()

  return {
    plan: normalizePlan(profile?.plan),
    monitorUntil: profile?.monitor_until ?? null,
    monitorActive: profile?.monitor_active ?? false,
    stripeMonitorSubscriptionId: profile?.stripe_monitor_subscription_id ?? null,
  }
}

/** @deprecated Prefer fetchUserProfile() */
export async function fetchUserPlan(): Promise<UserPlan> {
  const profile = await fetchUserProfile()
  return profile.plan
}
