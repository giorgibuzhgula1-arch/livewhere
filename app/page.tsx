'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Quiz from '@/components/Quiz'
import Results from '@/components/Results'
import HowItWorks from '@/components/HowItWorks'
import Pricing from '@/components/Pricing'
import AuthModal from '@/components/AuthModal'
import { parseStreamingBufferToCities } from '@/lib/parse-streaming-cities'
import { supabase } from '@/lib/supabase'
import { CityResult, AnalyzeRequest } from '@/lib/types'
import {
  savePendingAnalyze,
  loadPendingAnalyze,
  clearPendingAnalyze,
} from '@/lib/pending-analyze'

type StreamPayload =
  | { type: 'delta'; text: string }
  | { type: 'status'; text: string }
  | { type: 'done'; cities: CityResult[] }
  | { type: 'error'; error: string }
  | { type: 'limits'; maxCities: number | null }

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

export default function Home() {
  const [matches, setMatches] = useState<CityResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [authGoogleOnly, setAuthGoogleOnly] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultMaxCities, setResultMaxCities] = useState<number | null>(null)
  const resumeStarted = useRef(false)

  const showLanding = matches === null && !loading

  const runAnalyze = useCallback(async (data: AnalyzeRequest) => {
    setLoading(true)
    setError(null)
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
        savePendingAnalyze(data)
        setAuthGoogleOnly(true)
        setAuthOpen(true)
        setAuthMode('login')
        setError(json.error || 'Sign in to continue')
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

      const capMatches = (list: CityResult[]) =>
        streamMaxCities != null && list.length > streamMaxCities
          ? list.slice(0, streamMaxCities)
          : list

      const applyPayload = (payload: StreamPayload) => {
        if (payload.type === 'limits') {
          streamMaxCities = payload.maxCities
          setResultMaxCities(payload.maxCities)
        } else if (payload.type === 'status') {
          usedDataEngine = true
        } else if (payload.type === 'delta') {
          if (!usedDataEngine) {
            accumulatedAi += payload.text
            setMatches(capMatches(parseStreamingBufferToCities(accumulatedAi, data)))
          }
        } else if (payload.type === 'done') {
          setMatches(capMatches(payload.cities))
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
          applyPayload(payload)
        }
      }

      buffer += decoder.decode()
      if (buffer.trim()) {
        const { events } = parseSseEvents(buffer + '\n\n')
        for (const payload of events) {
          applyPayload(payload)
        }
      }

      if (!finished && !streamError && !usedDataEngine) {
        if (accumulatedAi.trim()) {
          const recovered = capMatches(parseStreamingBufferToCities(accumulatedAi, data))
          if (recovered.length > 0) {
            setMatches(recovered)
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
  }, [])

  const tryResumePendingAnalyze = useCallback(async () => {
    const pending = loadPendingAnalyze()
    if (!pending || resumeStarted.current) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    resumeStarted.current = true
    clearPendingAnalyze()
    setAuthOpen(false)
    setAuthGoogleOnly(false)
    await runAnalyze(pending)
    resumeStarted.current = false
  }, [runAnalyze])

  useEffect(() => {
    tryResumePendingAnalyze()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        tryResumePendingAnalyze()
      }
    })
    return () => subscription.unsubscribe()
  }, [tryResumePendingAnalyze])

  async function handleAnalyzeRequest(data: AnalyzeRequest) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      savePendingAnalyze(data)
      setAuthGoogleOnly(true)
      setAuthMode('login')
      setAuthOpen(true)
      return
    }
    await runAnalyze(data)
  }

  function handleResetMatches() {
    setMatches(null)
    setError(null)
  }

  return (
    <main style={{ position: 'relative' }}>
      <Navbar onAuthClick={() => { setAuthGoogleOnly(false); setAuthOpen(true); setAuthMode('login') }} />
      
      {showLanding && (
        <>
          <Hero onStart={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })} />
          <div id="quiz">
            <Quiz onSubmit={handleAnalyzeRequest} loading={loading} error={error} />
          </div>
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

      {matches !== null && matches.length > 0 && (
        <Results
          cities={matches}
          streaming={loading}
          maxCities={resultMaxCities}
          onReset={handleResetMatches}
        />
      )}

      {matches !== null && matches.length === 0 && !loading && (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20
        }}>
          <p style={{ color: '#f05a8c', fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
            {error || 'No cities could be loaded. Try again.'}
          </p>
          <button
            type="button"
            onClick={() => { setMatches(null); setError(null) }}
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
          setAuthGoogleOnly(false)
        }}
        onModeSwitch={() => setAuthMode(m => m === 'login' ? 'signup' : 'login')}
      />
    </main>
  )
}
