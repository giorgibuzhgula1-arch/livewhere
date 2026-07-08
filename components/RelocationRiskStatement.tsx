import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

const CONSEQUENCES = [
  'Higher Taxes',
  'Higher Healthcare Costs',
  'More Expensive Housing',
  'Lower Purchasing Power',
] as const

export default function RelocationRiskStatement() {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '72px 24px 80px',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
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
          alignItems: 'center',
        }}
      >
        {CONSEQUENCES.map((line) => (
          <li
            key={line}
            style={{
              fontFamily: fontFamilySans,
              fontSize: 'clamp(16px, 2vw, 18px)',
              fontWeight: 400,
              lineHeight: 1.4,
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
    </section>
  )
}
