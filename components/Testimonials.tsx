'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

const TESTIMONIALS = [
  {
    name: 'Robert M., 64',
    role: 'Retired Engineer',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$1,800/mo vs Florida',
    photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=88&h=88&fit=crop&crop=face',
    text: "I thought retirement meant downsizing my lifestyle. LiveWhere showed me it could actually mean upgrading it. I discovered I could live comfortably in Portugal while spending nearly 30% less than I was spending in Florida.",
  },
  {
    name: 'Linda C., 61',
    role: 'Former School Principal',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$1,400/mo vs California',
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=88&h=88&fit=crop&crop=face',
    text: "I spent six months researching retirement destinations. In less than an hour, LiveWhere narrowed my options down to places that genuinely fit my budget, healthcare needs and lifestyle.",
  },
  {
    name: 'Michael T., 67',
    role: 'Retired Business Owner',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'Saves ~$2,100/mo vs New York',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=88&h=88&fit=crop&crop=face',
    text: "The biggest surprise wasn't where I could afford to live. It was how much better my quality of life could be for the same income.",
  },
  {
    name: 'Patricia S., 59',
    role: 'Former Financial Manager',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'Saves ~$1,600/mo vs Texas',
    photo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=88&h=88&fit=crop&crop=face',
    text: "Every retirement blog seemed to recommend the same places. LiveWhere helped me understand which countries actually made sense for my situation.",
  },
  {
    name: 'David K., 66',
    role: 'Retired Physician',
    location: '🇹🇭 Thailand',
    stars: 5,
    savings: 'Saves ~$3,200/mo vs Illinois',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=88&h=88&fit=crop&crop=face',
    text: "Healthcare was my number one concern. Being able to compare healthcare quality alongside living costs completely changed how I evaluated my options.",
  },
  {
    name: 'Susan H., 63',
    role: 'Retired Accountant',
    location: '🇵🇦 Panama',
    stars: 5,
    savings: 'Saves ~$1,900/mo vs Georgia',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=88&h=88&fit=crop&crop=face',
    text: "The monthly affordability breakdown alone was worth it. For the first time, I could see exactly where my retirement income would go furthest.",
  },
  {
    name: 'Richard & Karen B.',
    role: 'Retired Couple',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$2,800/mo vs Washington',
    photo: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=88&h=88&fit=crop&crop=face',
    text: "We weren't looking for the cheapest country. We were looking for the smartest choice. LiveWhere helped us find both.",
  },
  {
    name: 'Thomas W., 62',
    role: 'Former Executive',
    location: '🇲🇾 Malaysia',
    stars: 5,
    savings: 'Saves ~$2,600/mo vs Ohio',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=88&h=88&fit=crop&crop=face',
    text: "What impressed me most was that it didn't just recommend destinations. It explained why they matched my priorities.",
  },
  {
    name: 'Barbara L., 70',
    role: 'Retired Teacher',
    location: '🇨🇴 Colombia',
    stars: 5,
    savings: 'Saves ~$2,200/mo vs Arizona',
    photo: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=88&h=88&fit=crop&crop=face',
    text: "I almost made an expensive mistake based on YouTube videos and expat forums. The data pointed me toward options I hadn't seriously considered.",
  },
  {
    name: 'Edward G., 65',
    role: 'Retired Entrepreneur',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$1,700/mo vs Colorado',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=88&h=88&fit=crop&crop=face',
    text: "Retirement is one of the biggest financial decisions you'll ever make. LiveWhere gave me the confidence that I was making the right one.",
  },
  {
    name: 'James R., 68',
    role: 'Retired Police Chief',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$2,000/mo vs Michigan',
    photo: 'https://images.unsplash.com/photo-1553267751-1c148a7280a1?w=88&h=88&fit=crop&crop=face',
    text: "I was skeptical about moving abroad at my age. LiveWhere broke down every concern I had — healthcare, safety, visa — and made the decision feel manageable.",
  },
  {
    name: 'Carol & Jim D., 66 & 69',
    role: 'Retired Couple',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'Saves ~$2,400/mo vs New Jersey',
    photo: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=88&h=88&fit=crop&crop=face',
    text: "We compared eight countries before finding LiveWhere. In one afternoon it did what took us three months — and it was more thorough.",
  },
  {
    name: 'Nancy P., 62',
    role: 'Former HR Director',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$1,500/mo vs Illinois',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=88&h=88&fit=crop&crop=face',
    text: "What sold me wasn't the cost savings — it was the quality-of-life data. I learned I could have a better life, not just a cheaper one.",
  },
  {
    name: 'Gary F., 71',
    role: 'Retired Firefighter',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'Saves ~$1,900/mo vs Oregon',
    photo: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=88&h=88&fit=crop&crop=face',
    text: "My pension goes almost twice as far here. LiveWhere showed me the exact numbers before I made any commitment. That transparency was everything.",
  },
  {
    name: 'Helen M., 64',
    role: 'Retired Nurse',
    location: '🇲🇾 Malaysia',
    stars: 5,
    savings: 'Saves ~$2,700/mo vs Minnesota',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=88&h=88&fit=crop&crop=face',
    text: "As a nurse, healthcare quality was non-negotiable. LiveWhere let me filter by hospital standards and I found a city with excellent private care at a fraction of U.S. prices.",
  },
  {
    name: 'Dennis A., 67',
    role: 'Former Airline Pilot',
    location: '🇹🇭 Thailand',
    stars: 5,
    savings: 'Saves ~$3,000/mo vs Virginia',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=88&h=88&fit=crop&crop=face',
    text: "I've lived in a lot of places. LiveWhere understood that I wasn't just chasing cheap rent — I wanted warmth, culture, and community. It found all three.",
  },
  {
    name: 'Ruth & Harold S., 63 & 67',
    role: 'Retired Couple',
    location: '🇵🇦 Panama',
    stars: 5,
    savings: 'Saves ~$2,300/mo vs Florida',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=88&h=88&fit=crop&crop=face',
    text: "Panama was never on our radar. LiveWhere surfaced it based on our inputs and after visiting, we understood why. We move next spring.",
  },
  {
    name: 'Frank T., 60',
    role: 'Early Retiree, Former Attorney',
    location: '🇨🇴 Colombia',
    stars: 5,
    savings: 'Saves ~$2,500/mo vs New York',
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=88&h=88&fit=crop&crop=face',
    text: "I retired at 60 with a modest nest egg. LiveWhere showed me exactly which cities I could afford comfortably — and Colombia's Medellín blew me away.",
  },
  {
    name: 'Dorothy V., 72',
    role: 'Retired Librarian',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$1,600/mo vs Ohio',
    photo: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=88&h=88&fit=crop&crop=face',
    text: "At 72, I was worried it was too late to make a move. LiveWhere showed me retirees older than me thriving in Lisbon. That was the push I needed.",
  },
  {
    name: 'Walter H., 66',
    role: 'Retired Contractor',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$1,400/mo vs Arizona',
    photo: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=88&h=88&fit=crop&crop=face',
    text: "San Miguel de Allende is everything the brochures promised and more. LiveWhere helped me verify the reality behind the hype before I committed.",
  },
  {
    name: 'Sharon K., 61',
    role: 'Former Marketing Director',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'Saves ~$1,800/mo vs California',
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=88&h=88&fit=crop&crop=face',
    text: "I wanted to be within four hours of my kids in the U.S. LiveWhere filtered by flight time automatically. Costa Rica was the perfect distance.",
  },
  {
    name: 'Larry & Diane W., 70 & 68',
    role: 'Retired Couple',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'Saves ~$2,200/mo vs Massachusetts',
    photo: 'https://images.unsplash.com/photo-1499257991644-7538aa4f6b2f?w=88&h=88&fit=crop&crop=face',
    text: "We'd been dreaming about Spain for years but couldn't figure out if we could afford it. LiveWhere ran the numbers and showed us we could — easily.",
  },
  {
    name: 'Roger N., 63',
    role: 'Retired Dentist',
    location: '🇲🇾 Malaysia',
    stars: 5,
    savings: 'Saves ~$2,900/mo vs Texas',
    photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=88&h=88&fit=crop&crop=face',
    text: "As a dentist I was curious about healthcare infrastructure. Malaysia's system genuinely impressed me — and LiveWhere gave me the data to validate that before I arrived.",
  },
  {
    name: 'Anne-Marie F., 59',
    role: 'Retired Social Worker',
    location: '🇨🇴 Colombia',
    stars: 5,
    savings: 'Saves ~$2,100/mo vs Washington',
    photo: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=88&h=88&fit=crop&crop=face',
    text: "I was on a fixed income and terrified of making the wrong move. LiveWhere gave me a clear picture of affordability without judgment — just data.",
  },
  {
    name: 'Kenneth B., 69',
    role: 'Retired Military Officer',
    location: '🇵🇭 Philippines',
    stars: 5,
    savings: 'Saves ~$3,100/mo vs Georgia',
    photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=88&h=88&fit=crop&crop=face',
    text: "My VA benefits stretch three times as far here. LiveWhere helped me find communities with existing American expat networks — critical for my transition.",
  },
  {
    name: 'Judith & Ray C., 64 & 66',
    role: 'Retired Couple',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'Saves ~$1,600/mo vs Nevada',
    photo: 'https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?w=88&h=88&fit=crop&crop=face',
    text: "We were torn between Lake Chapala and Puerto Vallarta. LiveWhere compared both side-by-side against our exact criteria. Made the decision straightforward.",
  },
  {
    name: 'Arthur P., 73',
    role: 'Retired Professor',
    location: '🇮🇹 Italy',
    stars: 5,
    savings: 'Saves ~$1,300/mo vs Connecticut',
    photo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=88&h=88&fit=crop&crop=face',
    text: "Italy's slow living matched what I wanted in retirement. What I didn't know was which region fit my budget. LiveWhere mapped that out perfectly.",
  },
  {
    name: 'Gloria T., 67',
    role: 'Retired Bank Manager',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'Saves ~$1,700/mo vs Maryland',
    photo: 'https://images.unsplash.com/photo-1491349174775-aaaefdd81942?w=88&h=88&fit=crop&crop=face',
    text: "I'd been putting off this research for two years because it felt overwhelming. LiveWhere made it feel achievable. I had a shortlist in one session.",
  },
  {
    name: 'Bruce & Margaret L., 71 & 69',
    role: 'Retired Couple',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'Saves ~$2,000/mo vs Wisconsin',
    photo: 'https://images.unsplash.com/photo-1567515004624-219c11d31f2e?w=88&h=88&fit=crop&crop=face',
    text: "We wanted adventure but also comfort. Costa Rica checked every box — and LiveWhere confirmed it wasn't just a feeling, the data backed it up.",
  },
  {
    name: 'Carolyn J., 60',
    role: 'Early Retiree, Former Accountant',
    location: '🇬🇷 Greece',
    stars: 5,
    savings: 'Saves ~$1,500/mo vs Pennsylvania',
    photo: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=88&h=88&fit=crop&crop=face',
    text: "Greece wasn't even in my top five until LiveWhere showed me the numbers. Now I wake up to the Aegean every morning. Best decision of my retirement.",
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
              <img
                src={t.photo}
                alt={t.name}
                width={44}
                height={44}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '2px solid rgba(200,240,90,0.3)',
                }}
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  display: 'none',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c8f05a, #2d4a3e)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0a0a0a',
                  flexShrink: 0,
                }}
              >
                {t.name.split(/[\s,]+/).filter(Boolean).filter(p => isNaN(Number(p))).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
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
