/**
 * OAuth diagnostic — captures network, cookies, and redirect consistency
 * for quiz → Google sign-in flow on production.
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const SITE = process.env.OAUTH_DIAG_SITE || 'https://www.livewhere.io'
const SUPABASE_URL = 'https://iwuevhuwnmhunrrqnzqt.supabase.co'
const CODE_VERIFIER_COOKIE = 'sb-iwuevhuwnmhunrrqnzqt-auth-token-code-verifier'

const report = {
  timestamp: new Date().toISOString(),
  site: SITE,
  steps: [],
  network: [],
  cookies: {},
  domainCheck: {},
  timing: {},
  tokenExchangeProbe: null,
  rootCause: null,
}

function log(step, data) {
  console.log(`\n=== ${step} ===`)
  console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2))
  report.steps.push({ step, data, at: new Date().toISOString() })
}

function parseCookieAttrs(setCookieHeader) {
  if (!setCookieHeader) return null
  const parts = setCookieHeader.split(';').map((p) => p.trim())
  const [nameValue, ...attrs] = parts
  const eq = nameValue.indexOf('=')
  const name = nameValue.slice(0, eq)
  const value = nameValue.slice(eq + 1)
  const parsed = { name, valueLength: value.length, domain: null, path: '/', sameSite: null, secure: false, httpOnly: false }
  for (const a of attrs) {
    const lower = a.toLowerCase()
    if (lower === 'secure') parsed.secure = true
    else if (lower === 'httponly') parsed.httpOnly = true
    else if (lower.startsWith('domain=')) parsed.domain = a.slice(7)
    else if (lower.startsWith('path=')) parsed.path = a.slice(5)
    else if (lower.startsWith('samesite=')) parsed.sameSite = a.slice(9)
  }
  return parsed
}

async function getVerifierCookieDetails(context, label) {
  const cookies = await context.cookies()
  const verifier = cookies.find((c) => c.name === CODE_VERIFIER_COOKIE)
  const allNames = cookies.filter((c) => c.name.includes('sb-')).map((c) => c.name)
  const details = {
    label,
    present: Boolean(verifier),
    allSupabaseCookieNames: allNames,
    verifier: verifier
      ? {
          name: verifier.name,
          domain: verifier.domain,
          path: verifier.path,
          sameSite: verifier.sameSite,
          secure: verifier.secure,
          httpOnly: verifier.httpOnly,
          expires: verifier.expires,
          valueLength: verifier.value?.length ?? 0,
        }
      : null,
  }
  report.cookies[label] = details
  return details
}

async function completeQuiz(page) {
  await page.goto(`${SITE}/#quiz`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)

  await page.locator('text=Your personalized').scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(500)

  const beach = page.getByRole('button', { name: /Beach life/i })
  if (await beach.isVisible({ timeout: 5000 }).catch(() => false)) {
    await beach.click()
  }

  const analyzeBtn = page.getByRole('button', { name: /Analyze & Find My Countries/i })
  await analyzeBtn.scrollIntoViewIfNeeded()
  await analyzeBtn.click({ timeout: 15000 })
  await page.waitForTimeout(4000)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  // --- Network capture ---
  const failedRequests = []
  page.on('request', (req) => {
    const url = req.url()
    if (url.includes('/auth/v1/') || url.includes('/auth/callback')) {
      report.network.push({ phase: 'request', method: req.method(), url })
    }
  })

  page.on('response', async (res) => {
    const url = res.url()
    if (!url.includes('/auth/v1/') && !url.includes('/auth/callback')) return
    let body = null
    try {
      body = await res.text()
    } catch {
      body = '<unreadable>'
    }
    const entry = {
      phase: 'response',
      url,
      status: res.status(),
      statusText: res.statusText(),
      body: body?.slice(0, 2000),
    }
    report.network.push(entry)
    if (res.status() >= 400) failedRequests.push(entry)
    console.log(`\n[NETWORK] ${res.status()} ${url}`)
    if (body) console.log(body.slice(0, 500))
  })

  // --- Domain check: apex → www ---
  const apexRes = await page.goto('https://livewhere.io/', { waitUntil: 'commit' })
  report.domainCheck.apexRequest = 'https://livewhere.io/'
  report.domainCheck.apexFinalUrl = page.url()
  report.domainCheck.apexStatus = apexRes?.status()

  // --- Quiz flow ---
  log('quiz', 'Starting quiz flow')
  try {
    await completeQuiz(page)
    log('quiz', { url: page.url(), title: await page.title() })
  } catch (e) {
    log('quiz-error', String(e))
  }

  // Wait for auth modal
  const googleBtn = page.getByRole('button', { name: /continue with google/i })
  const modalVisible = await googleBtn.isVisible({ timeout: 15000 }).catch(() => false)
  log('auth-modal', { visible: modalVisible, url: page.url() })

  if (!modalVisible) {
    // Try opening auth directly via hash + pending state
    await page.goto(`${SITE}/?auth_error=oauth#quiz`)
    await page.waitForTimeout(2000)
  }

  const googleVisible = await googleBtn.isVisible({ timeout: 10000 }).catch(() => false)
  if (!googleVisible) {
    log('abort', 'Google button not found — cannot continue')
    writeFileSync('scripts/oauth-diagnose-report.json', JSON.stringify(report, null, 2))
    await browser.close()
    process.exit(1)
  }

  // --- Timing: instrument signInWithOAuth ---
  await page.evaluate(() => {
    window.__oauthDiag = { events: [] }
  })

  let authorizeUrl = null
  let cookieBeforeRedirect = null

  const navPromise = page.waitForURL(
    (url) =>
      url.hostname.includes('google.com') ||
      url.hostname.includes('supabase.co') ||
      url.pathname.includes('/auth/callback'),
    { timeout: 30000 },
  ).catch(() => null)

  // Intercept Set-Cookie on authorize redirect
  page.on('response', async (res) => {
    const url = res.url()
    if (url.includes('/auth/v1/authorize')) {
      authorizeUrl = url
      const headers = res.headers()
      log('authorize-response', {
        url,
        status: res.status(),
        location: headers['location'] || null,
      })
    }
  })

  const timingStart = Date.now()

  // Click Google and capture state
  await page.evaluate(() => {
    const origAssign = window.location.assign.bind(window.location)
    window.location.assign = function (url) {
      window.__oauthDiag.events.push({ type: 'location.assign', url, at: Date.now() })
      return origAssign(url)
    }
  })

  await googleBtn.click()

  // Poll for verifier cookie before navigation completes
  for (let i = 0; i < 20; i++) {
    cookieBeforeRedirect = await getVerifierCookieDetails(context, 'after_click_poll')
    if (cookieBeforeRedirect.present) break
    await page.waitForTimeout(50)
  }

  const documentCookieCheck = await page.evaluate((cookieName) => {
    const raw = document.cookie
    const has = raw.includes(cookieName)
    return { documentCookie: raw, hasVerifierInDocumentCookie: has }
  }, CODE_VERIFIER_COOKIE).catch(() => ({ error: 'page navigated' }))

  report.timing = {
    clickToCookiePollMs: Date.now() - timingStart,
    documentCookieCheck,
  }

  await navPromise
  report.timing.clickToNavigationMs = Date.now() - timingStart
  report.timing.finalUrlAfterNav = page.url()

  cookieBeforeRedirect = await getVerifierCookieDetails(context, 'after_navigation')
  log('cookie-after-nav', cookieBeforeRedirect)

  // Parse authorize URL for redirect_to
  if (authorizeUrl) {
    const u = new URL(authorizeUrl)
    report.domainCheck.authorizeUrl = authorizeUrl
    report.domainCheck.redirectToParam = u.searchParams.get('redirect_to')
  } else if (page.url().includes('supabase.co')) {
    const u = new URL(page.url())
    report.domainCheck.authorizeUrl = page.url()
    report.domainCheck.redirectToParam = u.searchParams.get('redirect_to')
  }

  // If we landed on Google, go back to callback simulation path
  // Probe token endpoint with missing verifier (documents error shape)
  const probeRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dWV2aHV3bm1odW5ycnFuenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzcxNTIsImV4cCI6MjA5MzQxMzE1Mn0.TGSwy3a2_-i1u_nLMZKjVCRiPZi3At1UB7Z6KrHaqso',
      Authorization: `Bearer ${process.env.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dWV2aHV3bm1odW5ycnFuenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzcxNTIsImV4cCI6MjA5MzQxMzE1Mn0.TGSwy3a2_-i1u_nLMZKjVCRiPZi3At1UB7Z6KrHaqso'}`,
    },
    body: JSON.stringify({ auth_code: 'fake-code-for-probe', code_verifier: 'fake-verifier' }),
  })
  report.tokenExchangeProbe = {
    url: `${SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
    status: probeRes.status,
    body: await probeRes.text(),
  }

  // --- Callback page test: load callback WITHOUT verifier cookie ---
  const callbackContext = await browser.newContext()
  const callbackPage = await callbackContext.newPage()
  const callbackNetwork = []

  callbackPage.on('response', async (res) => {
    const url = res.url()
    if (!url.includes('/auth/v1/token')) return
    let body = ''
    try { body = await res.text() } catch { body = '<unreadable>' }
    callbackNetwork.push({ url, status: res.status(), body })
  })

  await callbackPage.goto(
    `${SITE}/auth/callback?code=00000000-0000-0000-0000-000000000000&next=${encodeURIComponent('/?restore=results')}`,
    { waitUntil: 'networkidle', timeout: 30000 },
  ).catch(() => {})

  await callbackPage.waitForTimeout(3000)
  const callbackCookies = await getVerifierCookieDetails(callbackContext, 'callback_without_prior_oauth')
  report.callbackSimulation = {
    landedUrl: callbackPage.url(),
    cookiesOnCallback: callbackCookies,
    tokenRequests: callbackNetwork,
  }

  // --- Callback WITH verifier set manually then fake code ---
  const callbackContext2 = await browser.newContext()
  // Set a fake verifier cookie like supabase would
  await callbackContext2.addCookies([
    {
      name: CODE_VERIFIER_COOKIE,
      value: 'dGVzdC12ZXJpZmllci1mb3ItcHJvYmU',
      domain: 'www.livewhere.io',
      path: '/',
      sameSite: 'Lax',
      secure: true,
    },
  ])
  const callbackPage2 = await callbackContext2.newPage()
  const callbackNetwork2 = []
  callbackPage2.on('response', async (res) => {
    const url = res.url()
    if (!url.includes('/auth/v1/token')) return
    let body = ''
    try { body = await res.text() } catch { body = '<unreadable>' }
    callbackNetwork2.push({ url, status: res.status(), body })
  })
  await callbackPage2.goto(
    `${SITE}/auth/callback?code=00000000-0000-0000-0000-000000000000&next=${encodeURIComponent('/?restore=results')}`,
    { waitUntil: 'networkidle', timeout: 30000 },
  ).catch(() => {})
  await callbackPage2.waitForTimeout(3000)
  report.callbackWithVerifierCookie = {
    landedUrl: callbackPage2.url(),
    cookies: await getVerifierCookieDetails(callbackContext2, 'callback_with_fake_verifier'),
    tokenRequests: callbackNetwork2,
  }

  writeFileSync('scripts/oauth-diagnose-report.json', JSON.stringify(report, null, 2))
  log('done', 'Report written to scripts/oauth-diagnose-report.json')

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
