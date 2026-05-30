'use client'

import { CityResult } from '@/lib/types'
import {
  getVisaInfoForCountry,
  recommendVisa,
  difficultyColor,
  visaScoreColor,
  type VisaOption,
} from '@/lib/visa-data'

interface Props {
  city: CityResult
  /** Net monthly income estimate used to tailor the recommendation. */
  monthlyIncome?: number
  lifestyle?: string[]
}

function typeChipColor(type: VisaOption['type']): string {
  if (type === 'Digital Nomad Visa') return '#c8f05a'
  if (type === 'Residency') return '#5af0c8'
  return '#7ab3ff'
}

function VisaOptionCard({ option }: { option: VisaOption }) {
  const diffColor = difficultyColor(option.difficulty)
  const chipColor = typeChipColor(option.type)
  return (
    <div style={{ background: '#1a1a26', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f0ede8', lineHeight: 1.3 }}>{option.name}</div>
          <span style={{
            display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 600,
            color: chipColor, background: `${chipColor}1f`, border: `1px solid ${chipColor}55`,
            padding: '3px 10px', borderRadius: 20,
          }}>
            {option.type}
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#0a0a0f', background: diffColor,
          padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0,
        }}>
          {option.difficulty}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Processing', val: option.processingTime },
          { label: 'Cost', val: option.cost },
          { label: 'Min. income', val: option.minIncomeMonthly ? `$${option.minIncomeMonthly.toLocaleString()}/mo` : 'None' },
          { label: 'Duration', val: option.duration },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8' }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        Requirements
      </div>
      <div>
        {option.requirements.map((req) => (
          <div key={req} style={{ fontSize: 12.5, color: 'rgba(240,237,232,0.6)', padding: '3px 0', display: 'flex', gap: 8, lineHeight: 1.4 }}>
            <span style={{ color: diffColor, fontWeight: 700, flexShrink: 0 }}>✓</span> {req}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VisaAnalysis({ city, monthlyIncome, lifestyle }: Props) {
  const info = getVisaInfoForCountry(city.country)

  if (!info) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#c8f05a', marginBottom: 8, fontWeight: 600 }}>
          🛂 Visa Analysis
        </div>
        <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.6)', lineHeight: 1.6 }}>
          Detailed visa data for {city.country} is coming soon. In the meantime: {city.visa || 'check official immigration sources for nomad, work, or residency options.'}
        </p>
      </div>
    )
  }

  const recommendation = recommendVisa(info, monthlyIncome, lifestyle)
  const scoreColor = visaScoreColor(info.visaScore)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#c8f05a', fontWeight: 600 }}>
          🛂 Visa Analysis
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Visa access</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: scoreColor }}>{info.visaScore}</span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.55)', lineHeight: 1.6, marginBottom: 18 }}>
        {info.summary}
      </p>

      {recommendation && (
        <div style={{
          background: 'rgba(200,240,90,0.04)', border: '1px solid rgba(200,240,90,0.18)',
          borderRadius: 14, padding: 16, marginBottom: 18, display: 'flex', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: 'rgba(200,240,90,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}>✦</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#c8f05a', marginBottom: 4 }}>
              Recommended: {recommendation.option.name}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(240,237,232,0.8)' }}>
              {recommendation.reason}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {info.options.map((option) => (
          <VisaOptionCard key={option.name} option={option} />
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)', marginTop: 14, lineHeight: 1.5 }}>
        Estimates for remote workers — not legal advice. Always confirm with official immigration sources.
      </p>
    </div>
  )
}
