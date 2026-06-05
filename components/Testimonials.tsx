'use client'
import { useState } from 'react'
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
  {
    name: 'Daniel F.',
    role: 'Freelance Writer',
    location: '🇲🇾 Kuala Lumpur, Malaysia',
    avatar: 'https://i.pravatar.cc/150?img=30',
    stars: 5,
    text: "I'd been freelancing remotely for two years but kept putting off the actual move. Running the numbers finally made it real — Kuala Lumpur came out ahead of everywhere I'd considered. Eight months in, my savings rate has doubled.",
  },
  {
    name: 'Anna & Mikkel S.',
    role: 'Remote Workers',
    location: '🇪🇪 Tallinn, Estonia',
    avatar: 'https://i.pravatar.cc/150?img=31',
    stars: 5,
    text: "I was skeptical that any tool could account for my specific situation — two kids, one income, fully remote. But the family filter actually narrowed it down sensibly. We're in Tallinn now and the quality of life is genuinely better than Berlin at half the cost.",
  },
  {
    name: 'Lars V.',
    role: 'Software Developer',
    location: '🇷🇴 Bucharest, Romania',
    avatar: 'https://i.pravatar.cc/150?img=32',
    stars: 5,
    text: "Bucharest wasn't glamorous but the numbers were undeniable. $400 rent, fast internet, EU access. I've been here 14 months and I'm saving more than I ever did in Amsterdam.",
  },
  {
    name: 'Sophie T.',
    role: 'Graphic Designer',
    location: '🇹🇭 Chiang Mai, Thailand',
    avatar: 'https://i.pravatar.cc/150?img=33',
    stars: 5,
    text: 'I kept going back and forth between Bali and Chiang Mai for months. Seeing them compared side by side — costs, visa options, internet speeds — made the decision obvious. Chiang Mai by a clear margin for my situation.',
  },
  {
    name: 'Thomas B.',
    role: 'Consultant',
    location: '🇵🇹 Porto, Portugal',
    avatar: 'https://i.pravatar.cc/150?img=34',
    stars: 5,
    text: "The tax breakdown for Portugal's NHR regime alone justified using this. I had no idea how much I was overpaying in Belgium. Moved to Porto eight months ago and the lifestyle upgrade has been significant.",
  },
  {
    name: 'Maria K.',
    role: 'Health Consultant',
    location: '🇸🇮 Ljubljana, Slovenia',
    avatar: 'https://i.pravatar.cc/150?img=35',
    stars: 5,
    text: "I'm a nurse working remote health consulting. Most relocation tools assume you're in tech. This one didn't — healthcare quality scored high in my results and pushed me toward Ljubljana. Genuinely surprised by how livable it is.",
  },
  {
    name: 'Ryan M.',
    role: 'Product Designer',
    location: '🇦🇷 Buenos Aires, Argentina',
    avatar: 'https://i.pravatar.cc/150?img=36',
    stars: 5,
    text: "Buenos Aires came up third on my list and I almost ignored it. Glad I didn't. The dollar situation means my income goes incredibly far here. Co-working scene is better than most European cities I've tried.",
  },
  {
    name: 'Claire H.',
    role: 'Marketing Manager',
    location: '🇵🇹 Lisbon, Portugal',
    avatar: 'https://i.pravatar.cc/150?img=37',
    stars: 5,
    text: "I'd been in London for six years and kept telling myself I'd leave eventually. Seeing exactly how much I'd save in Lisbon made eventually feel very urgent. Handed in my notice two weeks after running the numbers.",
  },
  {
    name: 'Ben W.',
    role: 'UX Researcher',
    location: '🇵🇱 Kraków, Poland',
    avatar: 'https://i.pravatar.cc/150?img=38',
    stars: 5,
    text: "What I appreciated was that it didn't just show me cheap cities. It balanced affordability with safety and infrastructure. That's why I ended up in Kraków rather than somewhere cheaper but less livable.",
  },
  {
    name: 'Emma L.',
    role: 'Online Teacher',
    location: '🇨🇴 Medellín, Colombia',
    avatar: 'https://i.pravatar.cc/150?img=39',
    stars: 5,
    text: "I teach English online and my income isn't huge. Most tools seemed built for six-figure tech salaries. This one actually returned useful results for my budget. Medellín has been perfect — low cost, warm, great community.",
  },
  {
    name: 'Jack P.',
    role: 'Developer',
    location: '🇲🇾 Penang, Malaysia',
    avatar: 'https://i.pravatar.cc/150?img=40',
    stars: 5,
    text: "The visa difficulty score is something I hadn't seen anywhere else. As an Australian, visa options matter a lot. It filtered out places that would've been a headache and pushed Bali and Malaysia to the top.",
  },
  {
    name: 'Nina R.',
    role: 'Brand Strategist',
    location: '🇬🇪 Tbilisi, Georgia',
    avatar: 'https://i.pravatar.cc/150?img=41',
    stars: 5,
    text: "Three years of spreadsheets and I still wasn't confident. Ran this once, got a shortlist of five cities, researched each one properly, picked Tbilisi. The 1% flat tax for freelancers is real and it's changed my financial situation completely.",
  },
  {
    name: 'Oliver J.',
    role: 'Copywriter',
    location: '🇪🇸 Málaga, Spain',
    avatar: 'https://i.pravatar.cc/150?img=42',
    stars: 5,
    text: "I was planning to move to Barcelona. This talked me out of it — too expensive for what you get relative to Valencia or Málaga. Ended up in Málaga and couldn't be more satisfied. Better weather too.",
  },
  {
    name: 'Lukas & Petra N.',
    role: 'Remote Couple',
    location: '🇨🇿 Prague, Czech Republic',
    avatar: 'https://i.pravatar.cc/150?img=43',
    stars: 5,
    text: "My partner and I had completely different priorities. She wanted safety and culture, I wanted low taxes and fast internet. The weighting system let us both input what mattered and find a city that worked for both. We're in Prague now.",
  },
  {
    name: 'Harriet B.',
    role: 'Finance Analyst',
    location: '🇦🇪 Dubai, UAE',
    avatar: 'https://i.pravatar.cc/150?img=48',
    stars: 5,
    text: "Dubai felt out of reach until I saw the actual numbers. 0% income tax on my salary made the higher rent irrelevant. I'd been losing tens of thousands a year staying in the UK for no good reason.",
  },
  {
    name: 'Stefan M.',
    role: 'Backend Engineer',
    location: '🇵🇱 Warsaw, Poland',
    avatar: 'https://i.pravatar.cc/150?img=50',
    stars: 5,
    text: 'I wanted somewhere with a real tech scene, not just a cheap place to work from a café. The tech hub filter was useful — pointed me toward Warsaw. Surprised by how strong the startup ecosystem is here.',
  },
  {
    name: 'Richard T.',
    role: 'Early Retiree',
    location: '🇵🇹 Algarve, Portugal',
    avatar: 'https://i.pravatar.cc/150?img=52',
    stars: 5,
    text: "Retired early and needed somewhere my pension would actually stretch. Most tools are aimed at remote workers in their 30s. The cost-of-living breakdown worked just as well for my situation. Living in Algarve now, very happy.",
  },
  {
    name: 'Yuki S.',
    role: 'Illustrator',
    location: '🇪🇸 Barcelona, Spain',
    avatar: 'https://i.pravatar.cc/150?img=54',
    stars: 5,
    text: "I was overwhelmed by the number of options. Having everything scored against my actual priorities rather than someone else's opinion made it much easier to cut through the noise.",
  },
  {
    name: 'Chris D.',
    role: 'Developer',
    location: '🇧🇬 Bansko, Bulgaria',
    avatar: 'https://i.pravatar.cc/150?img=56',
    stars: 5,
    text: "Moved to Bansko on a whim after it came up in my results. Thought it was a mistake for the first two weeks. Six months later I'm still here, rent is $350, mountains are 10 minutes away, and the nomad community is surprisingly solid.",
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
