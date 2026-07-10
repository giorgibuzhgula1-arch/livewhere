'use client'

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

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '20px 22px',
} as const

function scoreToStarRating(score: number): number {
  return Math.round((score / 20) * 2) / 2
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span
      style={{ display: 'inline-flex', gap: 2, fontSize: 18, lineHeight: 1 }}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i
        const half = !filled && rating >= i - 0.5
        return (
          <span
            key={i}
            style={{
              color: filled || half ? '#c8f05a' : 'rgba(240,237,232,0.22)',
              opacity: half ? 0.55 : 1,
            }}
          >
            {filled || half ? '★' : '☆'}
          </span>
        )
      })}
    </span>
  )
}

function unlockedCities(plan: SavedRetirementPlan): CityResult[] {
  return plan.city_results.filter((city) => !city.locked)
}

/** First plan in list order with exportable cities (list is already newest-first from fetchSavedPlans). */
export function pickDecisionPlan(plans: SavedRetirementPlan[]): SavedRetirementPlan | null {
  for (const plan of plans) {
    if (unlockedCities(plan).length > 0) return plan
  }
  return null
}

function rankedCities(plan: SavedRetirementPlan): CityResult[] {
  return [...unlockedCities(plan)].sort((a, b) => b.score - a.score)
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

function buildWhyBullets(city: CityResult, priorities: UserPriorities): string[] {
  const bullets: string[] = [...city.pros].filter(Boolean).slice(0, 5)

  if (bullets.length >= 3) {
    return bullets.slice(0, 5)
  }

  const topDims = topUserPriorityDimensions(priorities)
  for (const dim of topDims) {
    if (bullets.length >= 5) break
    const value = scoreValue(city, dim.scoreKey)
    const line = `${dim.label} scores ${value}/100 — you rated this ${priorities[dim.priorityKey]}/5.`
    if (!bullets.includes(line)) bullets.push(line)
  }

  if (bullets.length < 3) {
    const sortedDims = [...PRIORITY_DIMENSIONS].sort(
      (a, b) => scoreValue(city, b.scoreKey) - scoreValue(city, a.scoreKey),
    )
    for (const dim of sortedDims) {
      if (bullets.length >= 3) break
      const value = scoreValue(city, dim.scoreKey)
      const line = `${dim.label} scores ${value}/100 for your profile.`
      if (!bullets.includes(line)) bullets.push(line)
    }
  }

  return bullets.slice(0, 5)
}

function buildAvoidReason(city: CityResult, priorities: UserPriorities): string {
  if (city.cons.length > 0 && city.cons[0]?.trim()) {
    return city.cons[0].trim()
  }

  const topDims = topUserPriorityDimensions(priorities)
  if (topDims.length > 0) {
    let weakest = topDims[0]
    let weakestValue = scoreValue(city, weakest.scoreKey)
    for (const dim of topDims) {
      const value = scoreValue(city, dim.scoreKey)
      if (value < weakestValue) {
        weakest = dim
        weakestValue = value
      }
    }
    return `Lower ${weakest.label.toLowerCase()} fit (${weakestValue}/100) relative to your ${priorities[weakest.priorityKey]}/5 priority.`
  }

  const sortedDims = [...PRIORITY_DIMENSIONS].sort(
    (a, b) => scoreValue(city, a.scoreKey) - scoreValue(city, b.scoreKey),
  )
  const dim = sortedDims[0]
  const value = scoreValue(city, dim.scoreKey)
  return `Lower ${dim.label.toLowerCase()} fit (${value}/100) for your profile.`
}

function citiesToAvoid(ranked: CityResult[]): CityResult[] {
  if (ranked.length <= 1) return []
  const avoidCount = Math.min(3, ranked.length - 1)
  return ranked.slice(-avoidCount).reverse()
}

/**
 * Confidence from #1 match score plus separation from #2 in the same plan.
 * gap = score(#1) - score(#2); if only one city, gap = 0.
 * Formula: min(100, round(score + gap * 0.75))
 */
function calculateDecisionConfidence(recommended: CityResult, ranked: CityResult[]): number {
  const gap = ranked.length >= 2 ? recommended.score - ranked[1].score : 0
  return Math.min(100, Math.round(recommended.score + gap * 0.75))
}

function DecisionConfidenceBlock({
  confidence,
}: {
  confidence: number
}) {
  return (
    <div
      style={{
        ...cardStyle,
        marginBottom: 16,
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(200,240,90,0.06) 0%, var(--surface) 55%)',
        borderColor: 'rgba(200,240,90,0.18)',
      }}
    >
      <p
        style={{
          fontFamily: fontFamilySans,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: '#c8f05a',
          fontWeight: 600,
          margin: '0 0 16px',
        }}
      >
        Decision Confidence
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 4,
          marginBottom: 18,
        }}
      >
        <span
          style={{
            fontFamily: fontFamilySerif,
            fontSize: 'clamp(48px, 8vw, 64px)',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: '#c8f05a',
          }}
        >
          {confidence}
        </span>
        <span
          style={{
            fontFamily: fontFamilySans,
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 600,
            color: 'rgba(240,237,232,0.45)',
          }}
        >
          %
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={confidence}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Decision confidence"
        style={{
          width: '100%',
          maxWidth: 360,
          height: 8,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
          margin: '0 auto 18px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${confidence}%`,
            borderRadius: 999,
            background: '#c8f05a',
          }}
        />
      </div>

      <p
        style={{
          fontFamily: fontFamilySans,
          fontSize: 14,
          lineHeight: 1.65,
          color: 'rgba(240,237,232,0.65)',
          margin: 0,
          maxWidth: 420,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        LiveWhere estimates this city is your strongest overall match based on every factor
        analyzed.
      </p>
    </div>
  )
}

export default function BlueprintDecisionSection({ plans }: Props) {
  const plan = pickDecisionPlan(plans)
  if (!plan) return null

  const ranked = rankedCities(plan)
  const recommended = ranked[0]
  if (!recommended) return null

  const avoid = citiesToAvoid(ranked)
  const whyBullets = buildWhyBullets(recommended, plan.quiz_input.priorities)
  const starRating = scoreToStarRating(recommended.score)
  const decisionConfidence = calculateDecisionConfidence(recommended, ranked)

  return (
    <section style={{ marginBottom: 40, maxWidth: 720 }}>
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
        Your Relocation Decision
      </h2>
      <p
        style={{
          fontFamily: fontFamilySans,
          fontSize: 13,
          color: 'rgba(240,237,232,0.45)',
          margin: '0 0 24px',
          lineHeight: 1.5,
        }}
      >
        Based on {plan.name}
      </p>

      <div style={{ ...cardStyle, marginBottom: 16, borderColor: 'rgba(200,240,90,0.25)' }}>
        <p
          style={{
            fontFamily: fontFamilySans,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: '#c8f05a',
            fontWeight: 600,
            margin: '0 0 12px',
          }}
        >
          Recommended City
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
          <span style={{ fontSize: 32, lineHeight: 1 }}>{recommended.flag}</span>
          <div>
            <p
              style={{
                fontFamily: fontFamilySerif,
                fontSize: 22,
                fontWeight: 700,
                color: '#f0ede8',
                margin: '0 0 4px',
                lineHeight: 1.2,
              }}
            >
              {recommended.name}, {recommended.country}
            </p>
            <p
              style={{
                fontFamily: fontFamilySans,
                fontSize: 14,
                color: 'rgba(240,237,232,0.65)',
                margin: 0,
              }}
            >
              Match score{' '}
              <strong style={{ color: '#c8f05a', fontWeight: 700 }}>{recommended.score}/100</strong>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StarRating rating={starRating} />
          <span
            style={{
              fontFamily: fontFamilySans,
              fontSize: 13,
              color: 'rgba(240,237,232,0.55)',
            }}
          >
            {starRating}/5
          </span>
        </div>
      </div>

      <DecisionConfidenceBlock confidence={decisionConfidence} />

      {whyBullets.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <p
            style={{
              fontFamily: fontFamilySans,
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: '#c8f05a',
              fontWeight: 600,
              margin: '0 0 14px',
            }}
          >
            Why this city wins
          </p>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {whyBullets.map((bullet) => (
              <li
                key={bullet}
                style={{
                  fontFamily: fontFamilySans,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'rgba(240,237,232,0.75)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: '#c8f05a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}

      {avoid.length > 0 && (
        <div style={cardStyle}>
          <p
            style={{
              fontFamily: fontFamilySans,
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: 'rgba(240,237,232,0.45)',
              fontWeight: 600,
              margin: '0 0 14px',
            }}
          >
            Cities you should avoid
          </p>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {avoid.map((city) => (
              <li key={`${city.name}|${city.country}`}>
                <p
                  style={{
                    fontFamily: fontFamilySans,
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#f0ede8',
                    margin: '0 0 4px',
                  }}
                >
                  {city.flag} {city.name}, {city.country}{' '}
                  <span style={{ color: 'rgba(240,237,232,0.45)', fontWeight: 400 }}>
                    ({city.score}/100)
                  </span>
                </p>
                <p
                  style={{
                    fontFamily: fontFamilySans,
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: 'rgba(240,237,232,0.6)',
                    margin: 0,
                  }}
                >
                  May not fit your priorities: {buildAvoidReason(city, plan.quiz_input.priorities)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
