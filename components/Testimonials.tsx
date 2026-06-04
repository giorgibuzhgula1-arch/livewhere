'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

const TESTIMONIALS = [
  { name: 'Jake T.', role: 'Software Engineer', location: '🇵🇹 Lisbon, Portugal', avatar: 'https://i.pravatar.cc/150?img=11', text: 'I was stuck between Lisbon and Barcelona for months. LiveWhere ran the numbers and Lisbon won by a mile — lower taxes, cheaper rent, same quality of life. Moved 3 months ago and couldn\'t be happier.', stars: 5 },
  { name: 'Emily R.', role: 'Freelance Designer', location: '🇹🇭 Chiang Mai, Thailand', avatar: 'https://i.pravatar.cc/150?img=47', text: 'As a freelancer I needed a city that\'s affordable but still has fast internet and a good expat scene. LiveWhere pointed me to Chiang Mai — $900/month all-in. Best decision I\'ve made.', stars: 5 },
  { name: 'Chris M.', role: 'Product Manager', location: '🇲🇽 Mexico City, Mexico', avatar: 'https://i.pravatar.cc/150?img=15', text: 'The tax breakdown alone is worth it. I had no idea how much I was leaving on the table staying in the US. Mexico City gives me an extra $1,400/month effectively. The PDF report sealed the deal.', stars: 5 },
  { name: 'Sarah K.', role: 'Content Creator', location: '🇦🇪 Dubai, UAE', avatar: 'https://i.pravatar.cc/150?img=45', text: 'I compared 12 cities in under 5 minutes. The side-by-side view is incredibly clear — costs, safety, lifestyle score. Chose Dubai for the 0% income tax and haven\'t looked back.', stars: 5 },
  { name: 'Trevor G.', role: 'App Developer', location: '🇬🇪 Tbilisi, Georgia', avatar: 'https://i.pravatar.cc/150?img=3', text: 'Georgia\'s 1% tax for small businesses is insane. LiveWhere showed me Tbilisi — fast internet, $500/month rent, incredible food scene. Completely changed my financial picture.', stars: 5 },
  { name: 'Megan L.', role: 'Digital Nomad', location: '🇨🇴 Medellín, Colombia', avatar: 'https://i.pravatar.cc/150?img=44', text: 'Medellín wasn\'t even on my radar until LiveWhere surfaced it. Perfect climate, insane value for money, great co-working scene. I tell every nomad friend about this site.', stars: 5 },
  { name: 'Cameron Y.', role: 'SEO Specialist', location: '🇲🇾 Kuala Lumpur, Malaysia', avatar: 'https://i.pravatar.cc/150?img=23', text: 'KL is wildly underrated. World-class food, fast internet, affordable rent, English everywhere. LiveWhere ranked it #2 for my profile and I completely agree.', stars: 5 },
  { name: 'Brooke D.', role: 'Yoga Instructor', location: '🇮🇩 Bali, Indonesia', avatar: 'https://i.pravatar.cc/150?img=9', text: 'Ubud is exactly what it promises — spiritual, creative, affordable. LiveWhere matched it perfectly to my wellness-focused lifestyle priorities. I\'ve extended my stay indefinitely.', stars: 5 },
  { name: 'Ryan B.', role: 'Startup Founder', location: '🇪🇪 Tallinn, Estonia', avatar: 'https://i.pravatar.cc/150?img=33', text: 'LiveWhere helped me realize Estonia\'s e-Residency and low cost of living was perfect for my stage. The AI scoring actually factored in my startup lifestyle. Genuinely impressive tool.', stars: 5 },
  { name: 'Ashley C.', role: 'Marketing Consultant', location: '🇪🇸 Barcelona, Spain', avatar: 'https://i.pravatar.cc/150?img=49', text: 'I\'ve been wanting to move to Europe for years but couldn\'t decide where. LiveWhere made it a data decision, not an emotional one. Barcelona fit my budget perfectly.', stars: 5 },
  { name: 'Nathan P.', role: 'DevOps Engineer', location: '🇷🇴 Bucharest, Romania', avatar: 'https://i.pravatar.cc/150?img=14', text: 'I needed a European base with low taxes and fast internet. Bucharest scored top 3 for me. $600/month for a great apartment. Living like a king on a US salary.', stars: 5 },
  { name: 'Brandon W.', role: 'UX Researcher', location: '🇯🇵 Tokyo, Japan', avatar: 'https://i.pravatar.cc/150?img=13', text: 'Tokyo felt out of reach financially until I saw the actual numbers. LiveWhere showed me it\'s cheaper than NYC once you factor in no car and public healthcare.', stars: 5 },
  { name: 'Kayla S.', role: 'Copywriter', location: '🇬🇷 Athens, Greece', avatar: 'https://i.pravatar.cc/150?img=46', text: 'Greece\'s digital nomad visa plus LiveWhere\'s cost breakdown made this a no-brainer. Athens is stunning and my monthly costs dropped by 40% compared to Chicago.', stars: 5 },
  { name: 'Mason I.', role: 'SaaS Founder', location: '🇦🇪 Dubai, UAE', avatar: 'https://i.pravatar.cc/150?img=20', text: 'For a founder bootstrapping a SaaS, 0% corporate tax in Dubai changes the math completely. LiveWhere laid it out clearly with actual numbers. Moved 4 months ago.', stars: 5 },
  { name: 'Olivia T.', role: 'Remote Accountant', location: '🇵🇹 Lisbon, Portugal', avatar: 'https://i.pravatar.cc/150?img=35', text: 'Sydney housing costs were killing me. LiveWhere showed me I could move to Lisbon, keep my AUD income, and save $2,000 a month. The numbers spoke for themselves.', stars: 5 },
  { name: 'Ethan R.', role: 'Mobile Developer', location: '🇷🇸 Belgrade, Serbia', avatar: 'https://i.pravatar.cc/150?img=24', text: 'Belgrade is a hidden gem. Flat 15% tax, fast internet, great nightlife, growing tech scene. LiveWhere was the only platform that ranked it highly for tech workers.', stars: 5 },
  { name: 'Cody C.', role: 'Growth Hacker', location: '🇻🇳 Ho Chi Minh City, Vietnam', avatar: 'https://i.pravatar.cc/150?img=53', text: 'HCMC is one of the most underrated cities on earth. $700/month, incredible food, super fast internet. LiveWhere ranked it top 3 for my budget and I completely agree.', stars: 5 },
  { name: 'Travis A.', role: 'IT Consultant', location: '🇭🇺 Budapest, Hungary', avatar: 'https://i.pravatar.cc/150?img=57', text: 'Budapest is stunning and extraordinarily affordable for Europe. LiveWhere\'s scoring factored in my consulting tax situation perfectly. One of the best cities I\'ve ever lived in.', stars: 5 },
  { name: 'Molly Z.', role: 'Illustrator', location: '🇪🇸 Valencia, Spain', avatar: 'https://i.pravatar.cc/150?img=60', text: 'Valencia is everything Barcelona promises but actually affordable. LiveWhere matched it as my #1 and the quality of life here is unreal. Paella, beaches, and a thriving creative scene.', stars: 5 },
  { name: 'Jessica F.', role: 'Online Business Owner', location: '🇲🇹 Malta', avatar: 'https://i.pravatar.cc/150?img=48', text: 'Malta wasn\'t on my list at all. LiveWhere surfaced it based on my tax situation and lifestyle. English-speaking, EU, warm weather — perfect trifecta.', stars: 5 },
  { name: 'Patrick K.', role: 'Remote Sales Director', location: '🇦🇪 Dubai, UAE', avatar: 'https://i.pravatar.cc/150?img=27', text: 'London\'s cost of living was brutal. LiveWhere showed me Dubai would give me a 45% effective pay rise just from the tax difference. The comparison tool is incredibly powerful.', stars: 5 },
  { name: 'Courtney F.', role: 'Brand Strategist', location: '🇦🇱 Tirana, Albania', avatar: 'https://i.pravatar.cc/150?img=5', text: 'Albania is the new frontier for digital nomads. EU candidate, flat 15% tax, stunning coastline. LiveWhere was one of the only platforms with real data on Tirana.', stars: 5 },
  { name: 'Samantha U.', role: 'Life Coach', location: '🇨🇷 San José, Costa Rica', avatar: 'https://i.pravatar.cc/150?img=37', text: 'Costa Rica\'s pensionado visa plus the pura vida lifestyle was exactly what I needed. LiveWhere matched me perfectly and the expat community here is incredible.', stars: 5 },
  { name: 'Kyle W.', role: 'Amazon FBA Seller', location: '🇧🇬 Sofia, Bulgaria', avatar: 'https://i.pravatar.cc/150?img=65', text: 'Bulgaria has the EU\'s lowest flat tax at 10%. LiveWhere flagged this immediately for my e-commerce profile. Sofia is modern, fast internet, and insanely affordable.', stars: 5 },
  { name: 'Danielle V.', role: 'Remote Therapist', location: '🇵🇹 Lisbon, Portugal', avatar: 'https://i.pravatar.cc/150?img=68', text: 'Auckland housing is out of control. LiveWhere showed me I could move to Lisbon, keep my NZD client base, and cut my living costs by 50%. The decision was easy after seeing the numbers.', stars: 5 },
]

export default function Testimonials() {
  const [showAll, setShowAll] = useState(false)

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ Real Stories
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 48 }}>
        People who found their city
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
              <img src={t.avatar} alt={t.name} width={44} height={44} style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
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
            Show all 25 reviews
          </button>
        </div>
      )}
    </section>
  )
}
