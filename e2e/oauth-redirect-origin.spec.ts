import { expect, test, type Page } from '@playwright/test'
import { CANONICAL_PRODUCTION_ORIGIN } from './test-env'

async function openAuthModal(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
}

async function captureAuthorizeRedirectTo(page: Page): Promise<string> {
  const authorizeRequest = page.waitForRequest(
    (req) => req.method() === 'GET' && req.url().includes('/auth/v1/authorize'),
    { timeout: 15_000 },
  )

  await page.getByRole('button', { name: 'Continue with Google' }).click()
  const request = await authorizeRequest
  const redirectTo = new URL(request.url()).searchParams.get('redirect_to')

  if (!redirectTo) {
    throw new Error(`authorize request missing redirect_to: ${request.url()}`)
  }

  return redirectTo
}

test.describe('OAuth redirect_to origin regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/auth/v1/authorize**', (route) => route.abort())
    await openAuthModal(page)
  })

  test('www.livewhere.io uses canonical production callback, not vercel.app', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'oauth-production-host', 'production-host project only')

    const redirectTo = await captureAuthorizeRedirectTo(page)
    const redirectUrl = new URL(redirectTo)

    expect(redirectUrl.origin).toBe(CANONICAL_PRODUCTION_ORIGIN)
    expect(redirectUrl.pathname).toBe('/auth/callback')
    expect(redirectTo).not.toContain('vercel.app')
    expect(redirectTo).not.toMatch(/^http:\/\/www\.livewhere\.io/)
  })

  test('non-production host keeps redirect_to on the same origin (preview/local branch)', async ({ page, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== 'oauth-preview-host', 'preview-host project only')

    const localOrigin = new URL(baseURL!).origin

    const redirectTo = await captureAuthorizeRedirectTo(page)
    const redirectUrl = new URL(redirectTo)

    expect(redirectUrl.origin).toBe(localOrigin)
    expect(redirectUrl.pathname).toBe('/auth/callback')
    expect(redirectTo).not.toContain('www.livewhere.io')
    expect(redirectTo).not.toContain('vercel.app')
  })
})
