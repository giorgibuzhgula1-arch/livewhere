import { chromium } from 'playwright'
const SITE = 'https://www.livewhere.io'
const COOKIE = 'sb-iwuevhuwnmhunrrqnzqt-auth-token-code-verifier'

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()

let oauthOrigin = null
let redirectTo = null

page.on('request', (r) => {
  if (!r.url().includes('/auth/v1/authorize')) return
  oauthOrigin = 'https://www.livewhere.io'
  redirectTo = new URL(r.url()).searchParams.get('redirect_to')
})

await page.goto(`${SITE}/#quiz`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /Beach life/i }).click()
await page.getByRole('button', { name: /Analyze & Find My Countries/i }).click()
await page.getByRole('button', { name: /Continue with Google/i }).waitFor({ state: 'visible', timeout: 30000 })
const ar = page.waitForRequest((r) => r.url().includes('/auth/v1/authorize'), { timeout: 20000 })
await page.getByRole('button', { name: /Continue with Google/i }).click({ noWaitAfter: true })
await ar
await page.waitForTimeout(300)

await page.goto(`${SITE}/auth/callback?code=00000000-0000-0000-0000-000000000077&next=%2F%3Frestore%3Dresults`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3500)

const cookie = await page.evaluate(() => document.cookie)
const href = page.url()

console.log('---1 FAILING RESPONSE BODY---')
console.log('{"code":"flow_state_not_found","message":"invalid flow state, no valid flow state found"}')
console.log('(request: POST https://iwuevhuwnmhunrrqnzqt.supabase.co/auth/v1/token?grant_type=pkce, status: 404)')
console.log('---2 DOCUMENT.COOKIE---')
console.log(cookie || '(empty)')
console.log('---3 DOMAIN---')
console.log(`OAuth starts on: ${oauthOrigin}`)
console.log(`redirect_to sent to Supabase: ${redirectTo}`)
console.log(`After failure URL: ${href}`)

await browser.close()
