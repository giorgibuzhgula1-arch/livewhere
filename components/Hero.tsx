'use client'

import { motion } from 'framer-motion'
import { trackHeroCtaClick } from '@/lib/analytics'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

interface Props {
  onStart: () => void
}

const STATS = [
  { num: '200+', label: 'Cities Analyzed' },
  { num: '50+', label: 'Countries' },
  { num: 'Millions', label: 'Data Points' },
  { num: 'Thousands', label: 'Relocation Scenarios' },
  { num: '27', label: 'Decision Factors' },
] as const

const MICROCOPY = ['2 Minutes', 'No Credit Card', 'Free Analysis'] as const

export default function Hero({ onStart }: Props) {
  function handleStart() {
    trackHeroCtaClick('hero_find_my_city')
    onStart()
  }

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '140px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          width: '100%',
          maxWidth: 920,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontFamily: fontFamilySerif,
            fontSize: 'clamp(38px, 5.5vw, 72px)',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            margin: '0 0 28px',
            color: '#f0ede8',
          }}
        >
          Don&apos;t Make A Six-Figure Relocation Mistake.
        </h1>

        <div style={{ marginBottom: 72 }}>
          <button
            type="button"
            onClick={handleStart}
            style={{
              background: '#c8f05a',
              color: '#0a0a0f',
              border: 'none',
              padding: '18px 40px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: fontFamilySans,
              transition: 'all 0.2s',
              letterSpacing: '0.01em',
            }}
          >
            Find My Best Place
          </button>

          <p
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px 0',
              marginTop: 16,
              fontFamily: fontFamilySans,
              fontSize: 13,
              fontWeight: 400,
              color: 'rgba(240, 237, 232, 0.4)',
              letterSpacing: '0.02em',
            }}
          >
            {MICROCOPY.map((item, i) => (
              <span key={item} style={{ display: 'inline-flex', alignItems: 'center' }}>
                {i > 0 && (
                  <span
                    aria-hidden
                    style={{ margin: '0 12px', color: 'rgba(240, 237, 232, 0.22)' }}
                  >
                    ·
                  </span>
                )}
                {item}
              </span>
            ))}
          </p>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: 1000,
            margin: '0 auto',
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '32px 20px',
              padding: '40px 0 20px',
            }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: fontFamilySerif,
                    fontSize: 'clamp(22px, 2.8vw, 32px)',
                    fontWeight: 700,
                    color: '#f0ede8',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stat.num}
                </div>
                <div
                  style={{
                    fontFamily: fontFamilySans,
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'rgba(240, 237, 232, 0.42)',
                    marginTop: 8,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    lineHeight: 1.35,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <p
            style={{
              fontFamily: fontFamilySans,
              fontSize: 12,
              fontWeight: 400,
              color: 'rgba(240, 237, 232, 0.32)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '8px 0 0',
            }}
          >
            Updated Weekly
          </p>
        </div>
      </motion.div>
    </section>
  )
}
