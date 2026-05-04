'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Props {
  isOpen: boolean
  mode: 'login' | 'signup'
  onClose: () => void
  onModeSwitch: () => void
}

export default function AuthModal({ isOpen, mode, onClose, onModeSwitch }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onClose()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#1a1a26',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#f0ede8', padding: '14px 18px', borderRadius: 12,
    fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none',
    marginBottom: 12
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              background: '#12121a', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 24, padding: 40, maxWidth: 400, width: '100%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700 }}>
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.45)', fontSize: 20, cursor: 'pointer' }}>✕</button>
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
                <input
                  type="email" placeholder="Email" value={email}
                  onChange={e => setEmail(e.target.value)} style={inputStyle}
                />
                <input
                  type="password" placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)} style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />

                {error && (
                  <div style={{ background: 'rgba(240,90,140,0.1)', border: '1px solid rgba(240,90,140,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f05a8c', fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <button onClick={handleSubmit} disabled={loading} style={{
                  width: '100%', background: '#c8f05a', color: '#0a0a0f',
                  border: 'none', padding: '16px', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", marginBottom: 16
                }}>
                  {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(240,237,232,0.45)' }}>
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={onModeSwitch} style={{ background: 'none', border: 'none', color: '#c8f05a', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
