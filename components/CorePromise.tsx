'use client'

import { motion } from 'framer-motion'

const LINES = [
  "We don't show you Cities.",
  'We eliminate the wrong ones.',
  'And leave you with only the places you can actually thrive in.',
]

export default function CorePromise() {
  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 80px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 24, fontWeight: 600, textAlign: 'center' }}>
        ✦ Core Promise
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        {LINES.map((line, i) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: i === 1 ? 'clamp(28px, 4vw, 40px)' : 'clamp(22px, 3vw, 32px)',
              fontWeight: i === 1 ? 700 : 500,
              lineHeight: 1.25,
              color: i === 1 ? '#f0ede8' : 'rgba(240,237,232,0.75)',
              margin: 0,
            }}
          >
            {line}
          </motion.p>
        ))}
      </div>
    </section>
  )
}
