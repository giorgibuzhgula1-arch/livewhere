import { defineConfig, devices } from '@playwright/test'
import {
  E2E_LOCAL_PREVIEW_ORIGIN,
  E2E_STRIPE_WEBHOOK_SECRET,
  E2E_SUPABASE_ANON_KEY,
  E2E_SUPABASE_URL,
} from './e2e/test-env'

const PORT = process.env.PORT || '3000'
const localServerOrigin = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 60_000,
  use: {
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'oauth-production-host',
      testMatch: /oauth-redirect-origin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://www.livewhere.io:${PORT}`,
        launchOptions: {
          args: ['--host-resolver-rules=MAP www.livewhere.io 127.0.0.1'],
        },
      },
    },
    {
      name: 'oauth-preview-host',
      testMatch: /oauth-redirect-origin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: E2E_LOCAL_PREVIEW_ORIGIN,
      },
    },
    {
      name: 'stripe-webhook',
      testMatch: /stripe-webhook\.spec\.ts/,
      use: {
        baseURL: localServerOrigin,
      },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: localServerOrigin,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PORT,
      ENABLE_WEBHOOK_E2E_ACK: 'true',
      WEBHOOK_E2E_LITE: 'true',
      STRIPE_WEBHOOK_SECRET: E2E_STRIPE_WEBHOOK_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_e2e_placeholder',
      SUPABASE_SERVICE_ROLE_KEY:
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_service_role_e2e_placeholder',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || E2E_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || E2E_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.livewhere.io',
    },
  },
})
