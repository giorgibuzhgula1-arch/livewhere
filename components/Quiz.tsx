'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnalyzeRequest, UserPriorities } from '@/lib/types'
import {
  trackBudgetSelected,
  trackPrioritiesCompleted,
  trackQuizCompleted,
  trackQuizStarted,
  trackQuizStepViewed,
} from '@/lib/analytics'

interface Props {
  onSubmit: (data: AnalyzeRequest) => void
  loading: boolean
  error: string | null
}

const LABELS: Record<number, string> = {
  1: 'Not important',
  2: 'Somewhat important',
  3: 'Important',
  4: 'Very important',
  5: 'Extremely important',
}

const PRIORITIES = [
  { key: 'tax', emoji: '💰', label: 'Low taxes' },
  { key: 'housing', emoji: '🏠', label: 'Affordable housing' },
  { key: 'health', emoji: '🏥', label: 'Healthcare' },
  { key: 'stability', emoji: '🏛️', label: 'Long-Term Stability' },
  { key: 'safety', emoji: '🔒', label: 'Safety' },
  { key: 'expat_community', emoji: '👥', label: 'Expat community' },
  { key: 'visa_residency', emoji: '🛂', label: 'Visa & residency ease' },
]

const LIFESTYLES: { key: string; label: string }[] = [
  { key: 'family', label: '👨‍👩‍👧 Family' },
  { key: 'wealth_preservation', label: '💰 Wealth Preservation' },
  { key: 'beach_life', label: '🏖️ Beach life' },
  { key: 'mountains', label: '🏔️ Mountains' },
  { key: 'city_buzz', label: '🏙️ City buzz' },
  { key: 'nature_slow_life', label: '🌿 Nature & slow life' },
  { key: 'retire_coast', label: '🏖️ Retire on the coast' },
  { key: 'healthcare_priority', label: '🏥 Healthcare priority' },
  { key: 'active_expat_community', label: '👴 Active expat community' },
  { key: 'warm_climate_year_round', label: '☀️ Warm climate year-round' },
]

const PRIORITY_LEVELS = [1, 2, 3, 4, 5] as const

const QUIZ_STEPS = [
  { id: 'lifestyle', label: 'Lifestyle' },
  ...PRIORITIES.map(({ key, label }) => ({ id: key, label })),
  { id: 'budget', label: 'Budget' },
] as const

const LAST_STEP = QUIZ_STEPS.length - 1
const BUDGET_STEP = LAST_STEP

function resolveDraftStep(draft: { step?: unknown; stepId?: unknown }): number {
  if (typeof draft.stepId === 'string') {
    const byId = QUIZ_STEPS.findIndex((item) => item.id === draft.stepId)
    if (byId >= 0) return byId
  }
  // Pre-split 3-step drafts: 0 lifestyle, 1 grouped priorities, 2 budget
  if (draft.step === 2) return BUDGET_STEP
  if (draft.step === 1) return 1
  if (draft.step === 0) return 0
  return 0
}

/**
 * Chip → monthlyBudget mapping for AnalyzeRequest / scoreCity.
 * The engine still receives a single USD number (not a range).
 * Values are representative points inside each band:
 *   under_1500 → 1200, 1500_2500 → 2000, 2500_4000 → 3250,
 *   4000_plus → 5500, not_sure → 2500 (previous slider default).
 */
const BUDGET_CHIPS = [
  { id: 'under_1500', label: '<$1,500', monthlyBudget: 1200 },
  { id: '1500_2500', label: '$1,500–2,500', monthlyBudget: 2000 },
  { id: '2500_4000', label: '$2,500–4,000', monthlyBudget: 3250 },
  { id: '4000_plus', label: '$4,000+', monthlyBudget: 5500 },
  { id: 'not_sure', label: 'Not sure yet', monthlyBudget: 2500 },
] as const

type BudgetChipId = (typeof BUDGET_CHIPS)[number]['id']

const QUIZ_DRAFT_KEY = 'livewhere_quiz_draft'

function persistQuizDraft(
  monthlyBudget: number,
  priorities: UserPriorities,
  lifestyle: string[],
  step: number,
  budgetChip: BudgetChipId | null,
) {
  const payload = JSON.stringify({
    monthlyBudget,
    priorities,
    lifestyle,
    step,
    stepId: QUIZ_STEPS[step]?.id ?? null,
    budgetChip,
  })
  try {
    sessionStorage.setItem(QUIZ_DRAFT_KEY, payload)
  } catch {
    /* private browsing / storage disabled */
  }
}

function clearQuizDraft() {
  try {
    sessionStorage.removeItem(QUIZ_DRAFT_KEY)
  } catch {
    /* private browsing / storage disabled */
  }
}

function scrollQuizIntoView() {
  const el = document.getElementById('quiz')
  if (!el) return
  const top = el.getBoundingClientRect().top
  if (top >= 0 && top < 80) return
  el.scrollIntoView({ behavior: 'auto', block: 'start' })
}

export default function Quiz({ onSubmit, loading, error }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  const [monthlyBudget, setMonthlyBudget] = useState(2500)
  const [priorities, setPriorities] = useState<UserPriorities>({
    tax: 4, housing: 4, climate: 3, health: 3, stability: 3, safety: 4,
    expat_community: 3, visa_residency: 3,
  })
  const [lifestyle, setLifestyle] = useState<string[]>([])
  const [budgetChip, setBudgetChip] = useState<BudgetChipId | null>(null)
  const [draftReady, setDraftReady] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const prioritiesTracked = useRef(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(QUIZ_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as {
        monthlyBudget?: unknown
        priorities?: UserPriorities
        lifestyle?: unknown
        step?: unknown
        stepId?: unknown
        budgetChip?: unknown
      }
      if (typeof draft.monthlyBudget === 'number') setMonthlyBudget(draft.monthlyBudget)
      if (draft.priorities && typeof draft.priorities === 'object') setPriorities(draft.priorities)
      if (Array.isArray(draft.lifestyle) && draft.lifestyle.every((x) => typeof x === 'string')) {
        setLifestyle(draft.lifestyle)
      }
      const restoredChip = BUDGET_CHIPS.find((chip) => draft.budgetChip === chip.id)
      if (restoredChip) {
        setBudgetChip(restoredChip.id)
        setMonthlyBudget(restoredChip.monthlyBudget)
      }
      setStep(resolveDraftStep(draft))
    } catch {
      /* private browsing / storage disabled / bad JSON */
    }
    setDraftReady(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setMobileNav(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!draftReady) return
    const el = sectionRef.current
    if (!el) return

    const fireStepView = () => {
      trackQuizStarted()
      trackQuizStepViewed(step + 1, QUIZ_STEPS[step].id)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fireStepView()
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [step, draftReady])

  function handleBudgetChip(id: BudgetChipId) {
    const chip = BUDGET_CHIPS.find((item) => item.id === id)
    if (!chip) return
    setBudgetChip(chip.id)
    setMonthlyBudget(chip.monthlyBudget)
    persistQuizDraft(chip.monthlyBudget, priorities, lifestyle, step, chip.id)
    trackBudgetSelected(chip.monthlyBudget)
  }

  function handlePriorityChange(key: keyof UserPriorities, value: number) {
    setPriorities((p) => {
      const next = { ...p, [key]: value }
      persistQuizDraft(monthlyBudget, next, lifestyle, step, budgetChip)
      return next
    })
    if (!prioritiesTracked.current) {
      prioritiesTracked.current = true
      trackPrioritiesCompleted()
    }
  }

  function toggleLifestyle(key: string) {
    setLifestyle(prev => {
      const next = prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
      persistQuizDraft(monthlyBudget, priorities, next, step, budgetChip)
      return next
    })
    if (!prioritiesTracked.current) {
      prioritiesTracked.current = true
      trackPrioritiesCompleted()
    }
  }

  function goToStep(nextStep: number) {
    if (nextStep < 0 || nextStep > LAST_STEP) return
    setStep(nextStep)
    persistQuizDraft(monthlyBudget, priorities, lifestyle, nextStep, budgetChip)
    scrollQuizIntoView()
  }

  function handleSubmit() {
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        const params = new URLSearchParams(window.location.search)
        console.log('[quiz-auth-debug] Quiz handleSubmit — quiz submitted', {
          href: window.location.href,
          search: window.location.search,
          restoreParam: params.get('restore'),
          budget: monthlyBudget,
        })
      }, 0)
    }
    trackQuizCompleted({ budget: monthlyBudget, lifestyleCount: lifestyle.length })
    clearQuizDraft()
    onSubmit({ monthlyBudget, currency: 'USD', priorities, lifestyle })
  }

  const currentStep = QUIZ_STEPS[step] ?? QUIZ_STEPS[0]
  const currentPriority = PRIORITIES.find((item) => item.key === currentStep.id) ?? null

  const navButtonBase: CSSProperties = {
    minHeight: 48,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    cursor: loading ? 'wait' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'all 0.2s',
    padding: '14px 20px',
  }

  const stepNav = (
    <div
      className="quiz-step-nav"
      style={{
        display: 'flex',
        gap: 12,
        position: 'sticky',
        bottom: 0,
        background: '#12121a',
        paddingTop: 8,
        marginTop: 8,
        zIndex: 2,
      }}
    >
      {step > 0 && (
        <button
          type="button"
          onClick={() => goToStep(step - 1)}
          disabled={loading}
          style={{
            ...navButtonBase,
            flex: '0 0 auto',
            minWidth: 88,
            background: '#1a1a26',
            color: '#f0ede8',
            border: '1px solid rgba(255,255,255,0.07)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          Back
        </button>
      )}
      {step < LAST_STEP ? (
        <button
          type="button"
          onClick={() => goToStep(step + 1)}
          disabled={loading}
          style={{
            ...navButtonBase,
            flex: 1,
            background: '#c8f05a',
            color: '#0a0a0f',
            border: 'none',
            opacity: loading ? 0.85 : 1,
          }}
        >
          Next
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          aria-busy={loading}
          style={{
            ...navButtonBase,
            flex: 1,
            background: '#c8f05a',
            color: '#0a0a0f',
            border: 'none',
            opacity: loading ? 0.85 : 1,
          }}
        >
          {loading ? (
            <>
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  border: '2px solid rgba(10,10,15,0.25)',
                  borderTopColor: '#0a0a0f',
                  borderRadius: '50%',
                  animation: 'quiz-submit-spin 0.8s linear infinite',
                  flexShrink: 0,
                }}
              />
              Analyzing your matches…
            </>
          ) : (
            <>✦ Analyze & Find My Countries</>
          )}
        </button>
      )}
    </div>
  )

  return (
    <section ref={sectionRef} style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ The Tool
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 48 }}>
        Your personalized<br />country score
      </h2>

      <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24 }}>
        <div className="quiz-card-header" style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Tell us about yourself</div>
          <div className="quiz-step-badge" style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', background: '#1a1a26', padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            Step {step + 1} of {QUIZ_STEPS.length}
          </div>
        </div>

        <div className="quiz-card-body" style={{ padding: 40 }}>
          {currentStep.id === 'lifestyle' && (
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 12, fontWeight: 500, display: 'block' }}>
                Your lifestyle (select all that apply)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {LIFESTYLES.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className="quiz-lifestyle-chip"
                    onClick={() => toggleLifestyle(key)}
                    style={{
                      padding: '10px 18px', borderRadius: 30, fontSize: 13, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                      minHeight: 44,
                      background: lifestyle.includes(key) ? 'rgba(200,240,90,0.12)' : '#1a1a26',
                      border: lifestyle.includes(key) ? '1px solid #c8f05a' : '1px solid rgba(255,255,255,0.07)',
                      color: lifestyle.includes(key) ? '#c8f05a' : '#f0ede8',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentPriority && (
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 14, color: '#f0ede8', marginBottom: 6, fontWeight: 600, display: 'block' }}>
                {currentPriority.emoji} {currentPriority.label}
              </label>
              <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
                {LABELS[priorities[currentPriority.key as keyof UserPriorities]]}
              </p>
              <div className="quiz-priority-level-chips">
                {PRIORITY_LEVELS.map((level) => {
                  const selected = priorities[currentPriority.key as keyof UserPriorities] === level
                  return (
                    <button
                      key={level}
                      type="button"
                      className="quiz-priority-level-chip"
                      onClick={() => handlePriorityChange(currentPriority.key as keyof UserPriorities, level)}
                      aria-pressed={selected}
                      aria-label={`${level} · ${LABELS[level]}`}
                      style={{
                        minHeight: 48,
                        minWidth: 48,
                        padding: '12px 8px',
                        borderRadius: 14,
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textAlign: 'center',
                        background: selected ? 'rgba(200,240,90,0.12)' : '#1a1a26',
                        border: selected ? '1px solid #c8f05a' : '1px solid rgba(255,255,255,0.07)',
                        color: selected ? '#c8f05a' : '#f0ede8',
                      }}
                    >
                      {level}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentStep.id === 'budget' && (
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 14, color: '#f0ede8', marginBottom: 6, fontWeight: 600, display: 'block' }}>
                Your monthly budget to live abroad
              </label>
              <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
                This includes rent, food, healthcare & lifestyle
              </p>
              <div className="quiz-budget-chips">
                {BUDGET_CHIPS.map((chip) => {
                  const selected = budgetChip === chip.id
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      className="quiz-budget-chip"
                      onClick={() => handleBudgetChip(chip.id)}
                      aria-pressed={selected}
                      style={{
                        minHeight: 48,
                        padding: '12px 16px',
                        borderRadius: 14,
                        fontSize: 15,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: selected ? 'rgba(200,240,90,0.12)' : '#1a1a26',
                        border: selected ? '1px solid #c8f05a' : '1px solid rgba(255,255,255,0.07)',
                        color: selected ? '#c8f05a' : '#f0ede8',
                      }}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <style>{`
            @keyframes quiz-submit-spin { to { transform: rotate(360deg) } }
            .quiz-budget-chips {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }
            .quiz-budget-chip {
              width: 100%;
            }
            .quiz-budget-chips .quiz-budget-chip:last-child {
              grid-column: 1 / -1;
            }
            .quiz-priority-level-chips {
              display: grid;
              grid-template-columns: repeat(5, minmax(0, 1fr));
              gap: 8px;
            }
            .quiz-priority-level-chip {
              width: 100%;
            }
            @media (max-width: 767px) {
              .quiz-card-header {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 10px !important;
                padding: 16px 20px !important;
              }
              .quiz-card-body {
                padding: 20px !important;
                padding-bottom: 120px !important;
              }
              .quiz-step-nav {
                position: fixed !important;
                left: 0;
                right: 0;
                bottom: 0;
                padding: 12px 16px !important;
                padding-bottom: max(12px, env(safe-area-inset-bottom)) !important;
                margin-top: 0 !important;
                border-top: 1px solid rgba(255,255,255,0.07);
                z-index: 95 !important;
                pointer-events: auto;
                touch-action: manipulation;
              }
              .quiz-step-nav button {
                touch-action: manipulation;
                pointer-events: auto;
              }
            }
          `}</style>

          {error && (
            <div style={{ background: 'rgba(240,90,140,0.1)', border: '1px solid rgba(240,90,140,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#f05a8c', fontSize: 14 }}>
              {error}
            </div>
          )}

          {mobileNav ? createPortal(stepNav, document.body) : stepNav}
        </div>
      </div>
    </section>
  )
}
