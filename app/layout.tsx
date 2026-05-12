import type { Metadata } from 'next'
import Script from 'next/script'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

const GA_MEASUREMENT_ID = 'G-8BKJ3L5SQB'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'LiveWhere — Find Your Perfect City',
  description: 'AI-powered city recommendation. Enter your salary, set priorities, discover the best cities for your lifestyle.',
  openGraph: {
    title: 'LiveWhere — Find Your Perfect City',
    description: 'Stop guessing where to live. Let data decide.',
  },
  verification: {
    google: '0nIljKmgZB9PIlt13uYYNyc9f1O8OPmTgYBfZ8SGD14',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <div className="orb orb1" aria-hidden />
        <div className="orb orb2" aria-hidden />
        <div className="app-shell">{children}</div>
      </body>
    </html>
  )
}
