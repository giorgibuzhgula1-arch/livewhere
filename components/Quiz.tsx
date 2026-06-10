'use client'

import { useEffect, useRef, useState } from 'react'
import { AnalyzeRequest, UserPriorities } from '@/lib/types'
import { trackFunnelStep } from '@/lib/gtag'

interface Props {
  onSubmit: (data: AnalyzeRequest) => void
  loading: boolean
  error: string | null
}

const TOTAL_STEPS = 3

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
  { key: 'climate', emoji: '🌞', label: 'Climate' },
  { key: 'health', emoji: '🏥', label: 'Healthcare' },
  { key: 'nightlife', emoji: '🎉', label: 'Nightlife & culture' },
  { key: 'safety', emoji: '🔒', label: 'Safety' },
]

const LIFESTYLES = [
  '🌍 Digital nomad', '👨‍👩‍👧 Family', '🎓 Student-friendly',
  '🏖️ Beach life', '🏔️ Mountains', '🏙️ City buzz',
  '🌿 Nature & slow life', '💻 Tech scene'
]

export default function Quiz({ onSubmit, loading, error }: Props) {
  const [step, setStep] = useState(1)
  const trackedSteps = useRef(new Set<number>())
  const [salary, setSalary] = useState(80000)
  const [currency, setCurrency] = useState('USD')
  const [priorities, setPriorities] = useState<UserPriorities>({
    tax: 4, housing: 4, climate: 3, health: 3, nightlife: 2, safety: 4
  })
  const [lifestyle, setLifestyle] = useState<string[]>(['🌍 Digital nomad', '💻 Tech scene'])

  useEffect(() => {
    if (trackedSteps.current.has(step)) return
    trackedSteps.current.add(step)
    trackFunnelStep(step)
  }, [step])

  function toggleLifestyle(item: string) {
    setLifestyle(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])
  }

  function handleSubmit() {
    onSubmit({ salary, currency, priorities, lifestyle })
  }

  function goToNextStep() {
    setStep((current) => Math.min(current + 1, TOTAL_STEPS))
  }

  function goToPreviousStep() {
    setStep((current) => Math.max(current - 1, 1))
  }

  const inputStyle = {
    background: '#1a1a26', border: '1px solid rgba(255,255,255,0.07)',
    color: '#f0ede8', padding: '14px 18px', borderRadius: 12,
    fontSize: 16, fontFamily: "'DM Sans', sans-serif", outline: 'none'
  }

  const navButtonStyle = (primary = false) => ({
    background: primary ? '#c8f05a' : 'transparent',
    color: primary ? '#0a0a0f' : '#f0ede8',
    border: primary ? 'none' : '1px solid rgba(255,255,255,0.07)',
    padding: '14px 24px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: primary ? 700 : 500,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  })

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ The Tool
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 48 }}>
        Your personalized<br />city score
      </h2>

      <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Tell us about yourself</div>
          <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', background: '#1a1a26', padding: '6px 14px', borderRadius: 20 }}>
            Step {step} of {TOTAL_STEPS}
          </div>
        </div>

        <div style={{ padding: 40 }}>
          {step === 1 && (
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 10, fontWeight: 500, display: 'block' }}>
                Your annual income (remote-friendly)
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  style={{ ...inputStyle, width: 100, cursor: 'pointer' }}>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
                <input type="number" value={salary} onChange={e => setSalary(Number(e.target.value))}
                  style={{ ...inputStyle, flex: 1 }} placeholder="e.g. 80000" />
              </div>
            </div>
          )}

          {step === 2 && (
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
                    {key === 'climate' && priorities.climate >= 4 && (
                      <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.45)', marginTop: 8, lineHeight: 1.5 }}>
                        Very important uses your lifestyle: Beach = warm cities (20°C+), Mountains = cool cities (14°C or below).
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 12, fontWeight: 500, display: 'block' }}>
                Your lifestyle (select all that apply)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {LIFESTYLES.map(item => (
                  <button key={item} onClick={() => toggleLifestyle(item)}
                    style={{
                      padding: '10px 18px', borderRadius: 30, fontSize: 13, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                      background: lifestyle.includes(item) ? 'rgba(200,240,90,0.12)' : '#1a1a26',
                      border: lifestyle.includes(item) ? '1px solid #c8f05a' : '1px solid rgba(255,255,255,0.07)',
                      color: lifestyle.includes(item) ? '#c8f05a' : '#f0ede8',
                    }}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(240,90,140,0.1)', border: '1px solid rgba(240,90,140,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#f05a8c', fontSize: 14 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: step === 1 ? 'flex-end' : 'space-between' }}>
            {step > 1 && (
              <button type="button" onClick={goToPreviousStep} style={navButtonStyle()}>
                Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button type="button" onClick={goToNextStep} style={navButtonStyle(true)}>
                Continue
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                style={{
                  flex: 1,
                  background: '#c8f05a', color: '#0a0a0f', border: 'none',
                  padding: 18, borderRadius: 14, fontSize: 16, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                  fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 10, transition: 'all 0.2s'
                }}>
                ✦ Analyze & Find My Cities
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
