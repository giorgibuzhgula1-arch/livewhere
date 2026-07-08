import { chromium } from 'playwright'

const SITE = process.argv[2] || 'http://localhost:3005'
const VERIFIER = 'sb-iwuevhuwnmhunrrqnzqt-auth-token-code-verifier'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
await page.route('**/accounts.google.com/**', (r) => r.abort())

let afterClick = null

await page.goto(`${SITE}/#quiz`, { waitUntil: 'networkidle', timeout: 60000 })
await page.getByRole('button', { name: /Beach life/i }).click().catch(() => {})
await page.getByRole('button', { name: /Analyze & Find My Countries/i }).click({ timeout: 15000 }).catch(() => {})
await page.getByRole('button', { name: /Continue with Google/i }).waitFor({ state: 'visible', timeout: 30000 })

await page.route('**/auth/v1/authorize**', async (route) => {
  afterClick = await page.evaluate((name) => ({
    origin: window.location.origin,
    href: window.location.href,
    documentCookie: document.cookie,
    hasVerifier: document.cookie.includes(name),
  }), VERIFIER)
  await route.fulfill({
    status: 302,
    headers: { location: 'https://accounts.google.com/' },
  })
})

await page.getByRole('button', { name: /Continue with Google/i }).click({ noWaitAfter: true })
await page.waitForTimeout(1000)

const jar = (await context.cookies()).find((c) => c.name === VERIFIER)

// Callback: verifier should still be readable before exchange runs
await page.goto(`${SITE}/auth/callback?code=test-code&next=%2F`, { waitUntil: 'domcontentloaded' })
const atCallback = await page.evaluate((name) => ({
  origin: window.location.origin,
  documentCookie: document.cookie,
  hasVerifier: document.cookie.includes(name),
}), VERIFIER)

console.log('AFTER_CLICK_DOCUMENT_COOKIE=')
console.log(afterClick?.documentCookie ?? '')
console.log('AFTER_CLICK_HAS_VERIFIER=' + Boolean(afterClick?.hasVerifier))
console.log('CALLBACK_DOCUMENT_COOKIE=')
console.log(atCallback.documentCookie)
console.log('CALLBACK_HAS_VERIFIER=' + atCallback.hasVerifier)
console.log('JAR_DOMAIN=' + (jar?.domain ?? 'none'))

await browser.close()
