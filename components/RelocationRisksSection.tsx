'use client'

import { pickDecisionPlan } from '@/components/BlueprintDecisionSection'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'
import { riskAssessment, type RiskLevel } from '@/lib/retirement-projections'
import type { CityResult } from '@/lib/types'
import { visaScoreForCountry } from '@/lib/visa-data'
import type { SavedRetirementPlan } from '@/lib/saved-plans'

type Props = {
  plans: SavedRetirementPlan[]
}

type RiskCategory = {
  label: string
  level: RiskLevel
}

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '20px 22px',
} as const

/** Higher benefit score → lower relocation risk. */
function benefitScoreToRisk(score: number): RiskLevel {
  if (score >= 75) return 'Low'
  if (score >= 50) return 'Medium'
  return 'High'
}

/** Higher hazard score → higher relocation risk (e.g. currency risk index). */
function hazardScoreToRisk(score: number): RiskLevel {
  if (score <= 25) return 'Low'
  if (score <= 50) return 'Medium'
  return 'High'
}

function riskBadgeColors(level: RiskLevel): { color: string; background: string; border: string } {
  switch (level) {
    case 'Low':
      return {
        color: '#c8f05a',
        background: 'rgba(200,240,90,0.12)',
        border: 'rgba(200,240,90,0.35)',
      }
    case 'Medium':
      return {
        color: '#f0c85a',
        background: 'rgba(240,200,90,0.12)',
        border: 'rgba(240,200,90,0.35)',
      }
    case 'High':
      return {
        color: '#f05a8c',
        background: 'rgba(240,90,140,0.12)',
        border: 'rgba(240,90,140,0.35)',
      }
  }
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const colors = riskBadgeColors(level)
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: fontFamilySans,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        padding: '5px 10px',
        borderRadius: 20,
        color: colors.color,
        background: colors.background,
        border: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}
    >
      {level}
    </span>
  )
}

function recommendedCity(plans: SavedRetirementPlan[]): CityResult | null {
  const plan = pickDecisionPlan(plans)
  if (!plan) return null

  const ranked = plan.city_results
    .filter((city) => !city.locked)
    .sort((a, b) => b.score - a.score)

  return ranked[0] ?? null
}

function buildRiskCategories(city: CityResult): RiskCategory[] {
  const categories: RiskCategory[] = [
    {
      label: 'Housing',
      level: benefitScoreToRisk(city.scores.housing),
    },
    {
      label: 'Healthcare',
      level: benefitScoreToRisk(city.scores.health),
    },
    {
      label: 'Taxes',
      level: benefitScoreToRisk(city.scores.tax),
    },
    {
      label: 'Political Stability',
      level: benefitScoreToRisk(city.scores.stability),
    },
  ]

  const visaScore = visaScoreForCountry(city.country)
  if (visaScore != null) {
    categories.push({
      label: 'Visa',
      level: benefitScoreToRisk(visaScore),
    })
  }

  categories.push({
    label: 'Climate',
    level: benefitScoreToRisk(city.scores.climate),
  })

  const { currencyRisk } = riskAssessment(city)
  categories.push({
    label: 'Currency',
    level: hazardScoreToRisk(currencyRisk),
  })

  return categories
}

export default function RelocationRisksSection({ plans }: Props) {
  const city = recommendedCity(plans)
  if (!city) return null

  const categories = buildRiskCategories(city)

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
        Relocation Risks
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
        For {city.flag} {city.name}, {city.country}
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
          {categories.map((category, index) => (
            <li
              key={category.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '14px 0',
                borderBottom:
                  index < categories.length - 1
                    ? '1px solid rgba(255,255,255,0.07)'
                    : 'none',
              }}
            >
              <span
                style={{
                  fontFamily: fontFamilySans,
                  fontSize: 15,
                  color: 'rgba(240,237,232,0.85)',
                }}
              >
                {category.label}
              </span>
              <RiskBadge level={category.level} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
