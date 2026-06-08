'use client'

import { type CSSProperties, useMemo, useRef, useState } from 'react'
import AdminGate from '@/components/AdminGate'
import { adminHeaders } from '@/lib/admin-client'
import {
  OUTREACH_COUNTRY_FILTER_NOTE,
  filterOutreachByCountry,
} from '@/lib/outreach-country-filter'
import { openFindEmailSearch } from '@/lib/outreach-find-email'
import { parseOutreachCsv } from '@/lib/parse-outreach-csv'
import {
  platformLabel,
  type OutreachInfluencer,
  type OutreachPlatformFilter,
} from '@/lib/outreach-types'

type EmailSource = 'bio' | 'outscraper' | 'csv' | null

type InfluencerRow = OutreachInfluencer & {
  emailSource: EmailSource
}

const PLATFORM_OPTIONS: { value: OutreachPlatformFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
]

function formatSubs(n: number) {
  if (n <= 0) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export default function AdminOutreachPage() {
  return (
    <AdminGate
      title="Admin — Outreach"
      subtitle="Find YouTube, Instagram, and TikTok influencers and send partnership emails via Resend."
    >
      {({ secret }) => <OutreachPanel secret={secret} />}
    </AdminGate>
  )
}

function OutreachPanel({ secret }: { secret: string }) {
  const [keyword, setKeyword] = useState('')
  const [platform, setPlatform] = useState<OutreachPlatformFilter>('all')
  const [rows, setRows] = useState<InfluencerRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enrichProgress, setEnrichProgress] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

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
    setEnrichProgress(null)
    if (!options?.quiet) {
      setError(null)
      setSuccess(null)
    }

    const channels = missing.map((r) => ({
      channelId: r.channelId,
      channelName: r.channelName,
      profileUrl: r.profileUrl,
      platform: r.platform,
    }))

    const BATCH_SIZE = 10
    const total = channels.length
    let totalFound = 0
    let totalRejected = 0
    let totalProcessed = 0

    try {
      for (let i = 0; i < channels.length; i += BATCH_SIZE) {
        const batch = channels.slice(i, i + BATCH_SIZE)
        const batchStart = i + 1
        const batchEnd = i + batch.length
        setEnrichProgress(`Enriching ${batchStart}-${batchEnd} of ${total}...`)

        const res = await fetch('/api/admin/outreach/enrich', {
          method: 'POST',
          headers: adminHeaders(secret),
          body: JSON.stringify({ channels: batch }),
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

        totalFound += data.foundCount ?? byId.size
        totalRejected += data.rejectedCount ?? 0
        totalProcessed += data.processedCount ?? batch.length

        if (byId.size > 0) {
          setRows((prev) =>
            prev.map((row) => {
              const found = byId.get(row.channelId)
              if (!found) return row
              return { ...row, email: found, emailSource: 'outscraper' as const }
            })
          )
        }
      }

      if (totalFound === 0) {
        if (!options?.quiet) {
          setSuccess('Outscraper finished — no new emails found.')
        }
        return
      }

      if (!options?.quiet) {
        const msg =
          totalRejected > 0
            ? `Outscraper found ${totalFound} valid email(s); ${totalRejected} result(s) rejected as unrelated.`
            : `Outscraper found ${totalFound} email(s) for ${totalProcessed} channel(s).`
        setSuccess(msg)
      }
    } catch {
      if (!options?.quiet) {
        setError('Could not reach Outscraper enrichment API')
      }
    } finally {
      setEnriching(false)
      setEnrichProgress(null)
    }
  }

  const allSelectableSelected =
    withEmail.length > 0 && withEmail.every((r) => selected.has(r.channelId))

  async function handleCsvUpload(file: File) {
    setImporting(true)
    setError(null)
    setSuccess(null)
    setSelected(new Set())

    try {
      const text = await file.text()
      const defaultKeyword = keyword.trim() || 'csv import'
      const { influencers, skipped, errors } = parseOutreachCsv(text, defaultKeyword)

      if (errors.length > 0 && influencers.length === 0) {
        setError(errors.join('\n'))
        return
      }

      const raw = filterOutreachByCountry(influencers)
      const imported: InfluencerRow[] = raw.map((row) => ({
        ...row,
        emailSource: row.email ? ('csv' as const) : null,
      }))

      setRows((prev) => {
        const byId = new Map(prev.map((r) => [r.channelId, r]))
        for (const row of imported) byId.set(row.channelId, row)
        const next = Array.from(byId.values()).sort((a, b) => b.subscribers - a.subscribers)
        if (next.some((r) => !r.email)) {
          void enrichChannels(next, { quiet: true })
        }
        return next
      })

      const hidden = influencers.length - raw.length
      const parts = [
        `Imported ${imported.length} influencer(s) from CSV.`,
        skipped > 0 ? `${skipped} row(s) skipped (no channel name).` : null,
        hidden > 0 ? `${hidden} hidden by country filter.` : null,
        errors.length > 0 ? errors.join(' ') : null,
      ].filter(Boolean)

      setSuccess(parts.join(' '))
    } catch {
      setError('Could not read or parse the CSV file')
    } finally {
      setImporting(false)
      if (csvInputRef.current) csvInputRef.current.value = ''
    }
  }

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
        body: JSON.stringify({ keyword: keyword.trim(), platform }),
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

      const raw = (data.influencers ?? []) as OutreachInfluencer[]
      const visible: InfluencerRow[] = filterOutreachByCountry(raw).map((row) => ({
        ...row,
        emailSource: row.email ? ('bio' as const) : null,
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
          setSuccess('No influencers found for this keyword and platform.')
        }
      }
    } catch {
      setError('Could not complete influencer search')
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
        channelId: r.channelId,
        channelName: r.channelName,
        email: r.email!,
        keyword: r.keyword,
        profileUrl: r.profileUrl,
        platform: r.platform,
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
      const failureDetails = (data.failed ?? []) as {
        channelName: string
        email: string
        error: string
      }[]

      if (sent > 0 && failed === 0) {
        setSuccess(`Sent ${sent} personalized outreach email(s) from Jessica from LiveWhere's Partnerships Team.`)
      } else if (sent > 0 && failed > 0) {
        setSuccess(`Sent ${sent} email(s).`)
        setError(
          failureDetails
            .map((f) => `${f.channelName} (${f.email}): ${f.error}`)
            .join('\n')
        )
      } else {
        setError(
          failureDetails.length > 0
            ? failureDetails
                .map((f) => `${f.channelName} (${f.email}): ${f.error}`)
                .join('\n')
            : 'All outreach emails failed. Check server logs for details.'
        )
      }
      if (sent > 0) setSelected(new Set())
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
        Search by keyword across platforms, or import an Outscraper YouTube CSV. YouTube search uses
        the YouTube API; Instagram and TikTok use Google SERP via Outscraper. Emails are validated
        against the creator name
        (government, institutional, and unrelated addresses are filtered out).
      </p>

      <section style={cardStyle}>
        <div style={searchFormStyle}>
          <div>
            <span style={fieldLabelStyle}>Platform</span>
            <div style={platformFilterRowStyle} role="group" aria-label="Search platform">
              {PLATFORM_OPTIONS.map((opt) => {
                const active = platform === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPlatform(opt.value)}
                    style={active ? platformFilterBtnActiveStyle : platformFilterBtnStyle}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label style={labelStyle}>
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
            style={{ ...primaryBtnStyle, alignSelf: 'flex-start' }}
          >
            {searching ? 'Searching…' : 'Find Influencers'}
          </button>

          <div style={csvImportRowStyle}>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleCsvUpload(file)
              }}
            />
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              disabled={importing}
              style={ghostBtnStyle}
            >
              {importing ? 'Importing…' : 'Import CSV'}
            </button>
            <span style={csvHintStyle}>
              Outscraper YouTube export: channel name, email, subscribers, channel URL, etc.
              Uses keyword above when the file has no query column.
            </span>
          </div>
        </div>
      </section>

      {error && <p style={errorStyle}>{error}</p>}
      {enriching && enrichProgress && <p style={progressStyle}>{enrichProgress}</p>}
      {success && <p style={successStyle}>{success}</p>}

      {rows.length > 0 && (
        <section style={{ ...cardStyle, marginTop: 24 }}>
          <div style={toolbarStyle}>
            <span style={{ ...mutedStyle, marginBottom: 0 }}>
              {rows.length} result(s) · {withEmail.length} with email
            </span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {withoutEmail.length > 0 && (
                <button
                  type="button"
                  onClick={() => void enrichChannels(rows)}
                  disabled={enriching}
                  style={ghostBtnStyle}
                >
                  {enriching
                    ? enrichProgress ?? 'Enriching…'
                    : `Enrich Emails (${withoutEmail.length})`}
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
                  <th style={thStyle}>Platform</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Followers</th>
                  <th style={thStyle}>Country</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Profile</th>
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
                      <td style={tdStyle}>
                        <span style={platformBadgeStyle(row.platform)}>
                          {platformLabel(row.platform)}
                        </span>
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
                            {row.emailSource === 'csv' && (
                              <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.4)' }}>
                                from CSV
                              </span>
                            )}
                          </div>
                        ) : enriching ? (
                          <span style={{ color: 'rgba(240,237,232,0.45)', fontSize: 12 }}>
                            {enrichProgress ?? 'Enriching…'}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{ color: 'rgba(240,237,232,0.35)', fontSize: 12 }}>
                              Not found
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
                          href={row.profileUrl}
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

const searchFormStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const csvImportRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  paddingTop: 4,
  borderTop: '1px solid rgba(255,255,255,0.06)',
}

const csvHintStyle: CSSProperties = {
  flex: '1 1 220px',
  fontSize: 12,
  color: 'rgba(240,237,232,0.4)',
  lineHeight: 1.45,
}

const fieldLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(240,237,232,0.7)',
  marginBottom: 10,
}

const platformFilterRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const platformFilterBtnStyle: CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.18)',
  background: '#0a0a0f',
  color: 'rgba(240,237,232,0.75)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const platformFilterBtnActiveStyle: CSSProperties = {
  ...platformFilterBtnStyle,
  background: 'rgba(200,240,90,0.15)',
  border: '1px solid rgba(200,240,90,0.5)',
  color: '#c8f05a',
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
  whiteSpace: 'pre-wrap',
  lineHeight: 1.5,
}

const successStyle: CSSProperties = {
  color: '#c8f05a',
  fontSize: 14,
  marginTop: 16,
}

const progressStyle: CSSProperties = {
  color: 'rgba(240,237,232,0.65)',
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

function platformBadgeStyle(platform: InfluencerRow['platform']): CSSProperties {
  const colors: Record<InfluencerRow['platform'], { bg: string; border: string; color: string }> = {
    youtube: { bg: 'rgba(255,0,0,0.12)', border: 'rgba(255,80,80,0.35)', color: '#ff6b6b' },
    instagram: { bg: 'rgba(225,48,108,0.12)', border: 'rgba(225,48,108,0.35)', color: '#f472b6' },
    tiktok: { bg: 'rgba(0,242,234,0.1)', border: 'rgba(0,242,234,0.3)', color: '#5eead4' },
  }
  const c = colors[platform]
  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: c.bg,
    border: `1px solid ${c.border}`,
    color: c.color,
  }
}
