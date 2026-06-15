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
          color: 'rgba(240,237,232,0.45)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 32
        }}
      >
        <span style={{ width: 6, height: 6, background: '#c8f05a', borderRadius: '50%', display: 'inline-block' }} />
        Find your perfect city in 3 minutes
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
          style={{ display: 'block' }}
        >
          Stop guessing<br />
          <span style={{ color: '#c8f05a' }}>where to retire or relocate.</span>
        </motion.span>
        <motion.span
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            display: 'block',
            color: 'rgba(240,237,232,0.85)',
            WebkitTextStroke: '1px rgba(240,237,232,0.3)',
          }}
        >
          Let data decide.
        </motion.span>
      </h1>

      <motion.p
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: 18, color: 'rgba(240,237,232,0.45)', maxWidth: 520,
          lineHeight: 1.7, marginBottom: 48, fontWeight: 300
        }}
      >
        Enter your monthly budget, set your priorities, and discover the best cities worldwide
        for your lifestyle — with real tax calculations and cost breakdowns.
      </motion.p>

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
          Find My City →
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
          { num: '12', label: 'Data points/city' },
          { num: 'AI', label: 'Personalized' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '20px 36px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none'
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
