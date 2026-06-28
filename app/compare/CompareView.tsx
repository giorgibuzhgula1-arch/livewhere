'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import {
  cityOptionLabel,
  cityRowKey,
  findCityByQuery,
  getCityCompareMetrics,
  SORTED_CITY_OPTIONS,
  type CityCompareMetrics,
} from '@/lib/compare'
import styles from './compare.module.css'

function fmtUsd(n: number): string {
  return '$' + n.toLocaleString()
}

function scoreClass(score: number): string {
  if (score >= 75) return styles.scoreHigh
  if (score >= 50) return styles.scoreMid
  return styles.scoreLow
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

const METRIC_ROWS: Array<{
  label: string
  format: (m: CityCompareMetrics) => string
  isScore?: boolean
}> = [
  { label: 'Monthly Cost of Living', format: (m) => fmtUsd(m.monthlyCostOfLiving) },
  { label: 'Monthly Rent', format: (m) => fmtUsd(m.monthlyRent) },
  {
    label: 'Healthcare Score',
    format: (m) => formatScore(m.healthcareScore),
    isScore: true,
  },
  {
    label: 'Safety Score',
    format: (m) => formatScore(m.safetyScore),
    isScore: true,
  },
  {
    label: 'Tax Score',
    format: (m) => formatScore(m.taxScore),
    isScore: true,
  },
  {
    label: 'Climate Score',
    format: (m) => formatScore(m.climateScore),
    isScore: true,
  },
  {
    label: 'Overall Retirement Score',
    format: (m) => formatScore(m.overallRetirementScore),
    isScore: true,
  },
]

export default function CompareView() {
  const router = useRouter()
  const searchParams = useSearchParams()

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

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Back to LiveWhere
      </Link>

      <p className={styles.kicker}>Compare</p>
      <h1 className={styles.title}>City comparison</h1>
      <p className={styles.subtitle}>
        Compare retirement metrics side by side using LiveWhere&apos;s city database — cost of
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
          Select at least one city above to see comparison data.
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.metricHeader}>Metric</th>
                  {columns.map((col) => (
                    <th key={cityRowKey(col.city)} className={styles.cityHeader}>
                      {col.city.name}
                      <span className={styles.citySub}>{col.city.country}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRIC_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className={styles.metricCell}>{row.label}</td>
                    {columns.map((col) => {
                      const raw = row.format(col)
                      const numeric = row.isScore ? Number(raw) : null
                      return (
                        <td
                          key={`${cityRowKey(col.city)}-${row.label}`}
                          className={`${styles.valueCell}${numeric != null ? ` ${scoreClass(numeric)}` : ''}`}
                        >
                          {raw}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.note}>
            Scores are on a 0–100 scale. Overall retirement score uses a $4,000/mo reference
            budget and default priority weights from LiveWhere&apos;s scoring engine.
          </p>
        </>
      )}
    </main>
  )
}
