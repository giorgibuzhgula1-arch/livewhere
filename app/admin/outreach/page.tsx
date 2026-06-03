'use client'

import { type CSSProperties, useMemo, useState } from 'react'
import AdminGate from '@/components/AdminGate'
import { adminHeaders } from '@/lib/admin-client'
import {
  OUTREACH_COUNTRY_FILTER_NOTE,
  filterOutreachByCountry,
} from '@/lib/outreach-country-filter'
import { openFindEmailSearch } from '@/lib/outreach-find-email'

type EmailSource = 'youtube' | 'outscraper' | null

type InfluencerRow = {
  channelId: string
  channelName: string
  subscribers: number
  country: string | null
  email: string | null
  emailSource: EmailSource
  youtubeUrl: string
  keyword: string
}

function formatSubs(n: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export default function AdminOutreachPage() {
  return (
    <AdminGate
      title="Admin — Outreach"
      subtitle="Find YouTube influencers and send partnership emails via Resend."
    >
      {({ secret }) => <OutreachPanel secret={secret} />}
    </AdminGate>
  )
}

function OutreachPanel({ secret }: { secret: string }) {
  const [keyword, setKeyword] = useState('')
  const [rows, setRows] = useState<InfluencerRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const withoutEmail = useMemo(() => rows.filter((r) => !r.email), [rows])

  const withEmail = useMemo(
    () => rows.filter((r) => r.email),
    [rows]
  )

  async function enrichChannels(
    targetRows: InfluencerRow[],
    options?: { quiet?: boolean }
  ) {
    const missing = targetRows.filter((r) => !r.email)
    if (missing.length === 0) return

    setEnriching(true)
    if (!options?.quiet) {
      setError(null)
      setSuccess(null)
    }

    try {
      const res = await fetch('/api/admin/outreach/enrich', {
        method: 'POST',
        headers: adminHeaders(secret),
        body: JSON.stringify({
          channels: missing.map((r) => ({
            channelId: r.channelId,
            channelName: r.channelName,
          })),
        }),
      })
      const data = await res.json()

      if (res.status === 401) {
        setError('Invalid admin secret')
        return
      }
      if (!res.ok) {
        if (!options?.quiet) {
          setError(data.error || 'Email enrichment failed')
        }
        return
      }

      const byId = new Map<string, string>(
        (data.enriched ?? [])
          .filter((e: { channelId: string; email: string | null }) => e.email)
          .map((e: { channelId: string; email: string }) => [e.channelId, e.email])
      )

      if (byId.size === 0) {
        if (!options?.quiet) {
          setSuccess('Outscraper finished — no new emails found.')
        }
        return
      }

      setRows((prev) =>
        prev.map((row) => {
          const found = byId.get(row.channelId)
          if (!found) return row
          return { ...row, email: found, emailSource: 'outscraper' as const }
        })
      )

      const msg = `Outscraper found ${data.foundCount ?? byId.size} email(s) for ${data.processedCount ?? missing.length} channel(s).`
      setSuccess(msg)
    } catch {
      if (!options?.quiet) {
        setError('Could not reach Outscraper enrichment API')
      }
    } finally {
      setEnriching(false)
    }
  }

  const allSelectableSelected =
    withEmail.length > 0 && withEmail.every((r) => selected.has(r.channelId))

  async function handleSearch() {
    if (!keyword.trim()) return
    setSearching(true)
    setError(null)
    setSuccess(null)
    setSelected(new Set())

    try {
      const res = await fetch('/api/admin/outreach/search', {
        method: 'POST',
        headers: adminHeaders(secret),
        body: JSON.stringify({ keyword: keyword.trim() }),
      })
      const data = await res.json()

      if (res.status === 401) {
        setError('Invalid admin secret — lock and sign in again')
        return
      }
      if (!res.ok) {
        setError(data.error || 'Search failed')
        return
      }

      const raw = (data.influencers ?? []) as Omit<InfluencerRow, 'emailSource'>[]
      const visible: InfluencerRow[] = filterOutreachByCountry(raw).map((row) => ({
        ...row,
        emailSource: row.email ? ('youtube' as const) : null,
      }))
      setRows(visible)

      if (visible.length > 0 && visible.some((r) => !r.email)) {
        void enrichChannels(visible, { quiet: true })
      }

      if (visible.length === 0) {
        if (raw.length > 0) {
          setSuccess(
            'All matching channels were hidden by the country filter (India, Russia, Africa).'
          )
        } else {
          setSuccess('No channels found in the 5K–200K subscriber range for this keyword.')
        }
      }
    } catch {
      setError('Could not reach YouTube search API')
    } finally {
      setSearching(false)
    }
  }

  function toggleSelect(channelId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(channelId)) next.delete(channelId)
      else next.add(channelId)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(withEmail.map((r) => r.channelId)))
    }
  }

  async function handleSend() {
    const recipients = rows
      .filter((r) => selected.has(r.channelId) && r.email)
      .map((r) => ({
        channelName: r.channelName,
        email: r.email!,
        keyword: r.keyword,
        youtubeUrl: r.youtubeUrl,
      }))

    if (recipients.length === 0) {
      setError('Select at least one influencer with a public email')
      return
    }

    setSending(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/outreach/send', {
        method: 'POST',
        headers: adminHeaders(secret),
        body: JSON.stringify({ recipients }),
      })
      const data = await res.json()

      if (res.status === 401) {
        setError('Invalid admin secret')
        return
      }
      if (!res.ok) {
        setError(data.error || 'Send failed')
        return
      }

      const sent = data.sentCount ?? 0
      const failed = data.failedCount ?? 0
      setSuccess(
        failed > 0
          ? `Sent ${sent} email(s). ${failed} failed — check console or retry.`
          : `Sent ${sent} outreach email(s) with affiliate links.`
      )
      setSelected(new Set())
    } catch {
      setError('Could not send outreach emails')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <h1 style={titleStyle}>Influencer outreach</h1>
      <p style={mutedStyle}>
        Search YouTube for channels (5K–200K subscribers). Emails come from channel descriptions
        or Outscraper enrichment. Selected influencers get an affiliate record and a personalized
        Resend email.
      </p>

      <section style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ ...labelStyle, flex: '1 1 280px' }}>
            Keyword
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
              placeholder="digital nomad"
              style={inputStyle}
            />
          </label>
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={searching || !keyword.trim()}
            style={primaryBtnStyle}
          >
            {searching ? 'Searching…' : 'Find Influencers'}
          </button>
        </div>
      </section>

      {error && <p style={errorStyle}>{error}</p>}
      {success && <p style={successStyle}>{success}</p>}

      {rows.length > 0 && (
        <section style={{ ...cardStyle, marginTop: 24 }}>
          <div style={toolbarStyle}>
            <span style={mutedStyle}>
              {rows.length} channel(s) · {withEmail.length} with email
            </span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {withoutEmail.length > 0 && (
                <button
                  type="button"
                  onClick={() => void enrichChannels(rows)}
                  disabled={enriching}
                  style={ghostBtnStyle}
                >
                  {enriching ? 'Enriching…' : `Enrich Emails (${withoutEmail.length})`}
                </button>
              )}
              <button type="button" onClick={toggleSelectAll} style={ghostBtnStyle}>
                {allSelectableSelected ? 'Clear selection' : 'Select all with email'}
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || selected.size === 0}
                style={primaryBtnStyle}
              >
                {sending ? 'Sending…' : `Send Outreach Email (${selected.size})`}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle} />
                  <th style={thStyle}>Channel</th>
                  <th style={thStyle}>Subscribers</th>
                  <th style={thStyle}>Country</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>YouTube</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const canSelect = Boolean(row.email)
                  return (
                    <tr key={row.channelId} style={{ opacity: canSelect ? 1 : 0.55 }}>
                      <td style={tdStyle}>
                        <input
                          type="checkbox"
                          checked={selected.has(row.channelId)}
                          disabled={!canSelect}
                          onChange={() => toggleSelect(row.channelId)}
                          aria-label={`Select ${row.channelName}`}
                        />
                      </td>
                      <td style={tdStyle}>{row.channelName}</td>
                      <td style={tdStyle}>{formatSubs(row.subscribers)}</td>
                      <td style={tdStyle}>{row.country ?? '—'}</td>
                      <td style={tdStyle}>
                        {row.email ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ color: '#c8f05a', fontSize: 13 }}>{row.email}</span>
                            {row.emailSource === 'outscraper' && (
                              <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.4)' }}>
                                via Outscraper
                              </span>
                            )}
                          </div>
                        ) : enriching ? (
                          <span style={{ color: 'rgba(240,237,232,0.45)', fontSize: 12 }}>
                            Enriching…
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{ color: 'rgba(240,237,232,0.35)', fontSize: 12 }}>
                              Not in description
                            </span>
                            <button
                              type="button"
                              onClick={() => openFindEmailSearch(row.channelName)}
                              style={findEmailBtnStyle}
                            >
                              Find Email
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <a
                          href={row.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#c8f05a', fontSize: 13 }}
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={filterNoteStyle}>{OUTREACH_COUNTRY_FILTER_NOTE}</p>
        </section>
      )}
    </>
  )
}

const titleStyle: CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 32,
  fontWeight: 700,
  marginBottom: 8,
}

const mutedStyle: CSSProperties = {
  color: 'rgba(240,237,232,0.5)',
  fontSize: 14,
  marginBottom: 24,
  lineHeight: 1.5,
}

const cardStyle: CSSProperties = {
  background: '#12121a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 24,
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
  padding: '12px 20px',
  borderRadius: 10,
  border: 'none',
  background: '#c8f05a',
  color: '#0a0a0f',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}

const ghostBtnStyle: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'transparent',
  color: '#f0ede8',
  fontSize: 13,
  cursor: 'pointer',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
  marginBottom: 20,
}

const errorStyle: CSSProperties = {
  color: '#f05a8c',
  fontSize: 14,
  marginTop: 16,
}

const successStyle: CSSProperties = {
  color: '#c8f05a',
  fontSize: 14,
  marginTop: 16,
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

const findEmailBtnStyle: CSSProperties = {
  padding: '5px 10px',
  borderRadius: 6,
  border: '1px solid rgba(200,240,90,0.35)',
  background: 'rgba(200,240,90,0.08)',
  color: '#c8f05a',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
}

const filterNoteStyle: CSSProperties = {
  marginTop: 16,
  marginBottom: 0,
  fontSize: 12,
  color: 'rgba(240,237,232,0.4)',
  fontStyle: 'italic',
}
