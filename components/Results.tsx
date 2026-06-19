'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import CityCard from './CityCard'
import CityComparison from './CityComparison'
import LifetimeInsights from './LifetimeInsights'

const CityModal = dynamic(() => import('./CityModal'), { ssr: false })
import { CityResult } from '@/lib/types'
import { getSiteUrl } from '@/lib/site-url'
import { fetchUserPlan, isPaidPlan, type UserPlan } from '@/lib/plan'
import { exportRetirementReport } from '@/lib/export-pdf'

function buildShareLine(city: CityResult): string {
  return `My #1 match is ${city.name} ${city.flag} Match Score: ${city.score}% — Find yours at livewhere.io`
}

interface Props {
  cities: CityResult[]
  onReset: () => void
  streaming?: boolean
  /** When set (free tier), hide "Loading more cities…" once this many are shown. */
  maxCities?: number | null
  onUnlockPro?: () => void
  /** Target monthly living budget from the quiz — feeds the visa recommendation. */
  monthlyBudget?: number
  currency?: string
  lifestyle?: string[]
}

const CONTINENTS = ['all', 'Europe', 'Americas', 'Asia', 'Other']
const MAX_COMPARE_CITIES = 3

function cityKey(city: CityResult): string {
  return `${city.name}|${city.country}`
}

export default function Results({
  cities,
  onReset,
  streaming = false,
  maxCities = null,
  onUnlockPro,
  monthlyBudget,
  currency = 'USD',
  lifestyle,
}: Props) {
  const showStreamingIndicator =
    streaming && (maxCities == null || cities.length < maxCities)
  const [filter, setFilter] = useState('all')
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [plan, setPlan] = useState<UserPlan>('free')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [compareSelection, setCompareSelection] = useState<CityResult[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void fetchUserPlan().then((p) => {
      if (!cancelled) setPlan(p)
    })
    return () => { cancelled = true }
  }, [])

  const paid = isPaidPlan(plan)
  const isLifetime = plan === 'lifetime'
  const locked = !paid
  const isUnlocked = (city: CityResult) => paid || !city.locked
  const visaMonthlyBudget = typeof monthlyBudget === 'number' && monthlyBudget > 0 ? Math.round(monthlyBudget) : undefined

  // Always show unlocked card(s) first, then by descending score.
  const ordered = [...cities].sort((a, b) => {
    const au = isUnlocked(a) ? 1 : 0
    const bu = isUnlocked(b) ? 1 : 0
    if (au !== bu) return bu - au
    return b.score - a.score
  })

  const filtered = filter === 'all' ? ordered : ordered.filter(c => c.continent === filter)
  const top = ordered[0]
  const shareLine = top ? buildShareLine(top) : ''
  const siteUrl = getSiteUrl()

  async function copySiteLink() {
    try {
      await navigator.clipboard.writeText(siteUrl)
      setLinkCopied(true)
      window.setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  function openShareUrl(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleDownloadPdf() {
    if (pdfLoading) return
    const exportCities = ordered.filter(isUnlocked)
    if (exportCities.length === 0) return

    setPdfLoading(true)
    try {
      const budget = typeof monthlyBudget === 'number' && monthlyBudget > 0 ? monthlyBudget : 0
      await exportRetirementReport(exportCities, budget, { lifetime: true })
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  function isCompareSelected(city: CityResult): boolean {
    return compareSelection.some((c) => cityKey(c) === cityKey(city))
  }

  function toggleCompareSelection(city: CityResult) {
    setCompareSelection((prev) => {
      const key = cityKey(city)
      if (prev.some((c) => cityKey(c) === key)) {
        const next = prev.filter((c) => cityKey(c) !== key)
        if (next.length < 2) setShowComparison(false)
        return next
      }
      if (prev.length >= MAX_COMPARE_CITIES) return prev
      return [...prev, city]
    })
  }

  function clearCompareSelection() {
    setCompareSelection([])
    setShowComparison(false)
  }

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 20px 80px', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700 }}>
            Top matches <span style={{ color: '#c8f05a' }}>for you</span>
          </h2>
          {top && (
            <div style={{
              width: '100%',
              maxWidth: 640,
              background: 'linear-gradient(135deg, rgba(200,240,90,0.12) 0%, rgba(200,240,90,0.04) 100%)',
              border: '1px solid rgba(200,240,90,0.35)',
              borderRadius: 14,
              padding: '14px 16px',
            }}>
              <div style={{
                fontSize: 17,
                fontWeight: 700,
                color: '#c8f05a',
                marginBottom: 12,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.2,
              }}>
                Share your results — it&apos;s free
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button
                  type="button"
                  aria-label="Share on Facebook"
                  onClick={() =>
                    openShareUrl(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`
                    )
                  }
                  style={{
                    flex: '1 1 120px',
                    minHeight: 42,
                    background: 'rgba(24,119,242,0.12)',
                    border: '1px solid rgba(24,119,242,0.35)',
                    color: '#7ab3ff',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Facebook
                </button>
                <button
                  type="button"
                  aria-label="Share on X"
                  onClick={() =>
                    openShareUrl(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareLine)}&url=${encodeURIComponent(siteUrl)}`
                    )
                  }
                  style={{
                    flex: '1 1 140px',
                    minHeight: 42,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: '#f0ede8',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Share on X
                </button>
                <button
                  type="button"
                  aria-label="Share on Reddit"
                  onClick={() =>
                    openShareUrl(
                      `https://www.reddit.com/submit?url=${encodeURIComponent(siteUrl)}&title=${encodeURIComponent(shareLine)}`
                    )
                  }
                  style={{
                    flex: '1 1 120px',
                    minHeight: 42,
                    background: 'rgba(255,69,0,0.12)',
                    border: '1px solid rgba(255,69,0,0.35)',
                    color: '#ff8c5a',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Reddit
                </button>
              </div>
            </div>
          )}
          {showStreamingIndicator && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: 'rgba(240,237,232,0.45)',
              background: 'rgba(200,240,90,0.08)', border: '1px solid rgba(200,240,90,0.2)',
              borderRadius: 20, padding: '6px 12px', fontFamily: "'DM Sans', sans-serif"
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#c8f05a', animation: 'pulse 1.2s ease-in-out infinite'
              }} />
              <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4 } 50% { opacity: 1 } }`}</style>
              Loading more cities…
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {isLifetime && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading || ordered.filter(isUnlocked).length === 0}
              style={{
                background: pdfLoading ? 'rgba(200,240,90,0.08)' : 'rgba(200,240,90,0.1)',
                border: '1px solid rgba(200,240,90,0.35)',
                color: '#c8f05a',
                padding: '10px 18px',
                borderRadius: 10,
                fontSize: 13,
                cursor: pdfLoading ? 'wait' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                opacity: pdfLoading || ordered.filter(isUnlocked).length === 0 ? 0.7 : 1,
              }}
            >
              {pdfLoading ? 'Generating PDF…' : 'Download PDF Report'}
            </button>
          )}
          {top && paid && (
            <button
              type="button"
              onClick={() => shareCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{
                background: 'rgba(200,240,90,0.1)', border: '1px solid rgba(200,240,90,0.35)',
                color: '#c8f05a', padding: '10px 18px', borderRadius: 10,
                fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600
              }}
            >
              Share Your Match 🌍
            </button>
          )}
          <button type="button" onClick={onReset} style={{
            background: '#1a1a26', border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(240,237,232,0.45)', padding: '10px 18px', borderRadius: 10,
            fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
          }}>
            ← New search
          </button>
        </div>
      </div>

      {/* AI Insight — shown for the fully-unlocked #1 match (free + paid) */}
      {top && isUnlocked(top) && top.aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(200,240,90,0.04)', border: '1px solid rgba(200,240,90,0.15)',
            borderRadius: 16, padding: 24, marginBottom: 28, display: 'flex', gap: 16
          }}
        >
          <div style={{
            width: 36, height: 36, background: 'rgba(200,240,90,0.15)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
          }}>✦</div>
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>
            <strong style={{ color: '#c8f05a' }}>{top.flag} {top.name}</strong> is your #1 match.{' '}
            {top.aiInsight}
          </p>
        </motion.div>
      )}

      {top && paid && (
        <motion.div
          ref={shareCardRef}
          id="share-match"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          style={{
            background: '#1a1a26',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 28,
          }}
        >
          <div style={{
            fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2,
            color: 'rgba(240,237,232,0.45)', marginBottom: 12, fontFamily: "'DM Sans', sans-serif"
          }}>
            Share your match
          </div>
          <p style={{
            fontSize: 15, lineHeight: 1.65, color: 'rgba(240,237,232,0.92)',
            fontFamily: "'DM Sans', sans-serif", marginBottom: 20
          }}>
            {shareLine}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              aria-label="Share on Facebook"
              onClick={() =>
                openShareUrl(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.livewhere.io')}`
                )
              }
              style={{
                flex: '1 1 120px',
                minHeight: 44,
                background: 'rgba(24,119,242,0.12)',
                border: '1px solid rgba(24,119,242,0.12)',
                color: '#7ab3ff',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
              }}
            >
              Facebook
            </button>
            <button
              type="button"
              aria-label="Share on WhatsApp"
              onClick={() =>
                openShareUrl(`https://wa.me/?text=${encodeURIComponent(shareLine)}`)
              }
              style={{
                flex: '1 1 120px',
                minHeight: 44,
                background: 'rgba(37,211,102,0.12)',
                border: '1px solid rgba(37,211,102,0.35)',
                color: '#afffc1',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
              }}
            >
              WhatsApp
            </button>
            <button
              type="button"
              aria-label="Copy site link"
              onClick={copySiteLink}
              style={{
                flex: '1 1 120px',
                minHeight: 44,
                background: linkCopied ? 'rgba(200,240,90,0.15)' : 'rgba(200,240,90,0.08)',
                border: `1px solid ${linkCopied ? 'rgba(200,240,90,0.45)' : 'rgba(200,240,90,0.25)'}`,
                color: '#c8f05a',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
              }}
            >
              {linkCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          <p style={{
            fontSize: 12,
            color: 'rgba(240,237,232,0.38)',
            marginTop: 12,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Let your friends find theirs too →
          </p>
        </motion.div>
      )}

      {locked && (
        <div style={{
          background: 'rgba(200,240,90,0.06)',
          border: '1px solid rgba(200,240,90,0.2)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 24,
          fontSize: 14,
          lineHeight: 1.6,
          color: 'rgba(240,237,232,0.7)',
        }}>
          You&apos;re viewing your <strong style={{ color: '#c8f05a' }}>#1 match in full</strong> — take-home pay, costs, climate, safety, pros/cons and visa path. Upgrade to Pro to unlock all 12 matches.
        </div>
      )}

      {/* Continent filter */}
      {paid && cities.length > 3 && (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {CONTINENTS.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              background: filter === c ? 'rgba(200,240,90,0.1)' : '#1a1a26',
              border: filter === c ? '1px solid #c8f05a' : '1px solid rgba(255,255,255,0.07)',
              color: filter === c ? '#c8f05a' : 'rgba(240,237,232,0.45)',
            }}>
            {c === 'all' ? '🌍 All' : c === 'Europe' ? '🇪🇺 Europe' : c === 'Americas' ? '🌎 Americas' : c === 'Asia' ? '🌏 Asia' : '🌐 Other'}
          </button>
        ))}
      </div>
      )}

      {paid && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}>
          <span style={{
            fontSize: 13,
            color: 'rgba(240,237,232,0.55)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Compare cities — select up to {MAX_COMPARE_CITIES} unlocked matches
          </span>
          {compareSelection.length >= 2 && (
            <>
              <button
                type="button"
                onClick={() => setShowComparison(true)}
                style={{
                  background: 'rgba(200,240,90,0.1)',
                  border: '1px solid rgba(200,240,90,0.35)',
                  color: '#c8f05a',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                }}
              >
                Compare ({compareSelection.length})
              </button>
              <button
                type="button"
                onClick={clearCompareSelection}
                style={{
                  background: '#1a1a26',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(240,237,232,0.45)',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Clear selection
              </button>
            </>
          )}
        </div>
      )}

      {/* Cities grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {filtered.map((city, i) => {
          const compareSelected = isCompareSelected(city)
          const compareDisabled =
            paid &&
            isUnlocked(city) &&
            !compareSelected &&
            compareSelection.length >= MAX_COMPARE_CITIES

          return (
          <motion.div
            key={`${city.name}|${city.country}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{ position: 'relative' }}
          >
            {paid && isUnlocked(city) && (
              <button
                type="button"
                aria-pressed={compareSelected}
                aria-label={`${compareSelected ? 'Remove' : 'Add'} ${city.name} from comparison`}
                disabled={compareDisabled}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCompareSelection(city)
                }}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 2,
                  background: compareSelected ? 'rgba(200,240,90,0.18)' : 'rgba(26,26,38,0.92)',
                  border: compareSelected ? '1px solid #c8f05a' : '1px solid rgba(255,255,255,0.12)',
                  color: compareSelected ? '#c8f05a' : 'rgba(240,237,232,0.7)',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: compareDisabled ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: compareDisabled ? 0.45 : 1,
                }}
              >
                {compareSelected ? 'Selected' : 'Compare'}
              </button>
            )}
            <CityCard
              city={city}
              rank={i + 1}
              locked={!isUnlocked(city)}
              onUnlock={onUnlockPro}
              onClick={() => {
                if (isUnlocked(city)) setSelectedCity(city)
              }}
            />
          </motion.div>
          )
        })}
      </div>

      {paid && showComparison && compareSelection.length >= 2 && (
        <CityComparison cities={compareSelection} currency={currency} />
      )}

      {isLifetime && (
        <LifetimeInsights
          cities={ordered.filter(isUnlocked)}
          budget={typeof monthlyBudget === 'number' && monthlyBudget > 0 ? monthlyBudget : 0}
        />
      )}

      {selectedCity && (
        <CityModal
          city={selectedCity}
          monthlyBudget={visaMonthlyBudget}
          currency={currency}
          lifestyle={lifestyle}
          onClose={() => setSelectedCity(null)}
        />
      )}
    </section>
  )
}
