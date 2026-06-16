'use client'

import { motion } from 'framer-motion'
import { trackCtaClick } from '@/lib/gtag'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

interface Props { onStart: () => void }

export default function Hero({ onStart }: Props) {
  function handleStart() {
    trackCtaClick('hero_find_my_city')
    onStart()
  }
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '120px 20px 60px', textAlign: 'center', position: 'relative', zIndex: 1
    }}>
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          padding: '8px 18px', borderRadius: 30, fontSize: 12,
          color: '#c8f05a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 32
        }}
      >
        <span style={{ width: 6, height: 6, background: '#c8f05a', borderRadius: '50%', display: 'inline-block' }} />
        Discover where your retirement income buys the best life
      </motion.div>

      <h1
        style={{
          fontFamily: fontFamilySerif,
          fontSize: 'clamp(52px, 8vw, 100px)',
          fontWeight: 900, lineHeight: 0.95,
          letterSpacing: -2, marginBottom: 28
        }}
      >
        <motion.span
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'block', color: '#f0ede8' }}
        >
          The Retirement Intelligence Platform
        </motion.span>
        <motion.span
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            display: 'block',
            color: '#999999',
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          Compare taxes, healthcare, cost of living and residency across 200+ cities worldwide.
        </motion.span>
        <motion.span
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            display: 'block',
            color: '#c8f05a',
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Our users discover an average of $850/month in additional retirement purchasing power.
        </motion.span>
      </h1>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}
      >
        <button onClick={handleStart} style={{
          background: '#c8f05a', color: '#0a0a0f', border: 'none',
          padding: '16px 32px', borderRadius: 12, fontSize: 15,
          fontWeight: 600, cursor: 'pointer', fontFamily: fontFamilySans,
          transition: 'all 0.2s'
        }}>
          Find My Best Retirement Destination →
        </button>
        <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            background: 'transparent', color: '#f0ede8',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '16px 32px', borderRadius: 12, fontSize: 15,
            fontWeight: 500, cursor: 'pointer', fontFamily: fontFamilySans
          }}>
          See how it works
        </button>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          display: 'flex', background: '#12121a',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden'
        }}
      >
        {[
          { num: '200+', label: 'Cities scored' },
          { num: '50+', label: 'Countries' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '20px 36px', textAlign: 'center',
            borderRight: i < 1 ? '1px solid rgba(255,255,255,0.07)' : 'none'
          }}>
            <div style={{ fontFamily: fontFamilySerif, fontSize: 28, fontWeight: 700, color: '#c8f05a' }}>
              {s.num}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.45)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
