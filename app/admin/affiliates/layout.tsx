import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Admin — LiveWhere',
  robots: { index: false, follow: false },
}

export default function AdminAffiliatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
