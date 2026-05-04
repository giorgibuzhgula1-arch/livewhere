import { motion } from 'framer-motion'

const STEPS = [
  { num: '01', title: 'You share your situation', desc: 'Income, lifestyle priorities, family status — takes under 3 minutes.' },
  { num: '02', title: 'AI scores 200+ cities', desc: 'We calculate your real take-home pay, monthly costs, and lifestyle match for every city.' },
  { num: '03', title: 'Drill down by continent', desc: 'Filter by Europe, Americas, Asia. See city-level detail: taxes, rent, safety, pros & cons.' },
  { num: '04', title: 'Make your move', desc: 'Export a full PDF report. Compare side-by-side. Plan with confidence.' },
]

export default function HowItWorks() {
  return (
    <section id="how" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ The Process
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1 }}>
        How LiveWhere works
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 24, marginTop: 48 }}>
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 32 }}
          >
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 900, color: 'rgba(200,240,90,0.15)', lineHeight: 1, marginBottom: 16 }}>
              {step.num}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
            <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', lineHeight: 1.6 }}>{step.desc}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
