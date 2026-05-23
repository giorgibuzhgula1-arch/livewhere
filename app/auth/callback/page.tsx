'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/** Handles OAuth redirect; session is established before returning to home. */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let done = false

    async function redirectHome() {
      if (done) return
      done = true
      router.replace('/')
    }

    async function finish() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('OAuth callback:', error)
          await redirectHome()
          return
        }
      }

      // Ensure session is persisted before leaving this page (avoids race on /).
      for (let i = 0; i < 25; i++) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await redirectHome()
          return
        }
        await new Promise((r) => setTimeout(r, 80))
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          session?.user &&
          (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')
        ) {
          subscription.unsubscribe()
          void redirectHome()
        }
      })

      window.setTimeout(() => {
        void redirectHome()
      }, 6000)
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
