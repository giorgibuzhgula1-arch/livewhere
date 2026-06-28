'use client'

import Link from 'next/link'
import { CityResult } from '@/lib/types'
import { compareHrefForCity } from '@/lib/compare'
import { visaScoreForCountry, visaScoreColor } from '@/lib/visa-data'

interface Props {
  city: CityResult
  rank: number
  onClick: () => void
  locked?: boolean
  onUnlock?: () => void
  /** When set, show a link to the /compare page with this city pre-selected. */
  showCompareLink?: boolean
}

function getScoreColor(score: number) {
  if (score >= 80) return '#c8f05a'
  if (score >= 65) return '#f0c85a'
  return '#f05a8c'
}

function fmt(n: number, currency = 'USD') {
  const sym: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' }
  return (sym[currency] || '$') + n.toLocaleString()
}

function cardShellStyle(rank: number, cursor: string) {
  return {
    background: rank === 1 ? 'rgba(200,240,90,0.04)' : '#1a1a26',
    border: `1px solid ${rank === 1 ? 'rgba(200,240,90,0.3)' : rank === 2 ? 'rgba(90,240,200,0.2)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 18,
    padding: 24,
    cursor,
    transition: 'all 0.2s',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }
}

function CityDetails({ city, color, showCompareLink = false }: { city: CityResult; color: string; showCompareLink?: boolean }) {
  return (
    <>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color, width: `${city.score}%`, transition: 'width 0.5s ease',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ fontSize: 32 }}>{city.flag}</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
            {city.score}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>
            match score
          </div>
        </div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{city.name}</div>
      <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 16 }}>
        {city.country} · {city.continent}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Take-home/mo', val: fmt(city.takeHomeMonthly) },
          { label: 'Monthly cost', val: fmt(city.monthlyCost) },
          { label: 'Tax rate', val: `${city.taxRate}%` },
          { label: 'Monthly saving', val: `${city.monthlySavings > 0 ? '+' : ''}${fmt(Math.abs(city.monthlySavings))}`, color: city.monthlySavings > 0 ? '#c8f05a' : '#f05a8c' },
        ].map(({ label, val, color: vc }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: vc }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {city.tags.slice(0, 2).map(tag => (
          <span key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(200,240,90,0.1)', color: '#c8f05a' }}>{tag}</span>
        ))}
        <VisaBadge country={city.country} />
      </div>
      {showCompareLink && (
        <Link
          href={compareHrefForCity(city.name)}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-block',
            marginTop: 14,
            fontSize: 13,
            fontWeight: 600,
            color: '#c8f05a',
            textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Compare →
        </Link>
      )}
    </>
  )
}

function VisaBadge({ country }: { country: string }) {
  const score = visaScoreForCountry(country)
  if (score == null) return null
  const c = visaScoreColor(score)
  return (
    <span
      title={`Visa access score: ${score}/100`}
      style={{
        fontSize: 11, padding: '4px 10px', borderRadius: 20,
        background: `${c}1f`, border: `1px solid ${c}55`, color: c,
        display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600,
      }}
    >
      🛂 Visa {score}
    </span>
  )
}

export default function CityCard({ city, rank, onClick, locked = false, onUnlock, showCompareLink = false }: Props) {
  const color = getScoreColor(city.score)

  if (locked) {
    const region = city.continent && city.continent !== 'Other' ? city.continent : 'another region'
    return (
      <div style={cardShellStyle(rank, 'default')}>
        {/* Header: hidden identity (continent only) + visible match score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
              color: 'rgba(240,237,232,0.55)', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: 6,
            }}>
              🔒 Locked
            </span>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f0ede8', marginTop: 10, lineHeight: 1.2 }}>
              City in {region}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
              {city.score}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>
              match score
            </div>
          </div>
        </div>

        {/* Blurred placeholder stats teaser */}
        <div aria-hidden style={{ filter: 'blur(7px)', opacity: 0.25, userSelect: 'none', pointerEvents: 'none', marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['Take-home/mo', 'Monthly cost', 'Tax rate', 'Monthly saving'].map((label) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>$0,000</div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUnlock?.() }}
          style={{ width: '100%', background: '#c8f05a', color: '#0a0a0f', border: 'none', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          Get My Retirement Plan — $39
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={cardShellStyle(rank, 'pointer')}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      <CityDetails city={city} color={color} showCompareLink={showCompareLink} />
    </div>
  )
}