/** Check document.cookie vs Playwright cookies on callback page load */
import { chromium } from 'playwright'

const SITE = 'https://www.livewhere.io'
const COOKIE = 'sb-iwuevhuwnmhunrrqnzqt-auth-token-code-verifier'
const VERIFIER =
  '%22541ed708b00d033ecf996fc5c4f60dc71c6f16b3f8eecc8e7d2ed41afe52e6ca8e6dfb7f5ae966d137a2e7336cbc654951d2dfd7b4ad6a53%22'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  await context.addCookies([
    {
      name: COOKIE,
      value: VERIFIER,
      domain: 'www.livewhere.io',
      path: '/',
      sameSite: 'Lax',
      secure: true,
    },
  ])
  const page = await context.newPage()

  const events = []
  page.on('console', (m) => events.push(m.text()))
  page.on('response', async (r) => {
    if (r.url().includes('/auth/v1/token'))
      events.push(`TOKEN ${r.status()} ${await r.text().catch(() => '')}`)
  })

  await page.addInitScript((name) => {
    window.__cookieAtInit = document.cookie
    window.__hasVerifierAtInit = document.cookie.includes(name)
  }, COOKIE)

  await page.goto(
    `${SITE}/auth/callback?code=00000000-0000-0000-0000-000000000099&next=%2F`,
    { waitUntil: 'load' },
  )
  await page.waitForTimeout(2000)

  const snap = await page.evaluate((name) => ({
    atInit: window.__cookieAtInit,
    hasVerifierAtInit: window.__hasVerifierAtInit,
    afterLoad: document.cookie,
    hasVerifierAfterLoad: document.cookie.includes(name),
  }), COOKIE)

  console.log(JSON.stringify({ snap, playwrightCookies: await context.cookies(), events }, null, 2))
  await browser.close()
}

main()
