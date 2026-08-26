import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { unsanitizedCitiesForPersist } from '@/lib/recommendation'
import type { AnalyzeRequest, CityResult } from '@/lib/types'

/** Server-only. Unset or any value other than "true" keeps this off. */
export function isPaywallV2Enabled(): boolean {
  return process.env.PAYWALL_V2_ENABLED === 'true'
}

export function createAnalyzeSearchId(): string {
  return randomUUID()
}

/**
 * Fire-and-forget persist. Never throws. Does not change the analyze SSE payload.
 * Later OAuth can: UPDATE analyze_search_snapshots SET user_id = $userId
 *   WHERE id = $searchId AND user_id IS NULL.
 */
export async function persistAnalyzeSearchSnapshot(params: {
  searchId: string
  userId: string | null
  quizInput: AnalyzeRequest
  generatedCities: CityResult[]
  resultCount: number
}): Promise<void> {
  try {
    if (!isPaywallV2Enabled()) return

    const cities = unsanitizedCitiesForPersist(
      params.quizInput,
      params.generatedCities,
      params.resultCount,
    )

    const { error } = await supabaseAdmin.from('analyze_search_snapshots').insert({
      id: params.searchId,
      user_id: params.userId,
      quiz_input: params.quizInput,
      cities,
    })

    if (error) {
      console.error('[paywall-v2] persist failed:', error.message)
    }
  } catch (err) {
    console.error('[paywall-v2] persist failed:', err)
  }
}

export type AnalyzeSearchSnapshot = {
  searchId: string
  userId: string | null
  quizInput: AnalyzeRequest
  cities: CityResult[]
}

/**
 * Read a stored analyze snapshot. Never throws.
 * - searchId: that row, if it exists
 * - userId only: latest row for that user
 * - both: that searchId, only if user_id matches
 * Caller must still enforce paid + flag at the HTTP layer.
 */
export async function getAnalyzeSearchSnapshot(params: {
  searchId?: string | null
  userId?: string | null
}): Promise<AnalyzeSearchSnapshot | null> {
  try {
    if (!isPaywallV2Enabled()) return null

    const searchId = params.searchId?.trim() || null
    const userId = params.userId?.trim() || null
    if (!searchId && !userId) return null

    let query = supabaseAdmin
      .from('analyze_search_snapshots')
      .select('id, user_id, quiz_input, cities')

    if (searchId) {
      query = query.eq('id', searchId)
      if (userId) query = query.eq('user_id', userId)
    } else {
      query = query.eq('user_id', userId!).order('created_at', { ascending: false }).limit(1)
    }

    const { data, error } = await query.maybeSingle()
    if (error || !data) return null
    if (!Array.isArray(data.cities)) return null

    return {
      searchId: data.id,
      userId: data.user_id ?? null,
      quizInput: data.quiz_input as AnalyzeRequest,
      cities: data.cities as CityResult[],
    }
  } catch (err) {
    console.error('[paywall-v2] read failed:', err)
    return null
  }
}
