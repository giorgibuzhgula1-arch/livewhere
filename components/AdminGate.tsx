'use client'

import Link from 'next/link'
import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { ADMIN_STORAGE_KEY } from '@/lib/admin-client'
import AdminNav from '@/components/AdminNav'

type Props = {
  title: string
  subtitle: string
  children: (ctx: { secret: string; onLogout: () => void }) => ReactNode
}

export default function AdminGate({ title, subtitle, children }: Props) {
  const [secret, setSecret] = useState('')
  const [secretInput, setSecretInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY)
    if (stored) {
      setSecret(stored)
      setUnlocked(true)
    }
  }, [])

  function handleUnlock(e: FormEvent) {
    e.preventDefault()
    const trimmed = secretInput.trim()
    if (!trimmed) return
    sessionStorage.setItem(ADMIN_STORAGE_KEY, trimmed)
    setSecret(trimmed)
    setUnlocked(true)
    setError(null)
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY)
    setSecret('')
    setSecretInput('')
    setUnlocked(false)
  }

  if (!unlocked) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>{title}</h1>
          <p style={mutedStyle}>{subtitle}</p>
          <form onSubmit={handleUnlock}>
            <label style={labelStyle}>
              Admin secret
              <input
                type="password"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                style={inputStyle}
                autoComplete="current-password"
              />
            </label>
            {error && <p style={errorStyle}>{error}</p>}
            <button type="submit" style={primaryBtnStyle}>
              Continue
            </button>
          </form>
          <p style={{ ...mutedStyle, marginTop: 24, fontSize: 12 }}>
            Set <code style={codeStyle}>ADMIN_SECRET</code> in your environment.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <Link href="/" style={logoStyle}>
          LiveWhere
        </Link>
        <button type="button" onClick={handleLogout} style={ghostBtnStyle}>
          Lock
        </button>
      </header>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AdminNav />
        {children({ secret, onLogout: handleLogout })}
      </div>
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#0a0a0f',
  color: '#f0ede8',
  padding: '100px 24px 80px',
  position: 'relative',
  zIndex: 1,
}

const headerStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  padding: '20px 40px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'linear-gradient(to bottom, rgba(10,10,15,0.95), transparent)',
  zIndex: 100,
}

const logoStyle: CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 22,
  fontWeight: 700,
  color: '#f0ede8',
  textDecoration: 'none',
}

const cardStyle: CSSProperties = {
  maxWidth: 420,
  margin: '0 auto',
  background: '#12121a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 28,
}

const titleStyle: CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 28,
  fontWeight: 700,
  marginBottom: 8,
}

const mutedStyle: CSSProperties = {
  color: 'rgba(240,237,232,0.5)',
  fontSize: 14,
  marginBottom: 20,
  lineHeight: 1.5,
}

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  fontSize: 13,
  fontWeight: 500,
  color: 'rgba(240,237,232,0.7)',
}

const inputStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#0a0a0f',
  color: '#f0ede8',
  fontSize: 15,
}

const primaryBtnStyle: CSSProperties = {
  marginTop: 16,
  padding: '12px 24px',
  borderRadius: 10,
  border: 'none',
  background: '#c8f05a',
  color: '#0a0a0f',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}

const ghostBtnStyle: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'transparent',
  color: '#f0ede8',
  fontSize: 13,
  cursor: 'pointer',
}

const errorStyle: CSSProperties = {
  color: '#f05a8c',
  fontSize: 14,
}

const codeStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 12,
}
