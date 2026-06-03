'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'

const links = [
  { href: '/admin/affiliates', label: 'Affiliates' },
  { href: '/admin/outreach', label: 'Outreach' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 28,
        flexWrap: 'wrap',
      }}
    >
      {links.map((link) => {
        const active = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            style={active ? activeLinkStyle : linkStyle}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

const linkStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(240,237,232,0.6)',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 500,
}

const activeLinkStyle: CSSProperties = {
  ...linkStyle,
  background: 'rgba(200,240,90,0.12)',
  border: '1px solid rgba(200,240,90,0.35)',
  color: '#c8f05a',
}
