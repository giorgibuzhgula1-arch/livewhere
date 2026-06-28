import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { REF_COOKIE_MAX_AGE, REF_COOKIE_NAME, normalizeReferralCode } from '@/lib/affiliate'

/** Paths that skip Supabase session refresh (faster TTFB on marketing pages). */
function shouldSkipAuth(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname.startsWith('/blog')) return true
  if (pathname.startsWith('/news')) return true
  if (pathname.startsWith('/city-guides')) return true
  if (pathname.startsWith('/compare')) return true
  if (pathname.startsWith('/cities')) return true
  if (pathname.startsWith('/affiliates')) return true
  if (pathname.startsWith('/admin')) return true
  if (pathname === '/sitemap.xml') return true
  if (pathname === '/favicon.ico') return true
  return false
}

/** Set referral cookie after all other middleware cookie writes (Supabase recreates the response). */
function setReferralCookieOnResponse(request: NextRequest, response: NextResponse) {
  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref) return response

  const referralCode = normalizeReferralCode(ref)
  if (!referralCode) return response

  response.cookies.set(REF_COOKIE_NAME, referralCode, {
    maxAge: REF_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (shouldSkipAuth(pathname)) {
    return setReferralCookieOnResponse(request, NextResponse.next({ request }))
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getSession()

  return setReferralCookieOnResponse(request, response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
