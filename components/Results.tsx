'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import CityCard from './CityCard'
import CityModal from './CityModal'
import { CityResult } from '@/lib/types'
import { getSiteUrl } from '@/lib/site-url'

function buildShareLine(city: CityResult): string {
  return `My #1 match is ${city.name} ${city.flag} Match Score: ${city.score}% — Find yours at livewhere.io`
}

interface Props {
  cities: CityResult[]
  onReset: () => void
  streaming?: boolean
}

const CONTINENTS = ['all', 'Europe', 'Americas', 'Asia', 'Other']

export default function Results({ cities, onReset, streaming = false }: Props) {
  const [filter, setFilter] = useState('all')
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  const filtered = filter === 'all' ? cities : cities.filter(c => c.continent === filter)
  const top = cities[0]
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

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 20px 80px', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700 }}>
            Top matches <span style={{ color: '#c8f05a' }}>for you</span>
          </h2>
          {streaming && (
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
          {top && (
            <button
              type="button"
              onClick={() => shareCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{
                background: 'rgba(200,240,90,0.1)', border: '1px solid rgba(200,240,90,0.35)',
                color: '#c8f05a', padding: '10px 18px', borderRadius: 10,
                fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600
              }}
            >
              Share
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

      {/* AI Insight */}
      {top && (
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

      {top && (
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
        </motion.div>
      )}

      {/* Continent filter */}
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

      {/* Cities grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {filtered.map((city, i) => (
          <motion.div
            key={city.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <CityCard city={city} rank={i + 1} onClick={() => setSelectedCity(city)} />
          </motion.div>
        ))}
      </div>

      {selectedCity && (
        <CityModal city={selectedCity} onClose={() => setSelectedCity(null)} />
      )}
    </section>
  )
}
