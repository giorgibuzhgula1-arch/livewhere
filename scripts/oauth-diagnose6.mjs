import { chromium } from 'playwright'

const SITE = 'https://www.livewhere.io'
const COOKIE = 'sb-iwuevhuwnmhunrrqnzqt-auth-token-code-verifier'
const VERIFIER =
  '%22e30ab880e9b90183138c8921d843ee521bf89bbfb31329beeca856f5e72dd16bbd26fae38c4e2e13fc53655ec4baf64c8ee3bb06167307e3%22'

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

  const reqHeaders = []
  page.on('request', (req) => {
    if (req.url().includes('/auth/callback') && !req.url().includes('_next'))
      reqHeaders.push({ url: req.url(), cookie: req.headers().cookie || '' })
  })

  const tokenCalls = []
  page.on('response', async (r) => {
    if (!r.url().includes('/auth/v1/token')) return
    tokenCalls.push({ status: r.status(), body: await r.text().catch(() => '') })
  })

  await page.goto(`${SITE}/auth/callback?code=00000000-0000-0000-0000-000000000088&next=%2F`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(3000)

  const doc = await page.evaluate((name) => document.cookie.includes(name), COOKIE).catch(() => false)

  console.log(
    JSON.stringify(
      {
        requestCookieHeaders: reqHeaders,
        documentHasVerifier: doc,
        jarAfter: (await context.cookies()).filter((c) => c.name.includes('sb-')),
        tokenCalls,
      },
      null,
      2,
    ),
  )
  await browser.close()
}

main()
