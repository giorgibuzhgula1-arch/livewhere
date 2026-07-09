'use client'

import { isBlueprintPlan, isPaidPlan, type UserPlan } from '@/lib/plan'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'
import type { SavedRetirementPlan } from '@/lib/saved-plans'

type Props = {
  plans: SavedRetirementPlan[]
  plan: UserPlan
}

export function calculateDecisionReadinessScore(
  plans: SavedRetirementPlan[],
  plan: UserPlan,
): number {
  let score = 0

  if (plans.length >= 1) score += 25

  if (plans.some((p) => Array.isArray(p.city_results) && p.city_results.length >= 1)) score += 15

  if (plans.length >= 2) score += 20

  if (isPaidPlan(plan)) score += 25

  if (isBlueprintPlan(plan)) score += 15

  return score
}

function readinessMessage(score: number): string {
  if (score >= 100) {
    return "You're fully equipped to make your move with confidence."
  }
  if (score >= 75) {
    return 'Almost there — download your Blueprint to lock in your relocation strategy.'
  }
  if (score >= 50) {
    return "You're close — upgrade to Pro or Blueprint for a confident, data-backed decision."
  }
  if (score >= 25) {
    return "You're exploring — compare a few more cities to sharpen your decision."
  }
  return "Let's get started — take the quiz to see your first personalized results."
}

export default function DecisionReadinessScore({ plans, plan }: Props) {
  const score = calculateDecisionReadinessScore(plans, plan)

  return (
    <section
      aria-label="Your Decision Readiness"
      style={{
        marginTop: 28,
        marginBottom: 0,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '24px',
      }}
    >
      <h2
        style={{
          fontFamily: fontFamilySerif,
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#f0ede8',
          margin: '0 0 20px',
        }}
      >
        Your Decision Readiness
      </h2>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: fontFamilySans,
            fontSize: 'clamp(40px, 6vw, 56px)',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: '#c8f05a',
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: fontFamilySans,
            fontSize: 'clamp(20px, 3vw, 28px)',
            fontWeight: 600,
            color: 'rgba(240, 237, 232, 0.45)',
          }}
        >
          %
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Decision readiness"
        style={{
          width: '100%',
          height: 10,
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            borderRadius: 999,
            background: '#c8f05a',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <p
        style={{
          fontFamily: fontFamilySans,
          fontSize: 14,
          lineHeight: 1.55,
          color: 'rgba(240, 237, 232, 0.7)',
          margin: 0,
        }}
      >
        {readinessMessage(score)}
      </p>
    </section>
  )
}
