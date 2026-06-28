'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Pricing from '@/components/Pricing'
import styles from '../compare/compare.module.css'

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false })

export default function PricingPageClient() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Back to LiveWhere
      </Link>
      <Pricing
        onUpgrade={() => {
          setAuthMode('signup')
          setAuthOpen(true)
        }}
      />
      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeSwitch={() => setAuthMode((m) => (m === 'login' ? 'signup' : 'login'))}
      />
    </main>
  )
}
