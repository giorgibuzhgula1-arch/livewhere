'use client'

import { useEffect, useState } from 'react'

const INITIAL_COUNT = 11683

const STATIC_STATS = [
  'Thousands of retirement scenarios analyzed',
  'Trusted by retirees exploring life abroad',
  'Helping retirees compare opportunities worldwide',
]

function randomIncrementDelayMs(): number {
  return 8000 + Math.random() * 7000
}

function randomIncrementAmount(): number {
  return 1 + Math.floor(Math.random() * 3)
}

export default function RetirementStatsBar() {
  const [plansExplored, setPlansExplored] = useState(INITIAL_COUNT)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      setPlansExplored((count) => count + randomIncrementAmount())
      timeoutId = setTimeout(tick, randomIncrementDelayMs())
    }

    timeoutId = setTimeout(tick, randomIncrementDelayMs())

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          background: '#12121a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '24px 28px',
            textAlign: 'center',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(22px, 3vw, 28px)',
              fontWeight: 700,
              color: '#c8f05a',
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            {plansExplored.toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.55)', lineHeight: 1.5 }}>
            retirement plans explored
          </div>
        </div>

        {STATIC_STATS.map((text, i) => (
          <div
            key={text}
            style={{
              padding: '24px 28px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: i < STATIC_STATS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.65)', lineHeight: 1.5, fontWeight: 500 }}>
              {text}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
