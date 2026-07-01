import posthog from 'posthog-js'

/** PostHog funnel events — names align with GA events in lib/analytics.ts */
export const POSTHOG_EVENTS = {
  QUIZ_START: 'quiz_start',
  QUIZ_STEP_COMPLETED: 'quiz_step_completed',
  QUIZ_COMPLETE: 'quiz_complete',
  VIEW_RESULTS: 'view_results',
  SIGNUP_START: 'signup_start',
  SIGNUP_COMPLETE: 'signup_complete',
  CHECKOUT_START: 'checkout_start',
  PURCHASE_COMPLETE: 'purchase_complete',
} as const

export type PostHogEventName = (typeof POSTHOG_EVENTS)[keyof typeof POSTHOG_EVENTS]

export function capturePostHogEvent(
  event: PostHogEventName,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  posthog.capture(event, properties)
}
