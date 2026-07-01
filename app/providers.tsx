'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

function capturePageview(pathname: string, searchParams: URLSearchParams) {
  if (!posthog.__loaded) return
  const query = searchParams.toString()
  const url = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`
  posthog.capture('$pageview', { $current_url: url })
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return
    // Initial pageview is captured in posthog.init loaded callback.
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    capturePageview(pathname, searchParams)
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!key || !host) {
      console.warn('[posthog] init skipped — missing env vars', {
        keyPresent: Boolean(key),
        hostPresent: Boolean(host),
        host: host ?? '(missing)',
        hint: 'NEXT_PUBLIC_* values are inlined at build time — redeploy Vercel after adding env vars',
      })
      return
    }

    if (posthog.__loaded) {
      console.log('[posthog] already initialized', { host, api_host: host })
      return
    }

    posthog.init(key, {
      api_host: host,
      ui_host: host.includes('eu.') ? 'https://eu.posthog.com' : 'https://us.posthog.com',
      capture_pageview: false,
      session_recording: {
        maskAllInputs: false,
      },
      loaded: (client) => {
        console.log('[posthog] init complete', {
          host,
          api_host: host,
          keyPreview: `${key.slice(0, 8)}...${key.slice(-4)}`,
          keyLength: key.length,
          loaded: client.__loaded,
        })
        const pathname = window.location.pathname
        const searchParams = new URLSearchParams(window.location.search)
        capturePageview(pathname, searchParams)
      },
    })

    console.log('[posthog] init called', {
      host,
      api_host: host,
      keyPreview: `${key.slice(0, 8)}...${key.slice(-4)}`,
      keyLength: key.length,
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
