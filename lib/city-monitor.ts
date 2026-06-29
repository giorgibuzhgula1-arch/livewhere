import { supabase } from '@/lib/supabase'

export type MonitorSnapshot = {
  taxes: number
  visa: number
  healthcare: number
  cost_of_living: number
}

export type MonitorChanges = {
  summary: string
  deltas: Partial<Record<keyof MonitorSnapshot, { old: number; new: number }>>
}

export type CityMonitor = {
  id: string
  user_id: string
  city_id: string
  city_name: string
  snapshot: MonitorSnapshot
  changes: MonitorChanges | null
  checked_at: string
  created_at: string
}

export async function requireLoggedInUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sign in required')
  return user
}

/** Alert feed — rows where changes were detected. */
export async function fetchMonitorAlerts(): Promise<CityMonitor[]> {
  const user = await requireLoggedInUser()

  const { data, error } = await supabase
    .from('city_monitors')
    .select('*')
    .eq('user_id', user.id)
    .not('changes', 'is', null)
    .order('checked_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data ?? []) as CityMonitor[]
}

/** Cities currently being monitored (latest snapshot per city). */
export async function fetchMonitoredCities(): Promise<CityMonitor[]> {
  const user = await requireLoggedInUser()

  const { data, error } = await supabase
    .from('city_monitors')
    .select('*')
    .eq('user_id', user.id)
    .order('checked_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as CityMonitor[]
  const latestByCity = new Map<string, CityMonitor>()
  for (const row of rows) {
    if (!latestByCity.has(row.city_id)) {
      latestByCity.set(row.city_id, row)
    }
  }
  return Array.from(latestByCity.values())
}

export function formatMonitorDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function describeDelta(field: keyof MonitorSnapshot, oldVal: number, newVal: number): string {
  const labels: Record<keyof MonitorSnapshot, string> = {
    taxes: 'Tax rate',
    visa: 'Visa access score',
    healthcare: 'Healthcare score',
    cost_of_living: 'Cost of living',
  }
  const label = labels[field]
  const diff = newVal - oldVal
  const direction = diff > 0 ? 'increased' : 'decreased'
  if (field === 'cost_of_living') {
    return `${label} ${direction} by $${Math.abs(Math.round(diff)).toLocaleString()}/mo`
  }
  if (field === 'taxes') {
    return `${label} ${direction} by ${Math.abs(diff).toFixed(1)}%`
  }
  return `${label} ${direction} by ${Math.abs(Math.round(diff))} points`
}
