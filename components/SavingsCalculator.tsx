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
    <section className="py-16 px-4 bg-[#0a0a0a] border-y border-white/10">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">✦ Savings Estimate</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          See How Far Your Retirement Income Could Go
        </h2>
        <p className="text-white/50 mb-10 text-sm">
          Based on average cost of living data. Your actual savings may vary.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs text-white/40 uppercase tracking-widest">Current state</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/30"
            >
              {Object.keys(US_STATE_COSTS).map(s => (
                <option key={s} value={s} className="bg-[#111]">{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end pb-3 text-white/30 text-xl font-light">→</div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs text-white/40 uppercase tracking-widest">Retire in</label>
            <select
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/30"
            >
              {Object.entries(DESTINATIONS).map(([country, d]) => (
                <option key={country} value={country} className="bg-[#111]">{d.flag} {country}</option>
              ))}
            </select>
          </div>
        </div>

        {isPositive ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
            <p className="text-white/50 text-sm mb-6">
              Moving from <span className="text-white font-medium">{state}</span> to <span className="text-white font-medium">{dest.flag} {dest.city}, {destination}</span>
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-emerald-400">
                  ${monthlySavings.toLocaleString()}
                </p>
                <p className="text-white/40 text-xs mt-1">per month</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-emerald-400">
                  ${annualSavings.toLocaleString()}
                </p>
                <p className="text-white/40 text-xs mt-1">per year</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-emerald-400">
                  ${tenYearSavings.toLocaleString()}
                </p>
                <p className="text-white/40 text-xs mt-1">over 10 years</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
            <p className="text-white/50 text-sm">
              {dest.flag} {destination} has a similar cost of living to {state}. Try a different destination to see bigger savings.
            </p>
          </div>
        )}

        <a
          href="#quiz"
          className="inline-block bg-white text-black font-semibold px-8 py-4 rounded-full hover:bg-white/90 transition-colors text-sm"
        >
          Get My Personalized Retirement Analysis →
        </a>
      </div>
    </section>
  )
}
