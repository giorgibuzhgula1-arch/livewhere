import { supabase } from '@/lib/supabase'

export type UserPlan = 'free' | 'pro' | 'lifetime'

export const FREE_RESULT_COUNT = 3
export const PAID_RESULT_COUNT = 12

export function isPaidPlan(plan: UserPlan | string | null | undefined): boolean {
  return plan === 'pro' || plan === 'lifetime'
}

export function resultCountForPlan(plan: UserPlan | string | null | undefined): number {
  return isPaidPlan(plan) ? PAID_RESULT_COUNT : FREE_RESULT_COUNT
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
