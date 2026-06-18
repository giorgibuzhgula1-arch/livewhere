'use client'
import { useState } from 'react'

const US_STATE_COSTS: Record<string, number> = {
  'California': 5200,
  'New York': 5800,
  'Florida': 3800,
  'Texas': 3600,
  'Washington': 4800,
  'Massachusetts': 5100,
  'New Jersey': 5400,
  'Illinois': 4100,
  'Colorado': 4300,
  'Arizona': 3700,
  'Georgia': 3500,
  'Virginia': 4400,
  'Oregon': 4200,
  'Minnesota': 3900,
  'Michigan': 3400,
  'Ohio': 3200,
  'Pennsylvania': 3800,
  'Nevada': 3600,
  'Connecticut': 5000,
  'Maryland': 4600,
  'Wisconsin': 3500,
  'North Carolina': 3400,
  'Tennessee': 3100,
  'Indiana': 3000,
  'Missouri': 3000,
}

const DESTINATIONS: Record<string, { flag: string; city: string; rent_usd: number }> = {
  'Portugal': { flag: '🇵🇹', city: 'Lisbon', rent_usd: 1100 },
  'Spain': { flag: '🇪🇸', city: 'Barcelona', rent_usd: 1400 },
  'Mexico': { flag: '🇲🇽', city: 'Mexico City', rent_usd: 800 },
  'Thailand': { flag: '🇹🇭', city: 'Chiang Mai', rent_usd: 600 },
  'Colombia': { flag: '🇨🇴', city: 'Medellín', rent_usd: 650 },
  'Panama': { flag: '🇵🇦', city: 'Panama City', rent_usd: 1200 },
  'Malaysia': { flag: '🇲🇾', city: 'Kuala Lumpur', rent_usd: 700 },
  'Costa Rica': { flag: '🇨🇷', city: 'San José', rent_usd: 1000 },
  'Greece': { flag: '🇬🇷', city: 'Athens', rent_usd: 900 },
  'Italy': { flag: '🇮🇹', city: 'Rome', rent_usd: 1300 },
}

const MULTIPLIER = 1.72

const selectStyle: React.CSSProperties = {
  background: '#12121a',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  borderRadius: 10,
  padding: '12px 16px',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  minWidth: 180,
}

const cardStyle: React.CSSProperties = {
  background: '#12121a',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 20,
  padding: 32,
  marginBottom: 32,
}

export default function SavingsCalculator() {
  const [state, setState] = useState('Florida')
  const [destination, setDestination] = useState('Portugal')

  const usCost = US_STATE_COSTS[state] ?? 3800
  const dest = DESTINATIONS[destination]
  const destCost = Math.round(dest.rent_usd * MULTIPLIER)
  const monthlySavings = usCost - destCost
  const annualSavings = monthlySavings * 12
  const tenYearSavings = annualSavings * 10

  const isPositive = monthlySavings > 0

  return (
    <section
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '80px 20px',
        position: 'relative',
        zIndex: 1,
        background: '#0a0a0a',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#c8f05a', marginBottom: 12, fontWeight: 600 }}>
        ✦ Savings Estimate
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: 12,
        }}
      >
        See How Far Your Retirement Income Could Go
      </h2>
      <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.45)', marginBottom: 40, lineHeight: 1.6 }}>
        Based on average cost of living data. Your actual savings may vary.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'center',
          alignItems: 'flex-end',
          marginBottom: 40,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
          <label style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,237,232,0.45)' }}>
            Current state
          </label>
          <select value={state} onChange={(e) => setState(e.target.value)} style={selectStyle}>
            {Object.keys(US_STATE_COSTS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: 20, fontWeight: 300, paddingBottom: 12 }}>→</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
          <label style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,237,232,0.45)' }}>
            Retire in
          </label>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} style={selectStyle}>
            {Object.entries(DESTINATIONS).map(([country, d]) => (
              <option key={country} value={country}>{d.flag} {country}</option>
            ))}
          </select>
        </div>
      </div>

      {isPositive ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.45)', marginBottom: 24, lineHeight: 1.6 }}>
            Moving from{' '}
            <span style={{ color: '#f0ede8', fontWeight: 600 }}>{state}</span>
            {' '}to{' '}
            <span style={{ color: '#f0ede8', fontWeight: 600 }}>{dest.flag} {dest.city}, {destination}</span>
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 24,
            }}
          >
            {[
              { value: monthlySavings, label: 'per month' },
              { value: annualSavings, label: 'per year' },
              { value: tenYearSavings, label: 'over 10 years' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p
                  style={{
                    fontSize: 'clamp(28px, 4vw, 40px)',
                    fontWeight: 700,
                    color: '#c8f05a',
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  ${value.toLocaleString()}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.45)', marginTop: 6 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.45)', margin: 0, lineHeight: 1.6 }}>
            {dest.flag} {destination} has a similar cost of living to {state}. Try a different destination to see bigger savings.
          </p>
        </div>
      )}

      <a
        href="#quiz"
        style={{
          display: 'inline-block',
          background: '#c8f05a',
          color: '#0a0a0f',
          borderRadius: 50,
          padding: '16px 32px',
          fontWeight: 600,
          fontSize: 14,
          textDecoration: 'none',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Get My Personalized Retirement Analysis →
      </a>
    </section>
  )
}
