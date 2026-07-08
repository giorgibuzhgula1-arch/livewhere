/**
 * TEMP: Local diagnostic with injected localStorage scenarios.
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://127.0.0.1:3005'
const WATCH_MS = 12000

const scenarios = [
  {
    name: 'clean',
    storage: {},
  },
  {
    name: 'stale_oauth_return',
    storage: { livewhere_oauth_return: '1' },
  },
  {
    name: 'stale_pending_restore',
    storage: { livewhere_pending_auth_restore: '1' },
  },
  {
    name: 'stale_quiz_pending',
    storage: {
      livewhere_pending_auth_restore: '1',
      livewhere_pending_analyze: JSON.stringify({
        monthlyBudget: 2500,
        currency: 'USD',
        priorities: { tax: 4, housing: 4, climate: 3, health: 3, stability: 3, safety: 4, expat_community: 3, visa_residency: 3 },
        lifestyle: ['beach_life'],
      }),
      livewhere_pending_results: JSON.stringify({
        cities: [{ name: 'Lisbon', country: 'Portugal', score: 80, monthlyCost: 2000, monthlySavings: 500, locked: false }],
        maxCities: 12,
      }),
    },
  },
]

async function runScenario(browser, scenario) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const logs = []

  page.on('console', (msg) => {
    const text = msg.text()
    if (
      text.includes('quiz-auth') ||
      text.includes('HomePageClient mount')
    ) {
      logs.push({ at: Date.now(), text: text.slice(0, 1500) })
    }
  })

  await context.addInitScript((storage) => {
    for (const [k, v] of Object.entries(storage)) {
      localStorage.setItem(k, v)
      sessionStorage.setItem(k, v)
    }
  }, scenario.storage)

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(WATCH_MS)

  const mountLogs = logs.filter((l) => l.text.includes('HomePageClient mount'))
  const restoreMounts = logs.filter((l) => l.text.includes('restore useEffect mount'))
  const authUi = logs.filter((l) => l.text.includes('auth UI state changed'))
  const mountIds = new Set()
  for (const l of mountLogs) {
    const m = l.text.match(/mountId["\s:]+(\d+)/)
    if (m) mountIds.add(Number(m[1]))
  }

  const storageAfter = await page.evaluate(() => ({
    livewhere_oauth_return: localStorage.getItem('livewhere_oauth_return'),
    livewhere_pending_auth_restore: localStorage.getItem('livewhere_pending_auth_restore'),
    livewhere_pending_results: localStorage.getItem('livewhere_pending_results') ? 'present' : null,
    livewhere_pending_analyze: localStorage.getItem('livewhere_pending_analyze') ? 'present' : null,
  }))

  await context.close()

  return {
    scenario: scenario.name,
    injected: scenario.storage,
    mountLogCount: mountLogs.length,
    uniqueMountIds: [...mountIds],
    restoreMountCount: restoreMounts.length,
    authUiChangeCount: authUi.length,
    storageAfter,
    sampleLogs: logs.slice(0, 8).map((l) => l.text.slice(0, 200)),
  }
}

const browser = await chromium.launch({ headless: true })
const results = []
for (const scenario of scenarios) {
  results.push(await runScenario(browser, scenario))
}
await browser.close()
console.log(JSON.stringify(results, null, 2))
