'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cityOptionLabel,
  cityRowKey,
  findCityByQuery,
  getCityCompareMetrics,
  SORTED_CITY_OPTIONS,
  type CityCompareMetrics,
} from '@/lib/compare'
import { loadPendingAnalyze } from '@/lib/pending-analyze'
import { fetchUserPlan, isPaidPlan, type UserPlan } from '@/lib/plan'
import type { UserPriorities } from '@/lib/types'
import CompareCityCard from './CompareCityCard'
import CompareResultsPanel from './CompareResultsPanel'
import styles from './compare.module.css'

export default function CompareView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plan, setPlan] = useState<UserPlan>('free')
  const [priorities, setPriorities] = useState<UserPriorities | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchUserPlan().then((p) => {
      if (!cancelled) setPlan(p)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const quiz = loadPendingAnalyze()
    setPriorities(quiz?.priorities ?? null)
  }, [])

  const paid = isPaidPlan(plan)
  const showPaywall = !paid

  const cityAKey = useMemo(() => {
    const query = searchParams.get('cityA')
    if (!query) return ''
    const city = findCityByQuery(query)
    return city ? cityRowKey(city) : ''
  }, [searchParams])

  const cityBKey = useMemo(() => {
    const query = searchParams.get('cityB')
    if (!query) return ''
    const city = findCityByQuery(query)
    return city ? cityRowKey(city) : ''
  }, [searchParams])

  const updateParams = useCallback(
    (nextA: string, nextB: string) => {
      const params = new URLSearchParams()
      if (nextA) {
        const city = SORTED_CITY_OPTIONS.find((c) => cityRowKey(c) === nextA)
        if (city) params.set('cityA', city.name)
      }
      if (nextB) {
        const city = SORTED_CITY_OPTIONS.find((c) => cityRowKey(c) === nextB)
        if (city) params.set('cityB', city.name)
      }
      const qs = params.toString()
      router.replace(qs ? `/compare?${qs}` : '/compare', { scroll: false })
    },
    [router],
  )

  const metricsA = useMemo(() => {
    const city = SORTED_CITY_OPTIONS.find((c) => cityRowKey(c) === cityAKey)
    return city ? getCityCompareMetrics(city) : null
  }, [cityAKey])

  const metricsB = useMemo(() => {
    const city = SORTED_CITY_OPTIONS.find((c) => cityRowKey(c) === cityBKey)
    return city ? getCityCompareMetrics(city) : null
  }, [cityBKey])

  const columns = [metricsA, metricsB].filter(Boolean) as CityCompareMetrics[]
  const comparingTwo = metricsA != null && metricsB != null

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Back to LiveWhere
      </Link>

      <p className={styles.kicker}>Compare</p>
      <h1 className={styles.title}>City comparison</h1>
      <p className={styles.subtitle}>
        Compare relocation metrics side by side using LiveWhere&apos;s city database — cost of
        living, healthcare, safety, taxes, climate, and overall score.
      </p>

      <div className={styles.selectors}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="city-a">
            City A
          </label>
          <select
            id="city-a"
            className={styles.select}
            value={cityAKey}
            onChange={(e) => updateParams(e.target.value, cityBKey)}
          >
            <option value="">Select a city…</option>
            {SORTED_CITY_OPTIONS.map((city) => (
              <option key={cityRowKey(city)} value={cityRowKey(city)}>
                {cityOptionLabel(city)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="city-b">
            City B
          </label>
          <select
            id="city-b"
            className={styles.select}
            value={cityBKey}
            onChange={(e) => updateParams(cityAKey, e.target.value)}
          >
            <option value="">Select a city…</option>
            {SORTED_CITY_OPTIONS.map((city) => (
              <option key={cityRowKey(city)} value={cityRowKey(city)}>
                {cityOptionLabel(city)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Select two cities to compare</p>
          <p>
            Choose City A and City B from the dropdowns above to see side-by-side cards, key
            differences, and a data-backed verdict.
          </p>
        </div>
      ) : (
        <div className={styles.resultsBlock}>
          <div className={styles.lockedWrap}>
            <div className={showPaywall ? styles.lockedContent : ''}>
              {comparingTwo && metricsA && metricsB ? (
                <CompareResultsPanel
                  metricsA={metricsA}
                  metricsB={metricsB}
                  priorities={priorities}
                />
              ) : (
                <div className={styles.cityCardGrid}>
                  {columns.map((col, index) => (
                    <CompareCityCard
                      key={cityRowKey(col.city)}
                      metrics={col}
                      label={index === 0 ? 'City A' : 'City B'}
                    />
                  ))}
                </div>
              )}

              <p className={styles.note}>
                Scores are on a 0–100 scale. Overall relocation score uses a $4,000/mo reference
                budget and default priority weights from LiveWhere&apos;s scoring engine.
                {priorities
                  ? ' Verdict weighting reflects your saved quiz priorities.'
                  : ' Complete the quiz to weight the verdict toward your priorities.'}
              </p>
            </div>

            {showPaywall && (
              <div className={styles.paywallOverlay}>
                <div className={styles.paywallCard}>
                  <h2 className={styles.paywallTitle}>
                    Unlock City Comparison — Continue to Pro
                  </h2>
                  <Link href="/pricing" className={styles.paywallBtn}>
                    Continue to Pro
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
