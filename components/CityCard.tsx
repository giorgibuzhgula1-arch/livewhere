'use client'

import { CityResult } from '@/lib/types'

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

export default function CityCard({ city, rank, onClick, locked = false, onUnlock }: Props) {
  const color = getScoreColor(city.score)

  if (locked) {
    return (
      <div style={{
        background: rank === 1 ? 'rgba(200,240,90,0.04)' : '#1a1a26',
        border: `1px solid ${rank === 1 ? 'rgba(200,240,90,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 18,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 220,
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>{city.flag}</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{city.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)' }}>{city.country}</div>

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10,10,15,0.72)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>🔒</div>
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
            }}
          >
            Unlock with Pro — $9/mo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div onClick={onClick} style={{
      background: rank === 1 ? 'rgba(200,240,90,0.04)' : '#1a1a26',
      border: `1px solid ${rank === 1 ? 'rgba(200,240,90,0.3)' : rank === 2 ? 'rgba(90,240,200,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 18, padding: 24, cursor: 'pointer', transition: 'all 0.2s',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color, width: `${city.score}%`, transition: 'width 0.5s ease'
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
            color: city.monthlySavings > 0 ? '#c8f05a' : '#f05a8c'
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
            background: 'rgba(200,240,90,0.1)', color: '#c8f05a'
          }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
