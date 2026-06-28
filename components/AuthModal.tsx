'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { getSiteUrl } from '@/lib/site-url'
import { markPendingAuthRestore, saveOAuthNext } from '@/lib/wait-for-session'
import { trackSignUp } from '@/lib/gtag'

interface Props {
  isOpen: boolean
  mode: 'login' | 'signup'
  onClose: () => void
  onModeSwitch: () => void
  /** When true, show Google sign-in only (e.g. before running analysis). */
  googleOnly?: boolean
}

export default function AuthModal({
  isOpen,
  mode,
  onClose,
  onModeSwitch,
  googleOnly = false,
}: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setFullName('')
      setEmail('')
      setPassword('')
      setError(null)
      setSuccess(false)
      setLoading(false)
    }
  }, [isOpen])

  function authRedirectOrigin() {
    return typeof window !== 'undefined' ? window.location.origin : getSiteUrl()
  }

  async function signInWithGoogle() {
    setLoading(true)
    setError(null)
    const nextPath = googleOnly ? '/?restore=results' : '/'
    saveOAuthNext(nextPath)
    if (googleOnly) {
      markPendingAuthRestore()
    }

    const origin =
      typeof window !== 'undefined' ? window.location.origin : getSiteUrl()
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setError(null)

    const trimmedEmail = email.trim()
    const trimmedName = fullName.trim()

    try {
      if (mode === 'signup') {
        if (!trimmedName) {
          throw new Error('Please enter your full name')
        }
        if (!trimmedEmail) {
          throw new Error('Please enter your email')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        const redirectTo = `${authRedirectOrigin()}/auth/callback?next=${encodeURIComponent('/')}`

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: trimmedName },
            emailRedirectTo: redirectTo,
          },
        })
        if (signUpError) throw signUpError

        trackSignUp('email')

        if (data.session) {
          onClose()
          return
        }

        setSuccess(true)
      } else {
        if (!trimmedEmail) {
          throw new Error('Please enter your email')
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
        if (signInError) throw signInError
        onClose()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  function handleModeSwitch() {
    setError(null)
    setSuccess(false)
    onModeSwitch()
  }

  const inputStyle = {
    width: '100%',
    background: '#1a1a26',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#f0ede8',
    padding: '14px 18px',
    borderRadius: 12,
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    marginBottom: 12,
  }

  const title = googleOnly
    ? 'Sign in to analyze your cities'
    : mode === 'login'
      ? 'Welcome back'
      : 'Create account'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 24,
              padding: 40,
              maxWidth: 400,
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 32,
              }}
            >
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700 }}>
                {title}
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(240,237,232,0.45)',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {success ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
                <p style={{ color: 'rgba(240,237,232,0.7)', lineHeight: 1.6 }}>
                  Check your email to confirm your account, then come back to sign in.
                </p>
              </div>
            ) : (
              <>
                {googleOnly && (
                  <p style={{
                    fontSize: 14,
                    color: 'rgba(240,237,232,0.55)',
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}>
                    Sign in with Google to run your personalized city analysis and save your results.
                  </p>
                )}

                {error && (
                  <div
                    style={{
                      background: 'rgba(240,90,140,0.1)',
                      border: '1px solid rgba(240,90,140,0.3)',
                      borderRadius: 10,
                      padding: '12px 16px',
                      marginBottom: 16,
                      color: '#f05a8c',
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: '#fff',
                    color: '#0a0a0f',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '14px 16px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    fontFamily: "'DM Sans', sans-serif",
                    marginBottom: googleOnly ? 0 : 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  <GoogleIcon />
                  Sign in with Google
                </button>

                {!googleOnly && (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        margin: '20px 0',
                        color: 'rgba(240,237,232,0.35)',
                        fontSize: 12,
                      }}
                    >
                      <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                      or
                      <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                    </div>

                    <form onSubmit={handleSubmit}>
                      {mode === 'signup' && (
                        <input
                          type="text"
                          name="fullName"
                          autoComplete="name"
                          placeholder="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          style={inputStyle}
                        />
                      )}
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle}
                      />
                      <input
                        type="password"
                        name="password"
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={inputStyle}
                      />

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          background: '#c8f05a',
                          color: '#0a0a0f',
                          border: 'none',
                          padding: '16px',
                          borderRadius: 12,
                          fontSize: 15,
                          fontWeight: 700,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.7 : 1,
                          fontFamily: "'DM Sans', sans-serif",
                          marginBottom: 16,
                        }}
                      >
                        {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
                      </button>
                    </form>

                    <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(240,237,232,0.45)' }}>
                      {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                      <button
                        type="button"
                        onClick={handleModeSwitch}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#c8f05a',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {mode === 'login' ? 'Sign up' : 'Sign in'}
                      </button>
                    </p>
                  </>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
