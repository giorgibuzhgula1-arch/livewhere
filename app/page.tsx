'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import CorePromise from '@/components/CorePromise'
import Quiz from '@/components/Quiz'
import HowItWorks from '@/components/HowItWorks'
import Testimonials from '@/components/Testimonials'
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
  markPendingAuthRestore,
  shouldRestoreAfterAuth,
  saveOAuthNext,
} from '@/lib/wait-for-session'
import { startProCheckout } from '@/lib/start-pro-checkout'

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

const OAUTH_RESTORE_MAX_MS = 1500

export default function Home() {
  const [matches, setMatches] = useState<CityResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authGoogleOnly, setAuthGoogleOnly] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultMaxCities, setResultMaxCities] = useState<number | null>(null)
  const [quizData, setQuizData] = useState<AnalyzeRequest | null>(null)
  const [awaitingAuthToView, setAwaitingAuthToView] = useState(false)
  const [restoringAfterOAuth, setRestoringAfterOAuth] = useState(false)

  const showLanding = matches === null && !loading && !awaitingAuthToView
  const showHero =
    !(matches !== null && matches.length > 0) &&
    !(matches !== null && loading && matches.length === 0)

  const revealPendingResults = useCallback(async (): Promise<boolean> => {
    const pending = loadPendingResults()
    if (!pending?.cities.length) return false

    const { data: { session: existing } } = await supabase.auth.getSession()
    const session =
      existing?.user
        ? existing
        : await waitForAuthSession(shouldRestoreAfterAuth() ? 40 : 10, 100)

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
    setAuthOpen(false)
    setAuthGoogleOnly(false)
    if (typeof window !== 'undefined' && window.location.search.includes('restore=results')) {
      window.history.replaceState(null, '', '/')
    }
    return true
  }, [])

  const openGoogleSignInForAnalyze = useCallback(() => {
    saveOAuthNext('/?restore=results')
    markPendingAuthRestore()
    setAuthGoogleOnly(true)
    setAuthMode('login')
    setAuthOpen(true)
  }, [])

  const promptSignInToView = useCallback((cities: CityResult[], maxCities: number | null) => {
    savePendingResults(cities, maxCities)
    setMatches(null)
    setAwaitingAuthToView(true)
    openGoogleSignInForAnalyze()
  }, [openGoogleSignInForAnalyze])

  const runAnalyze = useCallback(async (data: AnalyzeRequest) => {
    setLoading(true)
    setError(null)
    setAwaitingAuthToView(false)
    setQuizData(data)
    savePendingAnalyze(data)
    clearPendingResults()
    setMatches([])
    setResultMaxCities(null)

    let accumulatedAi = ''
    let usedDataEngine = false
    try {
      const { data: { session } } = await supabase.auth.getSession()
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
        setError(json.error || 'Free plan limit reached. Upgrade to Pro for unlimited searches.')
        return
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setMatches(null)
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
        if (await isLoggedIn()) {
          setMatches(capped)
          setAwaitingAuthToView(false)
          clearPendingAnalyze()
          clearPostAuthRestoreState()
        } else {
          promptSignInToView(capped, streamMaxCities)
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
    } finally {
      setLoading(false)
    }
  }, [promptSignInToView])

  const runAnalyzeRef = useRef(runAnalyze)
  runAnalyzeRef.current = runAnalyze
  const restoreAttemptedRef = useRef(false)

  // Never show "Finishing sign-in…" longer than 1.5s — then go home.
  useEffect(() => {
    if (!restoringAfterOAuth) return

    const timeoutId = window.setTimeout(() => {
      setRestoringAfterOAuth(false)
      setAwaitingAuthToView(false)
      clearPostAuthRestoreState()
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('restore') === 'results') {
          window.location.replace('/')
        }
      }
    }, OAUTH_RESTORE_MAX_MS)

    return () => window.clearTimeout(timeoutId)
  }, [restoringAfterOAuth])

  // Restore results after OAuth redirect (full page remount loses React state).
  useEffect(() => {
    if (restoreAttemptedRef.current) return
    restoreAttemptedRef.current = true
    const restoreRequested =
      typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).get('restore') === 'results' ||
        shouldRestoreAfterAuth())

    const pending = loadPendingResults()
    if (pending?.cities.length) {
      setAwaitingAuthToView(true)
      setResultMaxCities(pending.maxCities)
    }

    let cancelled = false

    async function tryRestoreAfterAuth() {
      if (!restoreRequested && !hasPendingResults() && !loadPendingAnalyze()) {
        clearPostAuthRestoreState()
        setRestoringAfterOAuth(false)
        return
      }

      const { data: { session: existing } } = await supabase.auth.getSession()
      if (existing?.user) {
        setRestoringAfterOAuth(false)
        if (await revealPendingResults()) return
        const quiz = loadPendingAnalyze()
        if (quiz && !cancelled) {
          clearPostAuthRestoreState()
          setAwaitingAuthToView(false)
          if (typeof window !== 'undefined' && window.location.search.includes('restore=results')) {
            window.history.replaceState(null, '', '/')
          }
          await runAnalyzeRef.current(quiz)
        }
        return
      }

      setRestoringAfterOAuth(true)
      await waitForAuthSession(15, 100)
      if (cancelled) return
      setRestoringAfterOAuth(false)

      if (await revealPendingResults()) return

      const quiz = loadPendingAnalyze()
      const { data: { session } } = await supabase.auth.getSession()
      if (quiz && session?.user) {
        clearPostAuthRestoreState()
        setAwaitingAuthToView(false)
        if (typeof window !== 'undefined' && window.location.search.includes('restore=results')) {
          window.history.replaceState(null, '', '/')
        }
        await runAnalyzeRef.current(quiz)
        return
      }

      if (!cancelled) {
        clearPostAuthRestoreState()
      }
    }

    void tryRestoreAfterAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        !session?.user ||
        (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION' && event !== 'TOKEN_REFRESHED')
      ) {
        return
      }
      void (async () => {
        setRestoringAfterOAuth(false)
        if (await revealPendingResults()) return
        const quiz = loadPendingAnalyze()
        if (!quiz) return
        setAuthOpen(false)
        setAuthGoogleOnly(false)
        await runAnalyzeRef.current(quiz)
      })()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [revealPendingResults])

  async function handleAnalyzeRequest(data: AnalyzeRequest) {
    savePendingAnalyze(data)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      openGoogleSignInForAnalyze()
      return
    }
    await runAnalyze(data)
  }

  function handleResetMatches() {
    setMatches(null)
    setError(null)
    setAwaitingAuthToView(false)
    setRestoringAfterOAuth(false)
    clearPostAuthRestoreState()
    clearPendingResults()
    clearPendingAnalyze()
  }

  function openSignInToView() {
    openGoogleSignInForAnalyze()
  }

  async function handleUnlockPro() {
    try {
      await startProCheckout()
    } catch {
      setAuthGoogleOnly(false)
      setAuthMode('login')
      setAuthOpen(true)
    }
  }

  return (
    <main style={{ position: 'relative' }}>
      <Navbar
        onAuthClick={() => { setAuthGoogleOnly(false); setAuthOpen(true); setAuthMode('login') }}
        onLogoClick={handleResetMatches}
      />

      {showHero && (
        <Hero onStart={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })} />
      )}

      {showLanding && (
        <>
          <CorePromise />
          <div id="quiz">
            <Quiz onSubmit={handleAnalyzeRequest} loading={loading} error={error} />
          </div>
          <Testimonials />
          <HowItWorks />
          <Pricing onUpgrade={() => { setAuthGoogleOnly(false); setAuthOpen(true); setAuthMode('signup') }} />
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
                Finishing sign-in…
              </p>
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
            Sign in with Google to view your personalized results — your #1 match in full, free.
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
            Sign in to view results
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
        googleOnly={authGoogleOnly}
        onClose={() => {
          setAuthOpen(false)
          if (!loadPendingResults()) {
            setAuthGoogleOnly(false)
          }
        }}
        onModeSwitch={() => setAuthMode(m => m === 'login' ? 'signup' : 'login')}
      />
    </main>
  )
}
