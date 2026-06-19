'use client'

import { CityResult } from '@/lib/types'
import {
  tenYearProjection,
  riskAssessment,
  wealthPreservation,
  type RiskLevel,
} from '@/lib/retirement-projections'

interface Props {
  cities: CityResult[]
  budget: number
}

function fmtUsd(n: number): string {
  return `$${n.toLocaleString()}`
}

function riskColor(level: RiskLevel): string {
  if (level === 'Low') return '#c8f05a'
  if (level === 'Medium') return '#f0c85a'
  return '#f05a8c'
}

function cityKey(city: CityResult): string {
  return `${city.name}|${city.country}`
}

export default function LifetimeInsights({ cities, budget }: Props) {
  if (cities.length === 0) return null

  return (
    <div style={{ marginTop: 32 }}>
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
        Blueprint exclusive
      </div>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        Lifetime retirement insights
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {cities.map((city) => {
          const projection = tenYearProjection(city, budget)
          const risk = riskAssessment(city)
          const wealth = wealthPreservation(city, budget)

          return (
            <div
              key={cityKey(city)}
              style={{
                background: '#12121a',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 18,
                padding: 24,
              }}
            >
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{city.flag}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{city.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)' }}>{city.country}</div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                <InsightBlock title="10-Year Projection" icon="📈">
                  <Metric label="Total accumulated savings" value={fmtUsd(projection.totalAccumulatedSavings)} />
                  <Metric label="Average monthly savings" value={fmtUsd(projection.averageMonthlySavings)} />
                  <Metric label="Final monthly savings" value={fmtUsd(projection.finalMonthlySavings)} />
                  <p style={footnoteStyle}>Assumes 2% annual cost-of-living increase over 120 months.</p>
                </InsightBlock>

                <InsightBlock title="Risk Assessment" icon="⚖️">
                  <div style={{ marginBottom: 12 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        color: riskColor(risk.level),
                        background: `${riskColor(risk.level)}18`,
                        border: `1px solid ${riskColor(risk.level)}55`,
                        padding: '4px 10px',
                        borderRadius: 20,
                      }}
                    >
                      {risk.level} risk
                    </span>
                  </div>
                  <Metric label="Political stability" value={`${risk.politicalStability}/100`} />
                  <Metric label="Healthcare index" value={`${risk.healthcareIndex}/100`} />
                  <Metric label="Currency risk" value={`${risk.currencyRisk}/100`} />
                  <Metric label="Visa permanence" value={`${risk.visaPermanence}/100`} />
                </InsightBlock>

                <InsightBlock title="Wealth Preservation" icon="💎">
                  <Metric label="Preservation score" value={`${wealth.preservationScore}/100`} highlight />
                  <Metric
                    label="Tax drag vs US baseline"
                    value={`${wealth.taxDragVsUsMonthly >= 0 ? '+' : ''}${fmtUsd(Math.abs(wealth.taxDragVsUsMonthly))}/mo`}
                  />
                  <Metric label="US baseline tax" value={`${wealth.usBaselineTaxRate}%`} />
                  <Metric label="Destination tax" value={`${wealth.destinationTaxRate}%`} />
                </InsightBlock>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InsightBlock({
  title,
  icon,
  children,
}: {
  title: string
  icon: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#1a1a26',
        borderRadius: 14,
        padding: 18,
        borderTop: '2px solid rgba(200,240,90,0.35)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: '#c8f05a',
          marginBottom: 14,
        }}
      >
        {icon} {title}
      </div>
      {children}
    </div>
  )
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: 'rgba(240,237,232,0.45)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: highlight ? '#c8f05a' : '#f0ede8', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const footnoteStyle = {
  fontSize: 11,
  color: 'rgba(240,237,232,0.38)',
  marginTop: 10,
  marginBottom: 0,
  lineHeight: 1.5,
} as const
