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
    savings: 'Saves ~$850/mo vs Florida',
    text: "I thought retirement meant downsizing my lifestyle. LiveWhere showed me it could actually mean upgrading it. I discovered I could live comfortably in Portugal while spending nearly 30% less than I was spending in Florida.",
  },
  {
    name: 'Linda C., 61',
    role: 'Former School Principal',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$2,140/mo vs California',
    text: "I spent six months researching retirement destinations. In less than an hour, LiveWhere narrowed my options down to places that genuinely fit my budget, healthcare needs and lifestyle.",
  },
  {
    name: 'Michael T., 67',
    role: 'Retired Business Owner',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'Saves ~$2,890/mo vs New York',
    text: "The biggest surprise wasn't where I could afford to live. It was how much better my quality of life could be for the same income.",
  },
  {
    name: 'Patricia S., 59',
    role: 'Former Financial Manager',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'Saves ~$870/mo vs Texas',
    text: "Every retirement blog seemed to recommend the same places. LiveWhere helped me understand which countries actually made sense for my situation.",
  },
  {
    name: 'David K., 66',
    role: 'Retired Physician',
    location: '🇹🇭 Thailand',
    stars: 5,
    savings: 'Saves ~$2,350/mo vs Illinois',
    text: "Healthcare was my number one concern. Being able to compare healthcare quality alongside living costs completely changed how I evaluated my options.",
  },
  {
    name: 'Susan H., 63',
    role: 'Retired Accountant',
    location: '🇵🇦 Panama',
    stars: 5,
    savings: 'Saves ~$1,920/mo vs Georgia',
    text: "The monthly affordability breakdown alone was worth it. For the first time, I could see exactly where my retirement income would go furthest.",
  },
  {
    name: 'Richard & Karen B.',
    role: 'Retired Couple',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$2,640/mo vs Washington',
    text: "We weren't looking for the cheapest country. We were looking for the smartest choice. LiveWhere helped us find both.",
  },
  {
    name: 'Thomas W., 62',
    role: 'Former Executive',
    location: '🇲🇾 Malaysia',
    stars: 5,
    savings: 'Saves ~$2,480/mo vs Ohio',
    text: "What impressed me most was that it didn't just recommend destinations. It explained why they matched my priorities.",
  },
  {
    name: 'Barbara L., 70',
    role: 'Retired Teacher',
    location: '🇨🇴 Colombia',
    stars: 5,
    savings: 'Saves ~$2,070/mo vs Arizona',
    text: "I almost made an expensive mistake based on YouTube videos and expat forums. The data pointed me toward options I hadn't seriously considered.",
  },
  {
    name: 'Edward G., 65',
    role: 'Retired Entrepreneur',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$840/mo vs Colorado',
    text: "Retirement is one of the biggest financial decisions you'll ever make. LiveWhere gave me the confidence that I was making the right one.",
  },
  {
    name: 'James R., 68',
    role: 'Retired Police Chief',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$1,980/mo vs Michigan',
    text: "I was skeptical about moving abroad at my age. LiveWhere broke down every concern I had — healthcare, safety, visa — and made the decision feel manageable.",
  },
  {
    name: 'Carol & Jim D., 66 & 69',
    role: 'Retired Couple',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'Saves ~$2,760/mo vs New Jersey',
    text: "We compared eight countries before finding LiveWhere. In one afternoon it did what took us three months — and it was more thorough.",
  },
  {
    name: 'Nancy P., 62',
    role: 'Former HR Director',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$2,190/mo vs Illinois',
    text: "What sold me wasn't the cost savings — it was the quality-of-life data. I learned I could have a better life, not just a cheaper one.",
  },
  {
    name: 'Gary F., 71',
    role: 'Retired Firefighter',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'Saves ~$2,310/mo vs Oregon',
    text: "My pension goes almost twice as far here. LiveWhere showed me the exact numbers before I made any commitment. That transparency was everything.",
  },
  {
    name: 'Helen M., 64',
    role: 'Retired Nurse',
    location: '🇲🇾 Malaysia',
    stars: 5,
    savings: 'Saves ~$2,550/mo vs Minnesota',
    text: "As a nurse, healthcare quality was non-negotiable. LiveWhere let me filter by hospital standards and I found a city with excellent private care at a fraction of U.S. prices.",
  },
  {
    name: 'Dennis A., 67',
    role: 'Former Airline Pilot',
    location: '🇹🇭 Thailand',
    stars: 5,
    savings: 'Saves ~$3,020/mo vs Virginia',
    text: "I've lived in a lot of places. LiveWhere understood that I wasn't just chasing cheap rent — I wanted warmth, culture, and community. It found all three.",
  },
  {
    name: 'Ruth & Harold S., 63 & 67',
    role: 'Retired Couple',
    location: '🇵🇦 Panama',
    stars: 5,
    savings: 'Saves ~$2,080/mo vs Florida',
    text: "Panama was never on our radar. LiveWhere surfaced it based on our inputs and after visiting, we understood why. We move next spring.",
  },
  {
    name: 'Frank T., 60',
    role: 'Early Retiree, Former Attorney',
    location: '🇨🇴 Colombia',
    stars: 5,
    savings: 'Saves ~$2,430/mo vs New York',
    text: "I retired at 60 with a modest nest egg. LiveWhere showed me exactly which cities I could afford comfortably — and Colombia's Medellín blew me away.",
  },
  {
    name: 'Dorothy V., 72',
    role: 'Retired Librarian',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$830/mo vs Ohio',
    text: "At 72, I was worried it was too late to make a move. LiveWhere showed me retirees older than me thriving in Lisbon. That was the push I needed.",
  },
  {
    name: 'Walter H., 66',
    role: 'Retired Contractor',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$760/mo vs Arizona',
    text: "San Miguel de Allende is everything the brochures promised and more. LiveWhere helped me verify the reality behind the hype before I committed.",
  },
  {
    name: 'Sharon K., 61',
    role: 'Former Marketing Director',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'Saves ~$1,870/mo vs California',
    text: "I wanted to be within four hours of my kids in the U.S. LiveWhere filtered by flight time automatically. Costa Rica was the perfect distance.",
  },
  {
    name: 'Larry & Diane W., 70 & 68',
    role: 'Retired Couple',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'Saves ~$2,680/mo vs Massachusetts',
    text: "We'd been dreaming about Spain for years but couldn't figure out if we could afford it. LiveWhere ran the numbers and showed us we could — easily.",
  },
  {
    name: 'Roger N., 63',
    role: 'Retired Dentist',
    location: '🇲🇾 Malaysia',
    stars: 5,
    savings: 'Saves ~$2,920/mo vs Texas',
    text: "As a dentist I was curious about healthcare infrastructure. Malaysia's system genuinely impressed me — and LiveWhere gave me the data to validate that before I arrived.",
  },
  {
    name: 'Anne-Marie F., 59',
    role: 'Retired Social Worker',
    location: '🇨🇴 Colombia',
    stars: 5,
    savings: 'Saves ~$2,010/mo vs Washington',
    text: "I was on a fixed income and terrified of making the wrong move. LiveWhere gave me a clear picture of affordability without judgment — just data.",
  },
  {
    name: 'Kenneth B., 69',
    role: 'Retired Military Officer',
    location: '🇵🇭 Philippines',
    stars: 5,
    savings: 'Saves ~$3,140/mo vs Georgia',
    text: "My VA benefits stretch three times as far here. LiveWhere helped me find communities with existing American expat networks — critical for my transition.",
  },
  {
    name: 'Judith & Ray C., 64 & 66',
    role: 'Retired Couple',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$1,980/mo vs Nevada',
    text: "We were torn between Lake Chapala and Puerto Vallarta. LiveWhere compared both side-by-side against our exact criteria. Made the decision straightforward.",
  },
  {
    name: 'Arthur P., 73',
    role: 'Retired Professor',
    location: '🇮🇹 Italy',
    stars: 5,
    savings: 'Saves ~$2,240/mo vs Connecticut',
    text: "Italy's slow living matched what I wanted in retirement. What I didn't know was which region fit my budget. LiveWhere mapped that out perfectly.",
  },
  {
    name: 'Gloria T., 67',
    role: 'Retired Bank Manager',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$2,150/mo vs Maryland',
    text: "I'd been putting off this research for two years because it felt overwhelming. LiveWhere made it feel achievable. I had a shortlist in one session.",
  },
  {
    name: 'Bruce & Margaret L., 71 & 69',
    role: 'Retired Couple',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'Saves ~$2,260/mo vs Wisconsin',
    text: "We wanted adventure but also comfort. Costa Rica checked every box — and LiveWhere confirmed it wasn't just a feeling, the data backed it up.",
  },
  {
    name: 'Carolyn J., 60',
    role: 'Early Retiree, Former Accountant',
    location: '🇬🇷 Greece',
    stars: 5,
    savings: 'Saves ~$1,920/mo vs Pennsylvania',
    text: "Greece wasn't even in my top five until LiveWhere showed me the numbers. Now I wake up to the Aegean every morning. Best decision of my retirement.",
  },
  {
    name: 'Martin & Joyce H., 68 & 65',
    role: 'Retired Couple',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$2,170/mo vs Illinois',
    text: "We were worried about language barriers and bureaucracy. LiveWhere laid out the visa process step by step and connected us to the right resources. We've never looked back.",
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#c8f05a', fontSize: 14, letterSpacing: 2 }}>{'★'.repeat(t.stars)}</div>
              {/* Savings badge */}
              <div style={{
                background: 'rgba(200,240,90,0.12)',
                border: '1px solid rgba(200,240,90,0.3)',
                borderRadius: 100,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: '#c8f05a',
                whiteSpace: 'nowrap',
              }}>
                {t.savings}
              </div>
            </div>

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
