/**
 * Trace: budget=1500, climate=5, expat_community=5, healthcare=5, others=3
 * Usage: npx --yes tsx scripts/trace-sea-priorities.ts
 */
import { CITIES } from '../lib/recommendation/index'
import { rankCities } from '../lib/recommendation/scoreCity'

const userInput = {
  monthlyBudget: 1500,
  priorities: {
    health: 5,
    tax: 3,
    safety: 3,
    housing: 3,
    climate: 5,
    visa_residency: 3,
    expat_community: 5,
    stability: 3,
  },
}

const ranked = rankCities(CITIES, userInput)
const survivors = ranked.filter((r) => !r.eliminated)

console.log('=== Input ===')
console.log(JSON.stringify(userInput, null, 2))
console.log('')
console.log(`Survivors: ${survivors.length} / ${CITIES.length}`)
console.log('')
console.log('=== Top 5 ===')
for (const r of survivors.slice(0, 5)) {
  const c = r.city
  console.log(
    `#${survivors.indexOf(r) + 1} ${c.name}, ${c.country} — score ${r.score} | HC ${r.healthcareScore} | COL $${r.costOfLiving} | climate sub ${r.subScores?.climate} | expat sub ${r.subScores?.expat}`,
  )
}

const sea = ['Thailand', 'Malaysia']
const seaInTop20 = survivors.slice(0, 20).filter((r) => sea.includes(r.city.country))
console.log('')
console.log('=== Thailand/Malaysia in top 20 ===')
for (const r of seaInTop20) {
  console.log(`#${survivors.indexOf(r) + 1} ${r.city.name}, ${r.city.country} — score ${r.score}`)
}
if (seaInTop20.length === 0) console.log('(none)')
