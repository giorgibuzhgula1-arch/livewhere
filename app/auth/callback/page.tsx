'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { markOAuthReturn, waitForAuthSession } from '@/lib/wait-for-session'

/** Handles OAuth redirect; session is established before returning to home. */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let done = false

    async function redirectHome() {
      if (done) return
      done = true
      markOAuthReturn()
      router.replace('/')
    }

    async function finish() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('OAuth callback:', error)
          router.replace('/')
          return
        }
        window.history.replaceState(null, '', window.location.pathname)
      }

      const session = await waitForAuthSession(80, 100)
      if (session?.user) {
        await redirectHome()
        return
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          session?.user &&
          (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')
        ) {
          subscription.unsubscribe()
          void redirectHome()
        }
      })

      window.setTimeout(() => {
        subscription.unsubscribe()
        void redirectHome()
      }, 10000)
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
