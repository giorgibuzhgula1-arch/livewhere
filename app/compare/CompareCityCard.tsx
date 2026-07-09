'use client'

import type { CityCompareMetrics } from '@/lib/compare'
import styles from './compare.module.css'

function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

type Props = {
  metrics: CityCompareMetrics
  label: string
  highlighted?: boolean
}

export default function CompareCityCard({ metrics, label, highlighted = false }: Props) {
  const { city } = metrics

  const stats = [
    { label: 'Overall score', value: formatScore(metrics.overallRetirementScore), highlight: true },
    { label: 'Cost of living', value: `${fmtUsd(metrics.monthlyCostOfLiving)}/mo` },
    { label: 'Tax rate', value: `${city.tax_rate}%` },
    { label: 'Healthcare', value: formatScore(metrics.healthcareScore) },
    { label: 'Safety', value: formatScore(metrics.safetyScore) },
    { label: 'Climate', value: formatScore(metrics.climateScore) },
  ]

  return (
    <article
      className={[styles.cityCard, highlighted ? styles.cityCardWinner : ''].filter(Boolean).join(' ')}
    >
      <p className={styles.cityCardLabel}>{label}</p>
      <h2 className={styles.cityCardName}>{city.name}</h2>
      <p className={styles.cityCardCountry}>{city.country}</p>

      <div className={styles.cityCardScoreBlock}>
        <span className={styles.cityCardScore}>{formatScore(metrics.overallRetirementScore)}</span>
        <span className={styles.cityCardScoreSuffix}>/ 100</span>
      </div>

      <dl className={styles.cityCardStats}>
        {stats.slice(1).map((stat) => (
          <div key={stat.label} className={styles.cityCardStatRow}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
