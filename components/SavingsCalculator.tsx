'use client'
import { useState } from 'react'

const COUNTRY_LOCATIONS = ['United Kingdom', 'Australia', 'Canada'] as const

// Monthly cost of living ($) by location — US states scaled from BLS Consumer Expenditure Survey
// 2024 national average (~$6,545/mo per consumer unit) via MERIC/C2ER 2025 state index
// (national average = 100), normalized to single-retiree household baseline (~$3,720 at index 100).
const US_STATE_COSTS: Record<string, number> = {
  'United Kingdom': 3500,
  'Australia': 3800,
  'Canada': 3200,
  'Alabama': 3300,
  'Alaska': 4600,
  'Arizona': 3700,
  'Arkansas': 3300,
  'California': 5200,
  'Colorado': 4300,
  'Connecticut': 5000,
  'Delaware': 3800,
  'Florida': 3800,
  'Georgia': 3500,
  'Hawaii': 6900,
  'Idaho': 3700,
  'Illinois': 4100,
  'Indiana': 3000,
  'Iowa': 3300,
  'Kansas': 3300,
  'Kentucky': 3400,
  'Louisiana': 3400,
  'Maine': 4100,
  'Maryland': 4600,
  'Massachusetts': 5100,
  'Michigan': 3400,
  'Minnesota': 3900,
  'Mississippi': 3200,
  'Missouri': 3000,
  'Montana': 3600,
  'Nebraska': 3400,
  'Nevada': 3600,
  'New Hampshire': 4100,
  'New Jersey': 5400,
  'New Mexico': 3500,
  'New York': 5800,
  'North Carolina': 3400,
  'North Dakota': 3400,
  'Ohio': 3200,
  'Oklahoma': 3200,
  'Oregon': 4200,
  'Pennsylvania': 3800,
  'Rhode Island': 4100,
  'South Carolina': 3500,
  'South Dakota': 3400,
  'Tennessee': 3100,
  'Texas': 3600,
  'Utah': 3800,
  'Vermont': 4100,
  'Virginia': 4400,
  'Washington': 4800,
  'West Virginia': 3300,
  'Wisconsin': 3500,
  'Wyoming': 3500,
}

const DESTINATIONS: Record<string, { flag: string; city: string; rent_usd: number }> = {
  'Belize': { flag: String.fromCodePoint(0x1f1e7, 0x1f1ff), city: 'Belize City', rent_usd: 900 },
  'Colombia': { flag: String.fromCodePoint(0x1f1e8, 0x1f1f4), city: 'Medellín', rent_usd: 650 },
  'Costa Rica': { flag: String.fromCodePoint(0x1f1e8, 0x1f1f7), city: 'San José', rent_usd: 1000 },
  'Croatia': { flag: String.fromCodePoint(0x1f1ed, 0x1f1f7), city: 'Split', rent_usd: 800 },
  'Czech Republic': { flag: String.fromCodePoint(0x1f1e8, 0x1f1ff), city: 'Prague', rent_usd: 1100 },
  'Ecuador': { flag: String.fromCodePoint(0x1f1ea, 0x1f1e8), city: 'Cuenca', rent_usd: 650 },
  'France': { flag: String.fromCodePoint(0x1f1eb, 0x1f1f7), city: 'Nice', rent_usd: 1800 },
  'Germany': { flag: String.fromCodePoint(0x1f1e9, 0x1f1ea), city: 'Munich', rent_usd: 1900 },
  'Greece': { flag: String.fromCodePoint(0x1f1ec, 0x1f1f7), city: 'Athens', rent_usd: 900 },
  'Italy': { flag: String.fromCodePoint(0x1f1ee, 0x1f1f9), city: 'Rome', rent_usd: 1300 },
  'Malaysia': { flag: String.fromCodePoint(0x1f1f2, 0x1f1fe), city: 'Kuala Lumpur', rent_usd: 700 },
  'Mexico': { flag: String.fromCodePoint(0x1f1f2, 0x1f1fd), city: 'Mexico City', rent_usd: 800 },
  'Montenegro': { flag: String.fromCodePoint(0x1f1f2, 0x1f1ea), city: 'Kotor', rent_usd: 750 },
  'Panama': { flag: String.fromCodePoint(0x1f1f5, 0x1f1e6), city: 'Panama City', rent_usd: 1200 },
  'Philippines': { flag: String.fromCodePoint(0x1f1f5, 0x1f1ed), city: 'Cebu', rent_usd: 500 },
  'Portugal': { flag: String.fromCodePoint(0x1f1f5, 0x1f1f9), city: 'Lisbon', rent_usd: 1100 },
  'Spain': { flag: String.fromCodePoint(0x1f1ea, 0x1f1f8), city: 'Barcelona', rent_usd: 1400 },
  'Thailand': { flag: String.fromCodePoint(0x1f1f9, 0x1f1ed), city: 'Chiang Mai', rent_usd: 600 },
  'Uruguay': { flag: String.fromCodePoint(0x1f1fa, 0x1f1fe), city: 'Montevideo', rent_usd: 1100 },
  'Vietnam': { flag: String.fromCodePoint(0x1f1fb, 0x1f1f3), city: 'Da Nang', rent_usd: 550 },
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

const flagStyle: React.CSSProperties = {
  fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", emoji',
  fontStyle: 'normal',
}

function Flag({ flag }: { flag: string }) {
  return <span style={flagStyle}>{flag}</span>
}

export default function SavingsCalculator({
  defaultLocation = 'Florida',
}: {
  defaultLocation?: string
}) {
  const resolvedDefault = US_STATE_COSTS[defaultLocation] ? defaultLocation : 'Florida'
  const [state, setState] = useState(resolvedDefault)
  const [destination, setDestination] = useState('Portugal')
  const [destOpen, setDestOpen] = useState(false)

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
            Current location
          </label>
          <select value={state} onChange={(e) => setState(e.target.value)} style={selectStyle}>
            {COUNTRY_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
            <option disabled>──────────────</option>
            {Object.keys(US_STATE_COSTS)
              .filter((s) => !COUNTRY_LOCATIONS.includes(s as (typeof COUNTRY_LOCATIONS)[number]))
              .sort((a, b) => a.localeCompare(b))
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
        </div>

        <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: 20, fontWeight: 300, paddingBottom: 12 }}>→</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
          <label style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(240,237,232,0.45)' }}>
            Retire in
          </label>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setDestOpen((open) => !open)}
              style={{ ...selectStyle, textAlign: 'left' }}
            >
              <Flag flag={dest.flag} /> {destination}
            </button>
            {destOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: '#12121a',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  maxHeight: 240,
                  overflowY: 'auto',
                  zIndex: 10,
                }}
              >
                {Object.entries(DESTINATIONS).map(([country, d]) => (
                  <div
                    key={country}
                    role="option"
                    aria-selected={country === destination}
                    onClick={() => {
                      setDestination(country)
                      setDestOpen(false)
                    }}
                    style={{
                      padding: '12px 16px',
                      fontSize: 14,
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#fff',
                      cursor: 'pointer',
                      background: country === destination ? 'rgba(200,240,90,0.1)' : 'transparent',
                    }}
                  >
                    <Flag flag={d.flag} /> {country}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isPositive ? (
        <div style={cardStyle}>
          <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.45)', marginBottom: 24, lineHeight: 1.6 }}>
            Moving from{' '}
            <span style={{ color: '#f0ede8', fontWeight: 600 }}>{state}</span>
            {' '}to{' '}
            <span style={{ color: '#f0ede8', fontWeight: 600 }}><Flag flag={dest.flag} /> {dest.city}, {destination}</span>
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
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 700,
              lineHeight: 1.1,
              margin: '32px 0 0',
              textAlign: 'center',
              color: '#f0ede8',
            }}
          >
            What Could An Extra $228,960 Mean For Your Retirement?
          </h3>
        </div>
      ) : (
        <div style={cardStyle}>
          <p style={{ fontSize: 14, color: 'rgba(240,237,232,0.45)', margin: 0, lineHeight: 1.6 }}>
            <Flag flag={dest.flag} /> {destination} has a similar cost of living to {state}. Try a different destination to see bigger savings.
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
