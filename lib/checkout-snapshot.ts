import type { AnalyzeRequest, CityResult } from '@/lib/types'

export const CHECKOUT_SNAPSHOT_KEY = 'livewhere_checkout_snapshot'

export type CheckoutSnapshot = {
  quizInput: AnalyzeRequest
  cities: CityResult[]
  maxCities?: number | null
}

function read(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(CHECKOUT_SNAPSHOT_KEY)
}

export function saveCheckoutSnapshot(snapshot: CheckoutSnapshot): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CHECKOUT_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function loadCheckoutSnapshot(): CheckoutSnapshot | null {
  const raw = read()
  if (!raw) return null
  try {
    return JSON.parse(raw) as CheckoutSnapshot
  } catch {
    return null
  }
}

export function clearCheckoutSnapshot(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(CHECKOUT_SNAPSHOT_KEY)
}
