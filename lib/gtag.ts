import { browserAnalyticsHost, isProductionAnalyticsHost } from '@/lib/analytics-host'

type GtagFn = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: GtagFn
    dataLayer?: unknown[]
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

function analyticsAllowed(): boolean {
  return Boolean(GA_MEASUREMENT_ID) && isProductionAnalyticsHost(browserAnalyticsHost())
}

export function gtag(...args: unknown[]) {
  if (typeof window === 'undefined' || !analyticsAllowed()) return
  window.gtag?.(...args)
}

export function isGtagReady(): boolean {
  if (typeof window === 'undefined') return false
  if (!analyticsAllowed()) return true
  return typeof window.gtag === 'function'
}

export function pageview(url: string) {
  if (!analyticsAllowed()) return
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

export function gaEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
): boolean {
  const cleaned = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined),
      )
    : undefined
  if (typeof window === 'undefined') return false
  if (!analyticsAllowed()) return true
  if (typeof window.gtag !== 'function') return false
  window.gtag('event', eventName, cleaned)
  return true
}

/** @deprecated Use analytics helpers instead */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  gaEvent(eventName, params)
}

export function trackSignUp(method: 'email' | 'google' = 'email') {
  gaEvent('sign_up', { method })
}
