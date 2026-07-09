'use client'

import { useMemo } from 'react'
import type { CityCompareMetrics } from '@/lib/compare'
import {
  analyzeComparison,
  buildMetricDifferences,
  generateCompareVerdict,
} from '@/lib/compare-verdict'
import type { UserPriorities } from '@/lib/types'
import CompareCityCard from './CompareCityCard'
import styles from './compare.module.css'

type Props = {
  metricsA: CityCompareMetrics
  metricsB: CityCompareMetrics
  priorities: UserPriorities | null
}

export default function CompareResultsPanel({ metricsA, metricsB, priorities }: Props) {
  const differences = useMemo(
    () => buildMetricDifferences(metricsA, metricsB),
    [metricsA, metricsB],
  )

  const verdict = useMemo(
    () => generateCompareVerdict(metricsA, metricsB, priorities),
    [metricsA, metricsB, priorities],
  )

  const analysis = useMemo(
    () => analyzeComparison(metricsA, metricsB, priorities),
    [metricsA, metricsB, priorities],
  )

  const highlightA = analysis.winner === 'a'
  const highlightB = analysis.winner === 'b'

  return (
    <div className={styles.compareResults}>
      <div className={styles.cityCardGrid}>
        <CompareCityCard metrics={metricsA} label="City A" highlighted={highlightA} />
        <CompareCityCard metrics={metricsB} label="City B" highlighted={highlightB} />
      </div>

      {differences.length > 0 && (
        <section className={styles.differenceSection} aria-label="Key differences">
          <h2 className={styles.sectionHeading}>Difference</h2>
          <ul className={styles.differenceList}>
            {differences.map((item) => (
              <li
                key={item.key}
                className={[
                  styles.differenceItem,
                  item.favors === 'a' ? styles.differenceFavorsA : styles.differenceFavorsB,
                ].join(' ')}
              >
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.verdictSection} aria-label="AI Verdict">
        <p className={styles.verdictKicker}>AI Verdict</p>
        <h2 className={styles.sectionHeading}>
          {analysis.isTie
            ? 'A close call'
            : `${analysis.winner === 'a' ? metricsA.city.name : metricsB.city.name} leads`}
        </h2>
        <p className={styles.verdictBody}>{verdict}</p>
      </section>
    </div>
  )
}
