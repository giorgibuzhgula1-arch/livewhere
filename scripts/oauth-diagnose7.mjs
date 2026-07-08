import { chromium } from 'playwright'

const SITE = 'https://www.livewhere.io'
const COOKIE = 'sb-iwuevhuwnmhunrrqnzqt-auth-token-code-verifier'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${SITE}/#quiz`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Beach life/i }).click()
  await page.getByRole('button', { name: /Analyze & Find My Countries/i }).click()
  await page.getByRole('button', { name: /Continue with Google/i }).waitFor({ state: 'visible', timeout: 30000 })

  const authorizeReq = page.waitForRequest((r) => r.url().includes('/auth/v1/authorize'), { timeout: 20000 })
  await page.getByRole('button', { name: /Continue with Google/i }).click({ noWaitAfter: true })
  await authorizeReq
  await page.waitForTimeout(500)

  const jarBefore = (await context.cookies()).find((c) => c.name === COOKIE)

  const callbackReqCookies = []
  page.on('request', (req) => {
    if (req.url().startsWith(`${SITE}/auth/callback`))
      callbackReqCookies.push(req.headers().cookie || '')
  })

  const tokenCalls = []
  page.on('response', async (r) => {
    if (!r.url().includes('/auth/v1/token')) return
    tokenCalls.push({ status: r.status(), body: await r.text().catch(() => '') })
  })

  const consoleErr = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErr.push(m.text())
  })

  await page.goto(
    `${SITE}/auth/callback?code=00000000-0000-0000-0000-000000000077&next=%2F%3Frestore%3Dresults`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForTimeout(3000)

  console.log(
    JSON.stringify(
      {
        jarBeforeCallback: jarBefore,
        callbackRequestCookieHeader: callbackReqCookies,
        jarAfter: (await context.cookies()).filter((c) => c.name.includes('sb-')),
        tokenCalls,
        consoleErrors: consoleErr,
        finalUrl: page.url(),
      },
      null,
      2,
    ),
  )
  await browser.close()
}

main()
