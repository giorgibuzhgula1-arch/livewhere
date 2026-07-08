/**
 * Tests apex vs www cookie domain during OAuth start,
 * and middleware impact on callback token exchange.
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const SUPABASE_URL = 'https://iwuevhuwnmhunrrqnzqt.supabase.co'
const CODE_VERIFIER_COOKIE = 'sb-iwuevhuwnmhunrrqnzqt-auth-token-code-verifier'
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dWV2aHV3bm1odW5ycnFuenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzcxNTIsImV4cCI6MjA5MzQxMzE1Mn0.TGSwy3a2_-i1u_nLMZKjVCRiPZi3At1UB7Z6KrHaqso'

const report = { tests: [] }

async function runQuizGoogle(context, startUrl, label) {
  const page = await context.newPage()
  const tokenResponses = []

  page.on('response', async (res) => {
    if (!res.url().includes('/auth/v1/token')) return
    let body = ''
    try {
      body = await res.text()
    } catch {
      body = '<unreadable>'
    }
    tokenResponses.push({ url: res.url(), status: res.status(), body })
  })

  await page.goto(`${startUrl}/#quiz`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1000)
  const beach = page.getByRole('button', { name: /Beach life/i })
  if (await beach.isVisible({ timeout: 5000 }).catch(() => false)) await beach.click()
  await page.getByRole('button', { name: /Analyze & Find My Countries/i }).click({ timeout: 15000 })
  await page.waitForTimeout(3000)

  const googleBtn = page.getByRole('button', { name: /Continue with Google/i })
  await googleBtn.click({ timeout: 10000 })

  // Wait for authorize request
  await page.waitForTimeout(2000)

  const cookies = await context.cookies()
  const verifier = cookies.find((c) => c.name === CODE_VERIFIER_COOKIE)

  // Capture redirect_to from any supabase authorize in network - evaluate from page if still on site
  let redirectTo = null
  let pageOrigin = null
  try {
    pageOrigin = await page.evaluate(() => window.location.origin)
    redirectTo = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource')
      const auth = entries.find((e) => e.name.includes('/auth/v1/authorize'))
      return auth ? new URL(auth.name).searchParams.get('redirect_to') : null
    })
  } catch {
    pageOrigin = 'navigated away'
  }

  report.tests.push({
    label,
    startUrl,
    pageOriginAfterClick: pageOrigin,
    redirectToFromAuthorize: redirectTo,
    verifierCookie: verifier
      ? {
          domain: verifier.domain,
          path: verifier.path,
          sameSite: verifier.sameSite,
          secure: verifier.secure,
          httpOnly: verifier.httpOnly,
          valueLength: verifier.value?.length,
        }
      : null,
    tokenResponses,
  })

  await page.close()
}

async function callbackExchangeTest(site, label, withVerifier) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  if (withVerifier) {
    await context.addCookies([
      {
        name: CODE_VERIFIER_COOKIE,
        value:
          'base64-eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0IjoidmVyaWZpZXIifQ.test',
        domain: new URL(site).hostname,
        path: '/',
        sameSite: 'Lax',
        secure: true,
      },
    ])
  }

  const page = await context.newPage()
  const tokenResponses = []
  const cookieSnapshots = []

  page.on('response', async (res) => {
    if (!res.url().includes('/auth/v1/token')) return
    let body = ''
    try {
      body = await res.text()
    } catch {
      body = '<unreadable>'
    }
    tokenResponses.push({
      url: res.url(),
      status: res.status(),
      statusText: res.statusText(),
      body,
    })
  })

  // Snapshot cookies before callback load
  cookieSnapshots.push({
    when: 'before_callback',
    cookies: (await context.cookies()).filter((c) => c.name.includes('sb-')),
  })

  await page.goto(
    `${site}/auth/callback?code=00000000-0000-0000-0000-000000000001&next=${encodeURIComponent('/?restore=results')}`,
    { waitUntil: 'networkidle', timeout: 45000 },
  )

  await page.waitForTimeout(2500)

  cookieSnapshots.push({
    when: 'after_callback',
    cookies: (await context.cookies()).filter((c) => c.name.includes('sb-')),
  })

  report.tests.push({
    label,
    site,
    withVerifier,
    finalUrl: page.url(),
    cookieSnapshots,
    tokenResponses,
  })

  await browser.close()
}

async function middlewareCookieProbe() {
  // Request callback through middleware without browser JS
  const res = await fetch('https://www.livewhere.io/auth/callback?code=test', {
    redirect: 'manual',
    headers: {
      Cookie: `${CODE_VERIFIER_COOKIE}=test-verifier-value`,
    },
  })
  const setCookies = res.headers.getSetCookie?.() || []
  report.middlewareProbe = {
    status: res.status,
    location: res.headers.get('location'),
    setCookieHeaders: setCookies,
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  // Test 1: www start
  const ctx1 = await browser.newContext()
  await runQuizGoogle(ctx1, 'https://www.livewhere.io', 'www_start')
  await ctx1.close()

  // Test 2: apex start (307 → www)
  const ctx2 = await browser.newContext()
  await runQuizGoogle(ctx2, 'https://livewhere.io', 'apex_start_redirects_to_www')
  await ctx2.close()

  await browser.close()

  await callbackExchangeTest('https://www.livewhere.io', 'callback_no_verifier', false)
  await callbackExchangeTest('https://www.livewhere.io', 'callback_with_verifier_cookie', true)

  await middlewareCookieProbe()

  writeFileSync('scripts/oauth-diagnose-report2.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}

main().catch(console.error)
