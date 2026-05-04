'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import CityCard from './CityCard'
import CityModal from './CityModal'
import { CityResult } from '@/lib/types'

interface Props {
  cities: CityResult[]
  onReset: () => void
}

const CONTINENTS = ['all', 'Europe', 'Americas', 'Asia', 'Other']

export default function Results({ cities, onReset }: Props) {
  const [filter, setFilter] = useState('all')
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null)

  const filtered = filter === 'all' ? cities : cities.filter(c => c.continent === filter)
  const top = cities[0]

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 20px 80px', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700 }}>
          Top matches <span style={{ color: '#c8f05a' }}>for you</span>
        </h2>
        <button onClick={onReset} style={{
          background: '#1a1a26', border: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(240,237,232,0.45)', padding: '10px 18px', borderRadius: 10,
          fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
        }}>
          ← New search
        </button>
      </div>

      {/* AI Insight */}
      {top && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(200,240,90,0.04)', border: '1px solid rgba(200,240,90,0.15)',
            borderRadius: 16, padding: 24, marginBottom: 28, display: 'flex', gap: 16
          }}
        >
          <div style={{
            width: 36, height: 36, background: 'rgba(200,240,90,0.15)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
          }}>✦</div>
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>
            <strong style={{ color: '#c8f05a' }}>{top.flag} {top.name}</strong> is your #1 match.{' '}
            {top.aiInsight}
          </p>
        </motion.div>
      )}

      {/* Continent filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {CONTINENTS.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              background: filter === c ? 'rgba(200,240,90,0.1)' : '#1a1a26',
              border: filter === c ? '1px solid #c8f05a' : '1px solid rgba(255,255,255,0.07)',
              color: filter === c ? '#c8f05a' : 'rgba(240,237,232,0.45)',
            }}>
            {c === 'all' ? '🌍 All' : c === 'Europe' ? '🇪🇺 Europe' : c === 'Americas' ? '🌎 Americas' : c === 'Asia' ? '🌏 Asia' : '🌐 Other'}
          </button>
        ))}
      </div>

      {/* Cities grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {filtered.map((city, i) => (
          <motion.div
            key={city.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <CityCard city={city} rank={i + 1} onClick={() => setSelectedCity(city)} />
          </motion.div>
        ))}
      </div>

      {selectedCity && (
        <CityModal city={selectedCity} onClose={() => setSelectedCity(null)} />
      )}
    </section>
  )
}
