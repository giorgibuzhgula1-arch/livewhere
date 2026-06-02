'use client'

import Link from 'next/link'
import { type CSSProperties, type FormEvent, useState } from 'react'
import { getSiteUrl } from '@/lib/site-url'

type AffiliateRow = {
  name: string
  email: string
  referral_code: string
  total_clicks: number
  total_conversions: number
  total_earnings: number
  status: string
}

export default function AffiliatesPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null)
  const [referralUrl, setReferralUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setCopied(false)

    try {
      const res = await fetch('/api/affiliates/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      setAffiliate(data.affiliate)
      setReferralUrl(data.referralUrl)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/affiliates/signup?email=${encodeURIComponent(email.trim().toLowerCase())}`
      )
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Account not found')
        return
      }

      setAffiliate(data.affiliate)
      setReferralUrl(data.referralUrl)
    } catch {
      setError('Could not load stats.')
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!referralUrl) return
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const displayUrl =
    referralUrl || (affiliate ? `${getSiteUrl()}/?ref=${affiliate.referral_code}` : null)

  return (
    <main
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '120px 20px 80px',
        position: 'relative',
        zIndex: 1,
      }}
    >
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
            fontFamily: 'var(--font-playfair), serif',
            fontSize: 22,
            fontWeight: 900,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          Live<span style={{ color: '#c8f05a' }}>Where</span>
        </Link>
      </header>

      <p
        style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--accent)',
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        Partners
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        Affiliate Program
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: 32 }}>
        Share LiveWhere with your audience and earn 40% commission on every paid conversion
        tracked through your link.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          marginBottom: 32,
          padding: 24,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
        }}
      >
        <label style={{ fontSize: 13, color: 'var(--muted)' }}>
          Name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            placeholder="Your name or brand"
          />
        </label>
        <label style={{ fontSize: 13, color: 'var(--muted)' }}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
          />
        </label>
        {error && (
          <p style={{ color: 'var(--accent3)', fontSize: 14, margin: 0 }}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? 'Working…' : 'Get my referral link'}
          </button>
          <button
            type="button"
            onClick={loadStats}
            disabled={loading || !email.trim()}
            style={secondaryButtonStyle}
          >
            Load my stats
          </button>
        </div>
      </form>

      {affiliate && displayUrl && (
        <section
          style={{
            padding: 24,
            background: 'rgba(200,240,90,0.04)',
            border: '1px solid rgba(200,240,90,0.2)',
            borderRadius: 16,
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
            Your referral link
          </p>
          <p
            style={{
              fontSize: 15,
              wordBreak: 'break-all',
              marginBottom: 16,
              color: 'var(--accent)',
            }}
          >
            {displayUrl}
          </p>
          <button type="button" onClick={copyLink} style={primaryButtonStyle}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginTop: 28,
            }}
          >
            <StatCard label="Clicks" value={affiliate.total_clicks ?? 0} />
            <StatCard label="Conversions" value={affiliate.total_conversions ?? 0} />
            <StatCard
              label="Earnings"
              value={`$${Number(affiliate.total_earnings ?? 0).toFixed(2)}`}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>
            Status: {affiliate.status}
          </p>
        </section>
      )}
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '14px 12px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: 22,
          fontWeight: 700,
          color: '#c8f05a',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

const inputStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--surface2)',
  color: 'var(--text)',
  fontSize: 15,
  fontFamily: 'inherit',
}

const primaryButtonStyle: CSSProperties = {
  background: '#c8f05a',
  color: '#0a0a0f',
  border: 'none',
  padding: '12px 20px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const secondaryButtonStyle: CSSProperties = {
  background: 'transparent',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  padding: '12px 20px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
