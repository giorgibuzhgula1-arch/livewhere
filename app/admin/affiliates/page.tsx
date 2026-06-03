'use client'

import Link from 'next/link'
import { type CSSProperties, type FormEvent, useCallback, useEffect, useState } from 'react'
import AdminNav from '@/components/AdminNav'
import { ADMIN_STORAGE_KEY, adminHeaders } from '@/lib/admin-client'

type AffiliateRow = {
  id: string
  name: string
  email: string
  referral_code: string
  referralUrl: string
  commission_rate: number
  total_clicks: number
  total_conversions: number
  total_earnings: number
  status: string
  created_at: string
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n)
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function AdminAffiliatesPage() {
  const [secret, setSecret] = useState('')
  const [secretInput, setSecretInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([])
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY)
    if (stored) {
      setSecret(stored)
      setUnlocked(true)
    }
  }, [])

  const loadAffiliates = useCallback(async (adminSecret: string) => {
    setListLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/affiliates', {
        headers: adminHeaders(adminSecret),
      })
      const data = await res.json()
      if (res.status === 401) {
        sessionStorage.removeItem(ADMIN_STORAGE_KEY)
        setUnlocked(false)
        setSecret('')
        setError('Invalid admin secret')
        return
      }
      if (!res.ok) {
        setError(data.error || 'Failed to load affiliates')
        return
      }
      setAffiliates(data.affiliates ?? [])
    } catch {
      setError('Could not load affiliates')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (unlocked && secret) {
      void loadAffiliates(secret)
    }
  }, [unlocked, secret, loadAffiliates])

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
    setAffiliates([])
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    if (!secret) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: adminHeaders(secret),
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()

      if (res.status === 401) {
        handleLogout()
        setError('Invalid admin secret')
        return
      }

      if (!res.ok) {
        setError(data.error || 'Invite failed')
        if (data.affiliate) {
          await loadAffiliates(secret)
        }
        return
      }

      setSuccess(
        data.created
          ? `Invite sent to ${data.affiliate.email}`
          : `Welcome email resent to ${data.affiliate.email}`
      )
      setName('')
      setEmail('')
      await loadAffiliates(secret)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!unlocked) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Admin — Affiliates</h1>
          <p style={mutedStyle}>
            Enter your admin secret to manage affiliate invites.
          </p>
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

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <AdminNav />
        <h1 style={titleStyle}>Affiliate admin</h1>
        <p style={mutedStyle}>
          Create affiliates, send welcome emails via Resend, and track performance.
        </p>

        <section style={{ ...cardStyle, marginBottom: 32 }}>
          <h2 style={sectionTitleStyle}>Send invite</h2>
          <form onSubmit={handleInvite} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label style={labelStyle}>
                Name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  placeholder="Jane Influencer"
                />
              </label>
              <label style={labelStyle}>
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="jane@example.com"
                />
              </label>
            </div>
            {error && <p style={errorStyle}>{error}</p>}
            {success && <p style={successStyle}>{success}</p>}
            <button type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Sending…' : 'Send invite'}
            </button>
          </form>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h2 style={{ ...sectionTitleStyle, margin: 0 }}>All affiliates</h2>
            <button
              type="button"
              onClick={() => loadAffiliates(secret)}
              disabled={listLoading}
              style={ghostBtnStyle}
            >
              {listLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {affiliates.length === 0 && !listLoading ? (
            <p style={mutedStyle}>No affiliates yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Clicks</th>
                    <th style={thStyle}>Sales</th>
                    <th style={thStyle}>Earnings</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((a) => (
                    <tr key={a.id}>
                      <td style={tdStyle}>{a.name}</td>
                      <td style={tdStyle}>{a.email}</td>
                      <td style={tdStyle}>
                        <a
                          href={a.referralUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#c8f05a', fontSize: 13 }}
                        >
                          {a.referral_code}
                        </a>
                      </td>
                      <td style={tdStyle}>{a.total_clicks}</td>
                      <td style={tdStyle}>{a.total_conversions}</td>
                      <td style={tdStyle}>{formatMoney(a.total_earnings)}</td>
                      <td style={tdStyle}>
                        <span style={statusBadge(a.status)}>{a.status}</span>
                      </td>
                      <td style={tdStyle}>{formatDate(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
  background: '#12121a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 28,
}

const titleStyle: CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 32,
  fontWeight: 700,
  marginBottom: 8,
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 20,
}

const mutedStyle: CSSProperties = {
  color: 'rgba(240,237,232,0.5)',
  fontSize: 14,
  marginBottom: 24,
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
  padding: '12px 24px',
  borderRadius: 10,
  border: 'none',
  background: '#c8f05a',
  color: '#0a0a0f',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  width: 'fit-content',
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
  margin: 0,
}

const successStyle: CSSProperties = {
  color: '#c8f05a',
  fontSize: 14,
  margin: 0,
}

const codeStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 12,
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(240,237,232,0.45)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 600,
}

const tdStyle: CSSProperties = {
  padding: '14px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  verticalAlign: 'middle',
}

function statusBadge(status: string): CSSProperties {
  const active = status === 'active'
  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
    background: active ? 'rgba(200,240,90,0.15)' : 'rgba(255,255,255,0.06)',
    color: active ? '#c8f05a' : 'rgba(240,237,232,0.6)',
  }
}
