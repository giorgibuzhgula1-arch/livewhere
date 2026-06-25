'use client'

import { motion } from 'framer-motion'

const BULLETS = [
  'Compare 200+ cities',
  'Estimate long-term retirement costs',
  'Calculate real purchasing power',
  'Identify hidden retirement risks',
]

export default function CorePromise() {
  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 80px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 24, fontWeight: 600, textAlign: 'center' }}>
        ✦ Core Promise
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0 }}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(22px, 3vw, 32px)',
            fontWeight: 500,
            lineHeight: 1.25,
            color: 'rgba(240,237,232,0.75)',
            margin: 0,
          }}
        >
          We don&apos;t show you countries. We eliminate the wrong ones.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: 'rgba(240,237,232,0.6)',
            margin: '0 auto',
            maxWidth: 640,
          }}
        >
          A country that looks affordable today can quietly drain tens of thousands of dollars from your retirement through taxes, healthcare costs, inflation, housing expenses, and hidden long-term costs. Before making one of the biggest financial decisions of your life, see the numbers.
        </motion.p>
        <motion.ul
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.16 }}
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '8px auto 0',
            maxWidth: 420,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {BULLETS.map((item) => (
            <li
              key={item}
              style={{
                fontSize: 14,
                color: 'rgba(240,237,232,0.75)',
                display: 'flex',
                gap: 10,
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: '#c8f05a', fontWeight: 700, flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
