import type { UserPriorities } from '@/lib/types'

function clampPriority(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 3
  return Math.max(1, Math.min(5, Math.round(n)))
}

/** Coerce request priorities to numeric 1–5 (avoids string "4" edge cases). */
export function normalizePriorities(raw: UserPriorities): UserPriorities {
  return {
    tax: clampPriority(raw.tax),
    housing: clampPriority(raw.housing),
    climate: clampPriority(raw.climate),
    health: clampPriority(raw.health),
    nightlife: clampPriority(raw.nightlife),
    safety: clampPriority(raw.safety),
  }
}

export function isPriorityHigh(value: number): boolean {
  return value >= 4
}
