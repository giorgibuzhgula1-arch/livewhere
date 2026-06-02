import { NextRequest, NextResponse } from 'next/server'

export function getAdminSecret(): string | null {
  const secret = process.env.ADMIN_SECRET?.trim()
  return secret || null
}

export function isAdminAuthorized(req: NextRequest): boolean {
  const secret = getAdminSecret()
  if (!secret) return false

  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim() === secret
  }

  const header = req.headers.get('x-admin-secret')
  return header?.trim() === secret
}

export function adminUnauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function adminNotConfiguredResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Admin is not configured. Set ADMIN_SECRET in the environment.' },
    { status: 503 }
  )
}
