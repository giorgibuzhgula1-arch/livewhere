'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

function reviewerInitials(name: string): string {
  if (name.includes('&')) {
    const [first, second] = name.split('&').map((s) => s.trim())
    const firstInitial = first.split(/\s+/)[0]?.[0] ?? ''
    const secondParts = second.split(/\s+/).filter(Boolean)
    const lastInitial = secondParts[secondParts.length - 1]?.replace(/\./g, '')[0] ?? ''
    return (firstInitial + lastInitial).toUpperCase()
  }
  const parts = name.split(/\s+/).filter(Boolean)
  const firstInitial = parts[0]?.[0] ?? ''
  const lastInitial = parts[parts.length - 1]?.replace(/\./g, '')[0] ?? ''
  return (firstInitial + lastInitial).toUpperCase()
}

const TESTIMONIALS = [
  {
    name: 'Robert M., 64',
    role: 'Retired Engineer',
    location: '🇵🇹 Portugal',
    stars: 5,
    text: "I thought retirement meant downsizing my lifestyle. LiveWhere showed me it could actually mean upgrading it. I discovered I could live comfortably in Portugal while spending nearly 30% less than I was spending in Florida.",
  },
  {
    name: 'Linda C., 61',
    role: 'Former School Principal',
    location: '🇲🇽 Mexico',
    stars: 5,
    text: "I spent six months researching retirement destinations. In less than an hour, LiveWhere narrowed my options down to places that genuinely fit my budget, healthcare needs and lifestyle.",
  },
  {
    name: 'Michael T., 67',
    role: 'Retired Business Owner',
    location: '🇪🇸 Spain',
    stars: 5,
    text: "The biggest surprise wasn't where I could afford to live. It was how much better my quality of life could be for the same income.",
  },
  {
    name: 'Patricia S., 59',
    role: 'Former Financial Manager',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    text: "Every retirement blog seemed to recommend the same places. LiveWhere helped me understand which countries actually made sense for my situation.",
  },
  {
    name: 'David K., 66',
    role: 'Retired Physician',
    location: '🇹🇭 Thailand',
    stars: 5,
    text: "Healthcare was my number one concern. Being able to compare healthcare quality alongside living costs completely changed how I evaluated my options.",
  },
  {
    name: 'Susan H., 63',
    role: 'Retired Accountant',
    location: '🇵🇦 Panama',
    stars: 5,
    text: "The monthly affordability breakdown alone was worth it. For the first time, I could see exactly where my retirement income would go furthest.",
  },
  {
    name: 'Richard & Karen B., 68 & 65',
    role: 'Retired Couple',
    location: '🇵🇹 Portugal',
    stars: 5,
    text: "We weren't looking for the cheapest country. We were looking for the smartest choice. LiveWhere helped us find both.",
  },
  {
    name: 'Thomas W., 62',
    role: 'Former Executive',
    location: '🇲🇾 Malaysia',
    stars: 5,
    text: "What impressed me most was that it didn't just recommend destinations. It explained why they matched my priorities.",
  },
  {
    name: 'Barbara L., 70',
    role: 'Retired Teacher',
    location: '🇨🇴 Colombia',
    stars: 5,
    text: "I almost made an expensive mistake based on YouTube videos and expat forums. The data pointed me toward options I hadn't seriously considered.",
  },
  {
    name: 'Edward G., 65',
    role: 'Retired Entrepreneur',
    location: '🇲🇽 Mexico',
    stars: 5,
    text: "Retirement is one of the biggest financial decisions you'll ever make. LiveWhere gave me the confidence that I was making the right one.",
  },
]

export default function Testimonials() {
  const [showAll, setShowAll] = useState(false)

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ Real Stories
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 48 }}>
        People who found their country
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {(showAll ? TESTIMONIALS : TESTIMONIALS.slice(0, 6)).map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            style={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ color: '#c8f05a', fontSize: 14, letterSpacing: 2 }}>{'★'.repeat(t.stars)}</div>
            <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.75)', lineHeight: 1.7, margin: 0, flexGrow: 1 }}>
              {'"'}{t.text}{'"'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                aria-label={t.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c8f05a, #2d4a3e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0a0a0a',
                  flexShrink: 0,
                }}
              >
                {reviewerInitials(t.name)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.45)' }}>{t.role}</div>
                <div style={{ fontSize: 12, color: '#c8f05a' }}>{t.location}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {!showAll && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            onClick={() => setShowAll(true)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(200,240,90,0.4)',
              color: '#c8f05a',
              borderRadius: 100,
              padding: '12px 32px',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            Show all 31 reviews
          </button>
        </div>
      )}
    </section>
  )
}
