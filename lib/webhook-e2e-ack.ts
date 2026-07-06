/** In-memory ack for E2E regression tests (ENABLE_WEBHOOK_E2E_ACK=true only). */
export type WebhookE2eAck = {
  eventId: string
  eventType: string
  completedAt: number
}

let lastAck: WebhookE2eAck | null = null

export function markWebhookE2eProcessed(eventId: string, eventType: string): void {
  if (process.env.ENABLE_WEBHOOK_E2E_ACK !== 'true') return
  lastAck = { eventId, eventType, completedAt: Date.now() }
}

export function getWebhookE2eAck(): WebhookE2eAck | null {
  if (process.env.ENABLE_WEBHOOK_E2E_ACK !== 'true') return null
  return lastAck
}

export function resetWebhookE2eAck(): void {
  lastAck = null
}
