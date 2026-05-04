import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LiveWhere — Find Your Perfect City',
  description: 'AI-powered city recommendation. Enter your salary, set priorities, discover the best cities for your lifestyle.',
  openGraph: {
    title: 'LiveWhere — Find Your Perfect City',
    description: 'Stop guessing where to live. Let data decide.',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="orb orb1" aria-hidden />
        <div className="orb orb2" aria-hidden />
        <div className="app-shell">{children}</div>
      </body>
    </html>
  )
}
