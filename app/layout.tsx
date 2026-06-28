import type { Metadata } from 'next'
import Script from 'next/script'
import RefClickTracker from '@/components/RefClickTracker'
import { getSiteUrl } from '@/lib/site-url'
import { dmSans, playfair } from '@/lib/fonts'
import './globals.css'

const GA_MEASUREMENT_ID = 'G-8BKJ3L5SQB'
const CLARITY_PROJECT_ID = 'x4vqdz3sfo'
const CRISP_WEBSITE_ID = '21955386-aa52-45a9-a036-2833b4534d80'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'LiveWhere — Find Your Perfect City',
  description: 'AI-powered city recommendation. Enter your salary, set priorities, discover the best cities for your lifestyle.',
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
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
            console.log('[GA4] gtag configured:', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
          `}
        </Script>
        <Script id="crisp-chat" strategy="afterInteractive">
          {`
            window.$crisp=[];
            window.CRISP_WEBSITE_ID="${CRISP_WEBSITE_ID}";
            (function(){
              d=document;
              s=d.createElement("script");
              s.src="https://client.crisp.chat/l.js";
              s.async=1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
          `}
        </Script>
      </head>
      <body className={dmSans.className}>
        <div className="orb orb1" aria-hidden />
        <div className="orb orb2" aria-hidden />
        <RefClickTracker />
        <div className="app-shell">{children}</div>
      </body>
    </html>
  )
}
