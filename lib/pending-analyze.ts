import type { AnalyzeRequest } from '@/lib/types'

export const PENDING_ANALYZE_KEY = 'livewhere_pending_analyze'

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

export function savePendingAnalyze(data: AnalyzeRequest): void {
  if (typeof window === 'undefined') return
  write(PENDING_ANALYZE_KEY, JSON.stringify(data))
}

export function loadPendingAnalyze(): AnalyzeRequest | null {
  const raw = read(PENDING_ANALYZE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AnalyzeRequest
  } catch {
    return null
  }
}

export function clearPendingAnalyze(): void {
  if (typeof window === 'undefined') return
  remove(PENDING_ANALYZE_KEY)
}

export function hasPendingAnalyze(): boolean {
  return loadPendingAnalyze() !== null
}
