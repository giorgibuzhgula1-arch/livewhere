'use client'

import { pickDecisionPlan } from '@/components/BlueprintDecisionSection'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'
import type { CityResult } from '@/lib/types'
import type { SavedRetirementPlan } from '@/lib/saved-plans'
import { getVisaInfoForCountry, recommendVisa } from '@/lib/visa-data'

type Props = {
  plans: SavedRetirementPlan[]
}

type NextStep = {
  month: number
  title: string
  description: string
}

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '20px 22px',
} as const

function recommendedContext(
  plans: SavedRetirementPlan[],
): { city: CityResult; plan: SavedRetirementPlan } | null {
  const plan = pickDecisionPlan(plans)
  if (!plan) return null

  const ranked = plan.city_results
    .filter((city) => !city.locked)
    .sort((a, b) => b.score - a.score)

  const city = ranked[0]
  if (!city) return null

  return { city, plan }
}

function buildNextSteps(city: CityResult, plan: SavedRetirementPlan): NextStep[] {
  const visaInfo = getVisaInfoForCountry(city.country)
  const monthlyBudget =
    typeof plan.quiz_input.monthlyBudget === 'number' && plan.quiz_input.monthlyBudget > 0
      ? plan.quiz_input.monthlyBudget
      : undefined
  const visaRec = visaInfo ? recommendVisa(visaInfo, monthlyBudget, plan.quiz_input.lifestyle) : null

  const month1Description = visaRec
    ? `For ${city.country}, start with the ${visaRec.option.name} (${visaRec.option.difficulty} — typical processing ${visaRec.option.processingTime}, est. ${visaRec.option.cost}). ${visaInfo!.summary}`
    : `Research long-stay and residency visa options for ${city.country}. Confirm requirements with official immigration sources before applying.`

  const month4Description = visaRec && visaRec.option.requirements.length > 0
    ? `Gather documents for your ${visaRec.option.name}: ${visaRec.option.requirements.slice(0, 4).join('; ')}.`
    : 'Collect passports, financial statements, health insurance proof, and any apostilled records your destination requires.'

  return [
    {
      month: 1,
      title: 'Research visa requirements',
      description: month1Description,
    },
    {
      month: 2,
      title: `Visit ${city.name}`,
      description: `Spend time in ${city.flag} ${city.name}, ${city.country} to confirm daily life, neighborhoods, and whether the match score (${Math.round(city.score)}/100) holds up in person.`,
    },
    {
      month: 3,
      title: 'Sell or lease your property',
      description:
        'Line up your current home — sell, lease, or sublet — so your departure timeline stays flexible once visa paperwork advances.',
    },
    {
      month: 4,
      title: 'Prepare and gather documents',
      description: month4Description,
    },
    {
      month: 5,
      title: `Move to ${city.name}`,
      description: `Relocate to ${city.flag} ${city.name}, ${city.country}. With estimated monthly costs around $${city.monthlyCost.toLocaleString()} and estimated monthly savings of $${Math.max(0, city.monthlySavings).toLocaleString()}/mo on your budget, finalize housing and local setup.`,
    },
  ]
}

export default function NextStepsSection({ plans }: Props) {
  const context = recommendedContext(plans)
  if (!context) return null

  const { city, plan } = context
  const steps = buildNextSteps(city, plan)

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
        Your Next Steps
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
        A month-by-month action plan for your move to {city.flag} {city.name} — more detailed than
        the high-level journey tracker on My Plans.
      </p>

      <div style={cardStyle}>
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {steps.map((step, index) => (
            <li
              key={step.month}
              style={{
                display: 'flex',
                gap: 18,
                paddingBottom: index < steps.length - 1 ? 24 : 0,
                marginBottom: index < steps.length - 1 ? 24 : 0,
                borderBottom:
                  index < steps.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  width: 52,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid rgba(200,240,90,0.45)',
                    background: 'rgba(200,240,90,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: fontFamilySans,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#c8f05a',
                  }}
                  aria-hidden
                >
                  {step.month}
                </div>
                {index < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      width: 1,
                      minHeight: 24,
                      marginTop: 8,
                      background: 'rgba(255,255,255,0.08)',
                    }}
                    aria-hidden
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                <p
                  style={{
                    fontFamily: fontFamilySans,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    color: 'rgba(200,240,90,0.75)',
                    margin: '0 0 6px',
                  }}
                >
                  Month {step.month}
                </p>
                <h3
                  style={{
                    fontFamily: fontFamilySans,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#f0ede8',
                    margin: '0 0 8px',
                    lineHeight: 1.3,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: fontFamilySans,
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: 'rgba(240,237,232,0.65)',
                    margin: 0,
                  }}
                >
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
