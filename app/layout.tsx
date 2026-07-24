import type { Metadata } from 'next'
import Script from 'next/script'
import RefClickTracker from '@/components/RefClickTracker'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { PostHogProvider } from '@/app/providers'
import { getSiteUrl } from '@/lib/site-url'
import { dmSans, playfair } from '@/lib/fonts'
import './globals.css'

const CLARITY_PROJECT_ID = 'x4vqdz3sfo'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'LiveWhere — Find Your Perfect City',
  description: 'Personalized city recommendation. Enter your salary, set priorities, discover the best cities for your lifestyle.',
  alternates: {
    canonical: 'https://www.livewhere.io',
  },
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
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <head>
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5QP723VG');`,
          }}
        />
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
          `}
        </Script>
        <Script
          src="https://code.tidio.co/epmebrwxqyubp902tcis4izbo59fnbly.js"
          strategy="afterInteractive"
          async
        />
      </head>
      <body className={dmSans.className}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5QP723VG"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <PostHogProvider>
          <GoogleAnalytics />
          <div className="orb orb1" aria-hidden />
          <div className="orb orb2" aria-hidden />
          <RefClickTracker />
          <div className="app-shell">{children}</div>
        </PostHogProvider>
      </body>
    </html>
  )
}
