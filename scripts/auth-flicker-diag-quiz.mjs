/**
 * TEMP: Quiz submit flow — watch auth UI oscillation + remount count.
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://127.0.0.1:3010'
const WATCH_MS = 20000

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const logs = []

page.on('console', (msg) => {
  const text = msg.text()
  if (text.includes('quiz-auth') || text.includes('HomePageClient mount')) {
    logs.push({ at: Date.now(), text: text.slice(0, 1800) })
  }
})

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(2000)

const analyzeBtn = page.getByRole('button', { name: /Analyze & Find My Countries/i })
await analyzeBtn.scrollIntoViewIfNeeded()
await analyzeBtn.click({ timeout: 15000 })

await page.waitForTimeout(WATCH_MS)

const storage = await page.evaluate(() => ({
  livewhere_oauth_return: localStorage.getItem('livewhere_oauth_return'),
  livewhere_pending_auth_restore: localStorage.getItem('livewhere_pending_auth_restore'),
  livewhere_pending_results: localStorage.getItem('livewhere_pending_results') ? 'present' : null,
  livewhere_pending_analyze: localStorage.getItem('livewhere_pending_analyze') ? 'present' : null,
}))

const mountIds = new Set()
for (const l of logs) {
  const m = l.text.match(/mountId["\s:]+(\d+)/) || l.text.match(/HomePageClient mount: (\d+)/)
  if (m) mountIds.add(Number(m[1]))
}

const summary = {
  totalLogs: logs.length,
  uniqueMountIds: [...mountIds],
  restoreMounts: logs.filter((l) => l.text.includes('restore useEffect mount')).length,
  authUiChanges: logs.filter((l) => l.text.includes('auth UI state changed')).length,
  storage,
  authUiSamples: logs.filter((l) => l.text.includes('auth UI state changed')).slice(0, 10).map((l) => l.text.slice(0, 300)),
  lastLogs: logs.slice(-6).map((l) => l.text.slice(0, 200)),
}

console.log(JSON.stringify(summary, null, 2))
await browser.close()
