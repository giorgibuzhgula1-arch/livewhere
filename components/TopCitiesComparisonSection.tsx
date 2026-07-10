'use client'

import { pickDecisionPlan } from '@/components/BlueprintDecisionSection'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'
import type { CityResult, UserPriorities } from '@/lib/types'
import type { SavedRetirementPlan } from '@/lib/saved-plans'

type Props = {
  plans: SavedRetirementPlan[]
}

type PriorityDimension = {
  priorityKey: keyof UserPriorities
  scoreKey: keyof CityResult['scores']
  label: string
}

const PRIORITY_DIMENSIONS: PriorityDimension[] = [
  { priorityKey: 'tax', scoreKey: 'tax', label: 'Low taxes' },
  { priorityKey: 'housing', scoreKey: 'housing', label: 'Affordable housing' },
  { priorityKey: 'climate', scoreKey: 'climate', label: 'Climate fit' },
  { priorityKey: 'health', scoreKey: 'health', label: 'Healthcare' },
  { priorityKey: 'stability', scoreKey: 'stability', label: 'Long-term stability' },
  { priorityKey: 'safety', scoreKey: 'safety', label: 'Safety' },
  { priorityKey: 'expat_community', scoreKey: 'expat', label: 'Expat community' },
]

const RANK_LABELS = ['Winner', 'Runner Up', 'Alternative'] as const

function unlockedCities(plan: SavedRetirementPlan): CityResult[] {
  return plan.city_results.filter((city) => !city.locked)
}

function rankedTopCities(plan: SavedRetirementPlan, limit: number): CityResult[] {
  return [...unlockedCities(plan)].sort((a, b) => b.score - a.score).slice(0, limit)
}

function topUserPriorityDimensions(priorities: UserPriorities): PriorityDimension[] {
  return PRIORITY_DIMENSIONS.filter((dim) => priorities[dim.priorityKey] >= 4).sort(
    (a, b) => priorities[b.priorityKey] - priorities[a.priorityKey],
  )
}

function scoreValue(city: CityResult, scoreKey: keyof CityResult['scores']): number {
  const value = city.scores[scoreKey]
  return typeof value === 'number' ? value : 0
}

/** Mirrors BlueprintDecisionSection priority-weighted standout logic. */
function standoutSubScore(
  city: CityResult,
  priorities: UserPriorities,
): { label: string; value: number } {
  const topDims = topUserPriorityDimensions(priorities)
  const dimsToCheck = topDims.length > 0 ? topDims : PRIORITY_DIMENSIONS

  let best = dimsToCheck[0]
  let bestValue = scoreValue(city, best.scoreKey)

  for (const dim of dimsToCheck.slice(1)) {
    const value = scoreValue(city, dim.scoreKey)
    if (value > bestValue) {
      best = dim
      bestValue = value
    }
  }

  return { label: best.label, value: bestValue }
}

function formatUsd(amount: number): string {
  return `$${amount.toLocaleString()}`
}

function CityComparisonCard({
  city,
  rankLabel,
  isWinner,
  priorities,
}: {
  city: CityResult
  rankLabel: string
  isWinner: boolean
  priorities: UserPriorities
}) {
  const standout = standoutSubScore(city, priorities)
  const pros = city.pros.filter(Boolean).slice(0, 2)
  const savingsPositive = city.monthlySavings >= 0

  return (
    <article
      style={{
        flex: isWinner ? '1.15 1 220px' : '1 1 200px',
        minWidth: 0,
        background: isWinner
          ? 'linear-gradient(135deg, rgba(200,240,90,0.06) 0%, var(--surface) 55%)'
          : 'var(--surface)',
        border: isWinner
          ? '1px solid rgba(200,240,90,0.35)'
          : '1px solid var(--border)',
        borderRadius: 16,
        padding: isWinner ? '22px 24px' : '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <p
        style={{
          fontFamily: fontFamilySans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: isWinner ? '#c8f05a' : 'rgba(240,237,232,0.45)',
          margin: 0,
        }}
      >
        {rankLabel}
      </p>

      <div>
        <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 8 }} aria-hidden>
          {city.flag}
        </div>
        <h3
          style={{
            fontFamily: fontFamilySerif,
            fontSize: isWinner ? 'clamp(20px, 2.5vw, 24px)' : 'clamp(18px, 2.2vw, 22px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: '#f0ede8',
            margin: '0 0 4px',
          }}
        >
          {city.name}
        </h3>
        <p
          style={{
            fontFamily: fontFamilySans,
            fontSize: 13,
            color: 'rgba(240,237,232,0.45)',
            margin: 0,
          }}
        >
          {city.country}
        </p>
      </div>

      <div
        style={{
          fontFamily: fontFamilySans,
          fontSize: isWinner ? 28 : 24,
          fontWeight: 700,
          color: isWinner ? '#c8f05a' : 'rgba(240,237,232,0.85)',
          lineHeight: 1,
        }}
      >
        {Math.round(city.score)}
        <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,237,232,0.4)' }}>/100</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: 'rgba(240,237,232,0.4)',
              marginBottom: 4,
            }}
          >
            Monthly cost
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8' }}>
            {formatUsd(city.monthlyCost)}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: 'rgba(240,237,232,0.4)',
              marginBottom: 4,
            }}
          >
            Monthly savings
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: savingsPositive ? '#c8f05a' : '#f05a8c',
            }}
          >
            {savingsPositive ? '+' : '-'}
            {formatUsd(Math.abs(city.monthlySavings))}
          </div>
        </div>
      </div>

      {pros.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {pros.map((pro) => (
            <li
              key={pro}
              style={{
                fontFamily: fontFamilySans,
                fontSize: 13,
                lineHeight: 1.5,
                color: 'rgba(240,237,232,0.65)',
                display: 'flex',
                gap: 8,
              }}
            >
              <span style={{ color: '#c8f05a', flexShrink: 0 }}>+</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 4,
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            color: 'rgba(240,237,232,0.4)',
            marginBottom: 4,
          }}
        >
          Standout factor
        </div>
        <div
          style={{
            fontFamily: fontFamilySans,
            fontSize: 13,
            color: 'rgba(240,237,232,0.75)',
            lineHeight: 1.45,
          }}
        >
          {standout.label}{' '}
          <span style={{ color: '#c8f05a', fontWeight: 600 }}>{standout.value}/100</span>
        </div>
      </div>
    </article>
  )
}

export default function TopCitiesComparisonSection({ plans }: Props) {
  const plan = pickDecisionPlan(plans)
  if (!plan) return null

  const topCities = rankedTopCities(plan, 3)

  // One city is already fully covered by BlueprintDecisionSection — comparison adds no value.
  if (topCities.length < 2) return null

  return (
    <section style={{ marginBottom: 40, maxWidth: 960 }}>
      <h2
        style={{
          fontFamily: fontFamilySerif,
          fontSize: 'clamp(22px, 3vw, 30px)',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#f0ede8',
          margin: '0 0 8px',
        }}
      >
        Top 3 Cities Comparison
      </h2>
      <p
        style={{
          fontFamily: fontFamilySans,
          fontSize: 13,
          color: 'rgba(240,237,232,0.45)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}
      >
        Your best matches from {plan.name} — ranked by overall fit score.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {topCities.map((city, index) => (
          <CityComparisonCard
            key={`${city.name}-${city.country}`}
            city={city}
            rankLabel={RANK_LABELS[index]}
            isWinner={index === 0}
            priorities={plan.quiz_input.priorities}
          />
        ))}
      </div>
    </section>
  )
}
