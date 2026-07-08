import { chromium } from 'playwright'
import { parse } from 'cookie'

const SITE = 'https://www.livewhere.io'
const COOKIE = 'sb-iwuevhuwnmhunrrqnzqt-auth-token-code-verifier'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  let snapAtAuthorize = null
  page.on('request', (req) => {
    if (!req.url().includes('/auth/v1/authorize')) return
    void page
      .evaluate((name) => ({
        origin: window.location.origin,
        href: window.location.href,
        documentCookie: document.cookie,
        hasVerifier: document.cookie.includes(name),
      }), COOKIE)
      .then((s) => {
        snapAtAuthorize = s
      })
      .catch(() => {})
  })

  await page.goto(`${SITE}/#quiz`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Beach life/i }).click()
  await page.getByRole('button', { name: /Analyze & Find My Countries/i }).click()
  await page.getByRole('button', { name: /Continue with Google/i }).waitFor({ state: 'visible', timeout: 30000 })
  await page.getByRole('button', { name: /Continue with Google/i }).click({ noWaitAfter: true, timeout: 15000 })
  await page.waitForTimeout(2000)

  const jar = (await context.cookies()).find((c) => c.name === COOKIE)
  const parsed = parse(snapAtAuthorize?.documentCookie || '')
  console.log(
    JSON.stringify(
      {
        snapAtAuthorize,
        parsedVerifier: parsed[COOKIE],
        jarValue: jar?.value,
        jarAttrs: jar
          ? { domain: jar.domain, path: jar.path, sameSite: jar.sameSite, secure: jar.secure }
          : null,
      },
      null,
      2,
    ),
  )
  await browser.close()
}

main()
