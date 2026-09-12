export const ANALYTICS_PRODUCTION_HOST = 'www.livewhere.io'

export function isProductionAnalyticsHost(hostname?: string | null): boolean {
  const host = (hostname ?? '').split(':')[0].toLowerCase()
  return host === ANALYTICS_PRODUCTION_HOST
}

export function browserAnalyticsHost(): string {
  if (typeof window === 'undefined') return ''
  return window.location.hostname
}
