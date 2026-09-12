'use client'

import Script from 'next/script'
import { Suspense, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { browserAnalyticsHost, isProductionAnalyticsHost } from '@/lib/analytics-host'
import { GA_MEASUREMENT_ID, pageview } from '@/lib/gtag'

function GoogleAnalyticsInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    setAllowed(isProductionAnalyticsHost(browserAnalyticsHost()))
  }, [])

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !allowed) return
    const query = searchParams.toString()
    const url = query ? `${pathname}?${query}` : pathname
    pageview(url)
  }, [pathname, searchParams, allowed])

  if (!GA_MEASUREMENT_ID || !allowed) return null

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  )
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  )
}
