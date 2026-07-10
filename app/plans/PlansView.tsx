'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import {
  deleteSavedPlan,
  ensurePlanSummary,
  fetchSavedPlans,
  formatPlanDate,
  FREE_SAVED_PLANS_LIMIT,
  type SavedRetirementPlan,
} from '@/lib/saved-plans'
import {
  addFavoriteCity,
  cityFavoriteKey,
  fetchFavoriteCities,
  removeFavoriteCity,
  type FavoriteCity,
} from '@/lib/favorite-cities'
import { fetchUserProfile, isBlueprintPlan, isPaidPlan, type UserProfile } from '@/lib/plan'
import type { CityResult } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import SavedPlansCompare from '@/components/SavedPlansCompare'
import MonitorFeed from '@/components/MonitorFeed'
import RelocationJourney from '@/components/RelocationJourney'
import PlansClosingCta from '@/components/PlansClosingCta'
import MyDocuments from '@/components/MyDocuments'
import DecisionReadinessScore from '@/components/DecisionReadinessScore'
import CityFavoriteButton from '@/components/CityFavoriteButton'
import FavoriteCitiesStrip from '@/components/FavoriteCitiesStrip'
import styles from '../compare/compare.module.css'

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false })
const CityModal = dynamic(() => import('@/components/CityModal'), { ssr: false })

type ModalContext = {
  monthlyBudget?: number
  currency?: string
  lifestyle?: string[]
}

function firstNameFromUser(u: User): string | null {
  const meta = u.user_metadata
  if (meta && typeof meta === 'object' && typeof meta.full_name === 'string') {
    const first = meta.full_name.trim().split(/\s+/)[0]
    if (first) return first
  }
  const fromEmail = u.email?.split('@')[0]?.trim()
  return fromEmail || null
}

function welcomeHeading(firstName: string | null): string {
  if (firstName) {
    return `Welcome back, ${firstName}. Your relocation plan is ready.`
  }
  return 'Welcome back.'
}

export default function PlansView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const activeTab =
    tabParam === 'monitor' ? 'monitor' : tabParam === 'documents' ? 'documents' : 'plans'

  const [user, setUser] = useState<{ id: string; firstName: string | null } | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [plans, setPlans] = useState<SavedRetirementPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [compareA, setCompareA] = useState<string>('')
  const [compareB, setCompareB] = useState<string>('')
  const [profileReady, setProfileReady] = useState(false)
  const [paid, setPaid] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    plan: 'free',
    monitorUntil: null,
    monitorActive: false,
    stripeMonitorSubscriptionId: null,
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null)
  const [modalContext, setModalContext] = useState<ModalContext>({})
  const [summaryLoadingIds, setSummaryLoadingIds] = useState<Set<string>>(new Set())
  const summaryRequestedRef = useRef<Set<string>>(new Set())
  const [favorites, setFavorites] = useState<FavoriteCity[]>([])
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set())
  const [togglingFavoriteKey, setTogglingFavoriteKey] = useState<string | null>(null)

  const backfillSummaries = useCallback((rows: SavedRetirementPlan[]) => {
    for (const plan of rows) {
      if (plan.ai_summary?.trim() || summaryRequestedRef.current.has(plan.id)) continue
      summaryRequestedRef.current.add(plan.id)
      setSummaryLoadingIds((prev) => new Set(prev).add(plan.id))

      void ensurePlanSummary(plan).then((summary) => {
        setSummaryLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(plan.id)
          return next
        })
        if (summary) {
          setPlans((prev) =>
            prev.map((p) => (p.id === plan.id ? { ...p, ai_summary: summary } : p)),
          )
        }
      })
    }
  }, [])

  const loadFavorites = useCallback(async () => {
    console.log('[plans] loadFavorites called')
    try {
      const rows = await fetchFavoriteCities()
      console.log('[plans] loadFavorites success', rows.length)
      setFavorites(rows)
      setFavoriteKeys(new Set(rows.map((r) => cityFavoriteKey(r.city_name, r.city_country))))
    } catch (err) {
      console.error('[plans] loadFavorites failed', err)
      setFavorites([])
      setFavoriteKeys(new Set())
    }
  }, [])

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchSavedPlans()
      setPlans(rows)
      if (rows.length > 0) {
        setActiveId((prev) => prev ?? rows[0].id)
      }
      backfillSummaries(rows)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load plans')
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [backfillSummaries])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (cancelled) return
      setUser(u ? { id: u.id, firstName: firstNameFromUser(u) } : null)
      setAuthReady(true)

      if (u) {
        const profile = await fetchUserProfile()
        if (!cancelled) {
          setUserProfile(profile)
          setPaid(isPaidPlan(profile.plan))
          setProfileReady(true)
        }
        await loadPlans()
        await loadFavorites()
      } else {
        setProfileReady(true)
        setLoading(false)
      }
    }

    void init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? { id: session.user.id, firstName: firstNameFromUser(session.user) } : null)
      if (session?.user) {
        void loadPlans()
        void loadFavorites()
        void fetchUserProfile().then((profile) => {
          setUserProfile(profile)
          setPaid(isPaidPlan(profile.plan))
          setProfileReady(true)
        })
      } else {
        setPlans([])
        setActiveId(null)
        setFavorites([])
        setFavoriteKeys(new Set())
        setProfileReady(true)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadPlans, loadFavorites])

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

  const closingCtaHref = activePlan ? `/?savedPlan=${activePlan.id}` : '/pricing'

  const flagByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const plan of plans) {
      for (const city of plan.city_results) {
        map.set(cityFavoriteKey(city.name, city.country), city.flag)
      }
    }
    return map
  }, [plans])

  const isCityFavorited = useCallback(
    (cityName: string, cityCountry: string) =>
      favoriteKeys.has(cityFavoriteKey(cityName, cityCountry)),
    [favoriteKeys],
  )

  const toggleFavorite = useCallback(
    async (cityName: string, cityCountry: string) => {
      const key = cityFavoriteKey(cityName, cityCountry)
      if (togglingFavoriteKey) return

      const wasFavorited = favoriteKeys.has(key)
      setTogglingFavoriteKey(key)
      setFavoriteKeys((prev) => {
        const next = new Set(prev)
        if (wasFavorited) next.delete(key)
        else next.add(key)
        return next
      })

      try {
        if (wasFavorited) {
          await removeFavoriteCity(cityName, cityCountry)
          setFavorites((prev) =>
            prev.filter((f) => cityFavoriteKey(f.city_name, f.city_country) !== key),
          )
        } else {
          const row = await addFavoriteCity(cityName, cityCountry)
          setFavorites((prev) => [row, ...prev.filter((f) => f.id !== row.id)])
        }
      } catch {
        setFavoriteKeys((prev) => {
          const next = new Set(prev)
          if (wasFavorited) next.add(key)
          else next.delete(key)
          return next
        })
        void loadFavorites()
      } finally {
        setTogglingFavoriteKey(null)
      }
    },
    [favoriteKeys, togglingFavoriteKey, loadFavorites],
  )

  function handleCityClick(city: CityResult, plan: SavedRetirementPlan) {
    setModalContext({
      monthlyBudget: plan.quiz_input.monthlyBudget,
      currency: plan.quiz_input.currency,
      lifestyle: plan.quiz_input.lifestyle,
    })
    setSelectedCity(city)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this saved plan?')) return
    setDeletingId(id)
    try {
      await deleteSavedPlan(id)
      setPlans((prev) => prev.filter((p) => p.id !== id))
      summaryRequestedRef.current.delete(id)
      if (activeId === id) setActiveId(null)
      if (compareA === id) setCompareA('')
      if (compareB === id) setCompareB('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const visaMonthlyBudget =
    typeof modalContext.monthlyBudget === 'number' && modalContext.monthlyBudget > 0
      ? Math.round(modalContext.monthlyBudget)
      : undefined

  function setTab(tab: 'plans' | 'monitor' | 'documents') {
    if (tab === 'monitor' && profileReady && user && userProfile.plan === 'free') {
      router.push('/pricing')
      return
    }
    const href =
      tab === 'monitor' ? '/plans?tab=monitor' : tab === 'documents' ? '/plans?tab=documents' : '/plans'
    router.replace(href)
  }

  useEffect(() => {
    if (
      authReady &&
      profileReady &&
      user &&
      activeTab === 'monitor' &&
      userProfile.plan === 'free'
    ) {
      router.replace('/pricing')
    }
  }, [authReady, profileReady, user, activeTab, userProfile.plan, router])

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

      <p className={styles.kicker} style={{ marginBottom: 16 }}>
        My Relocation HQ
      </p>
      <h1
        className={styles.title}
        style={{
          maxWidth: 720,
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
          marginBottom: 28,
          color: '#f0ede8',
          fontWeight: 700,
        }}
      >
        {welcomeHeading(user?.firstName ?? null)}
      </h1>

      <RelocationJourney />

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setTab('plans')}
          style={tabBtn(activeTab === 'plans')}
        >
          My Plans
        </button>
        <button
          type="button"
          onClick={() => setTab('monitor')}
          style={tabBtn(activeTab === 'monitor')}
        >
          Monitor
        </button>
        <button
          type="button"
          onClick={() => setTab('documents')}
          style={tabBtn(activeTab === 'documents')}
        >
          My Documents
        </button>
      </div>

      {activeTab === 'monitor' ? (
        profileReady ? (
          <MonitorFeed userProfile={userProfile} />
        ) : (
          <p className={styles.subtitle}>Loading…</p>
        )
      ) : activeTab === 'documents' ? (
        <MyDocuments
          plans={plans}
          loading={loading}
          isBlueprint={isBlueprintPlan(userProfile.plan)}
        />
      ) : (
        <>
      <p className={styles.subtitle}>
        {paid
          ? 'Unlimited saved plans on Pro & Blueprint.'
          : `${plans.length}/${FREE_SAVED_PLANS_LIMIT} plan saved on Free.`}
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

      {!loading && (
        <FavoriteCitiesStrip
          favorites={favorites}
          flagByKey={flagByKey}
          isFavorited={isCityFavorited}
          onToggle={toggleFavorite}
          togglingKey={togglingFavoriteKey}
        />
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
              const topCity = plan.city_results[0]
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontSize: 13,
                      color: 'rgba(240,237,232,0.7)',
                      marginBottom: 14,
                    }}
                  >
                    <span>
                      Top: {topCity?.flag} {topCity?.name} ({topCity?.score})
                    </span>
                    {topCity && (
                      <CityFavoriteButton
                        favorited={isCityFavorited(topCity.name, topCity.country)}
                        onToggle={() => toggleFavorite(topCity.name, topCity.country)}
                        disabled={
                          togglingFavoriteKey === cityFavoriteKey(topCity.name, topCity.country)
                        }
                        cityLabel={`${topCity.name}, ${topCity.country}`}
                      />
                    )}
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
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 12 }}>
                {activePlan.name}
              </h2>

              {activePlan.ai_summary ? (
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'rgba(240,237,232,0.75)',
                    marginBottom: 16,
                    padding: '14px 16px',
                    background: 'rgba(200,240,90,0.04)',
                    border: '1px solid rgba(200,240,90,0.15)',
                    borderRadius: 12,
                  }}
                >
                  {activePlan.ai_summary}
                </p>
              ) : summaryLoadingIds.has(activePlan.id) ? (
                <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 16, fontStyle: 'italic' }}>
                  Building plan summary…
                </p>
              ) : null}

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
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 4px 4px 0',
                      borderRadius: 10,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCityClick(city, activePlan)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        fontSize: 14,
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'inherit',
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(200,240,90,0.35)'
                        e.currentTarget.style.background = 'rgba(200,240,90,0.04)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <span>
                        {i + 1}. {city.flag} {city.name}, {city.country}
                      </span>
                      <span style={{ color: '#c8f05a', fontWeight: 600 }}>{city.score}</span>
                    </button>
                    <CityFavoriteButton
                      favorited={isCityFavorited(city.name, city.country)}
                      onToggle={() => toggleFavorite(city.name, city.country)}
                      disabled={togglingFavoriteKey === cityFavoriteKey(city.name, city.country)}
                      cityLabel={`${city.name}, ${city.country}`}
                    />
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
              <SavedPlansCompare
                planA={comparePlanA}
                planB={comparePlanB}
                onCityClick={handleCityClick}
              />
            )}
            {compareA && compareB && compareA === compareB && (
              <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.5)' }}>Choose two different plans.</p>
            )}
          </div>
        </>
      )}

      <DecisionReadinessScore plans={plans} plan={userProfile.plan} />
        </>
      )}

      <PlansClosingCta href={closingCtaHref} />

      {selectedCity && (
        <CityModal
          city={selectedCity}
          monthlyBudget={visaMonthlyBudget}
          currency={modalContext.currency}
          lifestyle={modalContext.lifestyle}
          plan={userProfile.plan}
          onClose={() => setSelectedCity(null)}
        />
      )}
    </main>
  )
}

function tabBtn(active: boolean): React.CSSProperties {
  return {
    background: active ? 'rgba(200,240,90,0.12)' : 'transparent',
    border: `1px solid ${active ? 'rgba(200,240,90,0.4)' : 'rgba(255,255,255,0.12)'}`,
    color: active ? '#c8f05a' : 'rgba(240,237,232,0.6)',
    padding: '10px 18px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  }
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
