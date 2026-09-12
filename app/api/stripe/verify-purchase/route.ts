import { NextRequest, NextResponse } from 'next/server'
import { isExcludedTestPurchase } from '@/lib/founder-test'
import { stripe } from '@/lib/stripe'

const SESSION_ID_RE = /^cs_[a-zA-Z0-9_]+$/

export async function POST(req: NextRequest) {
  let sessionId: unknown
  try {
    const body = await req.json()
    sessionId = body?.sessionId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid =
      session.payment_status === 'paid' || session.payment_status === 'no_payment_required'

    if (!paid) {
      return NextResponse.json({ verified: false, exclude: false })
    }

    const email = session.customer_details?.email ?? session.customer_email ?? null
    const userId = session.metadata?.userId ?? null
    const exclude = isExcludedTestPurchase({
      sessionId: session.id,
      livemode: session.livemode,
      email,
      userId,
    })

    const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : null

    return NextResponse.json({
      verified: true,
      exclude,
      amountTotal,
      currency: session.currency ?? 'usd',
      plan: session.metadata?.checkoutType ?? null,
    })
  } catch (err) {
    console.error('[verify-purchase] Stripe retrieve failed:', err)
    return NextResponse.json({ verified: false, exclude: false }, { status: 200 })
  }
}
