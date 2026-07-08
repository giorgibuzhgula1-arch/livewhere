import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

const STEPS = [
  { num: '01', text: 'Tell us about your priorities.' },
  { num: '02', text: 'We analyze 27 relocation factors.' },
  { num: '03', text: "See where you'll thrive." },
] as const

export default function HowLiveWhereWorks() {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 1000,
        margin: '0 auto',
        padding: '80px 24px 100px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#c8f05a',
          marginBottom: 56,
          fontWeight: 600,
        }}
      >
        ✦ How LiveWhere Works
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '48px 32px',
          alignItems: 'start',
        }}
      >
        {STEPS.map((step) => (
          <div key={step.num} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: fontFamilySerif,
                fontSize: 'clamp(40px, 5vw, 56px)',
                fontWeight: 900,
                lineHeight: 1,
                color: 'rgba(200, 240, 90, 0.35)',
                marginBottom: 20,
              }}
            >
              {step.num}
            </div>
            <p
              style={{
                fontFamily: fontFamilySans,
                fontSize: 'clamp(16px, 2vw, 18px)',
                fontWeight: 500,
                lineHeight: 1.5,
                color: 'rgba(240, 237, 232, 0.8)',
                margin: 0,
              }}
            >
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
