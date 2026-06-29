'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import {
  deleteSavedPlan,
  fetchSavedPlans,
  formatPlanDate,
  FREE_SAVED_PLANS_LIMIT,
  type SavedRetirementPlan,
} from '@/lib/saved-plans'
import { fetchUserPlan, isPaidPlan } from '@/lib/plan'
import SavedPlansCompare from '@/components/SavedPlansCompare'
import styles from '../compare/compare.module.css'

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false })

export default function PlansView() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [plans, setPlans] = useState<SavedRetirementPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [compareA, setCompareA] = useState<string>('')
  const [compareB, setCompareB] = useState<string>('')
  const [paid, setPaid] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchSavedPlans()
      setPlans(rows)
      if (rows.length > 0) {
        setActiveId((prev) => prev ?? rows[0].id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load plans')
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (cancelled) return
      setUser(u ? { id: u.id } : null)
      setAuthReady(true)

      if (u) {
        const plan = await fetchUserPlan()
        if (!cancelled) setPaid(isPaidPlan(plan))
        await loadPlans()
      } else {
        setLoading(false)
      }
    }

    void init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? { id: session.user.id } : null)
      if (session?.user) {
        void loadPlans()
        void fetchUserPlan().then((p) => setPaid(isPaidPlan(p)))
      } else {
        setPlans([])
        setActiveId(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadPlans])

  const activePlan = useMemo(
    () => plans.find((p) => p.id === activeId) ?? null,
    [plans, activeId],
  )

  const comparePlanA = useMemo(
    () => plans.find((p) => p.id === compareA) ?? null,
    [plans, compareA],
  )
  const comparePlanB = useMemo(
    () => plans.find((p) => p.id === compareB) ?? null,
    [plans, compareB],
  )

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this saved plan?')) return
    setDeletingId(id)
    try {
      await deleteSavedPlan(id)
      setPlans((prev) => prev.filter((p) => p.id !== id))
      if (activeId === id) setActiveId(null)
      if (compareA === id) setCompareA('')
      if (compareB === id) setCompareB('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  if (!authReady) {
    return (
      <main className={styles.page}>
        <p className={styles.subtitle}>Loading…</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <Link href="/" className={styles.back}>
          ← Back to LiveWhere
        </Link>
        <p className={styles.kicker}>My Plans</p>
        <h1 className={styles.title}>Saved retirement plans</h1>
        <p className={styles.subtitle}>
          Sign in to save quiz results and compare scenarios like Plan A vs Plan B.
        </p>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          style={{
            background: '#c8f05a',
            color: '#0a0a0f',
            border: 'none',
            padding: '14px 24px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Sign in
        </button>
        <AuthModal
          isOpen={authOpen}
          mode="login"
          onClose={() => setAuthOpen(false)}
          onModeSwitch={() => {}}
        />
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Back to LiveWhere
      </Link>

      <p className={styles.kicker}>My Plans</p>
      <h1 className={styles.title}>Saved retirement plans</h1>
      <p className={styles.subtitle}>
        {paid
          ? 'Unlimited saved plans on Premium.'
          : `${plans.length}/${FREE_SAVED_PLANS_LIMIT} plans saved on Free.`}
        {' '}Run a new quiz on the home page, then use &ldquo;Save this Plan&rdquo; on your results.
      </p>

      {error && (
        <div
          style={{
            background: 'rgba(240,90,140,0.1)',
            border: '1px solid rgba(240,90,140,0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            color: '#f05a8c',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'rgba(240,237,232,0.45)' }}>Loading your plans…</p>
      ) : plans.length === 0 ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 28,
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'rgba(240,237,232,0.6)', marginBottom: 16 }}>
            No saved plans yet. Complete the quiz and tap &ldquo;Save this Plan&rdquo; on your results.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: '#c8f05a',
              color: '#0a0a0f',
              textDecoration: 'none',
              padding: '12px 20px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Take the quiz
          </Link>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 14,
              marginBottom: 28,
            }}
          >
            {plans.map((plan) => {
              const isActive = plan.id === activeId
              return (
                <div
                  key={plan.id}
                  style={{
                    background: isActive ? 'rgba(200,240,90,0.06)' : 'var(--surface)',
                    border: `1px solid ${isActive ? 'rgba(200,240,90,0.35)' : 'var(--border)'}`,
                    borderRadius: 16,
                    padding: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.45)', marginBottom: 10 }}>
                    {formatPlanDate(plan.created_at)} · {plan.city_results.length} cities
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.7)', marginBottom: 14 }}>
                    Top: {plan.city_results[0]?.flag} {plan.city_results[0]?.name} ({plan.city_results[0]?.score})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setActiveId(plan.id)}
                      style={pillBtn(isActive)}
                    >
                      View
                    </button>
                    <Link href={`/?savedPlan=${plan.id}`} style={{ ...pillBtn(false), textDecoration: 'none' }}>
                      Open results
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(plan.id)}
                      disabled={deletingId === plan.id}
                      style={{
                        ...pillBtn(false),
                        color: '#f05a8c',
                        borderColor: 'rgba(240,90,140,0.35)',
                      }}
                    >
                      {deletingId === plan.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {activePlan && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: 24,
                marginBottom: 28,
              }}
            >
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>
                {activePlan.name}
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.5)', marginBottom: 16 }}>
                Budget {activePlan.quiz_input.monthlyBudget.toLocaleString()} {activePlan.quiz_input.currency}/mo
                {activePlan.quiz_input.lifestyle?.length
                  ? ` · ${activePlan.quiz_input.lifestyle.join(', ')}`
                  : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activePlan.city_results.slice(0, 12).map((city, i) => (
                  <div
                    key={`${city.name}|${city.country}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 10,
                      fontSize: 14,
                    }}
                  >
                    <span>
                      {i + 1}. {city.flag} {city.name}, {city.country}
                    </span>
                    <span style={{ color: '#c8f05a', fontWeight: 600 }}>{city.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: 24,
            }}
          >
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 16 }}>
              Compare two plans
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select plan A</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select plan B</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {comparePlanA && comparePlanB && comparePlanA.id !== comparePlanB.id && (
              <SavedPlansCompare planA={comparePlanA} planB={comparePlanB} />
            )}
            {compareA && compareB && compareA === compareB && (
              <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.5)' }}>Choose two different plans.</p>
            )}
          </div>
        </>
      )}
    </main>
  )
}

function pillBtn(active: boolean): React.CSSProperties {
  return {
    background: active ? 'rgba(200,240,90,0.15)' : 'transparent',
    border: `1px solid ${active ? 'rgba(200,240,90,0.4)' : 'rgba(255,255,255,0.12)'}`,
    color: active ? '#c8f05a' : 'rgba(240,237,232,0.75)',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  }
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: '#1a1a26',
  border: '1px solid rgba(255,255,255,0.07)',
  color: '#f0ede8',
  padding: '12px 14px',
  borderRadius: 10,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
}
