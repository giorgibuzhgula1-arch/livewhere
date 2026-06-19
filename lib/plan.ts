import { supabase } from '@/lib/supabase'

export type UserPlan = 'free' | 'pro' | 'lifetime'

export const PAID_RESULT_COUNT = 12
/** Free users now receive the full set of cities, but only the first is fully unlocked. */
export const FREE_RESULT_COUNT = 12
/** How many cities a free user can see in full detail (the rest are locked/blurred). */
export const FREE_UNLOCKED_COUNT = 3
/**
 * How many fully-detailed cities the AI actually generates for a free search.
 * Free users only ever see ONE city in full, so generating all 12 rich objects
 * was pure waste and the main cause of slow (~1 min) analyses. We generate a
 * small detailed set and pad the locked grid with teasers instead.
 */
export const FREE_DETAILED_COUNT = 3

export function isPaidPlan(plan: UserPlan | string | null | undefined): boolean {
  return plan === 'pro' || plan === 'lifetime'
}

export function resultCountForPlan(plan: UserPlan | string | null | undefined): number {
  return isPaidPlan(plan) ? PAID_RESULT_COUNT : FREE_RESULT_COUNT
}

/** Whether a given card index should be shown in full for this plan. */
export function isCardUnlocked(
  plan: UserPlan | string | null | undefined,
  index: number
): boolean {
  return isPaidPlan(plan) || index < FREE_UNLOCKED_COUNT
}

export async function fetchUserPlan(): Promise<UserPlan> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'free'

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan
  if (plan === 'pro' || plan === 'lifetime') return plan
  return 'free'
}
