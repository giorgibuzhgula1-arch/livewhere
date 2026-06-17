'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CityResult } from '@/lib/types'
import VisaAnalysis from './VisaAnalysis'

interface Props {
  city: CityResult
  onClose: () => void
  monthlyBudget?: number
  currency?: string
  lifestyle?: string[]
}

function fmt(n: number) { return '$' + n.toLocaleString() }
function getColor(s: number) { return s >= 80 ? '#c8f05a' : s >= 65 ? '#f0c85a' : '#f05a8c' }

export default function CityModal({ city, onClose, monthlyBudget, lifestyle }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            background: '#12121a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 24, maxWidth: 600, width: '100%',
            maxHeight: '90vh', overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 48 }}>{city.flag}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginTop: 8 }}>{city.name}</div>
              <div style={{ color: 'rgba(240,237,232,0.45)', fontSize: 14, marginTop: 4 }}>{city.country} · {city.continent}</div>
            </div>
            <button onClick={onClose} style={{
              background: '#1a1a26', border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(240,237,232,0.45)', width: 36, height: 36, borderRadius: 10,
              cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>

          <div style={{ padding: 32 }}>
            {/* Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { num: city.score, label: 'Match', color: getColor(city.score) },
                { num: city.scores.climate, label: 'Climate', color: getColor(city.scores.climate) },
                { num: city.scores.safety, label: 'Safety', color: getColor(city.scores.safety) },
                { num: city.scores.stability, label: 'Stability', color: getColor(city.scores.stability) },
              ].map(({ num, label, color }) => (
                <div key={label} style={{ background: '#1a1a26', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color }}>{num}</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* AI Insight */}
            <div style={{
              background: 'rgba(200,240,90,0.04)', border: '1px solid rgba(200,240,90,0.15)',
              borderRadius: 12, padding: '14px 18px', marginBottom: 24,
              fontSize: 14, lineHeight: 1.7, color: 'rgba(240,237,232,0.8)'
            }}>
              {city.aiInsight}
            </div>

            {/* Finance */}
            <div style={{ background: 'rgba(200,240,90,0.04)', border: '1px solid rgba(200,240,90,0.15)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#c8f05a', marginBottom: 16, fontWeight: 600 }}>
                💰 Financial Breakdown
              </div>
              {[
                { key: 'Effective tax rate', val: `${city.taxRate}%`, vc: undefined },
                { key: 'Take-home / month', val: fmt(city.takeHomeMonthly), vc: '#c8f05a' },
                { key: 'Monthly living costs', val: `- ${fmt(city.monthlyCost)}`, vc: '#f05a8c' },
                { key: 'Monthly savings', val: `${city.monthlySavings > 0 ? '+' : ''}${fmt(city.monthlySavings)}`, vc: city.monthlySavings > 0 ? '#c8f05a' : '#f05a8c' },
              ].map(({ key, val, vc }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 14 }}>
                  <span style={{ color: 'rgba(240,237,232,0.45)' }}>{key}</span>
                  <span style={{ fontWeight: 600, color: vc }}>{val}</span>
                </div>
              ))}
              {city.visa && (
                <div style={{ paddingTop: 10 }}>
                  <div style={{ color: 'rgba(240,237,232,0.45)', fontSize: 14, marginBottom: 6 }}>Visa situation</div>
                  <p style={{
                    fontSize: 13, lineHeight: 1.6, margin: 0,
                    fontWeight: 400, color: 'rgba(203,213,225,0.95)',
                  }}>
                    {city.visa}
                  </p>
                </div>
              )}
            </div>

            {/* Pros & Cons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#1a1a26', borderRadius: 14, padding: 18, borderTop: '2px solid #c8f05a' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#c8f05a', marginBottom: 12 }}>✓ Pros</div>
                {city.pros.map(p => (
                  <div key={p} style={{ fontSize: 13, color: 'rgba(240,237,232,0.6)', padding: '5px 0', display: 'flex', gap: 8, lineHeight: 1.4 }}>
                    <span style={{ color: '#c8f05a', fontWeight: 700, flexShrink: 0 }}>✓</span> {p}
                  </div>
                ))}
              </div>
              <div style={{ background: '#1a1a26', borderRadius: 14, padding: 18, borderTop: '2px solid #f05a8c' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#f05a8c', marginBottom: 12 }}>✗ Cons</div>
                {city.cons.map(c => (
                  <div key={c} style={{ fontSize: 13, color: 'rgba(240,237,232,0.6)', padding: '5px 0', display: 'flex', gap: 8, lineHeight: 1.4 }}>
                    <span style={{ color: '#f05a8c', fontWeight: 700, flexShrink: 0 }}>✗</span> {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Visa Analysis */}
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <VisaAnalysis city={city} monthlyBudget={monthlyBudget} lifestyle={lifestyle} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
