import type { CityResult } from '@/lib/types'

export const PENDING_RESULTS_KEY = 'livewhere_pending_results'

type PendingResultsPayload = {
  cities: CityResult[]
  maxCities: number | null
}

export function savePendingResults(cities: CityResult[], maxCities: number | null): void {
  if (typeof window === 'undefined') return
  const payload: PendingResultsPayload = { cities, maxCities }
  sessionStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(payload))
}

export function loadPendingResults(): PendingResultsPayload | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(PENDING_RESULTS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PendingResultsPayload
  } catch {
    return null
  }
}

export function clearPendingResults(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_RESULTS_KEY)
}
