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
import { fetchUserPlan, isPaidPlan, type UserPlan } from '@/lib/plan'
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

type RowWinner = 'a' | 'b' | 'tie'

type MetricRow = {
  label: string
  getValue: (m: CityCompareMetrics) => number
  format: (m: CityCompareMetrics) => string
  higherIsBetter: boolean
  isScore?: boolean
  summaryKey?: string
}

const METRIC_ROWS: MetricRow[] = [
  {
    label: 'Monthly Cost of Living',
    getValue: (m) => m.monthlyCostOfLiving,
    format: (m) => fmtUsd(m.monthlyCostOfLiving),
    higherIsBetter: false,
    summaryKey: 'cost',
  },
  {
    label: 'Monthly Rent',
    getValue: (m) => m.monthlyRent,
    format: (m) => fmtUsd(m.monthlyRent),
    higherIsBetter: false,
    summaryKey: 'rent',
  },
  {
    label: 'Healthcare Score',
    getValue: (m) => m.healthcareScore,
    format: (m) => formatScore(m.healthcareScore),
    higherIsBetter: true,
    isScore: true,
    summaryKey: 'healthcare',
  },
  {
    label: 'Safety Score',
    getValue: (m) => m.safetyScore,
    format: (m) => formatScore(m.safetyScore),
    higherIsBetter: true,
    isScore: true,
    summaryKey: 'safety',
  },
  {
    label: 'Tax Score',
    getValue: (m) => m.taxScore,
    format: (m) => formatScore(m.taxScore),
    higherIsBetter: true,
    isScore: true,
    summaryKey: 'taxes',
  },
  {
    label: 'Climate Score',
    getValue: (m) => m.climateScore,
    format: (m) => formatScore(m.climateScore),
    higherIsBetter: true,
    isScore: true,
    summaryKey: 'climate',
  },
  {
    label: 'Airport Score',
    getValue: (m) => m.airportScore,
    format: (m) => formatScore(m.airportScore),
    higherIsBetter: true,
    isScore: true,
    summaryKey: 'airport access',
  },
  {
    label: 'Internet Score',
    getValue: (m) => m.internetScore,
    format: (m) => formatScore(m.internetScore),
    higherIsBetter: true,
    isScore: true,
    summaryKey: 'internet',
  },
  {
    label: 'Walkability Score',
    getValue: (m) => m.walkabilityScore,
    format: (m) => formatScore(m.walkabilityScore),
    higherIsBetter: true,
    isScore: true,
    summaryKey: 'walkability',
  },
  {
    label: 'Visa Access Score',
    getValue: (m) => m.visaAccessScore,
    format: (m) => formatScore(m.visaAccessScore),
    higherIsBetter: true,
    isScore: true,
    summaryKey: 'visa access',
  },
  {
    label: 'Overall Retirement Score',
    getValue: (m) => m.overallRetirementScore,
    format: (m) => formatScore(m.overallRetirementScore),
    higherIsBetter: true,
    isScore: true,
    summaryKey: 'overall score',
  },
]

function rowWinner(a: number, b: number, higherIsBetter: boolean): RowWinner {
  if (a === b) return 'tie'
  if (higherIsBetter) return a > b ? 'a' : 'b'
  return a < b ? 'a' : 'b'
}

function buildOverallSummary(
  winner: CityCompareMetrics,
  loser: CityCompareMetrics,
): string {
  const highlights: string[] = []

  for (const row of METRIC_ROWS) {
    const w = rowWinner(row.getValue(winner), row.getValue(loser), row.higherIsBetter)
    if (w === 'a' && row.summaryKey) {
      highlights.push(row.summaryKey)
    }
  }

  const priority = [
    'cost',
    'overall score',
    'healthcare',
    'safety',
    'taxes',
    'climate',
    'airport access',
    'internet',
    'walkability',
    'visa access',
    'rent',
  ]
  const ordered = priority.filter((key) => highlights.includes(key))
  const rest = highlights.filter((key) => !ordered.includes(key))
  const parts = [...ordered, ...rest].slice(0, 3)

  let basis: string
  if (parts.length === 0) {
    basis = 'overall metrics'
  } else if (parts.length === 1) {
    basis = parts[0]
  } else if (parts.length === 2) {
    basis = `${parts[0]} and ${parts[1]}`
  } else {
    basis = `${parts[0]}, ${parts[1]}, and ${parts[2]}`
  }

  return `${winner.city.name} is the better retirement destination based on ${basis}.`
}

function shortMetricLabel(label: string): string {
  return label.replace(/ Score$/, '')
}

type CategoryBreakdown = {
  won: string[]
  lost: string[]
}

function buildCategoryBreakdown(
  winner: CityCompareMetrics,
  loser: CityCompareMetrics,
): CategoryBreakdown {
  const won: string[] = []
  const lost: string[] = []

  for (const row of METRIC_ROWS) {
    const result = rowWinner(
      row.getValue(winner),
      row.getValue(loser),
      row.higherIsBetter,
    )
    const label = shortMetricLabel(row.label)
    if (result === 'a') won.push(label)
    else if (result === 'b') lost.push(label)
  }

  return { won, lost }
}

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 16,
}

const chipSectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: 'rgba(240, 237, 232, 0.45)',
  fontWeight: 600,
  marginBottom: 8,
}

const wonChipStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 600,
  color: '#c8f05a',
  background: 'rgba(200, 240, 90, 0.12)',
  border: '1px solid rgba(200, 240, 90, 0.28)',
  borderRadius: 999,
  padding: '4px 10px',
}

const lostChipStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 600,
  color: 'rgba(240, 237, 232, 0.5)',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 999,
  padding: '4px 10px',
}

function CategoryChips({ labels, variant }: { labels: string[]; variant: 'won' | 'lost' }) {
  if (labels.length === 0) return null
  const chipStyle = variant === 'won' ? wonChipStyle : lostChipStyle
  return (
    <div style={chipRowStyle}>
      {labels.map((label) => (
        <span key={label} style={chipStyle}>
          {label}
        </span>
      ))}
    </div>
  )
}

function WinnerBadge({ result }: { result: RowWinner }) {
  if (result === 'tie') {
    return <span className={styles.tieBadge}>Tie</span>
  }
  return (
    <span className={styles.winnerBadge}>
      <span className={styles.winnerCheck} aria-hidden>
        ✓
      </span>
      Winner
    </span>
  )
}

export default function CompareView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plan, setPlan] = useState<UserPlan>('free')

  useEffect(() => {
    let cancelled = false
    void fetchUserPlan().then((p) => {
      if (!cancelled) setPlan(p)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const paid = isPaidPlan(plan)
  console.log('plan:', plan)
  console.log('isPaid:', isPaidPlan(plan))
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

  const overallResult = useMemo(() => {
    if (!metricsA || !metricsB) return null

    let winsA = 0
    let winsB = 0
    for (const row of METRIC_ROWS) {
      const w = rowWinner(
        row.getValue(metricsA),
        row.getValue(metricsB),
        row.higherIsBetter,
      )
      if (w === 'a') winsA++
      else if (w === 'b') winsB++
    }

    if (winsA > winsB) {
      return {
        winner: metricsA,
        loser: metricsB,
        winsA,
        winsB,
        isTie: false,
        breakdown: buildCategoryBreakdown(metricsA, metricsB),
      }
    }
    if (winsB > winsA) {
      return {
        winner: metricsB,
        loser: metricsA,
        winsA,
        winsB,
        isTie: false,
        breakdown: buildCategoryBreakdown(metricsB, metricsA),
      }
    }

    if (metricsA.overallRetirementScore === metricsB.overallRetirementScore) {
      return { winner: null, loser: null, winsA, winsB, isTie: true, breakdown: null }
    }

    const aWinsOverall = metricsA.overallRetirementScore > metricsB.overallRetirementScore
    const winner = aWinsOverall ? metricsA : metricsB
    const loser = aWinsOverall ? metricsB : metricsA
    return {
      winner,
      loser,
      winsA,
      winsB,
      isTie: false,
      breakdown: buildCategoryBreakdown(winner, loser),
    }
  }, [metricsA, metricsB])

  function winnerForRow(row: MetricRow, col: CityCompareMetrics): RowWinner | null {
    if (!comparingTwo || !metricsA || !metricsB) return null
    const colKey = cityRowKey(col.city)
    const result = rowWinner(
      row.getValue(metricsA),
      row.getValue(metricsB),
      row.higherIsBetter,
    )
    if (result === 'tie') return 'tie'
    const aKey = cityRowKey(metricsA.city)
    if (result === 'a') return colKey === aKey ? 'a' : null
    return colKey === cityRowKey(metricsB.city) ? 'b' : null
  }

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
        <div className={styles.resultsBlock}>
          <div className={styles.lockedWrap}>
            <div className={showPaywall ? styles.lockedContent : ''}>
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
                            const numeric = row.isScore ? row.getValue(col) : null
                            const cellWinner = winnerForRow(row, col)
                            const showWinner = cellWinner === 'a' || cellWinner === 'b'
                            const showTie = cellWinner === 'tie'

                            return (
                              <td
                                key={`${cityRowKey(col.city)}-${row.label}`}
                                className={[
                                  styles.valueCell,
                                  numeric != null ? scoreClass(numeric) : '',
                                  showWinner ? styles.valueCellWinner : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <div className={styles.valueStack}>
                                  <span>{raw}</span>
                                  {showWinner && <WinnerBadge result={cellWinner!} />}
                                  {showTie && columns.length === 2 && (
                                    <WinnerBadge result="tie" />
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {overallResult && (
                <div className={styles.overallWinnerCard}>
                  <p className={styles.overallKicker}>Overall winner</p>
                  {overallResult.isTie ? (
                    <>
                      <h2 className={styles.overallTitle}>It&apos;s a tie</h2>
                      <p className={styles.overallSummary}>
                        {metricsA!.city.name} and {metricsB!.city.name} are evenly matched across
                        these retirement metrics ({overallResult.winsA} wins each).
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className={styles.overallTitle}>{overallResult.winner!.city.name}</h2>
                      <p className={styles.overallCountry}>{overallResult.winner!.city.country}</p>
                      <p className={styles.overallSummary}>
                        {buildOverallSummary(overallResult.winner!, overallResult.loser!)}
                      </p>

                      <div style={{ marginTop: 20, marginBottom: 4 }}>
                        <p style={chipSectionLabelStyle}>Average Monthly Cost</p>
                        <p
                          style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#f0ede8',
                            margin: '0 0 20px',
                          }}
                        >
                          ~{fmtUsd(overallResult.winner!.monthlyCostOfLiving)}/mo estimated
                          living cost
                        </p>

                        {overallResult.breakdown && overallResult.breakdown.won.length > 0 && (
                          <>
                            <p style={chipSectionLabelStyle}>Won Categories</p>
                            <CategoryChips labels={overallResult.breakdown.won} variant="won" />
                          </>
                        )}

                        {overallResult.breakdown && overallResult.breakdown.lost.length > 0 && (
                          <>
                            <p style={chipSectionLabelStyle}>Lost Categories</p>
                            <CategoryChips labels={overallResult.breakdown.lost} variant="lost" />
                          </>
                        )}

                        {overallResult.breakdown && overallResult.breakdown.won.length > 0 && (
                          <p
                            className={styles.overallMeta}
                            style={{ marginBottom: 6, color: 'rgba(240, 237, 232, 0.65)' }}
                          >
                            <span style={{ color: 'rgba(200, 240, 90, 0.85)' }}>Strongest in:</span>{' '}
                            {overallResult.breakdown.won.join(' · ')}
                          </p>
                        )}

                        {overallResult.breakdown && overallResult.breakdown.lost.length > 0 && (
                          <p
                            className={styles.overallMeta}
                            style={{ marginBottom: 16, color: 'rgba(240, 237, 232, 0.55)' }}
                          >
                            <span style={{ color: 'rgba(240, 237, 232, 0.45)' }}>Watch out for:</span>{' '}
                            {overallResult.breakdown.lost.join(' · ')}
                          </p>
                        )}
                      </div>

                      <p className={styles.overallMeta}>
                        Won {Math.max(overallResult.winsA, overallResult.winsB)} of{' '}
                        {METRIC_ROWS.length} categories
                      </p>
                    </>
                  )}
                </div>
              )}

              <p className={styles.note}>
                Scores are on a 0–100 scale. Overall retirement score uses a $4,000/mo reference
                budget and default priority weights from LiveWhere&apos;s scoring engine.
              </p>
            </div>

            {showPaywall && (
              <div className={styles.paywallOverlay}>
                <div className={styles.paywallCard}>
                  <h2 className={styles.paywallTitle}>
                    Unlock City Comparison — Upgrade to Premium
                  </h2>
                  <Link href="/pricing" className={styles.paywallBtn}>
                    Upgrade to Premium
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
