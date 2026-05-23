'use client'

import { CityResult } from '@/lib/types'
import { countryCodeFromFlag } from '@/lib/country-code'

interface Props {
  city: CityResult
  rank: number
  onClick: () => void
  locked?: boolean
  onUnlock?: () => void
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

function CityIdentity({ city, countryCode }: { city: CityResult; countryCode: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 32, lineHeight: 1 }} aria-hidden>{city.flag}</span>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 2,
          color: '#c8f05a',
          background: 'rgba(200,240,90,0.12)',
          border: '1px solid rgba(200,240,90,0.25)',
          padding: '5px 10px',
          borderRadius: 6,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {countryCode}
        </span>
      </div>
      <div style={{
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1.25,
        color: '#f0ede8',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {city.name}
      </div>
    </div>
  )
}

function CityDetails({ city, color }: { city: CityResult; color: string }) {
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
          {
            label: 'Monthly saving',
            val: `${city.monthlySavings > 0 ? '+' : ''}${fmt(Math.abs(city.monthlySavings))}`,
            color: city.monthlySavings > 0 ? '#c8f05a' : '#f05a8c',
          },
        ].map(({ label, val, color: vc }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: vc }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {city.tags.slice(0, 2).map(tag => (
          <span key={tag} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 20,
            background: 'rgba(200,240,90,0.1)', color: '#c8f05a',
          }}>
            {tag}
          </span>
        ))}
      </div>
    </>
  )
}

function LockedCityDetails({ city, color }: { city: CityResult; color: string }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>
            {city.score}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>
            match score
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: 16 }}>
        {city.country} · {city.continent}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Take-home/mo', val: fmt(city.takeHomeMonthly) },
          { label: 'Monthly cost', val: fmt(city.monthlyCost) },
          { label: 'Tax rate', val: `${city.taxRate}%` },
          {
            label: 'Monthly saving',
            val: `${city.monthlySavings > 0 ? '+' : ''}${fmt(Math.abs(city.monthlySavings))}`,
            color: city.monthlySavings > 0 ? '#c8f05a' : '#f05a8c',
          },
        ].map(({ label, val, color: vc }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: vc }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {city.tags.slice(0, 2).map(tag => (
          <span key={tag} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 20,
            background: 'rgba(200,240,90,0.1)', color: '#c8f05a',
          }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CityCard({ city, rank, onClick, locked = false, onUnlock }: Props) {
  const color = getScoreColor(city.score)
  const countryCode = countryCodeFromFlag(city.flag)

  if (locked) {
    return (
      <div style={cardShellStyle(rank, 'default')}>
        <CityIdentity city={city} countryCode={countryCode} />

        <div style={{ position: 'relative', marginTop: 12, minHeight: 200 }}>
          <div
            aria-hidden
            style={{
              filter: 'blur(7px)',
              opacity: 0.85,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            <LockedCityDetails city={city} color={color} />
          </div>

          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 16,
            background: 'rgba(10,10,15,0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>🔒</div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onUnlock?.()
              }}
              style={{
                background: '#c8f05a',
                color: '#0a0a0f',
                border: 'none',
                padding: '12px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
              }}
            >
              Unlock with Pro — $9/mo
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={cardShellStyle(rank, 'pointer')}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      <CityDetails city={city} color={color} />
    </div>
  )
}
