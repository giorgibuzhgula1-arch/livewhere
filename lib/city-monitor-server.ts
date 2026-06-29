import { supabaseAdmin } from '@/lib/supabase-admin'
import { findCityByQuery, getCityCompareMetrics } from '@/lib/compare'
import type { CityResult } from '@/lib/types'
import type { MonitorChanges, MonitorSnapshot } from '@/lib/city-monitor'

const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

const THRESHOLDS: Record<keyof MonitorSnapshot, number> = {
  taxes: 0.5,
  visa: 2,
  healthcare: 2,
  cost_of_living: 75,
}

export function cityIdFromResult(city: CityResult): string {
  return `${city.name}|${city.country}`
}

export function currentSnapshotForCity(city: CityResult): MonitorSnapshot {
  try {
    const row = findCityByQuery(cityIdFromResult(city))
    if (row) {
      const metrics = getCityCompareMetrics(row)
      return {
        taxes: row.tax_rate,
        visa: metrics.visaAccessScore,
        healthcare: metrics.healthcareScore,
        cost_of_living: metrics.monthlyCostOfLiving,
      }
    }
  } catch {
    /* fall through */
  }

  return {
    taxes: city.taxRate,
    visa: 50,
    healthcare: city.scores?.health ?? 50,
    cost_of_living: city.monthlyCost,
  }
}

export function computeDeltas(
  previous: MonitorSnapshot,
  current: MonitorSnapshot,
): MonitorChanges['deltas'] {
  const deltas: MonitorChanges['deltas'] = {}
  const fields: (keyof MonitorSnapshot)[] = ['taxes', 'visa', 'healthcare', 'cost_of_living']

  for (const field of fields) {
    const oldVal = previous[field]
    const newVal = current[field]
    if (Math.abs(newVal - oldVal) >= THRESHOLDS[field]) {
      deltas[field] = { old: oldVal, new: newVal }
    }
  }

  return deltas
}

export function hasMeaningfulChanges(deltas: MonitorChanges['deltas']): boolean {
  return Object.keys(deltas).length > 0
}

function buildGptPrompt(cityName: string, deltas: MonitorChanges['deltas']): string {
  const lines = Object.entries(deltas)
    .map(([field, { old: o, new: n }]) => `- ${field}: ${o} → ${n}`)
    .join('\n')

  return `Summarize these retirement-relevant changes for ${cityName} in 2-3 sentences for a retiree. Focus on budget, taxes, visa/residency, and healthcare impact. Be factual and concise. Plain text only.

Changes detected:
${lines}`
}

export async function summarizeChangesWithGpt(
  cityName: string,
  deltas: MonitorChanges['deltas'],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return Object.entries(deltas)
      .map(([field, { old: o, new: n }]) => `${field} changed from ${o} to ${n}`)
      .join('. ')
  }

  try {
    const res = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.5,
        max_tokens: 180,
        messages: [
          {
            role: 'system',
            content:
              'You write brief retirement city monitoring alerts for LiveWhere. Plain text only, 2-3 sentences.',
          },
          { role: 'user', content: buildGptPrompt(cityName, deltas) },
        ],
      }),
    })

    if (!res.ok) {
      console.error('[monitor] GPT failed:', res.status, await res.text())
      return fallbackSummary(cityName, deltas)
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const text = data.choices?.[0]?.message?.content?.trim()
    return text || fallbackSummary(cityName, deltas)
  } catch (err) {
    console.error('[monitor] GPT error:', err)
    return fallbackSummary(cityName, deltas)
  }
}

function fallbackSummary(cityName: string, deltas: MonitorChanges['deltas']): string {
  const parts = Object.entries(deltas).map(([field, { old: o, new: n }]) => `${field} ${o}→${n}`)
  return `Updates detected for ${cityName}: ${parts.join(', ')}.`
}

export async function sendMonitorAlertEmail(params: {
  email: string
  cityName: string
  summary: string
  monitorUrl?: string
}): Promise<boolean> {
  const apiKey = process.env.LOOPS_API_KEY?.trim()
  if (!apiKey) {
    console.warn('[monitor] LOOPS_API_KEY not set — skipping email')
    return false
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.livewhere.io'

  try {
    const res = await fetch('https://app.loops.so/api/v1/events/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        eventName: 'city_monitor_alert',
        eventProperties: {
          cityName: params.cityName,
          summary: params.summary,
          monitorUrl: params.monitorUrl ?? `${siteUrl}/plans?tab=monitor`,
        },
      }),
    })

    if (!res.ok) {
      console.error('[monitor] Loops event failed:', res.status, await res.text())
      return false
    }

    return true
  } catch (err) {
    console.error('[monitor] Loops error:', err)
    return false
  }
}

async function getTopSavedCities(userId: string): Promise<CityResult[]> {
  const { data: plans, error } = await supabaseAdmin
    .from('saved_retirement_plans')
    .select('city_results')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error || !plans?.length) return []

  const cities = plans[0].city_results as CityResult[] | null
  if (!Array.isArray(cities)) return []
  return cities.slice(0, 3)
}

async function getLatestMonitor(userId: string, cityId: string) {
  const { data } = await supabaseAdmin
    .from('city_monitors')
    .select('*')
    .eq('user_id', userId)
    .eq('city_id', cityId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

async function insertMonitorRow(params: {
  userId: string
  cityId: string
  cityName: string
  snapshot: MonitorSnapshot
  changes: MonitorChanges | null
}) {
  const { error } = await supabaseAdmin.from('city_monitors').insert({
    user_id: params.userId,
    city_id: params.cityId,
    city_name: params.cityName,
    snapshot: params.snapshot,
    changes: params.changes,
    checked_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
}

export type CheckUserResult = {
  userId: string
  citiesChecked: number
  alertsCreated: number
  emailsSent: number
}

export async function checkCitiesForUser(userId: string, email: string | null): Promise<CheckUserResult> {
  const cities = await getTopSavedCities(userId)
  let alertsCreated = 0
  let emailsSent = 0

  for (const city of cities) {
    const cityId = cityIdFromResult(city)
    const cityName = city.name
    const current = currentSnapshotForCity(city)
    const previous = await getLatestMonitor(userId, cityId)

    if (!previous) {
      await insertMonitorRow({
        userId,
        cityId,
        cityName,
        snapshot: current,
        changes: null,
      })
      continue
    }

    const prevSnapshot = previous.snapshot as MonitorSnapshot
    const deltas = computeDeltas(prevSnapshot, current)

    if (!hasMeaningfulChanges(deltas)) {
      continue
    }

    const summary = await summarizeChangesWithGpt(cityName, deltas)
    const changes: MonitorChanges = { summary, deltas }

    await insertMonitorRow({
      userId,
      cityId,
      cityName,
      snapshot: current,
      changes,
    })

    alertsCreated += 1

    if (email) {
      const sent = await sendMonitorAlertEmail({ email, cityName, summary })
      if (sent) emailsSent += 1
    }
  }

  return {
    userId,
    citiesChecked: cities.length,
    alertsCreated,
    emailsSent,
  }
}

export async function getPaidUsersWithSavedPlans(): Promise<{ id: string; email: string | null }[]> {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, plan')
    .in('plan', ['pro', 'lifetime'])

  if (error || !profiles?.length) return []

  const paidIds = profiles.map((p) => p.id as string)

  const { data: planRows } = await supabaseAdmin
    .from('saved_retirement_plans')
    .select('user_id')
    .in('user_id', paidIds)

  const userIdsWithPlans = new Set((planRows ?? []).map((r) => r.user_id as string))

  const results: { id: string; email: string | null }[] = []

  for (const id of Array.from(userIdsWithPlans)) {
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(id)
    results.push({ id, email: user?.email ?? null })
  }

  return results
}

export async function runMonitorCheck(userId?: string): Promise<CheckUserResult[]> {
  if (userId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .maybeSingle()

    if (!profile || (profile.plan !== 'pro' && profile.plan !== 'lifetime')) {
      return []
    }

    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    return [await checkCitiesForUser(userId, user?.email ?? null)]
  }

  const users = await getPaidUsersWithSavedPlans()
  const outcomes: CheckUserResult[] = []

  for (const u of users) {
    try {
      outcomes.push(await checkCitiesForUser(u.id, u.email))
    } catch (err) {
      console.error(`[monitor] check failed for ${u.id}:`, err)
    }
  }

  return outcomes
}
