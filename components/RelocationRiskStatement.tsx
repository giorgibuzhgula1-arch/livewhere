import Image from 'next/image'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

const CONSEQUENCES = [
  'Higher Taxes',
  'Poor Healthcare',
  'Expensive Housing',
  'Years Of Financial Stress',
  'Visa & Residency Challenges',
] as const

export default function RelocationRiskStatement() {
  return (
    <section
      className="relocation-risk"
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '32px 24px 36px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <style>{`
        .relocation-risk-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .relocation-risk-text {
          text-align: left;
        }
        .relocation-risk-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
        }
        @media (min-width: 900px) {
          .relocation-risk-grid {
            flex-direction: row;
            align-items: center;
            gap: 48px;
          }
          .relocation-risk-text {
            flex: 1.22;
            min-width: 0;
          }
          .relocation-risk-image-col {
            flex: 1;
            min-width: 0;
          }
        }
      `}</style>

      <div className="relocation-risk-grid">
        <div className="relocation-risk-text">
          <h2
            style={{
              fontFamily: fontFamilySerif,
              fontSize: 'clamp(28px, 4.5vw, 48px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: '0 0 24px',
              color: '#f0ede8',
            }}
          >
            The Wrong Move Could Cost You More Than{' '}
            <span style={{ color: '#c8f05a' }}>$100,000</span>.
          </h2>

          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              alignItems: 'flex-start',
            }}
          >
            {CONSEQUENCES.map((line) => (
              <li
                key={line}
                style={{
                  fontFamily: fontFamilySans,
                  fontSize: 'clamp(19.2px, 2.4vw, 21.6px)',
                  fontWeight: 400,
                  lineHeight: 1.68,
                  color: 'rgba(240, 237, 232, 0.72)',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    color: 'rgba(240, 237, 232, 0.28)',
                    flexShrink: 0,
                  }}
                >
                  —
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <p
            style={{
              fontFamily: fontFamilySerif,
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              fontWeight: 500,
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
              color: 'rgba(240, 237, 232, 0.85)',
              margin: '28px 0 0',
            }}
          >
            Know before you relocate.
          </p>
        </div>

        <div className="relocation-risk-image-col">
          <div className="relocation-risk-image-wrap">
            <Image
              src="/images/couple-relocation.png"
              alt="Couple looking out at the ocean from a balcony"
              fill
              sizes="(max-width: 900px) 100vw, 42vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
