import { supabase } from '@/lib/supabase'
import type { AnalyzeRequest, CityResult } from '@/lib/types'
import { fetchUserPlan, isPaidPlan, FREE_SAVED_PLANS_LIMIT, type UserPlan } from '@/lib/plan'

export { FREE_SAVED_PLANS_LIMIT }

export type SavedRetirementPlan = {
  id: string
  user_id: string
  name: string
  quiz_input: AnalyzeRequest
  city_results: CityResult[]
  max_cities: number | null
  ai_summary: string | null
  created_at: string
  updated_at: string
}

export function savedPlansLimit(plan: UserPlan): number | null {
  return isPaidPlan(plan) ? null : FREE_SAVED_PLANS_LIMIT
}

export function canSaveMorePlan(plan: UserPlan, currentCount: number): boolean {
  const limit = savedPlansLimit(plan)
  if (limit == null) return true
  return currentCount < limit
}

export async function requireLoggedInUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Sign in required')
  }
  return user
}

export async function fetchSavedPlans(): Promise<SavedRetirementPlan[]> {
  const user = await requireLoggedInUser()

  const { data, error } = await supabase
    .from('saved_retirement_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as SavedRetirementPlan[]
}

export async function fetchSavedPlanById(id: string): Promise<SavedRetirementPlan | null> {
  const user = await requireLoggedInUser()

  const { data, error } = await supabase
    .from('saved_retirement_plans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as SavedRetirementPlan | null) ?? null
}

export async function countSavedPlans(): Promise<number> {
  const user = await requireLoggedInUser()

  const { count, error } = await supabase
    .from('saved_retirement_plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function saveRetirementPlan(params: {
  name: string
  quizInput: AnalyzeRequest
  cityResults: CityResult[]
  maxCities?: number | null
}): Promise<SavedRetirementPlan> {
  const user = await requireLoggedInUser()
  const plan = await fetchUserPlan()
  const count = await countSavedPlans()

  if (!canSaveMorePlan(plan, count)) {
    throw new Error(
      `Free accounts can save up to ${FREE_SAVED_PLANS_LIMIT} plan. Upgrade to Pro for unlimited saves.`,
    )
  }

  const trimmedName = params.name.trim()
  if (!trimmedName) throw new Error('Plan name is required')

  const { data, error } = await supabase
    .from('saved_retirement_plans')
    .insert({
      user_id: user.id,
      name: trimmedName,
      quiz_input: params.quizInput,
      city_results: params.cityResults,
      max_cities: params.maxCities ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  const saved = data as SavedRetirementPlan
  void ensurePlanSummary(saved)
  return saved
}

async function authFetchHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }
  return headers
}

/** Generate and persist AI summary for a saved plan (no-op if summary exists). */
export async function ensurePlanSummary(plan: SavedRetirementPlan): Promise<string | null> {
  if (plan.ai_summary?.trim()) return plan.ai_summary

  const headers = await authFetchHeaders()
  if (!headers.Authorization) return null

  const res = await fetch('/api/plan-summary', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      planId: plan.id,
      planName: plan.name,
      quizInput: plan.quiz_input,
      cityResults: plan.city_results,
    }),
  })

  if (!res.ok) return null

  const json = (await res.json()) as { summary?: string }
  return json.summary?.trim() ?? null
}

export async function deleteSavedPlan(id: string): Promise<void> {
  const user = await requireLoggedInUser()

  const { error } = await supabase
    .from('saved_retirement_plans')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}

export function defaultPlanName(existingCount: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const letter = letters[existingCount % letters.length] ?? 'A'
  return `Plan ${letter}`
}

export function formatPlanDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
