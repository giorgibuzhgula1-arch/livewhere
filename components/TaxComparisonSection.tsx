'use client'

import { pickDecisionPlan } from '@/components/BlueprintDecisionSection'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'
import type { CityResult } from '@/lib/types'
import type { SavedRetirementPlan } from '@/lib/saved-plans'

type Props = {
  plans: SavedRetirementPlan[]
}

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '20px 22px',
} as const

function unlockedCities(plan: SavedRetirementPlan): CityResult[] {
  return plan.city_results.filter((city) => !city.locked)
}

function citiesByTaxRate(cities: CityResult[]): CityResult[] {
  return [...cities].sort((a, b) => a.taxRate - b.taxRate)
}

function buildTaxTakeaway(cities: CityResult[]): string {
  if (cities.length === 0) return ''
  if (cities.length === 1) {
    const city = cities[0]
    return `${city.name} has a tax rate of ${city.taxRate}% among your saved matches.`
  }

  const sorted = citiesByTaxRate(cities)
  const lowest = sorted[0]
  const highest = sorted[sorted.length - 1]

  if (lowest.taxRate === highest.taxRate) {
    return `All ${cities.length} of your matches share the same effective tax rate of ${lowest.taxRate}%.`
  }

  return `${lowest.name} offers the lowest tax burden among your matches at ${lowest.taxRate}%, compared to ${highest.name} at ${highest.taxRate}%.`
}

export default function TaxComparisonSection({ plans }: Props) {
  const plan = pickDecisionPlan(plans)
  if (!plan) return null

  const cities = citiesByTaxRate(unlockedCities(plan))
  if (cities.length === 0) return null

  const takeaway = buildTaxTakeaway(cities)

  return (
    <section style={{ marginBottom: 40, maxWidth: 720 }}>
      <h2
        style={{
          fontFamily: fontFamilySerif,
          fontSize: 'clamp(22px, 3vw, 30px)',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#f0ede8',
          margin: '0 0 8px',
        }}
      >
        Tax Comparison
      </h2>
      <p
        style={{
          fontFamily: fontFamilySans,
          fontSize: 13,
          color: 'rgba(240,237,232,0.45)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}
      >
        Effective tax rates across your {plan.name} matches — lowest to highest.
      </p>

      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              minWidth: 360,
              borderCollapse: 'collapse',
              fontFamily: fontFamilySans,
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                {['City', 'Country', 'Tax Rate'].map((label) => (
                  <th
                    key={label}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(240,237,232,0.45)',
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((city, index) => {
                const isLowest = index === 0 && cities.length > 1
                return (
                  <tr key={`${city.name}-${city.country}`}>
                    <td
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        color: isLowest ? '#c8f05a' : '#f0ede8',
                        fontWeight: isLowest ? 600 : 400,
                      }}
                    >
                      <span style={{ marginRight: 8 }} aria-hidden>
                        {city.flag}
                      </span>
                      {city.name}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(240,237,232,0.75)',
                      }}
                    >
                      {city.country}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        color: isLowest ? '#c8f05a' : '#f0ede8',
                        fontWeight: 600,
                      }}
                    >
                      {city.taxRate}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p
          style={{
            fontFamily: fontFamilySans,
            fontSize: 14,
            lineHeight: 1.6,
            color: 'rgba(240,237,232,0.65)',
            margin: '16px 0 0',
          }}
        >
          {takeaway}
        </p>
      </div>
    </section>
  )
}
