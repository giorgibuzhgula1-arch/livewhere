'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import CityCard from './CityCard'
import CityComparison from './CityComparison'
import LifetimeInsights from './LifetimeInsights'

const CityModal = dynamic(() => import('./CityModal'), { ssr: false })
const SavePlanModal = dynamic(() => import('./SavePlanModal'), { ssr: false })
import { CityResult, type AnalyzeRequest } from '@/lib/types'
import { loadPendingAnalyze } from '@/lib/pending-analyze'
import { getSiteUrl } from '@/lib/site-url'
import { fetchUserPlan, isBlueprintPlan, isPaidPlan, type UserPlan } from '@/lib/plan'
import { exportRetirementReport } from '@/lib/export-pdf'
import { trackResultsViewed } from '@/lib/analytics'

function buildShareLine(city: CityResult): string {
  return `My #1 match is ${city.name} ${city.flag} Match Score: ${city.score}% — Find yours at livewhere.io`
}

function getScoreColor(score: number) {
  if (score >= 80) return '#c8f05a'
  if (score >= 65) return '#f0c85a'
  return '#f05a8c'
}

/** Average of tax + housing sub-scores (both 0–100 on CityResult). */
function financialFitScore(city: CityResult): number {
  const tax = city.scores?.tax ?? 0
  const housing = city.scores?.housing ?? 0
  return Math.round((tax + housing) / 2)
}

function topMatchMetrics(city: CityResult) {
  const scores = city.scores
  return [
    { label: 'Financial Fit', score: financialFitScore(city) },
    { label: 'Safety', score: scores?.safety ?? 0 },
    { label: 'Health', score: scores?.health ?? 0 },
    { label: 'Stability', score: scores?.stability ?? 0 },
    { label: 'Climate', score: scores?.climate ?? 0 },
  ]
}

const EMOTIONAL_UNLOCK_ITEMS = [
  '10-Year Savings',
  'Tax Comparison',
  'Healthcare Analysis',
  'Best City Breakdown',
  'Hidden Risks',
  'Personalized Relocation Strategy',
] as const

const WHAT_YOU_LL_GET_ITEMS = [
  'Know exactly where you\'ll save the most money',
  'Know which cities keep you safe and healthy',
  'Know the tax rules before you move, not after',
  'Know your real monthly budget abroad',
  'Know your best-fit city before making a decision this big',
] as const

/** Matches CityCard WhyThisMatchesYou / locked-card blur treatment. */
const lockedPreviewBlur: React.CSSProperties = {
  filter: 'blur(7px)',
  userSelect: 'none',
  pointerEvents: 'none',
  opacity: 0.85,
}

/**
 * Split aiInsight for paywall teaser: first sentence clear, remainder blurred.
 * Falls back to first ~40% when there is only one sentence (no period with trailing text).
 */
function splitAiInsightPreview(text: unknown): { clear: string; blurred: string } | null {
  if (typeof text !== 'string') return null
  const trimmed = text.trim()
  if (!trimmed) return null

  const dotIndex = trimmed.indexOf('.')
  if (dotIndex > 0 && dotIndex < trimmed.length - 1) {
    const afterDot = trimmed.slice(dotIndex + 1).trim()
    if (afterDot.length > 0) {
      return {
        clear: trimmed.slice(0, dotIndex + 1),
        blurred: afterDot,
      }
    }
  }

  const splitAt = Math.max(1, Math.ceil(trimmed.length * 0.4))
  const blurred = trimmed.slice(splitAt)
  if (!blurred) return null

  return {
    clear: trimmed.slice(0, splitAt),
    blurred,
  }
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
  quizInput?: AnalyzeRequest | null
  onAuthClick?: () => void
}

const CONTINENTS = ['all', 'Europe', 'Americas', 'Asia', 'Other']
const MAX_COMPARE_CITIES = 3

function cityKey(city: CityResult): string {
  return `${city.name}|${city.country}`
}

function resolveQuizInput(
  quizInput: AnalyzeRequest | null | undefined,
  monthlyBudget?: number,
  currency?: string,
  lifestyle?: string[],
): AnalyzeRequest | null {
  if (quizInput) return quizInput

  const pending = loadPendingAnalyze()
  if (pending) return pending

  if (typeof monthlyBudget === 'number' && monthlyBudget > 0) {
    return {
      monthlyBudget,
      currency: currency || 'USD',
      priorities: {
        tax: 5,
        housing: 5,
        climate: 5,
        health: 5,
        stability: 5,
        safety: 5,
        expat_community: 5,
        visa_residency: 5,
      },
      lifestyle: lifestyle ?? [],
    }
  }

  return null
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
  quizInput = null,
  onAuthClick,
}: Props) {
  const showStreamingIndicator =
    streaming && (maxCities == null || cities.length < maxCities)
  const [filter, setFilter] = useState('all')
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null)
  const [plan, setPlan] = useState<UserPlan>('free')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [compareSelection, setCompareSelection] = useState<CityResult[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [savePlanOpen, setSavePlanOpen] = useState(false)

  const resultsTracked = useRef(false)

  useEffect(() => {
    let cancelled = false
    void fetchUserPlan().then((p) => {
      if (!cancelled) setPlan(p)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (resultsTracked.current || streaming || cities.length === 0) return
    resultsTracked.current = true
    trackResultsViewed({ cityCount: cities.length })
  }, [cities.length, streaming])

  const paid = isPaidPlan(plan)
  const isBlueprint = isBlueprintPlan(plan)
  const locked = !paid
  const isUnlocked = (city: CityResult) => paid || !city.locked
  const visaMonthlyBudget = typeof monthlyBudget === 'number' && monthlyBudget > 0 ? Math.round(monthlyBudget) : undefined

  const effectiveQuizInput = resolveQuizInput(quizInput, monthlyBudget, currency, lifestyle)
  const canSavePlan = !streaming && cities.length > 0

  function handleSavePlanClick() {
    if (!effectiveQuizInput) {
      onAuthClick?.()
      return
    }
    setSavePlanOpen(true)
  }

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
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 20px 120px', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700 }}>
            Congratulations. We Found Your Best Relocation Matches.
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              lineHeight: 1.6,
              color: 'rgba(240,237,232,0.55)',
              margin: 0,
              maxWidth: 640,
            }}
          >
            Based on everything you told us, we&apos;ve identified the cities where you&apos;ll thrive.
          </p>
          {top && (
            <div
              id="share-results"
              style={{
              width: '100%',
              maxWidth: 640,
              background: 'linear-gradient(135deg, rgba(200,240,90,0.12) 0%, rgba(200,240,90,0.04) 100%)',
              border: '1px solid rgba(200,240,90,0.35)',
              borderRadius: 14,
              padding: '14px 16px',
            }}>
              <div style={{
                fontSize: 21,
                fontWeight: 700,
                color: '#c8f05a',
                marginBottom: 8,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.2,
              }}>
                Share your results - help a friend plan their move
              </div>
              <p style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: 'rgba(240,237,232,0.75)',
                fontFamily: "'DM Sans', sans-serif",
                margin: '0 0 12px',
              }}>
                {shareLine}
              </p>
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
          {isBlueprint && (
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
              {pdfLoading ? 'Building your blueprint…' : 'Download Your Relocation Blueprint'}
            </button>
          )}
          {top && paid && (
            <button
              type="button"
              onClick={() => document.getElementById('share-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
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
            ← Explore again
          </button>
        </div>
      </div>

      {/* #1 match score + key metrics (free + paid) */}
      {top && isUnlocked(top) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(200,240,90,0.04)', border: '1px solid rgba(200,240,90,0.15)',
            borderRadius: 16, padding: 24, marginBottom: 28,
          }}
        >
          <div style={{
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: '#c8f05a',
            fontWeight: 600,
            marginBottom: 16,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Your #1 match
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 36 }}>{top.flag}</span>
              <div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#f0ede8',
                  lineHeight: 1.2,
                }}>
                  {top.name}
                </div>
                <div style={{
                  fontSize: 13,
                  color: 'rgba(240,237,232,0.45)',
                  fontFamily: "'DM Sans', sans-serif",
                  marginTop: 2,
                }}>
                  {top.country}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 48,
                fontWeight: 900,
                color: getScoreColor(top.score),
                lineHeight: 1,
              }}>
                {top.score}
              </div>
              <div style={{
                fontSize: 11,
                color: 'rgba(240,237,232,0.45)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontFamily: "'DM Sans', sans-serif",
                marginTop: 4,
              }}>
                match score
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(240,237,232,0.45)',
              fontFamily: "'DM Sans', sans-serif",
              margin: '0 0 16px',
              lineHeight: 1.5,
            }}
          >
            We eliminate bad options before recommending good ones.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
          }}>
            {topMatchMetrics(top).map(({ label, score }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: '12px 14px',
                }}
              >
                <div style={{
                  fontSize: 10,
                  color: 'rgba(240,237,232,0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: getScoreColor(score),
                  lineHeight: 1,
                }}>
                  {score}
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(240,237,232,0.35)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    /100
                  </span>
                </div>
              </div>
            ))}
          </div>

          {locked && (() => {
            const insightParts = splitAiInsightPreview(top.aiInsight)
            if (!insightParts) return null
            return (
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: '#c8f05a',
                    fontWeight: 600,
                    marginBottom: 12,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Why This City
                </div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'rgba(240,237,232,0.88)',
                    fontFamily: "'DM Sans', sans-serif",
                    margin: '0 0 16px',
                  }}
                >
                  {insightParts.clear}{' '}
                  <span style={lockedPreviewBlur}>{insightParts.blurred}</span>
                </p>
                <button
                  type="button"
                  onClick={() => onUnlockPro?.()}
                  style={{
                    background: '#c8f05a',
                    color: '#0a0a0f',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Unlock My Complete Relocation Blueprint
                </button>
              </div>
            )
          })()}
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
          You&apos;re seeing real data for your #1 match — take-home pay, costs, climate, safety, pros/cons and visa path. Unlock the full breakdown we prepared and all 12 matches with Pro.
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
              showCompareLink={isUnlocked(city)}
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

      {locked && (
        <div
          style={{
            marginTop: 40,
            maxWidth: 640,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(22px, 3vw, 30px)',
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              color: '#f0ede8',
              margin: '0 0 20px',
              textAlign: 'center',
            }}
          >
            What You&apos;ll Get
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {WHAT_YOU_LL_GET_ITEMS.map((item) => (
              <li
                key={item}
                style={{
                  fontSize: 13,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  color: 'rgba(240,237,232,0.65)',
                  lineHeight: 1.45,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span
                  style={{
                    color: '#c8f05a',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {locked && (
        <div
          style={{
            marginTop: 40,
            padding: '32px 28px',
            background: 'linear-gradient(135deg, rgba(200,240,90,0.08) 0%, rgba(200,240,90,0.02) 100%)',
            border: '1px solid rgba(200,240,90,0.25)',
            borderRadius: 18,
            textAlign: 'center',
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(22px, 3vw, 30px)',
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              color: '#f0ede8',
              margin: '0 0 16px',
              maxWidth: 640,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            This Could Be One Of The Best Financial Decisions Of Your Life.
          </h3>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              lineHeight: 1.5,
              color: 'rgba(240,237,232,0.5)',
              margin: '0 0 16px',
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Moving is expensive. Guessing is even more expensive.
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              lineHeight: 1.65,
              color: 'rgba(240,237,232,0.65)',
              margin: '0 0 6px',
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            You now know where you could save more, live better and enjoy a higher quality of life.
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              lineHeight: 1.65,
              color: 'rgba(240,237,232,0.65)',
              margin: '0 0 28px',
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Don&apos;t make this decision with incomplete information.
          </p>

          <div
            style={{
              maxWidth: 480,
              margin: '0 auto 28px',
              textAlign: 'left',
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: '8px 0',
            }}
          >
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {EMOTIONAL_UNLOCK_ITEMS.map((label) => (
                <li
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: 'rgba(240,237,232,0.85)', fontWeight: 500 }}>
                    {label}{' '}
                    <span aria-hidden style={{ opacity: 0.7 }}>🔒</span>
                  </span>
                  <span aria-hidden style={lockedPreviewBlur}>
                    Preview data
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onUnlockPro?.()}
            style={{
              background: '#c8f05a',
              color: '#0a0a0f',
              border: 'none',
              padding: '14px 28px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Unlock My Complete Relocation Blueprint
          </button>
          <p
            style={{
              margin: '12px 0 0',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              lineHeight: 1.5,
              color: 'rgba(240,237,232,0.5)',
            }}
          >
            Make your relocation decision with confidence — or get your money back.
          </p>
        </div>
      )}

      {isBlueprint && (
        <LifetimeInsights
          cities={ordered.filter(isUnlocked)}
          budget={typeof monthlyBudget === 'number' && monthlyBudget > 0 ? monthlyBudget : 0}
        />
      )}

      {canSavePlan && (
        <div
          style={{
            marginTop: 40,
            padding: '28px 24px',
            background: 'linear-gradient(135deg, rgba(200,240,90,0.08) 0%, rgba(200,240,90,0.02) 100%)',
            border: '1px solid rgba(200,240,90,0.25)',
            borderRadius: 18,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: '#c8f05a',
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Saved plans
          </p>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(20px,3vw,26px)',
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Save this scenario for later
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(240,237,232,0.55)',
              marginBottom: 20,
              lineHeight: 1.6,
              maxWidth: 480,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Name this plan and compare it with other options — like Plan A vs Plan B.
          </p>
          <button
            type="button"
            onClick={handleSavePlanClick}
            style={{
              background: '#c8f05a',
              color: '#0a0a0f',
              border: 'none',
              padding: '14px 28px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Save this Plan
          </button>
        </div>
      )}

      {canSavePlan && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
            background: 'linear-gradient(to top, rgba(10,10,15,0.98) 70%, transparent)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <button
            type="button"
            onClick={handleSavePlanClick}
            style={{
              pointerEvents: 'auto',
              background: '#c8f05a',
              color: '#0a0a0f',
              border: 'none',
              padding: '14px 32px',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 8px 32px rgba(200,240,90,0.25)',
              maxWidth: 420,
              width: '100%',
            }}
          >
            Save this Plan
          </button>
        </div>
      )}

      {selectedCity && (
        <CityModal
          city={selectedCity}
          monthlyBudget={visaMonthlyBudget}
          currency={currency}
          lifestyle={lifestyle}
          plan={plan}
          onUnlock={onUnlockPro}
          onClose={() => setSelectedCity(null)}
        />
      )}

      {effectiveQuizInput && (
        <SavePlanModal
          isOpen={savePlanOpen}
          onClose={() => setSavePlanOpen(false)}
          quizInput={effectiveQuizInput}
          cities={cities}
          maxCities={maxCities}
          onAuthRequired={() => {
            setSavePlanOpen(false)
            onAuthClick?.()
          }}
        />
      )}
    </section>
  )
}
