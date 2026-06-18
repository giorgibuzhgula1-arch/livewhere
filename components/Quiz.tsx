'use client'

import { useEffect, useRef, useState } from 'react'
import { AnalyzeRequest, UserPriorities } from '@/lib/types'
import { trackFunnelStep } from '@/lib/gtag'

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
  5: 'Very important',
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

export default function Quiz({ onSubmit, loading, error }: Props) {
  const tracked = useRef(false)
  const [monthlyBudget, setMonthlyBudget] = useState(2500)
  const [priorities, setPriorities] = useState<UserPriorities>({
    tax: 4, housing: 4, climate: 3, health: 3, stability: 3, safety: 4,
    expat_community: 3, visa_residency: 3,
  })
  const [lifestyle, setLifestyle] = useState<string[]>([])

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    trackFunnelStep(1)
  }, [])

  function toggleLifestyle(key: string) {
    setLifestyle(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
  }

  function handleSubmit() {
    onSubmit({ monthlyBudget, currency: 'USD', priorities, lifestyle })
  }

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ The Tool
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 48 }}>
        Your personalized<br />country score
      </h2>

      <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Tell us about yourself</div>
          <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', background: '#1a1a26', padding: '6px 14px', borderRadius: 20 }}>
            Step 1 of 1
          </div>
        </div>

        <div style={{ padding: 40 }}>
          {/* Monthly budget */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ fontSize: 14, color: '#f0ede8', marginBottom: 6, fontWeight: 600, display: 'block' }}>
              Your monthly budget to live abroad
            </label>
            <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
              This includes rent, food, healthcare & lifestyle
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)' }}>$500</span>
              <span style={{ fontSize: 18, color: '#c8f05a', fontWeight: 700 }}>
                ${monthlyBudget.toLocaleString('en-US')} / month
              </span>
              <span style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)' }}>$10,000</span>
            </div>
            <input
              type="range"
              min={500}
              max={10000}
              step={100}
              value={monthlyBudget}
              onChange={e => setMonthlyBudget(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#c8f05a', cursor: 'pointer' }}
            />
          </div>

          {/* Priorities */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 16, fontWeight: 500, display: 'block' }}>
              Set your priorities
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
              {PRIORITIES.map(({ key, emoji, label }) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{emoji} {label}</span>
                    <span style={{ fontSize: 13, color: '#c8f05a', fontWeight: 600 }}>
                      {LABELS[priorities[key as keyof UserPriorities]]}
                    </span>
                  </div>
                  <input type="range" min={1} max={5}
                    value={priorities[key as keyof UserPriorities]}
                    onChange={e => setPriorities(p => ({ ...p, [key]: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#c8f05a', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Lifestyle */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 12, fontWeight: 500, display: 'block' }}>
              Your lifestyle (select all that apply)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {LIFESTYLES.map(({ key, label }) => (
                <button key={key} onClick={() => toggleLifestyle(key)}
                  style={{
                    padding: '10px 18px', borderRadius: 30, fontSize: 13, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                    background: lifestyle.includes(key) ? 'rgba(200,240,90,0.12)' : '#1a1a26',
                    border: lifestyle.includes(key) ? '1px solid #c8f05a' : '1px solid rgba(255,255,255,0.07)',
                    color: lifestyle.includes(key) ? '#c8f05a' : '#f0ede8',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(240,90,140,0.1)', border: '1px solid rgba(240,90,140,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#f05a8c', fontSize: 14 }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', background: '#c8f05a', color: '#0a0a0f', border: 'none',
              padding: 18, borderRadius: 14, fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
              fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, transition: 'all 0.2s'
            }}>
            ✦ Analyze & Find My Countries
          </button>
        </div>
      </div>
    </section>
  )
}
