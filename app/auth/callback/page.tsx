'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/** Handles OAuth redirect; session is established before returning to home. */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function finish() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      } else {
        await supabase.auth.getSession()
      }
      router.replace('/')
    }
    finish()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(240,237,232,0.45)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
    }}>
      Signing you in…
    </div>
  )
}
