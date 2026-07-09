import Link from 'next/link'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

type Props = {
  href: string
}

export default function PlansClosingCta({ href }: Props) {
  return (
    <section
      style={{
        marginTop: 80,
        paddingTop: 56,
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: fontFamilySans,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#c8f05a',
          fontWeight: 600,
          margin: '0 0 20px',
        }}
      >
        Today&apos;s Recommendation
      </p>

      <h2
        style={{
          fontFamily: fontFamilySerif,
          fontSize: 'clamp(24px, 3.2vw, 34px)',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#f0ede8',
          margin: '0 auto 32px',
          maxWidth: 560,
        }}
      >
        Continue Building Your Relocation Strategy.
      </h2>

      <Link
        href={href}
        style={{
          display: 'inline-block',
          background: '#c8f05a',
          color: '#0a0a0f',
          textDecoration: 'none',
          padding: '16px 36px',
          borderRadius: 12,
          fontFamily: fontFamilySans,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        Continue
      </Link>
    </section>
  )
}
