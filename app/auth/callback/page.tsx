'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  confirmAuthSessionReady,
  loadOAuthNext,
  markOAuthReturn,
  clearOAuthNext,
} from '@/lib/wait-for-session'
import { trackSignUp } from '@/lib/gtag'
import { trackSignupCompleted } from '@/lib/analytics'
import type { User } from '@supabase/supabase-js'

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

/**
 * Client-side OAuth callback. Exchanges the code in-browser (PKCE verifier lives
 * here), waits for a confirmed session, then hard-navigates so cookies persist on mobile.
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Signing you in…')

  useEffect(() => {
    let cancelled = false
    let redirecting = false
    let signUpTracked = false

    function trackNewGoogleSignUp(user: User) {
      if (signUpTracked) return
      const createdAt = new Date(user.created_at).getTime()
      if (Date.now() - createdAt < 60_000) {
        signUpTracked = true
        trackSignUp('google')
        trackSignupCompleted('google')
      }
    }

    function hardRedirect(path: string) {
      if (redirecting || cancelled) return
      redirecting = true
      markOAuthReturn()
      clearOAuthNext()
      window.location.replace(path)
    }

    async function finish() {
      const params = new URLSearchParams(window.location.search)
      const oauthError = params.get('error')
      const code = params.get('code')
      const next = safeNextPath(params.get('next') || loadOAuthNext())

      if (oauthError) {
        console.error('OAuth error:', oauthError, params.get('error_description'))
        hardRedirect('/?auth_error=oauth')
        return
      }

      if (code) {
        setStatus('Completing sign-in…')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('exchangeCodeForSession:', error.message)
          hardRedirect('/?auth_error=oauth')
          return
        }
        window.history.replaceState(null, '', window.location.pathname)
      }

      setStatus('Saving your session…')
      const session = await confirmAuthSessionReady(12, 100)
      if (cancelled) return

      if (session?.user) {
        trackNewGoogleSignUp(session.user)
        setStatus('Redirecting…')
        hardRedirect(next)
        return
      }

      setStatus('Waiting for session…')
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          session?.user &&
          (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')
        ) {
          subscription.unsubscribe()
          void (async () => {
            const ready = await confirmAuthSessionReady(8, 100)
            if (ready?.user) {
              trackNewGoogleSignUp(ready.user)
              hardRedirect(next)
            }
          })()
        }
      })

      window.setTimeout(async () => {
        subscription.unsubscribe()
        if (cancelled || redirecting) return
        const retry = await confirmAuthSessionReady(5, 100)
        if (retry?.user) {
          trackNewGoogleSignUp(retry.user)
          hardRedirect(next)
        } else {
          hardRedirect('/?auth_error=session')
        }
      }, 1500)
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      color: 'rgba(240,237,232,0.45)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
      padding: 20,
      textAlign: 'center',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid #1a1a26',
        borderTopColor: '#c8f05a',
        borderRadius: '50%',
        animation: 'oauth-spin 1s linear infinite',
      }} />
      <style>{`@keyframes oauth-spin { to { transform: rotate(360deg) } }`}</style>
      {status}
    </div>
  )
}
