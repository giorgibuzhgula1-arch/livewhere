'use client'

import { useEffect, useRef, useState } from 'react'
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

const SESSION_FAIL_MESSAGE =
  'Something went wrong, please try signing in again'

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
  const [showRetry, setShowRetry] = useState(false)
  /** Strict Mode may remount; PKCE code+verifier are single-use — exchange only once per page instance. */
  const codeExchangeAttemptedRef = useRef(false)

  useEffect(() => {
    let active = true
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

    function redirectHome(path: string, oauthSuccess: boolean) {
      if (redirecting || !active) return
      redirecting = true
      if (oauthSuccess) {
        markOAuthReturn()
      }
      clearOAuthNext()
      window.location.replace(path)
    }

    function failWithRetry(message: string) {
      if (!active || redirecting) return
      setShowRetry(true)
      setStatus(message)
    }

    async function finish() {
      const params = new URLSearchParams(window.location.search)
      const oauthError = params.get('error')
      const code = params.get('code')
      const next = safeNextPath(params.get('next') || loadOAuthNext())

      if (oauthError) {
        console.error('OAuth error:', oauthError, params.get('error_description'))
        redirectHome('/?auth_error=oauth', false)
        return
      }

      if (code) {
        if (!codeExchangeAttemptedRef.current) {
          codeExchangeAttemptedRef.current = true
          if (!active) return
          setStatus('Completing sign-in…')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!active) return
          if (error) {
            console.error('exchangeCodeForSession:', error)
            redirectHome('/?auth_error=oauth', false)
            return
          }
          window.history.replaceState(null, '', window.location.pathname)
        }
        // Second pass on same instance: skip exchange; fall through to session wait.
      }

      if (!active) return
      setStatus('Saving your session…')
      const session = await confirmAuthSessionReady(12, 100)
      // Unmounted/remounted: do not touch UI — the new effect owns the spinner.
      if (!active) return

      if (session?.user) {
        trackNewGoogleSignUp(session.user)
        setStatus('Redirecting…')
        redirectHome(next, true)
        return
      }

      // Timed-out / no session: never leave an infinite spinner.
      failWithRetry(SESSION_FAIL_MESSAGE)
    }

    void finish()
    return () => {
      active = false
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
      {!showRetry && (
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #1a1a26',
          borderTopColor: '#c8f05a',
          borderRadius: '50%',
          animation: 'oauth-spin 1s linear infinite',
        }} />
      )}
      <style>{`@keyframes oauth-spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ margin: 0, maxWidth: 360, lineHeight: 1.5 }}>{status}</p>
      {showRetry && (
        <button
          type="button"
          onClick={() => {
            window.location.assign('/')
          }}
          style={{
            background: '#c8f05a',
            color: '#0a0a0f',
            border: 'none',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Try signing in again
        </button>
      )}
    </div>
  )
}
