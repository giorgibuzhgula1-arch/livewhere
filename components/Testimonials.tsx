'use client'
import { motion } from 'framer-motion'

const TESTIMONIALS = [
  {
    name: 'Marcus D.',
    role: 'Copywriter',
    location: '🇵🇹 Lisbon, Portugal',
    avatar: 'https://i.pravatar.cc/150?img=3',
    stars: 5,
    text: "I wasn't expecting much, to be honest. I entered my details, and Lisbon came out on top. Portugal wasn't even on my radar. I spent a few days looking into it, and the recommendation actually made sense. I've been living here for four months now — my rent is $1,200, the weather is incredible, and the food scene is unreal. I haven't looked back.",
  },
  {
    name: 'Priya N.',
    role: 'Data Analyst',
    location: '🇦🇪 Dubai, UAE',
    avatar: 'https://i.pravatar.cc/150?img=47',
    stars: 5,
    text: "I'm the kind of person who usually builds a spreadsheet for everything. I spent nearly two weeks comparing cities on my own. This tool gave me a shortlist in minutes and even highlighted things I had completely overlooked, like tax advantages in Portugal and Dubai. It saved me a lot of research.",
  },
  {
    name: 'Tom & Sarah K.',
    role: 'Remote Workers',
    location: '🇪🇸 Valencia, Spain',
    avatar: 'https://i.pravatar.cc/150?img=11',
    stars: 5,
    text: "As a family, we had different priorities than most remote workers. We cared about safety, healthcare, schools, and overall quality of life. Most relocation tools seem designed for single nomads, but this one felt much more balanced. We ended up choosing Valencia, and it's been a fantastic move for us and the kids.",
  },
  {
    name: 'James R.',
    role: 'UX Designer',
    location: '🇨🇴 Medellín, Colombia',
    avatar: 'https://i.pravatar.cc/150?img=15',
    stars: 5,
    text: "Six months ago I was paying £2,100 a month for a tiny flat in London and feeling completely stuck. Today I'm living in Medellín, earning the same salary, and paying around $600 in rent. It's honestly been life-changing.",
  },
  {
    name: 'Alina V.',
    role: 'Product Manager',
    location: '🇲🇽 Mexico City, Mexico',
    avatar: 'https://i.pravatar.cc/150?img=44',
    stars: 5,
    text: "The recommendations aren't perfect, and you should absolutely do your own research before moving anywhere. But if you need a way to narrow hundreds of options down to a handful of places worth seriously considering, it's incredibly useful — Mexico City landed on my shortlist for culture, affordability, and a thriving remote-work scene.",
  },
  {
    name: 'Kevin O.',
    role: 'Developer',
    location: '🇹🇭 Chiang Mai, Thailand',
    avatar: 'https://i.pravatar.cc/150?img=25',
    stars: 5,
    text: 'The visa information ended up being the most valuable part for me. I had no idea Chiang Mai offered such a practical path for freelancers. That insight alone pushed me to explore it further, and eventually make the move.',
  },
]

export default function Testimonials() {
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ Real Stories
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 48 }}>
        People who found their city
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {TESTIMONIALS.map((t, i) => (
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
    </section>
  )
}
