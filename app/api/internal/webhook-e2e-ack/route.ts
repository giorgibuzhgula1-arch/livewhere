import { NextResponse } from 'next/server'
import { getWebhookE2eAck, resetWebhookE2eAck } from '@/lib/webhook-e2e-ack'

export const dynamic = 'force-dynamic'

/** Test-only: read last webhook background completion (ENABLE_WEBHOOK_E2E_ACK=true). */
export async function GET() {
  if (process.env.ENABLE_WEBHOOK_E2E_ACK !== 'true') {
    return NextResponse.json({ error: 'disabled' }, { status: 404 })
  }

  const ack = getWebhookE2eAck()
  if (!ack) {
    return NextResponse.json({ completed: false }, { status: 404 })
  }

  return NextResponse.json({ completed: true, ...ack })
}

/** Test-only: clear ack state between webhook E2E runs. */
export async function DELETE() {
  if (process.env.ENABLE_WEBHOOK_E2E_ACK !== 'true') {
    return NextResponse.json({ error: 'disabled' }, { status: 404 })
  }

  resetWebhookE2eAck()
  return NextResponse.json({ reset: true })
}
