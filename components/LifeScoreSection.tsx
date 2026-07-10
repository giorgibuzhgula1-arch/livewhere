'use client'

import { pickDecisionPlan } from '@/components/BlueprintDecisionSection'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'
import type { CityResult } from '@/lib/types'
import type { SavedRetirementPlan } from '@/lib/saved-plans'

type Props = {
  plans: SavedRetirementPlan[]
}

type LifeDimension = {
  label: string
  score: number
  summary?: boolean
}

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '20px 22px',
} as const

function recommendedCity(plans: SavedRetirementPlan[]): CityResult | null {
  const plan = pickDecisionPlan(plans)
  if (!plan) return null

  const ranked = plan.city_results
    .filter((city) => !city.locked)
    .sort((a, b) => b.score - a.score)

  return ranked[0] ?? null
}

/** Average of tax + housing sub-scores (both 0–100 on CityResult). */
function financialFitScore(city: CityResult): number {
  return Math.round((city.scores.tax + city.scores.housing) / 2)
}

function buildLifeDimensions(city: CityResult): LifeDimension[] {
  const dimensions: LifeDimension[] = [
    { label: 'Financial Fit', score: financialFitScore(city) },
  ]

  if (city.scores.expat != null) {
    dimensions.push({ label: 'Lifestyle Fit', score: city.scores.expat })
  }

  dimensions.push(
    { label: 'Safety Fit', score: city.scores.safety },
    { label: 'Healthcare Fit', score: city.scores.health },
    { label: 'Long-Term Stability', score: city.scores.stability },
    { label: 'Climate', score: city.scores.climate },
    { label: 'Overall Match', score: Math.round(city.score), summary: true },
  )

  return dimensions
}

function ScoreBar({ score, summary }: { score: number; summary?: boolean }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${score} out of 100`}
      style={{
        width: '100%',
        height: summary ? 8 : 6,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${score}%`,
          borderRadius: 999,
          background: summary ? '#c8f05a' : 'rgba(200,240,90,0.85)',
        }}
      />
    </div>
  )
}

export default function LifeScoreSection({ plans }: Props) {
  const city = recommendedCity(plans)
  if (!city) return null

  const dimensions = buildLifeDimensions(city)

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
        Life Score
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
        How {city.flag} {city.name} scores across the dimensions that shape daily life — beyond
        budget alone.
      </p>

      <div style={cardStyle}>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {dimensions.map((dimension, index) => (
            <li
              key={dimension.label}
              style={{
                padding: dimension.summary ? '18px 0 4px' : '14px 0',
                borderTop: dimension.summary ? '1px solid rgba(200,240,90,0.2)' : undefined,
                borderBottom:
                  !dimension.summary && index < dimensions.length - 1
                    ? '1px solid rgba(255,255,255,0.07)'
                    : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: fontFamilySans,
                    fontSize: dimension.summary ? 15 : 14,
                    fontWeight: dimension.summary ? 600 : 400,
                    color: dimension.summary
                      ? '#f0ede8'
                      : 'rgba(240,237,232,0.85)',
                  }}
                >
                  {dimension.label}
                </span>
                <span
                  style={{
                    fontFamily: fontFamilySans,
                    fontSize: dimension.summary ? 16 : 14,
                    fontWeight: 700,
                    color: dimension.summary ? '#c8f05a' : 'rgba(240,237,232,0.7)',
                    flexShrink: 0,
                  }}
                >
                  {dimension.score}
                </span>
              </div>
              <ScoreBar score={dimension.score} summary={dimension.summary} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
