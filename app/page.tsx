'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Quiz from '@/components/Quiz'
import Results from '@/components/Results'
import HowItWorks from '@/components/HowItWorks'
import Pricing from '@/components/Pricing'
import AuthModal from '@/components/AuthModal'
import { CityResult, AnalyzeRequest } from '@/lib/types'

export default function Home() {
  const [results, setResults] = useState<CityResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze(data: AnalyzeRequest) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 403) {
          setAuthOpen(true)
          setAuthMode('signup')
        } else {
          setError(json.error || 'Something went wrong')
        }
        return
      }
      setResults(json.cities)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
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
          alignItems: 'center', justifyContent: 'center', gap: '24px'
        }}>
          <div style={{
            width: 60, height: 60,
            border: '3px solid #1a1a26',
            borderTopColor: '#c8f05a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: 14 }}>
            Analyzing 200+ cities with AI...
          </p>
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
