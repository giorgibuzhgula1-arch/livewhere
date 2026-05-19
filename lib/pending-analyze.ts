import type { AnalyzeRequest } from '@/lib/types'

export const PENDING_ANALYZE_KEY = 'livewhere_pending_analyze'

export function savePendingAnalyze(data: AnalyzeRequest): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PENDING_ANALYZE_KEY, JSON.stringify(data))
}

export function loadPendingAnalyze(): AnalyzeRequest | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(PENDING_ANALYZE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AnalyzeRequest
  } catch {
    return null
  }
}

export function clearPendingAnalyze(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_ANALYZE_KEY)
}
