/**
 * TEMP: Capture homepage console for remount / auth UI oscillation diagnosis.
 * Usage: node scripts/auth-flicker-diag.mjs [url] [watchMs]
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const SITE = process.argv[2] || 'https://www.livewhere.io'
const WATCH_MS = Number(process.argv[3] || 15000)

const report = {
  site: SITE,
  watchMs: WATCH_MS,
  timestamp: new Date().toISOString(),
  console: [],
  summary: {},
}

function classify(text) {
  if (text.includes('HomePageClient mount')) return 'mount'
  if (text.includes('restore useEffect mount')) return 'restoreMount'
  if (text.includes('auth UI state changed')) return 'authUi'
  if (text.includes('restore useEffect SKIP')) return 'restoreSkip'
  if (text.includes('quiz-auth-diag')) return 'diag'
  return 'other'
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg) => {
    const text = msg.text()
    if (!text.includes('quiz-auth')) return
    report.console.push({
      at: Date.now(),
      type: msg.type(),
      category: classify(text),
      text: text.slice(0, 2000),
    })
  })

  const started = Date.now()
  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(WATCH_MS)

  const storage = await page.evaluate(() => ({
    livewhere_oauth_return: localStorage.getItem('livewhere_oauth_return'),
    livewhere_pending_auth_restore: localStorage.getItem('livewhere_pending_auth_restore'),
    livewhere_pending_results: localStorage.getItem('livewhere_pending_results')
      ? `present (${localStorage.getItem('livewhere_pending_results').length} chars)`
      : null,
    livewhere_pending_analyze: localStorage.getItem('livewhere_pending_analyze')
      ? `present (${localStorage.getItem('livewhere_pending_analyze').length} chars)`
      : null,
    session_oauth_return: sessionStorage.getItem('livewhere_oauth_return'),
    session_pending_auth_restore: sessionStorage.getItem('livewhere_pending_auth_restore'),
  }))

  report.localStorage = storage
  report.elapsedMs = Date.now() - started

  const counts = {}
  for (const line of report.console) {
    counts[line.category] = (counts[line.category] || 0) + 1
  }
  report.summary = counts

  // Correlate restore + auth UI bursts within 50ms windows
  const bursts = []
  for (const line of report.console) {
    if (line.category !== 'restoreMount' && line.category !== 'authUi') continue
    const peers = report.console.filter(
      (p) => Math.abs(p.at - line.at) < 50 && (p.category === 'restoreMount' || p.category === 'authUi'),
    )
    if (peers.length > 1) {
      bursts.push({
        at: line.at,
        categories: peers.map((p) => p.category),
        texts: peers.map((p) => p.text.slice(0, 120)),
      })
    }
  }
  report.correlatedBursts = bursts.slice(0, 20)

  const out = 'scripts/auth-flicker-diag-report.json'
  writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ out, summary: report.summary, localStorage: storage, burstCount: bursts.length }, null, 2))

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
