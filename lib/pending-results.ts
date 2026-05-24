import type { CityResult } from '@/lib/types'

export const PENDING_RESULTS_KEY = 'livewhere_pending_results'

type PendingResultsPayload = {
  cities: CityResult[]
  maxCities: number | null
}

function read(key: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

function write(key: string, value: string): void {
  localStorage.setItem(key, value)
  sessionStorage.setItem(key, value)
}

function remove(key: string): void {
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

export function savePendingResults(cities: CityResult[], maxCities: number | null): void {
  if (typeof window === 'undefined') return
  const payload: PendingResultsPayload = { cities, maxCities }
  write(PENDING_RESULTS_KEY, JSON.stringify(payload))
}

export function loadPendingResults(): PendingResultsPayload | null {
  const raw = read(PENDING_RESULTS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PendingResultsPayload
  } catch {
    return null
  }
}

export function clearPendingResults(): void {
  if (typeof window === 'undefined') return
  remove(PENDING_RESULTS_KEY)
}

export function hasPendingResults(): boolean {
  return Boolean(loadPendingResults()?.cities.length)
}
