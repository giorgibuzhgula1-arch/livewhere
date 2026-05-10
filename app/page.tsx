'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Quiz from '@/components/Quiz'
import Results from '@/components/Results'
import HowItWorks from '@/components/HowItWorks'
import Pricing from '@/components/Pricing'
import AuthModal from '@/components/AuthModal'
import { supabase } from '@/lib/supabase'
import { CityResult, AnalyzeRequest } from '@/lib/types'

type StreamPayload =
  | { type: 'delta'; text: string }
  | { type: 'done'; cities: CityResult[] }
  | { type: 'error'; error: string }

function parseSseEvents(chunk: string): { events: StreamPayload[]; rest: string } {
  const events: StreamPayload[] = []
  const parts = chunk.split('\n\n')
  const rest = parts.pop() ?? ''
  for (const part of parts) {
    for (const line of part.split('\n')) {
      if (!line.startsWith('data: ')) continue
      try {
        events.push(JSON.parse(line.slice(6)) as StreamPayload)
      } catch {
        /* ignore malformed frame */
      }
    }
  }
  return { events, rest }
}

export default function Home() {
  const [results, setResults] = useState<CityResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [streamPreview, setStreamPreview] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze(data: AnalyzeRequest) {
    setLoading(true)
    setError(null)
    setStreamPreview('')
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
        setAuthOpen(true)
        setAuthMode('signup')
        setError(json.error || 'Sign in to continue')
        return
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error || 'Something went wrong')
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setError('No response body')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let preview = ''
      let finished = false
      let streamError: string | null = null

      const applyPayload = (payload: StreamPayload) => {
        if (payload.type === 'delta') {
          preview += payload.text
          setStreamPreview(preview)
        } else if (payload.type === 'done') {
          setResults(payload.cities)
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

      if (!finished && !streamError) {
        setError('Analysis ended before results were ready')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      setStreamPreview('')
    }
  }

  return (
    <main style={{ position: 'relative' }}>
      <Navbar onAuthClick={() => { setAuthOpen(true); setAuthMode('login') }} />
      
      {!results && !loading && (
        <>
          <Hero onStart={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })} />
          <div id="quiz">
            <Quiz onSubmit={handleAnalyze} loading={loading} error={error} />
          </div>
          <HowItWorks />
          <Pricing onUpgrade={() => { setAuthOpen(true); setAuthMode('signup') }} />
        </>
      )}

      {loading && (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '24px',
          padding: '0 20px', maxWidth: 720, margin: '0 auto'
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
            Streaming your personalized city rankings…
          </p>
          {streamPreview ? (
            <div style={{
              width: '100%',
              maxHeight: 'min(40vh, 320px)',
              overflow: 'auto',
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              padding: '16px 18px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'rgba(240,237,232,0.55)',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {streamPreview}
            </div>
          ) : null}
        </div>
      )}

      {results && !loading && (
        <Results
          cities={results}
          onReset={() => setResults(null)}
        />
      )}

      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeSwitch={() => setAuthMode(m => m === 'login' ? 'signup' : 'login')}
      />
    </main>
  )
}
