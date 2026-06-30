'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import CorePromise from '@/components/CorePromise'
import Quiz from '@/components/Quiz'
import HowItWorks from '@/components/HowItWorks'
import RetirementStatsBar from '@/components/RetirementStatsBar'
import SavingsCalculator from '@/components/SavingsCalculator'
import Pricing from '@/components/Pricing'

const Results = dynamic(() => import('@/components/Results'), { ssr: false })
const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false })
import { parseStreamingBufferToCities } from '@/lib/parse-streaming-cities'
import { supabase } from '@/lib/supabase'
import { CityResult, AnalyzeRequest } from '@/lib/types'
import {
  savePendingResults,
  loadPendingResults,
  clearPendingResults,
  hasPendingResults,
} from '@/lib/pending-results'
import {
  savePendingAnalyze,
  loadPendingAnalyze,
  clearPendingAnalyze,
} from '@/lib/pending-analyze'
import {
  waitForAuthSession,
  clearPostAuthRestoreState,
  clearOAuthReturn,
  isOAuthReturnPending,
  saveOAuthNext,
} from '@/lib/wait-for-session'
import type { Session } from '@supabase/supabase-js'
import { startProCheckout } from '@/lib/start-pro-checkout'
import { fetchSavedPlanById } from '@/lib/saved-plans'
import { trackPremiumButtonClicked, trackPurchaseCompleted, type PremiumPlan } from '@/lib/analytics'

type StreamPayload =
  | { type: 'delta'; text: string }
  | { type: 'status'; text: string }
  | { type: 'city'; city: CityResult }
  | { type: 'done'; cities: CityResult[] }
  | { type: 'error'; error: string }
  | { type: 'limits'; maxCities: number | null }

function mergeStreamedCity(list: CityResult[], city: CityResult): CityResult[] {
  const key = `${city.name}|${city.country}`
  const next = list.filter((c) => `${c.name}|${c.country}` !== key)
  next.push(city)
  return next.sort((a, b) => b.score - a.score)
}

function parseSseEvents(chunk: string): { events: StreamPayload[]; rest: string } {
  const normalized = chunk.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '')
  const events: StreamPayload[] = []
  const parts = normalized.split('\n\n')
  const rest = parts.pop() ?? ''
  for (const part of parts) {
    for (const line of part.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.toLowerCase().startsWith('data:')) continue
      const colon = trimmed.indexOf(':')
      const jsonStr = trimmed.slice(colon + 1).trim()
      if (!jsonStr) continue
      try {
        events.push(JSON.parse(jsonStr) as StreamPayload)
      } catch {
        /* ignore malformed frame */
      }
    }
  }
  return { events, rest }
}

async function isLoggedIn(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return Boolean(session?.user)
}

/** Poll up to ~8s for session after OAuth before giving up on restore. */
const RESTORE_SESSION_MAX_ATTEMPTS = 64
const RESTORE_SESSION_POLL_MS = 125

/** Cached after first read so stale `livewhere_oauth_return` cannot leak into a later quiz. */
let postOAuthRestoreCached: boolean | null = null

function resetPostOAuthRestoreCache(): void {
  if (typeof window === 'undefined') {
    postOAuthRestoreCached = null
    return
  }
  const fromUrl = new URLSearchParams(window.location.search).get('restore') === 'results'
  postOAuthRestoreCached = fromUrl
}

function isPostOAuthRestore(): boolean {
  if (typeof window === 'undefined') return false
  if (postOAuthRestoreCached !== null) return postOAuthRestoreCached

  const fromUrl = new URLSearchParams(window.location.search).get('restore') === 'results'
  const fromOAuthFlag = isOAuthReturnPending()
  if (fromOAuthFlag) {
    clearOAuthReturn()
  }
  postOAuthRestoreCached = fromUrl || fromOAuthFlag
  return postOAuthRestoreCached
}

function logQuizAuthDebug(context: string, extra?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const restoreParam = params.get('restore')
  const oauthReturnPending = isOAuthReturnPending()
  console.log('[quiz-auth-debug]', context, {
    href: window.location.href,
    search: window.location.search,
    restoreParam,
    oauthReturnPending,
    isPostOAuthRestore: isPostOAuthRestore(),
    localStorage_oauth_return: localStorage.getItem('livewhere_oauth_return'),
    localStorage_pending_auth_restore: localStorage.getItem('livewhere_pending_auth_restore'),
    localStorage_oauth_next: localStorage.getItem('livewhere_oauth_next'),
    hasPendingResults: hasPendingResults(),
    hasPendingAnalyze: Boolean(loadPendingAnalyze()),
    ...extra,
  })
}

export default function HomePageClient({
  defaultSavingsLocation = 'Florida',
}: {
  defaultSavingsLocation?: string
}) {
  const [matches, setMatches] = useState<CityResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [authVariant, setAuthVariant] = useState<'default' | 'results'>('default')
  const [error, setError] = useState<string | null>(null)
  const [resultMaxCities, setResultMaxCities] = useState<number | null>(null)
  const [quizData, setQuizData] = useState<AnalyzeRequest | null>(null)
  const [awaitingAuthToView, setAwaitingAuthToView] = useState(false)
  const [restoringAfterOAuth, setRestoringAfterOAuth] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  useEffect(() => {
    if (!awaitingAuthToView && !authOpen && !restoringAfterOAuth) return
    logQuizAuthDebug('auth UI state changed', {
      awaitingAuthToView,
      restoringAfterOAuth,
      authOpen,
      loading,
      matchesIsNull: matches === null,
      authVariant,
    })
  }, [awaitingAuthToView, restoringAfterOAuth, authOpen, loading, matches, authVariant])

  const showLanding =
    matches === null && !loading && !awaitingAuthToView && !restoringAfterOAuth
  const showHero =
    !(matches !== null && matches.length > 0) &&
    !(matches !== null && loading && matches.length === 0)

  const revealPendingResults = useCallback(async (existingSession?: Session | null): Promise<boolean> => {
    const pending = loadPendingResults()
    if (!pending?.cities.length) return false

    let session = existingSession ?? null
    if (!session?.user) {
      const { data: { session: quick } } = await supabase.auth.getSession()
      session = quick
    }
    if (!session?.user) return false

    const pendingRequest = loadPendingAnalyze()
    if (pendingRequest) setQuizData(pendingRequest)
    setMatches(pending.cities)
    setResultMaxCities(pending.maxCities)
    clearPendingResults()
    clearPendingAnalyze()
    clearPostAuthRestoreState()
    setAwaitingAuthToView(false)
    setRestoringAfterOAuth(false)
    setRestoreError(null)
    setAuthOpen(false)
    setAuthVariant('default')
    if (typeof window !== 'undefined' && window.location.search.includes('restore=results')) {
      window.history.replaceState(null, '', '/')
    }
    resetPostOAuthRestoreCache()
    return true
  }, [])

  const waitForRestoreSession = useCallback(async (reason: string): Promise<Session | null> => {
    logQuizAuthDebug('waitForRestoreSession CALLED', { reason })
    const startedAt = Date.now()
    const { data: { session: existing } } = await supabase.auth.getSession()
    if (existing?.user) {
      logQuizAuthDebug('waitForRestoreSession DONE (existing session)', {
        reason,
        elapsedMs: Date.now() - startedAt,
        userId: existing.user.id,
      })
      return existing
    }
    logQuizAuthDebug('waitForRestoreSession polling waitForAuthSession', {
      reason,
      maxAttempts: RESTORE_SESSION_MAX_ATTEMPTS,
      pollMs: RESTORE_SESSION_POLL_MS,
      maxWaitMs: RESTORE_SESSION_MAX_ATTEMPTS * RESTORE_SESSION_POLL_MS,
    })
    const session = await waitForAuthSession(RESTORE_SESSION_MAX_ATTEMPTS, RESTORE_SESSION_POLL_MS)
    logQuizAuthDebug('waitForRestoreSession DONE (after poll)', {
      reason,
      elapsedMs: Date.now() - startedAt,
      hasSession: Boolean(session?.user),
      userId: session?.user?.id ?? null,
    })
    return session
  }, [])

  const openAuthForResults = useCallback(() => {
    logQuizAuthDebug('openAuthForResults')
    saveOAuthNext('/?restore=results')
    setAuthVariant('results')
    setAuthMode('signup')
    setAuthOpen(true)
    logQuizAuthDebug('openAuthForResults — authOpen set true')
  }, [])

  const savePendingAnonymousResults = useCallback((cities: CityResult[], maxCities: number | null) => {
    logQuizAuthDebug('savePendingAnonymousResults — analyze done, anonymous user', {
      cityCount: cities.length,
      maxCities,
      isPostOAuthRestore: isPostOAuthRestore(),
    })
    savePendingResults(cities, maxCities)
    setMatches(null)
  }, [])

  const runAnalyze = useCallback(async (
    data: AnalyzeRequest,
    options?: { isRestoreRefetch?: boolean },
  ) => {
    if (!options?.isRestoreRefetch) {
      clearOAuthReturn()
      resetPostOAuthRestoreCache()
    }
    logQuizAuthDebug('runAnalyze START', {
      isRestoreRefetch: Boolean(options?.isRestoreRefetch),
      isPostOAuthRestore: isPostOAuthRestore(),
      clearedOAuthReturn: !options?.isRestoreRefetch,
    })
    setLoading(true)
    setError(null)
    setRestoreError(null)
    setQuizData(data)
    savePendingAnalyze(data)
    if (!options?.isRestoreRefetch) {
      clearPendingResults()
    }
    setMatches([])
    setResultMaxCities(null)

    let accumulatedAi = ''
    let usedDataEngine = false
    let anonymousAuthGate = false
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const startedLoggedIn = Boolean(session?.user)

      if (!options?.isRestoreRefetch) {
        if (startedLoggedIn) {
          setAwaitingAuthToView(false)
        } else {
          anonymousAuthGate = true
          setAwaitingAuthToView(true)
          openAuthForResults()
          logQuizAuthDebug('runAnalyze — opened auth modal at analyze start (anonymous)')
        }
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      if (res.status === 403) {
        const json = await res.json().catch(() => ({}))
        setMatches(null)
        if (anonymousAuthGate) {
          setAuthOpen(false)
          setAwaitingAuthToView(false)
        }
        setError(json.error || 'Free plan limit reached. Upgrade to Pro for unlimited searches.')
        return
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setMatches(null)
        if (anonymousAuthGate) {
          setAuthOpen(false)
          setAwaitingAuthToView(false)
        }
        setError((json as { error?: string }).error || 'Something went wrong')
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setMatches(null)
        setError('No response body')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let finished = false
      let streamError: string | null = null
      let streamMaxCities: number | null = null
      const loggedIn = await isLoggedIn()

      const capMatches = (list: CityResult[]) =>
        streamMaxCities != null && list.length > streamMaxCities
          ? list.slice(0, streamMaxCities)
          : list

      const finishWithCities = async (cities: CityResult[]) => {
        const capped = capMatches(cities)
        const loggedInNow = await isLoggedIn()
        logQuizAuthDebug('finishWithCities — analyze stream done', {
          cityCount: capped.length,
          loggedIn: loggedInNow,
          isPostOAuthRestore: isPostOAuthRestore(),
        })
        if (loggedInNow) {
          setMatches(capped)
          setAwaitingAuthToView(false)
          setAuthOpen(false)
          setAuthVariant('default')
          clearPendingResults()
          clearPendingAnalyze()
          clearPostAuthRestoreState()
        } else {
          savePendingAnonymousResults(capped, streamMaxCities)
        }
      }

      const applyPayload = async (payload: StreamPayload) => {
        if (payload.type === 'limits') {
          streamMaxCities = payload.maxCities
          setResultMaxCities(payload.maxCities)
        } else if (payload.type === 'status') {
          usedDataEngine = true
        } else if (payload.type === 'city') {
          usedDataEngine = true
          // Free-tier cities stream in as locked teasers before the server
          // knows which one is the #1 match. Painting them now would render
          // the eventual top match locked, then flash to unlocked when the
          // authoritative `done` payload arrives. So only paint streamed
          // cities that are already unlocked; free tier waits for `done`.
          if (loggedIn && !payload.city.locked) {
            setMatches((prev) => capMatches(mergeStreamedCity(prev ?? [], payload.city)))
          }
        } else if (payload.type === 'delta') {
          if (loggedIn) {
            accumulatedAi += payload.text
            setMatches(capMatches(parseStreamingBufferToCities(accumulatedAi, data)))
          }
        } else if (payload.type === 'done') {
          await finishWithCities(payload.cities)
          finished = true
        } else if (payload.type === 'error') {
          streamError = payload.error
          setError(payload.error)
          finished = true
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const { events, rest } = parseSseEvents(buffer)
        buffer = rest

        for (const payload of events) {
          await applyPayload(payload)
        }
      }

      buffer += decoder.decode()
      if (buffer.trim()) {
        const { events } = parseSseEvents(buffer + '\n\n')
        for (const payload of events) {
          await applyPayload(payload)
        }
      }

      if (!finished && !streamError && !usedDataEngine) {
        if (accumulatedAi.trim()) {
          const recovered = capMatches(parseStreamingBufferToCities(accumulatedAi, data))
          if (recovered.length > 0) {
            await finishWithCities(recovered)
          } else {
            setError('Analysis ended before results were ready')
          }
        } else {
          setError('Analysis ended before results were ready')
        }
      }
    } catch {
      setMatches(null)
      setError('Network error. Please try again.')
      setAuthOpen(false)
      setAwaitingAuthToView(false)
    } finally {
      setLoading(false)
      logQuizAuthDebug('runAnalyze FINALLY — loading=false', {
        isPostOAuthRestore: isPostOAuthRestore(),
      })
    }
  }, [openAuthForResults, savePendingAnonymousResults])

  const runAnalyzeRef = useRef(runAnalyze)
  runAnalyzeRef.current = runAnalyze

  const attemptPostAuthRestore = useCallback(async (): Promise<boolean> => {
    const postOAuth = isPostOAuthRestore()
    logQuizAuthDebug('attemptPostAuthRestore CALLED', { isPostOAuthRestore: postOAuth })
    if (!postOAuth) {
      logQuizAuthDebug('attemptPostAuthRestore SKIP — not post-OAuth restore')
      return false
    }

    const hasResults = hasPendingResults()
    const quiz = loadPendingAnalyze()

    if (!hasResults && !quiz) {
      clearPostAuthRestoreState()
      resetPostOAuthRestoreCache()
      setRestoringAfterOAuth(false)
      setRestoreError(null)
      return false
    }

    if (hasResults) {
      logQuizAuthDebug('attemptPostAuthRestore — has pending results, will wait for session')
      setAwaitingAuthToView(true)
      setRestoringAfterOAuth(true)
      setRestoreError(null)

      const session = await waitForRestoreSession('attemptPostAuthRestore:hasResults')
      if (session?.user && (await revealPendingResults(session))) {
        return true
      }

      if (hasPendingResults()) {
        setRestoringAfterOAuth(false)
        setRestoreError(
          'Could not verify your sign-in. Your results are still saved — try signing in again.',
        )
        setAwaitingAuthToView(true)
        return false
      }
    }

    if (!quiz) {
      clearPostAuthRestoreState()
      setRestoringAfterOAuth(false)
      return false
    }

    setRestoringAfterOAuth(true)
    setRestoreError(null)
    logQuizAuthDebug('attemptPostAuthRestore — no results snapshot, refetching quiz after session')
    const session = await waitForRestoreSession('attemptPostAuthRestore:refetchQuiz')
    if (!session?.user) {
      setRestoringAfterOAuth(false)
      setRestoreError(
        'Could not verify your sign-in. Your quiz answers are saved — try signing in again.',
      )
      setAwaitingAuthToView(true)
      return false
    }

    setRestoringAfterOAuth(false)
    setAwaitingAuthToView(false)
    clearPostAuthRestoreState()
    if (typeof window !== 'undefined' && window.location.search.includes('restore=results')) {
      window.history.replaceState(null, '', '/')
    }
    resetPostOAuthRestoreCache()
    await runAnalyzeRef.current(quiz, { isRestoreRefetch: true })
    return true
  }, [revealPendingResults, waitForRestoreSession])

  const openAuthForSave = useCallback(() => {
    setAuthVariant('default')
    setAuthMode('login')
    setAuthOpen(true)
  }, [])

  const restoreAttemptedRef = useRef(false)
  const savedPlanAttemptedRef = useRef(false)
  const purchaseTrackedRef = useRef(false)

  // Track successful Stripe purchase return.
  useEffect(() => {
    if (purchaseTrackedRef.current || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') !== 'true') return

    const sessionId = params.get('session_id')
    const plan = (params.get('plan') ?? 'pro') as PremiumPlan
    if (!sessionId) return

    purchaseTrackedRef.current = true
    trackPurchaseCompleted({ transactionId: sessionId, plan })

    params.delete('upgraded')
    params.delete('session_id')
    params.delete('plan')
    const remaining = params.toString()
    window.history.replaceState(null, '', remaining ? `/?${remaining}` : '/')
  }, [])

  // Load a saved plan from /?savedPlan=<id> (logged-in users only).
  useEffect(() => {
    if (savedPlanAttemptedRef.current) return
    if (typeof window === 'undefined') return

    const planId = new URLSearchParams(window.location.search).get('savedPlan')
    if (!planId) return

    const savedPlanId = planId
    savedPlanAttemptedRef.current = true
    let cancelled = false

    async function loadSavedPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return

      if (!user) {
        openAuthForSave()
        return
      }

      try {
        const plan = await fetchSavedPlanById(savedPlanId)
        if (cancelled || !plan) return

        setQuizData(plan.quiz_input)
        setMatches(plan.city_results)
        setResultMaxCities(plan.max_cities)
        setAwaitingAuthToView(false)
        setError(null)
        window.history.replaceState(null, '', '/')
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load saved plan')
        }
      }
    }

    void loadSavedPlan()

    return () => { cancelled = true }
  }, [openAuthForSave])

  // Keep quiz inputs in sync when results are shown (e.g. after auth restore).
  useEffect(() => {
    if (matches === null || matches.length === 0 || quizData) return
    const pending = loadPendingAnalyze()
    if (pending) setQuizData(pending)
  }, [matches, quizData])

  // Restore results after OAuth redirect (full page remount loses React state).
  useEffect(() => {
    logQuizAuthDebug('restore useEffect mount')
    if (restoreAttemptedRef.current) {
      logQuizAuthDebug('restore useEffect SKIP — already attempted')
      return
    }
    restoreAttemptedRef.current = true

    const postOAuth = isPostOAuthRestore()
    logQuizAuthDebug('restore useEffect — isPostOAuthRestore check', { isPostOAuthRestore: postOAuth })
    if (!postOAuth) {
      logQuizAuthDebug('restore useEffect SKIP — not post-OAuth restore')
      return
    }

    const pending = loadPendingResults()
    if (pending?.cities.length) {
      setAwaitingAuthToView(true)
      setResultMaxCities(pending.maxCities)
    }

    let cancelled = false

    void (async () => {
      if (cancelled) return
      await attemptPostAuthRestore()
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logQuizAuthDebug('onAuthStateChange', {
        event,
        hasUser: Boolean(session?.user),
        isPostOAuthRestore: isPostOAuthRestore(),
      })
      if (
        !session?.user ||
        (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION' && event !== 'TOKEN_REFRESHED')
      ) {
        return
      }
      if (!isPostOAuthRestore()) return
      void (async () => {
        if (await revealPendingResults(session)) return
        if (hasPendingResults()) return
        const quiz = loadPendingAnalyze()
        if (!quiz) return
        setAuthOpen(false)
        setAuthVariant('default')
        setRestoringAfterOAuth(false)
        setRestoreError(null)
        clearPostAuthRestoreState()
        await runAnalyzeRef.current(quiz, { isRestoreRefetch: true })
      })()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [attemptPostAuthRestore, revealPendingResults])

  async function handleAnalyzeRequest(data: AnalyzeRequest) {
    await runAnalyze(data)
  }

  function handleResetMatches() {
    setMatches(null)
    setQuizData(null)
    setError(null)
    setRestoreError(null)
    setAwaitingAuthToView(false)
    setRestoringAfterOAuth(false)
    clearPostAuthRestoreState()
    resetPostOAuthRestoreCache()
    clearPendingResults()
    clearPendingAnalyze()
  }

  function openSignInToView() {
    openAuthForResults()
  }

  async function handleUnlockPro() {
    trackPremiumButtonClicked({ plan: 'pro', location: 'results' })
    try {
      await startProCheckout('results')
    } catch {
      setAuthVariant('default')
      setAuthMode('login')
      setAuthOpen(true)
    }
  }

  return (
    <main style={{ position: 'relative' }}>
      <Navbar
        onAuthClick={() => { setAuthVariant('default'); setAuthOpen(true); setAuthMode('login') }}
        onLogoClick={handleResetMatches}
      />

      {showHero && (
        <Hero onStart={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })} />
      )}

      {showLanding && (
        <>
          <CorePromise />
          <SavingsCalculator defaultLocation={defaultSavingsLocation} />
          <div id="quiz">
            <Quiz onSubmit={handleAnalyzeRequest} loading={loading} error={error} />
          </div>
          <RetirementStatsBar />
          <HowItWorks />
          <Pricing onUpgrade={() => { setAuthVariant('default'); setAuthOpen(true); setAuthMode('signup') }} />
        </>
      )}

      {matches !== null && loading && matches.length === 0 && (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '24px',
          padding: '0 20px'
        }}>
          <div style={{
            width: 60, height: 60,
            border: '3px solid #1a1a26',
            borderTopColor: '#c8f05a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: 14, textAlign: 'center' }}>
            Starting your personalized analysis…
          </p>
        </div>
      )}

      {awaitingAuthToView && !loading && matches === null && (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20, padding: 20,
        }}>
          {restoringAfterOAuth ? (
            <>
              <div style={{
                width: 48, height: 48,
                border: '3px solid #1a1a26',
                borderTopColor: '#c8f05a',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <p style={{ color: 'rgba(240,237,232,0.55)', fontSize: 15, textAlign: 'center' }}>
                Restoring your results…
              </p>
            </>
          ) : restoreError ? (
            <>
              <p style={{ color: '#f05a8c', fontSize: 14, textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>
                {restoreError}
              </p>
              <button
                type="button"
                onClick={() => {
                  setRestoreError(null)
                  void attemptPostAuthRestore()
                }}
                style={{
                  background: '#c8f05a', color: '#0a0a0f', border: 'none',
                  padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={openSignInToView}
                style={{
                  background: '#1a1a26', border: '1px solid rgba(255,255,255,0.07)',
                  color: '#c8f05a', padding: '12px 24px', borderRadius: 12, fontSize: 14,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                }}
              >
                Sign in again
              </button>
            </>
          ) : (
            <>
          <p style={{ color: '#c8f05a', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>
            ✦ Analysis complete
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(24px,4vw,36px)',
            fontWeight: 700,
            textAlign: 'center',
            maxWidth: 480,
          }}>
            Your top city matches are ready
          </h2>
          <p style={{ color: 'rgba(240,237,232,0.55)', fontSize: 15, textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>
            Create a free account to view your matches — Google or email, no extra forms.
          </p>
          <button
            type="button"
            onClick={openSignInToView}
            style={{
              background: '#c8f05a', color: '#0a0a0f', border: 'none',
              padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            View my results
          </button>
          <button
            type="button"
            onClick={handleResetMatches}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(240,237,232,0.45)', fontSize: 13,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ← New search
          </button>
            </>
          )}
        </div>
      )}

      {matches !== null && matches.length > 0 && (
        <Results
          cities={matches}
          streaming={loading}
          maxCities={resultMaxCities}
          onReset={handleResetMatches}
          onUnlockPro={handleUnlockPro}
          monthlyBudget={quizData?.monthlyBudget}
          currency={quizData?.currency}
          lifestyle={quizData?.lifestyle}
          quizInput={quizData}
          onAuthClick={openAuthForSave}
        />
      )}

      {matches !== null && matches.length === 0 && !loading && !awaitingAuthToView && (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20
        }}>
          <p style={{ color: '#f05a8c', fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
            {error || 'No cities could be loaded. Try again.'}
          </p>
          <button
            type="button"
            onClick={handleResetMatches}
            style={{
              background: '#1a1a26', border: '1px solid rgba(255,255,255,0.07)',
              color: '#c8f05a', padding: '12px 24px', borderRadius: 12, fontSize: 14,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600
            }}
          >
            Back to quiz
          </button>
        </div>
      )}

      {matches !== null && matches.length > 0 && error && loading === false && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          maxWidth: 560, padding: '12px 18px',
          background: 'rgba(240,90,140,0.12)', border: '1px solid rgba(240,90,140,0.35)',
          borderRadius: 12, color: '#f05a8c', fontSize: 13, zIndex: 50
        }}>
          {error}
        </div>
      )}

      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        variant={authVariant}
        onClose={() => {
          setAuthOpen(false)
          if (!loadPendingResults()) {
            setAuthVariant('default')
          }
        }}
        onModeSwitch={() => setAuthMode(m => m === 'login' ? 'signup' : 'login')}
        onAuthSuccess={() => {
          logQuizAuthDebug('AuthModal onAuthSuccess')
          void (async () => {
            const { data: { session } } = await supabase.auth.getSession()
            logQuizAuthDebug('onAuthSuccess — getSession', {
              hasSession: Boolean(session?.user),
              isPostOAuthRestore: isPostOAuthRestore(),
            })
            if (session?.user && (await revealPendingResults(session))) {
              logQuizAuthDebug('onAuthSuccess — revealPendingResults succeeded (immediate)')
              return
            }

            // Signed in while analyze still streaming — finishWithCities will show results.
            if (session?.user && !hasPendingResults() && loadPendingAnalyze()) {
              logQuizAuthDebug('onAuthSuccess — analyze in progress, closing modal')
              setAuthOpen(false)
              setAwaitingAuthToView(false)
              return
            }

            if (!isPostOAuthRestore()) {
              logQuizAuthDebug('onAuthSuccess SKIP waitForRestoreSession — not post-OAuth')
              return
            }

            logQuizAuthDebug('onAuthSuccess — will call waitForRestoreSession')
            setRestoringAfterOAuth(true)
            setRestoreError(null)
            const waited = await waitForRestoreSession('onAuthSuccess')
            if (waited?.user && (await revealPendingResults(waited))) return
            if (hasPendingResults()) {
              setRestoringAfterOAuth(false)
              setRestoreError(
                'Could not verify your sign-in. Your results are still saved — try signing in again.',
              )
              setAwaitingAuthToView(true)
            }
          })()
        }}
      />
    </main>
  )
}
