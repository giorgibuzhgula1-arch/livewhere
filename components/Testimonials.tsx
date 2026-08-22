'use client'
import { useRef, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { motion } from 'framer-motion'

function reviewerInitials(name: string): string {
  if (name.includes('&')) {
    const [first, second] = name.split('&').map((s) => s.trim())
    const firstInitial = first.split(/\s+/)[0]?.[0] ?? ''
    const secondParts = second.split(/\s+/).filter(Boolean)
    const lastInitial = secondParts[secondParts.length - 1]?.replace(/\./g, '')[0] ?? ''
    return (firstInitial + lastInitial).toUpperCase()
  }
  const parts = name.split(/\s+/).filter((p) => p && !/^\d+$/.test(p.replace(/[.,]/g, '')))
  const firstInitial = parts[0]?.[0] ?? ''
  const lastInitial = parts[parts.length - 1]?.replace(/\./g, '')[0] ?? ''
  return (firstInitial + lastInitial).toUpperCase()
}

type Testimonial = {
  name: string
  role: string
  location: string
  stars: number
  savings: string
  text: string
  videoUrl?: string
}

function ClickToPlayVideo({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const poster = 'https://pub-2c66f9226a0740a194205e63eaed682f.r2.dev/robert-poster.jpg'

  const boxStyle: CSSProperties = {
    position: 'relative',
    width: 140,
    maxWidth: 140,
    aspectRatio: '9 / 16',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#1a1a1a',
    flexShrink: 0,
    alignSelf: 'center',
    margin: '0 auto',
  }

  const videoStyle: CSSProperties = {
    width: 140,
    maxWidth: 140,
    aspectRatio: '9 / 16',
    borderRadius: 12,
    overflow: 'hidden',
    objectFit: 'cover',
    background: '#1a1a1a',
    flexShrink: 0,
    alignSelf: 'center',
    margin: '0 auto',
    display: 'block',
  }

  function handlePlayClick() {
    flushSync(() => setPlaying(true))
    void videoRef.current?.play()
  }

  if (playing) {
    return (
      <div style={boxStyle}>
        <video
          ref={videoRef}
          src={src}
          poster="https://pub-2c66f9226a0740a194205e63eaed682f.r2.dev/robert-poster.jpg"
          playsInline
          onEnded={() => setPlaying(false)}
          style={videoStyle}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            pointerEvents: 'auto',
          }}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handlePlayClick}
      aria-label="Play example story video"
      style={{
        ...boxStyle,
        padding: 0,
        border: 'none',
        cursor: 'pointer',
        display: 'block',
      }}
    >
      <img
        src={poster}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(10,10,15,0.72)',
          border: '1px solid rgba(200,240,90,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            width: 0,
            height: 0,
            marginLeft: 3,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: '14px solid #c8f05a',
          }}
        />
      </span>
    </button>
  )
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Sarah Mitchell, 64',
    role: 'Retired Teacher',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'up to ~$850/mo vs Florida',
    text: "I honestly thought retiring abroad meant sacrificing comfort. Instead, I ended up with a nicer apartment, better weather, and about $850 extra in my pocket every month. Spain has been a pleasant surprise.",
    videoUrl: 'https://pub-2c66f9226a0740a194205e63eaed682f.r2.dev/robert-testimonial-sound.mp4',
  },
  {
    name: 'Linda C., 61',
    role: 'Former School Principal',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'up to ~$2,140/mo vs California',
    text: "Six months of research left me with a dozen browser tabs and no clear answer. Once I compared my options side by side, Mexico quickly rose to the top. The numbers finally matched the lifestyle I was looking for.",
  },
  {
    name: 'Michael T., 67',
    role: 'Retired Business Owner',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'up to ~$2,890/mo vs New York',
    text: "Saving money was part of the goal, but I didn't expect life to feel this different. I spend more time outdoors, worry less about expenses, and still have room in my budget for travel. Spain has exceeded every expectation.",
  },
  {
    name: 'Patricia S., 59',
    role: 'Former Financial Manager',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'up to ~$870/mo vs Texas',
    text: "For a while I kept seeing the same countries recommended everywhere online. Once I looked at what actually mattered to me, Costa Rica made far more sense than the usual suggestions. I'm glad I didn't just follow the crowd.",
  },
  {
    name: 'David K., 66',
    role: 'Retired Physician',
    location: '🇹🇭 Thailand',
    stars: 5,
    savings: 'up to ~$2,350/mo vs Illinois',
    text: "As a physician, healthcare wasn't something I was willing to compromise on. Seeing quality care and affordability in the same place completely changed my perspective. Thailand checked more boxes than I expected.",
  },
  {
    name: 'Susan H., 63',
    role: 'Retired Accountant',
    location: '🇵🇦 Panama',
    stars: 5,
    savings: 'up to ~$1,920/mo vs Georgia',
    text: "The monthly breakdown was what finally made everything click. I could see exactly how far my retirement income would stretch — and Panama made the numbers work better than anywhere else I'd looked.",
  },
  {
    name: 'Richard & Karen B.',
    role: 'Retired Couple',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'up to ~$2,640/mo vs Washington',
    text: "We weren't chasing the cheapest option. We wanted somewhere that made financial and practical sense. Portugal ended up being both, and we haven't second-guessed it once.",
  },
  {
    name: 'Thomas W., 49',
    role: 'Former Executive',
    location: '🇲🇾 Malaysia',
    stars: 5,
    savings: 'up to ~$2,480/mo vs Ohio',
    text: "What stood out wasn't just the destination recommendations — it was understanding why each one fit my situation. Malaysia wasn't on my radar until the data made a strong case for it.",
  },
  {
    name: 'Barbara L., 70',
    role: 'Retired Teacher',
    location: '🇨🇴 Colombia',
    stars: 5,
    savings: 'up to ~$2,070/mo vs Arizona',
    text: "I almost talked myself into a move based on YouTube videos and expat forums. The actual data pointed somewhere I hadn't seriously considered. Colombia turned out to be the right call.",
  },
  {
    name: 'Edward G., 46',
    role: 'Retired Entrepreneur',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'up to ~$840/mo vs Colorado',
    text: "Retirement is one of the bigger financial decisions you'll face. I needed something more than blog posts and opinions. Having real numbers behind the decision made all the difference.",
  },
  {
    name: 'James R., 68',
    role: 'Retired Police Chief',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'up to ~$1,980/mo vs Michigan',
    text: "I had real concerns about moving at my age — healthcare, safety, whether it was even practical. Going through everything step by step made it feel a lot less daunting. Portugal turned out to be the right fit.",
  },
  {
    name: 'Carol & Jim D., 66 & 69',
    role: 'Retired Couple',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'up to ~$2,760/mo vs New Jersey',
    text: "We spent three months comparing countries on our own and felt like we were going in circles. One afternoon with the right data did more than all that research combined.",
  },
  {
    name: 'Nancy P., 53',
    role: 'Former HR Director',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'up to ~$2,190/mo vs Illinois',
    text: "The cost savings were real, but what actually sold me was the quality-of-life data. I wasn't looking for cheaper — I was looking for better. Mexico delivered on both.",
  },
  {
    name: 'Gary F., 71',
    role: 'Retired Firefighter',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'up to ~$2,310/mo vs Oregon',
    text: "My pension goes nearly twice as far here. I needed to see the exact numbers before committing to anything, and having that clarity upfront made the whole decision much easier.",
  },
  {
    name: 'Helen M., 64',
    role: 'Retired Nurse',
    location: '🇲🇾 Malaysia',
    stars: 5,
    savings: 'up to ~$2,550/mo vs Minnesota',
    text: "As a nurse, I wasn't willing to guess on healthcare quality. Being able to filter by hospital standards and see real cost comparisons made Malaysia an easy choice.",
  },
  {
    name: 'Dennis A., 67',
    role: 'Former Airline Pilot',
    location: '🇹🇭 Thailand',
    stars: 5,
    savings: 'up to ~$3,020/mo vs Virginia',
    text: "I've lived in a lot of places over the years. What I wanted in retirement was warmth, culture, and a real sense of community. Thailand had all three — and the data backed it up.",
  },
  {
    name: 'Ruth & Harold S., 63 & 67',
    role: 'Retired Couple',
    location: '🇵🇦 Panama',
    stars: 5,
    savings: 'up to ~$2,080/mo vs Florida',
    text: "Panama wasn't something we'd seriously considered. Once we saw how well it matched what we were looking for, we booked a visit. We move next spring.",
  },
  {
    name: 'Frank T., 54',
    role: 'Early Retiree, Former Attorney',
    location: '🇨🇴 Colombia',
    stars: 5,
    savings: 'up to ~$2,430/mo vs New York',
    text: "I retired early with a modest nest egg and wasn't sure what I could realistically afford. Seeing exactly which cities fit my budget — comfortably — made Medellín an obvious choice.",
  },
  {
    name: 'Dorothy V., 72',
    role: 'Retired Librarian',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'up to ~$830/mo vs Ohio',
    text: "At 72, I wasn't sure it made sense to uproot and move. What changed my mind was seeing how many retirees older than me were thriving in Lisbon. That was enough.",
  },
  {
    name: 'Walter H., 48',
    role: 'Retired Contractor',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'up to ~$760/mo vs Arizona',
    text: "San Miguel de Allende gets a lot of hype. What I needed was something more than word of mouth — a way to verify the reality before committing. The numbers held up.",
  },
  {
    name: 'Sharon K., 57',
    role: 'Former Marketing Director',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'up to ~$1,870/mo vs California',
    text: "Being within a few hours of my kids in the U.S. was non-negotiable. Costa Rica hit that mark and checked every other box too. I didn't have to compromise on anything.",
  },
  {
    name: 'Larry & Diane W., 70 & 68',
    role: 'Retired Couple',
    location: '🇪🇸 Spain',
    stars: 5,
    savings: 'up to ~$2,680/mo vs Massachusetts',
    text: "We'd talked about Spain for years but never felt sure we could make it work financially. Once we ran the actual numbers, it turned out we could — comfortably.",
  },
  {
    name: 'Roger N., 63',
    role: 'Retired Dentist',
    location: '🇲🇾 Malaysia',
    stars: 5,
    savings: 'up to ~$2,920/mo vs Texas',
    text: "As a dentist, I had specific questions about healthcare infrastructure. Malaysia's system genuinely impressed me, and having the data to validate that before I arrived made the transition much smoother.",
  },
  {
    name: 'Anne-Marie F., 59',
    role: 'Retired Social Worker',
    location: '🇨🇴 Colombia',
    stars: 5,
    savings: 'up to ~$2,010/mo vs Washington',
    text: "I was on a fixed income and nervous about making the wrong call. Having a clear, straightforward picture of affordability — without any pressure — was exactly what I needed.",
  },
  {
    name: 'Kenneth B., 69',
    role: 'Retired Military Officer',
    location: '🇵🇭 Philippines',
    stars: 5,
    savings: 'up to ~$3,140/mo vs Georgia',
    text: "My VA benefits stretch about three times as far here. Finding communities with established American expat networks made the transition feel far less overwhelming.",
  },
  {
    name: 'Judith & Ray C., 64 & 66',
    role: 'Retired Couple',
    location: '🇲🇽 Mexico',
    stars: 5,
    savings: 'up to ~$1,980/mo vs Nevada',
    text: "We were torn between two cities and couldn't decide. Comparing them side by side against our exact priorities made the choice straightforward. Lake Chapala won.",
  },
  {
    name: 'Arthur P., 73',
    role: 'Retired Professor',
    location: '🇮🇹 Italy',
    stars: 5,
    savings: 'up to ~$2,240/mo vs Connecticut',
    text: "I always knew I wanted Italy in retirement. What I didn't know was which region actually fit my budget. Getting that mapped out clearly made the whole thing feel achievable.",
  },
  {
    name: 'Gloria T., 59',
    role: 'Retired Bank Manager',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'up to ~$2,150/mo vs Maryland',
    text: "I'd been putting off this research for two years because it felt like too much. One focused session gave me a shortlist I actually felt confident about. Should have done it sooner.",
  },
  {
    name: 'Bruce & Margaret L., 71 & 69',
    role: 'Retired Couple',
    location: '🇨🇷 Costa Rica',
    stars: 5,
    savings: 'up to ~$2,260/mo vs Wisconsin',
    text: "We wanted adventure without giving up comfort. Costa Rica kept coming up — and the data confirmed it wasn't just a gut feeling. Every box got checked.",
  },
  {
    name: 'Carolyn J., 60',
    role: 'Early Retiree, Former Accountant',
    location: '🇬🇷 Greece',
    stars: 5,
    savings: 'up to ~$1,920/mo vs Pennsylvania',
    text: "Greece wasn't even in my top five. Then the numbers changed my mind. Now I wake up to the Aegean every morning. Easily the best decision I've made in retirement.",
  },
  {
    name: 'Martin & Joyce H., 68 & 65',
    role: 'Retired Couple',
    location: '🇵🇹 Portugal',
    stars: 5,
    savings: 'up to ~$2,170/mo vs Illinois',
    text: "We had real concerns about language barriers and navigating a foreign bureaucracy. Having the visa process laid out clearly and knowing where to find the right resources made everything manageable.",
  },
]

export default function Testimonials() {
  const [showAll, setShowAll] = useState(false)

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ Example Stories
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

            {t.videoUrl ? <ClickToPlayVideo src={t.videoUrl} /> : null}

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
