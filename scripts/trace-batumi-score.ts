/**
 * One-shot Batumi breakdown: health=5, stability=5 (Very Important).
 * Usage: npx --yes tsx scripts/trace-batumi-score.ts
 */
import { CITIES } from '../lib/recommendation/index'
import {
  computeAppliedWeights,
  computeSubScores,
  rankCities,
  scoreCity,
  type ScoreCityUserInput,
} from '../lib/recommendation/scoreCity'

const userInput: ScoreCityUserInput = {
  monthlyBudget: 2500,
  lifestyle: [],
  priorities: {
    health: 5,
    tax: 3,
    safety: 3,
    housing: 3,
    climate: 3,
    visa_residency: 3,
    expat_community: 2,
    stability: 5,
  },
}

const batumi = CITIES.find((c) => c.name === 'Batumi')!
const result = scoreCity(batumi, userInput)
const ranked = rankCities(CITIES, userInput)
const batumiRank = ranked.findIndex((r) => r.city.name === 'Batumi') + 1
const top5 = ranked.filter((r) => !r.eliminated).slice(0, 5)

console.log('=== Batumi row (live CITIES) ===')
console.log(JSON.stringify(batumi, null, 2))
console.log('')

console.log('=== User input ===')
console.log(JSON.stringify(userInput, null, 2))
console.log('')

console.log('=== Phase 1 — Batumi ===')
console.log(`eliminated: ${result.eliminated}`)
console.log(`eliminationReasons: ${result.eliminationReasons.join(', ') || '(none)'}`)
console.log(`healthcareScore: ${result.healthcareScore} (threshold < 50)`)
console.log(`safetyScore: ${result.safetyScore} (threshold < 40)`)
console.log(`costOfLiving: $${result.costOfLiving} (ceiling $${userInput.monthlyBudget * 1.25})`)
console.log(`stability_score: ${batumi.stability_score} (no Phase-1 elimination rule)`)
console.log('')

if (!result.eliminated && result.subScores && result.appliedWeights) {
  const subs = result.subScores
  const w = result.appliedWeights
  const factors = ['budget', 'healthcare', 'taxes', 'safety', 'housing', 'residency', 'stability', 'climate'] as const
  console.log('=== Phase 2 — per-factor breakdown ===')
  let sum = 0
  for (const k of factors) {
    const contrib = (subs[k] * w[k]) / 100
    sum += contrib
    console.log(
      `${k.padEnd(12)} sub=${String(subs[k]).padStart(3)} × weight=${w[k].toFixed(2)}% → contrib=${contrib.toFixed(2)}`,
    )
  }
  console.log(`TOTAL weighted score: ${sum.toFixed(1)} (reported: ${result.score})`)
  console.log(`expat (informational, 0% weight): ${subs.expat}`)
} else {
  console.log('=== Phase 2 skipped — city eliminated in Phase 1 ===')
  const subs = computeSubScores(batumi, userInput.monthlyBudget, userInput.lifestyle)
  const w = computeAppliedWeights(userInput.priorities, userInput.lifestyle)
  console.log('(Hypothetical Phase 2 if Batumi had survived:)')
  const factors = ['budget', 'healthcare', 'taxes', 'safety', 'housing', 'residency', 'stability', 'climate'] as const
  let sum = 0
  for (const k of factors) {
    const contrib = (subs[k] * w[k]) / 100
    sum += contrib
    console.log(
      `${k.padEnd(12)} sub=${String(subs[k]).padStart(3)} × weight=${w[k].toFixed(2)}% → contrib=${contrib.toFixed(2)}`,
    )
  }
  console.log(`Hypothetical total: ${sum.toFixed(1)}`)
}

console.log('')
console.log(`=== Rank position (all ${CITIES.length} cities) ===`)
console.log(`Batumi rank: #${batumiRank} of ${ranked.length} (${result.eliminated ? 'eliminated' : 'survivor'})`)
console.log('')
console.log('=== Top 5 survivors ===')
for (const r of top5) {
  console.log(`#${ranked.indexOf(r) + 1} ${r.city.name}, ${r.city.country} — score ${r.score}`)
}

console.log('')
console.log('=== OLD DATA scenario (healthcare=6 → score 60, pre-correction) ===')
const oldBatumi = { ...batumi, healthcare: 6 }
const oldResult = scoreCity(oldBatumi, userInput)
const oldRanked = rankCities(
  CITIES.map((c) => (c.name === 'Batumi' ? oldBatumi : c)),
  userInput,
)
const oldPos = oldRanked.findIndex((r) => r.city.name === 'Batumi') + 1
console.log(`eliminated: ${oldResult.eliminated} | reasons: ${oldResult.eliminationReasons.join(', ') || 'none'}`)
console.log(`rank: #${oldPos} | score: ${oldResult.score}`)
if (oldResult.subScores && oldResult.appliedWeights) {
  const s = oldResult.subScores
  const w = oldResult.appliedWeights
  for (const k of ['budget', 'healthcare', 'taxes', 'safety', 'housing', 'residency', 'stability', 'climate'] as const) {
    console.log(`${k.padEnd(12)} sub=${s[k]} × weight=${w[k].toFixed(2)}% → ${((s[k] * w[k]) / 100).toFixed(2)}`)
  }
}
console.log(
  'Top 3:',
  oldRanked
    .filter((r) => !r.eliminated)
    .slice(0, 3)
    .map((r) => `${r.city.name} ${r.score}`)
    .join(', '),
)
