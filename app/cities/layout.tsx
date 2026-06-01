import Link from 'next/link'
import type { ReactNode } from 'react'

export const dynamic = 'force-static'

export default function CitiesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '20px 40px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(10,10,15,0.95), transparent)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 900,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          Live<span style={{ color: '#c8f05a' }}>Where</span>
        </Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link
            href="/cities"
            style={{
              fontSize: 13,
              color: '#c8f05a',
              textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
            }}
          >
            City Guides
          </Link>
          <Link
            href="/blog"
            style={{
              fontSize: 13,
              color: 'rgba(240,237,232,0.45)',
              textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Blog
          </Link>
        </div>
      </header>
      {children}
    </>
  )
}
