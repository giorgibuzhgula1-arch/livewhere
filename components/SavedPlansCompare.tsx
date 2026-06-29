'use client'

import type { SavedRetirementPlan } from '@/lib/saved-plans'

function fmtUsd(n: number, currency = 'USD'): string {
  const sym: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' }
  return (sym[currency] || '$') + n.toLocaleString()
}

type Props = {
  planA: SavedRetirementPlan
  planB: SavedRetirementPlan
}

export default function SavedPlansCompare({ planA, planB }: Props) {
  const currencyA = planA.quiz_input.currency || 'USD'
  const currencyB = planB.quiz_input.currency || 'USD'
  const rows = Math.min(Math.max(planA.city_results.length, planB.city_results.length, 5), 12)

  return (
    <div
      style={{
        marginTop: 28,
        background: '#12121a',
        border: '1px solid rgba(200,240,90,0.25)',
        borderRadius: 18,
        padding: 24,
        overflowX: 'auto',
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
        Plan comparison
      </p>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        {planA.name} vs {planB.name}
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 20,
          fontSize: 13,
          color: 'rgba(240,237,232,0.65)',
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, color: '#f0ede8', marginBottom: 6 }}>{planA.name}</div>
          <div>Budget: {fmtUsd(planA.quiz_input.monthlyBudget, currencyA)}/mo</div>
          <div>Top match: {planA.city_results[0]?.name ?? '—'} ({planA.city_results[0]?.score ?? '—'})</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, color: '#f0ede8', marginBottom: 6 }}>{planB.name}</div>
          <div>Budget: {fmtUsd(planB.quiz_input.monthlyBudget, currencyB)}/mo</div>
          <div>Top match: {planB.city_results[0]?.name ?? '—'} ({planB.city_results[0]?.score ?? '—'})</div>
        </div>
      </div>

      <table
        style={{
          width: '100%',
          minWidth: 520,
          borderCollapse: 'collapse',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>{planA.name}</th>
            <th style={thStyle}>{planB.name}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => {
            const cityA = planA.city_results[i]
            const cityB = planB.city_results[i]
            return (
              <tr key={i}>
                <td style={tdStyle}>{i + 1}</td>
                <td style={tdStyle}>
                  {cityA ? (
                    <>
                      {cityA.flag} {cityA.name} — {cityA.score}
                      <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.45)', marginTop: 4 }}>
                        {fmtUsd(cityA.monthlyCost, currencyA)}/mo
                      </div>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={tdStyle}>
                  {cityB ? (
                    <>
                      {cityB.flag} {cityB.name} — {cityB.score}
                      <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.45)', marginTop: 4 }}>
                        {fmtUsd(cityB.monthlyCost, currencyB)}/mo
                      </div>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(240,237,232,0.45)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const tdStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  verticalAlign: 'top',
  color: 'rgba(240,237,232,0.88)',
}
