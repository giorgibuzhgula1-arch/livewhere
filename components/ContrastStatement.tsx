import { fontFamilySerif } from '@/lib/fonts'

export default function ContrastStatement() {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '120px 24px',
      }}
    >
      <p
        style={{
          fontFamily: fontFamilySerif,
          fontSize: 'clamp(28px, 4.5vw, 52px)',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          margin: '0 0 16px',
          color: 'rgba(240, 237, 232, 0.55)',
        }}
      >
        Google Gives You 10 Million Results.
      </p>
      <p
        style={{
          fontFamily: fontFamilySerif,
          fontSize: 'clamp(28px, 4.5vw, 52px)',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          margin: 0,
          color: '#c8f05a',
        }}
      >
        We Give You One Decision.
      </p>
    </section>
  )
}
