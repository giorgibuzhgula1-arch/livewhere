'use client'

import { useEffect, useState } from 'react'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

const INITIAL_COUNT = 11683
const ACCENT = '#c8f05a'
const TEXT_PRIMARY = '#f0ede8'
const TEXT_MUTED = 'rgba(240,237,232,0.75)'

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
          display: 'flex',
          flexWrap: 'wrap',
          background: '#12121a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: '1 1 240px',
            padding: '32px 36px',
            textAlign: 'center',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div
            style={{
              fontFamily: fontFamilySerif,
              fontSize: 'clamp(32px, 4vw, 40px)',
              fontWeight: 700,
              color: ACCENT,
              lineHeight: 1.1,
              marginBottom: 10,
            }}
          >
            {plansExplored.toLocaleString()}
          </div>
          <div
            style={{
              fontFamily: fontFamilySans,
              fontSize: 'clamp(15px, 2vw, 18px)',
              fontWeight: 600,
              color: TEXT_MUTED,
              lineHeight: 1.4,
            }}
          >
            retirement plans explored
          </div>
        </div>

        {STATIC_STATS.map((text, i) => (
          <div
            key={text}
            style={{
              flex: '1 1 240px',
              padding: '32px 36px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: i < STATIC_STATS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              style={{
                fontFamily: fontFamilySans,
                fontSize: 'clamp(16px, 2.2vw, 20px)',
                fontWeight: 600,
                color: TEXT_PRIMARY,
                lineHeight: 1.45,
              }}
            >
              {text}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
