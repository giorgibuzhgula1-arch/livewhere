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
import { startBlueprintUpgradeCheckout } from '@/lib/start-blueprint-upgrade-checkout'
import { trackPremiumButtonClicked } from '@/lib/analytics'
import styles from '../app/compare/compare.module.css'

type CheckoutAction = 'monitor' | 'blueprint' | null

type Props = {
  userProfile: UserProfile
}

export default function MonitorFeed({ userProfile }: Props) {
  const hasAccess = hasMonitorAccess(userProfile)
  const isPro = isProPlan(userProfile.plan)
  const isBlueprint = isBlueprintPlan(userProfile.plan)
  const isFree = userProfile.plan === 'free'
  const showMonitorCheckout = isPro || (isBlueprint && !hasAccess)
  const [alerts, setAlerts] = useState<CityMonitor[]>([])
  const [monitored, setMonitored] = useState<CityMonitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<CheckoutAction>(null)

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

  async function handleMonitorSubscribe() {
    trackPremiumButtonClicked({ plan: 'monitor', location: 'monitor_tab' })
    setCheckoutLoading('monitor')
    setError(null)
    try {
      await startMonitorCheckout()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout')
      setCheckoutLoading(null)
    }
  }

  async function handleBlueprintUpgrade() {
    trackPremiumButtonClicked({ plan: 'blueprint_upgrade', location: 'monitor_tab' })
    setCheckoutLoading('blueprint')
    setError(null)
    try {
      await startBlueprintUpgradeCheckout()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout')
      setCheckoutLoading(null)
    }
  }

  async function handleUpgradeClick() {
    if (showMonitorCheckout) {
      await handleMonitorSubscribe()
    }
  }

  if (isFree) {
    return null
  }

  if (!hasAccess && isPro) {
    const btnBase: React.CSSProperties = {
      width: '100%',
      border: 'none',
      padding: '14px 20px',
      borderRadius: 12,
      fontSize: 14,
      fontWeight: 700,
      fontFamily: "'DM Sans', sans-serif",
    }

    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Unlock Retirement Monitor
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(240,237,232,0.55)',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Weekly alerts when taxes, visas, healthcare, or cost of living change for your saved cities.
        </p>

        {error && (
          <p
            style={{
              fontSize: 13,
              color: '#f05a8c',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
            alignItems: 'stretch',
          }}
        >
          {/* Option 1: Monitor only */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 20,
                lineHeight: 1.35,
              }}
            >
              Add Monitor only — $9.99/month
            </h3>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => void handleMonitorSubscribe()}
              disabled={checkoutLoading !== null}
              style={{
                ...btnBase,
                background: '#1a1a26',
                color: '#f0ede8',
                cursor: checkoutLoading !== null ? 'wait' : 'pointer',
                opacity: checkoutLoading !== null && checkoutLoading !== 'monitor' ? 0.5 : 1,
              }}
            >
              {checkoutLoading === 'monitor' ? 'Loading…' : 'Subscribe'}
            </button>
          </div>

          {/* Option 2: Blueprint upgrade — highlighted */}
          <div
            style={{
              background: 'rgba(200,240,90,0.06)',
              border: '1px solid rgba(200,240,90,0.35)',
              borderRadius: 18,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: -11,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#c8f05a',
                color: '#0a0a0f',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                padding: '4px 12px',
                borderRadius: 20,
                whiteSpace: 'nowrap',
              }}
            >
              Best value
            </span>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 12,
                marginTop: 8,
                lineHeight: 1.35,
                color: '#c8f05a',
              }}
            >
              Continue to Blueprint — $100 one-time
            </h3>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(240,237,232,0.65)',
                lineHeight: 1.6,
                marginBottom: 20,
                flex: 1,
              }}
            >
              Includes 12 months Monitor ($120 value) + Personalized Relocation Blueprint + Priority Support
            </p>
            <button
              type="button"
              onClick={() => void handleBlueprintUpgrade()}
              disabled={checkoutLoading !== null}
              style={{
                ...btnBase,
                background: '#c8f05a',
                color: '#0a0a0f',
                cursor: checkoutLoading !== null ? 'wait' : 'pointer',
                opacity: checkoutLoading !== null && checkoutLoading !== 'blueprint' ? 0.5 : 1,
              }}
            >
              {checkoutLoading === 'blueprint' ? 'Loading…' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    )
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
          disabled={checkoutLoading !== null}
          style={{
            background: '#c8f05a',
            color: '#0a0a0f',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: checkoutLoading !== null ? 'wait' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            opacity: checkoutLoading !== null ? 0.7 : 1,
          }}
        >
          {checkoutLoading === 'monitor' ? 'Loading…' : 'Add Monitor — $9.99/month'}
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
