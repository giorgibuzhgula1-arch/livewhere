import Link from 'next/link'
import { fontFamilySans } from '@/lib/fonts'

const MUTED = 'rgba(240, 237, 232, 0.42)'

const linkStyle: React.CSSProperties = {
  fontFamily: fontFamilySans,
  fontSize: 13,
  color: MUTED,
  textDecoration: 'none',
  transition: 'color 0.15s ease',
}

export default function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '32px 24px 48px',
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
        className="landing-footer-inner"
      >
        <p
          style={{
            fontFamily: fontFamilySans,
            fontSize: 13,
            color: MUTED,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          © {year} LiveWhere. All rights reserved.
        </p>

        <nav
          aria-label="Legal"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <Link href="/terms" style={linkStyle}>
            Terms of Service
          </Link>
          <Link href="/privacy" style={linkStyle}>
            Privacy Policy
          </Link>
        </nav>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .landing-footer-inner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        footer a:hover {
          color: rgba(240, 237, 232, 0.65);
        }
      `}</style>
    </footer>
  )
}
