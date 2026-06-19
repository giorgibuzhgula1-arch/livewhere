'use client'

import { CityResult } from '@/lib/types'
import { visaScoreForCountry } from '@/lib/visa-data'

interface Props {
  cities: CityResult[]
  currency?: string
}

function fmt(n: number, currency = 'USD'): string {
  const sym: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' }
  return (sym[currency] || '$') + n.toLocaleString()
}

function cityKey(city: CityResult): string {
  return `${city.name}|${city.country}`
}

const ROWS: Array<{
  label: string
  value: (city: CityResult, currency: string) => string
}> = [
  { label: 'City', value: (city) => city.name },
  { label: 'Country', value: (city) => city.country },
  { label: 'Match score', value: (city) => String(city.score) },
  {
    label: 'Monthly cost',
    value: (city, currency) => fmt(city.monthlyCost, currency),
  },
  {
    label: 'Monthly savings',
    value: (city, currency) =>
      `${city.monthlySavings >= 0 ? '+' : '-'}${fmt(Math.abs(city.monthlySavings), currency)}`,
  },
  { label: 'Tax rate', value: (city) => `${city.taxRate}%` },
  {
    label: 'Visa difficulty',
    value: (city) => {
      const score = visaScoreForCountry(city.country)
      return score != null ? `${score}/100` : 'N/A'
    },
  },
  { label: 'Safety score', value: (city) => String(city.scores.safety) },
]

export default function CityComparison({ cities, currency = 'USD' }: Props) {
  if (cities.length < 2) return null

  return (
    <div
      style={{
        marginTop: 32,
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: 'rgba(240,237,232,0.45)',
          marginBottom: 8,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
        }}
      >
        City comparison
      </div>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        Side-by-side overview
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            minWidth: 480,
            borderCollapse: 'collapse',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(240,237,232,0.45)',
                  fontWeight: 600,
                  width: 160,
                }}
              >
                Metric
              </th>
              {cities.map((city) => (
                <th
                  key={cityKey(city)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    color: '#c8f05a',
                    fontWeight: 700,
                    minWidth: 140,
                  }}
                >
                  <span style={{ marginRight: 8 }}>{city.flag}</span>
                  {city.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(240,237,232,0.45)',
                    fontWeight: 600,
                    verticalAlign: 'top',
                  }}
                >
                  {row.label}
                </td>
                {cities.map((city) => (
                  <td
                    key={`${cityKey(city)}-${row.label}`}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      color: '#f0ede8',
                      verticalAlign: 'top',
                    }}
                  >
                    {row.value(city, currency)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
