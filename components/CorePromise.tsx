'use client'

import { motion } from 'framer-motion'

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
            fontSize: 18,
            lineHeight: 1.7,
            color: 'rgba(240,237,232,0.6)',
            margin: '0 auto',
            maxWidth: 640,
          }}
        >
          LiveWhere analyzes 200+ cities across taxes, healthcare, cost of living, safety and lifestyle to find the best place for your next chapter.
        </motion.p>
      </div>
    </section>
  )
}
