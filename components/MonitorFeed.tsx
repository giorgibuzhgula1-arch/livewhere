'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  describeDelta,
  fetchMonitorAlerts,
  fetchMonitoredCities,
  formatMonitorDate,
  type CityMonitor,
  type MonitorSnapshot,
} from '@/lib/city-monitor'
import {
  hasMonitorAccess,
  isBlueprintPlan,
  isProPlan,
  type UserProfile,
} from '@/lib/plan'
import { startMonitorCheckout } from '@/lib/start-monitor-checkout'
import styles from '../app/compare/compare.module.css'

type Props = {
  userProfile: UserProfile
  onUpgrade: () => void
}

export default function MonitorFeed({ userProfile, onUpgrade }: Props) {
  const hasAccess = hasMonitorAccess(userProfile)
  const isPro = isProPlan(userProfile.plan)
  const isBlueprint = isBlueprintPlan(userProfile.plan)
  const isFree = userProfile.plan === 'free'
  const showMonitorCheckout = isPro || (isBlueprint && !hasAccess)
  const [alerts, setAlerts] = useState<CityMonitor[]>([])
  const [monitored, setMonitored] = useState<CityMonitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (isFree) {
      onUpgrade()
    }
  }, [isFree, onUpgrade])

  const load = useCallback(async () => {
    if (!hasAccess) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [alertRows, cityRows] = await Promise.all([
        fetchMonitorAlerts(),
        fetchMonitoredCities(),
      ])
      setAlerts(alertRows)
      setMonitored(cityRows)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load monitor feed')
    } finally {
      setLoading(false)
    }
  }, [hasAccess])

  useEffect(() => {
    void load()
  }, [load])

  async function handleUpgradeClick() {
    if (showMonitorCheckout) {
      setCheckoutLoading(true)
      setError(null)
      try {
        await startMonitorCheckout()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to start checkout')
      } finally {
        setCheckoutLoading(false)
      }
    }
  }

  if (isFree) {
    return null
  }

  if (!hasAccess) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 36,
            marginBottom: 16,
            opacity: 0.5,
          }}
          aria-hidden
        >
          🔒
        </div>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Retirement Monitor
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(240,237,232,0.6)',
            lineHeight: 1.7,
            maxWidth: 420,
            margin: '0 auto 24px',
          }}
        >
          {isPro
            ? 'Get weekly alerts when taxes, visa rules, healthcare scores, or cost of living change for your top saved cities. Add Monitor to your Pro plan for $9.99/month.'
            : 'Your included 12 months of Monitor has ended. Continue weekly city alerts for $9.99/month.'}
        </p>
        {error && (
          <p
            style={{
              fontSize: 13,
              color: '#f05a8c',
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleUpgradeClick()}
          disabled={checkoutLoading}
          style={{
            background: '#c8f05a',
            color: '#0a0a0f',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: checkoutLoading ? 'wait' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            opacity: checkoutLoading ? 0.7 : 1,
          }}
        >
          {checkoutLoading ? 'Loading…' : 'Add Monitor — $9.99/month'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className={styles.subtitle} style={{ marginBottom: 24 }}>
        Weekly checks on your top 3 saved cities. Alerts appear when taxes, visa access,
        healthcare, or cost of living shift meaningfully.
      </p>

      {monitored.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 24,
          }}
        >
          {monitored.map((m) => (
            <span
              key={m.city_id}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(200,240,90,0.08)',
                border: '1px solid rgba(200,240,90,0.2)',
                color: 'rgba(200,240,90,0.9)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Monitoring {m.city_name}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(240,90,140,0.1)',
            border: '1px solid rgba(240,90,140,0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            color: '#f05a8c',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'rgba(240,237,232,0.45)' }}>Loading monitor feed…</p>
      ) : alerts.length === 0 ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 28,
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'rgba(240,237,232,0.6)', marginBottom: 12, lineHeight: 1.6 }}>
            No changes detected yet. Save a plan with your top city matches — we&apos;ll check
            every Monday and email you when something shifts.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              color: '#c8f05a',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Run the quiz →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  )
}

function AlertCard({ alert }: { alert: CityMonitor }) {
  const changes = alert.changes
  const deltas = changes?.deltas ?? {}
  const deltaEntries = Object.entries(deltas) as [keyof MonitorSnapshot, { old: number; new: number }][]

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid rgba(200,240,90,0.2)',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {alert.city_name}
        </h3>
        <time
          dateTime={alert.checked_at}
          style={{
            fontSize: 12,
            color: 'rgba(240,237,232,0.45)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {formatMonitorDate(alert.checked_at)}
        </time>
      </div>

      {changes?.summary && (
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: 'rgba(240,237,232,0.8)',
            marginBottom: deltaEntries.length > 0 ? 14 : 0,
          }}
        >
          {changes.summary}
        </p>
      )}

      {deltaEntries.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {deltaEntries.map(([field, { old: o, new: n }]) => (
            <li
              key={field}
              style={{
                fontSize: 12,
                color: '#c8f05a',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {describeDelta(field, o, n)}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
