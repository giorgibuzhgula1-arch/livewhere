import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Outreach Admin — LiveWhere',
  robots: { index: false, follow: false },
}

export default function AdminOutreachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
