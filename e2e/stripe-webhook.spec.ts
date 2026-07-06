import { expect, test } from '@playwright/test'
import Stripe from 'stripe'
import { E2E_STRIPE_WEBHOOK_SECRET } from './test-env'

const EVENT_ID = 'evt_e2e_regression_webhook'

function buildCheckoutCompletedEvent(): Stripe.Event {
  return {
    id: EVENT_ID,
    object: 'event',
    api_version: '2024-06-20',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    livemode: false,
    pending_webhooks: 0,
    request: null,
    data: {
      object: {
        id: 'cs_e2e_regression',
        object: 'checkout.session',
        metadata: {
          userId: 'e2e-user',
          checkoutType: 'blueprint',
          plan_id: 'e2e-plan',
        },
      } as Stripe.Checkout.Session,
    },
  }
}

test.describe('Stripe webhook regression', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await request.delete(`${baseURL}/api/internal/webhook-e2e-ack`)
  })

  test('returns 200 immediately and completes background PDF work', async ({ request, baseURL }) => {
    const event = buildCheckoutCompletedEvent()
    const payload = JSON.stringify(event)
    const stripe = new Stripe('sk_test_e2e')
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: E2E_STRIPE_WEBHOOK_SECRET,
    })

    const started = Date.now()
    const response = await request.post(`${baseURL}/api/stripe/webhook`, {
      data: payload,
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
    })
    const elapsedMs = Date.now() - started

    expect(response.status()).toBe(200)
    expect(elapsedMs).toBeLessThan(500)

    await expect
      .poll(
        async () => {
          const ackResponse = await request.get(`${baseURL}/api/internal/webhook-e2e-ack`)
          if (ackResponse.status() !== 200) return null
          return ackResponse.json()
        },
        { timeout: 15_000 },
      )
      .toMatchObject({
        completed: true,
        eventId: EVENT_ID,
        eventType: 'checkout.session.completed',
      })
  })

  test('rejects invalid signatures', async ({ request, baseURL }) => {
    const payload = JSON.stringify(buildCheckoutCompletedEvent())
    const response = await request.post(`${baseURL}/api/stripe/webhook`, {
      data: payload,
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=0,v1=invalid',
      },
    })

    expect(response.status()).toBe(400)
  })
})
