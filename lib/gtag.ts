type GtagFn = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: GtagFn
    dataLayer?: unknown[]
  }
}

export const GA_MEASUREMENT_ID = 'G-8BKJ3L5SQB'

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return
  window.gtag?.(...args)
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const cleaned = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined),
      )
    : undefined
  gtag('event', eventName, cleaned)
}

export function trackCtaClick(location = 'hero') {
  trackEvent('cta_click', { location })
}

export function trackSignUp(method: 'email' | 'google' = 'email') {
  trackEvent('sign_up', { method })
}

export function trackFunnelStep(step: number) {
  trackEvent(`funnel_step_${step}`)
}
