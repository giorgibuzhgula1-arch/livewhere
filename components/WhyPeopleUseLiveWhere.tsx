import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

const REASONS = [
  'Avoid expensive mistakes',
  'Compare every important factor',
  'See long-term financial impact',
  'Move with confidence',
] as const

const ACCENT = '#c8f05a'
const TEXT_MUTED = 'rgba(240,237,232,0.75)'

type Props = {
  embedded?: boolean
  plansExplored?: number
}

export default function WhyPeopleUseLiveWhere({ embedded = false, plansExplored }: Props) {
  return (
    <section
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: embedded ? 0 : '80px 24px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <h2
        style={{
          fontFamily: fontFamilySerif,
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: '#f0ede8',
          textAlign: 'center',
          margin: '0 0 40px',
        }}
      >
        Why People Use LiveWhere
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}
      >
        {REASONS.map((reason) => (
          <div
            key={reason}
            style={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: fontFamilySans,
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.4,
                color: 'rgba(240, 237, 232, 0.85)',
                margin: 0,
              }}
            >
              {reason}
            </p>
          </div>
        ))}

        {plansExplored !== undefined && (
          <div
            style={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '32px 36px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: fontFamilySerif,
                fontSize: 'clamp(32px, 4vw, 40px)',
                fontWeight: 700,
                color: ACCENT,
                lineHeight: 1.1,
                marginBottom: 10,
              }}
            >
              {plansExplored.toLocaleString()}
            </div>
            <div
              style={{
                fontFamily: fontFamilySans,
                fontSize: 'clamp(15px, 2vw, 18px)',
                fontWeight: 600,
                color: TEXT_MUTED,
                lineHeight: 1.4,
              }}
            >
              Plans Explored So Far
            </div>
          </div>
        )}

        <div
          style={{
            background: '#12121a',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding: '32px 36px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: fontFamilySerif,
              fontSize: 'clamp(32px, 4vw, 40px)',
              fontWeight: 700,
              color: ACCENT,
              lineHeight: 1.1,
              marginBottom: 10,
            }}
          >
            12M+
          </div>
          <div
            style={{
              fontFamily: fontFamilySans,
              fontSize: 'clamp(15px, 2vw, 18px)',
              fontWeight: 600,
              color: TEXT_MUTED,
              lineHeight: 1.4,
            }}
          >
            Data Points Analyzed
          </div>
        </div>
      </div>
    </section>
  )
}
