type GtagFn = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: GtagFn
    dataLayer?: unknown[]
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

export function gtag(...args: unknown[]) {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return
  window.gtag?.(...args)
}

export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID) return
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

export function gaEvent(
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
