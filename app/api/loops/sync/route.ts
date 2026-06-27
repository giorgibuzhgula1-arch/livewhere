import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const record = body.record
    if (!record?.email) {
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    const nameParts = (record.full_name || '').split(' ')

    const loopsPayload = {
      email: record.email,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      userId: record.id,
      source: 'livewhere_signup',
      userGroup: 'free',
    }

    const res = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loopsPayload),
    })

    const data = await res.json()
    console.log('[Loops Sync]', data)
    return NextResponse.json(data, { status: res.status })

  } catch (err) {
    console.error('[Loops Sync Error]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
