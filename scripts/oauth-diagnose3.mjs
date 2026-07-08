/**
 * Capture REAL verifier from OAuth start, then hit callback in same context.
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const SITE = 'https://www.livewhere.io'
const CODE_VERIFIER_COOKIE = 'sb-iwuevhuwnmhunrrqnzqt-auth-token-code-verifier'

async function startOAuthAndCaptureVerifier(page, context) {
  await page.goto(`${SITE}/#quiz`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.locator('text=Your personalized').scrollIntoViewIfNeeded().catch(() => {})
  const beach = page.getByRole('button', { name: /Beach life/i })
  if (await beach.isVisible({ timeout: 5000 }).catch(() => false)) await beach.click()
  await page.getByRole('button', { name: /Analyze & Find My Countries/i }).click({ timeout: 15000 })
  await page.getByRole('button', { name: /Continue with Google/i }).waitFor({ state: 'visible', timeout: 30000 })

  const authorizePromise = page.waitForRequest((r) => r.url().includes('/auth/v1/authorize'), { timeout: 20000 })

  // Read document.cookie on www BEFORE navigation away
  let docCookieBeforeNav = null
  page.once('request', async (req) => {
    if (!req.url().includes('/auth/v1/authorize')) return
    try {
      docCookieBeforeNav = await page.evaluate((name) => ({
        origin: window.location.origin,
        documentCookie: document.cookie,
        hasVerifier: document.cookie.includes(name),
      }), CODE_VERIFIER_COOKIE)
    } catch {
      docCookieBeforeNav = { error: 'evaluate failed' }
    }
  })

  await page.getByRole('button', { name: /Continue with Google/i }).click({ timeout: 15000 })
  const authorizeReq = await authorizePromise
  await page.waitForTimeout(300) // let cookie flush

  const verifier = (await context.cookies()).find((c) => c.name === CODE_VERIFIER_COOKIE)
  return {
    authorizeUrl: authorizeReq.url(),
    redirectTo: new URL(authorizeReq.url()).searchParams.get('redirect_to'),
    docCookieBeforeNav,
    verifierCookie: verifier,
  }
}

async function runCallback(page, context, label) {
  const consoleLogs = []
  const tokenResponses = []
  page.on('console', (msg) => consoleLogs.push({ type: msg.type(), text: msg.text() }))
  page.on('response', async (res) => {
    if (!res.url().includes('/auth/v1/token')) return
    tokenResponses.push({
      url: res.url(),
      status: res.status(),
      body: await res.text().catch(() => ''),
    })
  })

  const before = (await context.cookies()).filter((c) => c.name.includes('sb-'))
  await page.goto(
    `${SITE}/auth/callback?code=00000000-0000-0000-0000-000000000099&next=${encodeURIComponent('/?restore=results')}`,
    { waitUntil: 'domcontentloaded', timeout: 45000 },
  )
  await page.waitForTimeout(4000)
  const after = (await context.cookies()).filter((c) => c.name.includes('sb-'))

  return {
    label,
    cookiesBefore: before,
    cookiesAfter: after,
    finalUrl: page.url(),
    tokenResponses,
    consoleLogs,
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const oauthStart = await startOAuthAndCaptureVerifier(page, context)

  const callbackWithRealVerifier = await runCallback(page, context, 'same_context_real_verifier')

  const context2 = await browser.newContext()
  const page2 = await context2.newPage()
  const callbackNoVerifier = await runCallback(page2, context2, 'fresh_context_no_verifier')

  const report = { oauthStart, callbackWithRealVerifier, callbackNoVerifier }
  writeFileSync('scripts/oauth-diagnose-report3.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
}

main().catch(console.error)
