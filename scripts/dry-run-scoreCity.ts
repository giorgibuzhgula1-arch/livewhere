/**
 * Isolated dry run for lib/recommendation/scoreCity.ts — not wired to /api/analyze.
 *
 * Usage: npx --yes tsx scripts/dry-run-scoreCity.ts
 */
import { CITIES } from '../lib/recommendation/index'
import { rankCities, type ScoreCityUserInput } from '../lib/recommendation/scoreCity'

const userInput: ScoreCityUserInput = {
  monthlyBudget: 2500,
  lifestyle: [],
  priorities: {
    health: 5,
    tax: 5,
    safety: 3,
    housing: 3,
    climate: 2,
    visa_residency: 3,
    expat_community: 2,
    stability: 3,
  },
}

const ranked = rankCities(CITIES, userInput)
const survivors = ranked.filter((r) => !r.eliminated)
const eliminated = ranked.filter((r) => r.eliminated)

console.log('=== User input ===')
console.log(JSON.stringify(userInput, null, 2))
console.log('')
console.log(`Total cities: ${CITIES.length}`)
console.log(`Survivors: ${survivors.length}`)
console.log(`Eliminated: ${eliminated.length}`)
console.log('')

console.log('=== Top 5 (survivors) ===')
for (const r of survivors.slice(0, 5)) {
  console.log(
    `${r.city.name}, ${r.city.country} — score ${r.score} | COL $${r.costOfLiving} | residency ${r.residencyScore}${r.veryHardResidency ? ' (very_hard_residency)' : ''}`,
  )
  console.log(`  sub-scores: ${JSON.stringify(r.subScores)}`)
  console.log(`  weights: ${JSON.stringify(r.appliedWeights)}`)
}

console.log('')
console.log('=== Elimination breakdown ===')
const byReason: Record<string, number> = {}
for (const r of eliminated) {
  for (const reason of r.eliminationReasons) {
    byReason[reason] = (byReason[reason] ?? 0) + 1
  }
}
console.log(byReason)

console.log('')
console.log('=== Sample eliminated (first 5) ===')
for (const r of eliminated.slice(0, 5)) {
  console.log(
    `${r.city.name}, ${r.city.country} — ${r.eliminationReasons.join(', ')} | COL $${r.costOfLiving} health ${r.healthcareScore} safety ${r.safetyScore}`,
  )
}
