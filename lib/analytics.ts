import { gaEvent } from '@/lib/gtag'
import { POSTHOG_EVENTS, capturePostHogEvent } from '@/lib/posthog-events'

const SESSION_KEYS = {
  quizStarted: 'ga_quiz_started',
  budgetSelected: 'ga_budget_selected',
  prioritiesCompleted: 'ga_priorities_completed',
  quizCompleted: 'ga_quiz_completed',
  resultsViewed: 'ga_results_viewed',
  pricingViewed: 'ga_pricing_viewed',
  checkoutStarted: 'ga_checkout_started',
} as const

function oncePerSession(key: string): boolean {
  if (typeof window === 'undefined') return false
  if (sessionStorage.getItem(key)) return false
  sessionStorage.setItem(key, '1')
  return true
}

function oncePerTransaction(transactionId: string): boolean {
  if (typeof window === 'undefined') return false
  const key = `ga_purchase_${transactionId}`
  if (localStorage.getItem(key)) return false
  localStorage.setItem(key, '1')
  return true
}

export type PremiumPlan = 'pro' | 'blueprint' | 'blueprint_upgrade' | 'monitor'

const PLAN_VALUES: Record<PremiumPlan, number> = {
  pro: 49,
  blueprint: 149,
  blueprint_upgrade: 100,
  monitor: 9.99,
}

export function trackHeroCtaClick(location = 'hero') {
  gaEvent('select_item', {
    item_list_name: 'hero_cta',
    item_name: location,
  })
}

export function trackQuizStarted() {
  if (!oncePerSession(SESSION_KEYS.quizStarted)) return
  gaEvent('quiz_start')
  capturePostHogEvent(POSTHOG_EVENTS.QUIZ_START)
}

export function trackBudgetSelected(budget: number) {
  if (!oncePerSession(SESSION_KEYS.budgetSelected)) return
  gaEvent('select_item', {
    item_list_name: 'quiz_budget',
    item_name: 'monthly_budget',
    value: budget,
    currency: 'USD',
  })
  capturePostHogEvent(POSTHOG_EVENTS.QUIZ_STEP_COMPLETED, {
    step: 1,
    step_name: 'budget',
    budget,
  })
}

export function trackPrioritiesCompleted() {
  if (!oncePerSession(SESSION_KEYS.prioritiesCompleted)) return
  gaEvent('select_item', {
    item_list_name: 'quiz_priorities',
    item_name: 'priorities_completed',
  })
  capturePostHogEvent(POSTHOG_EVENTS.QUIZ_STEP_COMPLETED, {
    step: 2,
    step_name: 'priorities',
  })
}

export function trackQuizCompleted(params?: { budget?: number; lifestyleCount?: number }) {
  if (!oncePerSession(SESSION_KEYS.quizCompleted)) return
  gaEvent('quiz_complete', {
    value: params?.budget,
    lifestyle_count: params?.lifestyleCount,
  })
  capturePostHogEvent(POSTHOG_EVENTS.QUIZ_COMPLETE, {
    budget: params?.budget,
    lifestyle_count: params?.lifestyleCount,
  })
}

export function trackResultsViewed(params?: { cityCount?: number }) {
  if (!oncePerSession(SESSION_KEYS.resultsViewed)) return
  gaEvent('view_item_list', {
    item_list_name: 'city_results',
    items_shown: params?.cityCount,
  })
  capturePostHogEvent(POSTHOG_EVENTS.VIEW_RESULTS, {
    city_count: params?.cityCount,
  })
}

export function trackPricingViewed() {
  if (!oncePerSession(SESSION_KEYS.pricingViewed)) return
  gaEvent('view_item', {
    item_list_name: 'pricing_plans',
    item_name: 'pricing_page',
  })
}

export function trackPremiumButtonClicked(params: {
  plan: PremiumPlan | string
  location: string
}) {
  gaEvent('select_item', {
    item_list_name: 'premium_cta',
    item_name: params.plan,
    location: params.location,
  })
}

export function trackCheckoutStarted(params: {
  plan: PremiumPlan | string
  location?: string
}) {
  if (!oncePerSession(SESSION_KEYS.checkoutStarted)) return
  const plan = params.plan as PremiumPlan
  const value = PLAN_VALUES[plan] ?? undefined
  gaEvent('begin_checkout', {
    item_list_name: 'pricing_plans',
    item_name: params.plan,
    location: params.location,
    value,
    currency: 'USD',
  })
  capturePostHogEvent(POSTHOG_EVENTS.CHECKOUT_START, {
    plan: params.plan,
    location: params.location,
    value,
    currency: 'USD',
  })
}

export function trackPurchaseCompleted(params: {
  transactionId: string
  plan: PremiumPlan | string
  value?: number
  currency?: string
}) {
  if (!oncePerTransaction(params.transactionId)) return
  const plan = params.plan as PremiumPlan
  const value = params.value ?? PLAN_VALUES[plan] ?? 0
  gaEvent('purchase', {
    transaction_id: params.transactionId,
    value,
    currency: params.currency ?? 'USD',
    item_name: params.plan,
  })
  capturePostHogEvent(POSTHOG_EVENTS.PURCHASE_COMPLETE, {
    transaction_id: params.transactionId,
    plan: params.plan,
    value,
    currency: params.currency ?? 'USD',
  })
}

export function trackSignupStarted(params: {
  method: 'email' | 'google' | 'modal'
  location?: string
}) {
  capturePostHogEvent(POSTHOG_EVENTS.SIGNUP_START, params)
}

export function trackSignupCompleted(method: 'email' | 'google' = 'email') {
  capturePostHogEvent(POSTHOG_EVENTS.SIGNUP_COMPLETE, { method })
}
