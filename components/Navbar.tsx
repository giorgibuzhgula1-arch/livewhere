'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Props {
  onAuthClick: () => void
}

export default function Navbar({ onAuthClick }: Props) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      padding: '20px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 100,
      background: 'linear-gradient(to bottom, rgba(10,10,15,0.95), transparent)',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900 }}>
        Live<span style={{ color: '#c8f05a' }}>Where</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{
          background: 'rgba(200,240,90,0.1)', border: '1px solid rgba(200,240,90,0.3)',
          color: '#c8f05a', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500
        }}>
          ✦ AI-Powered
        </div>
        {user ? (
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(240,237,232,0.6)', padding: '8px 16px',
              borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
            }}
          >
            Sign out
          </button>
        ) : (
          <button
            onClick={onAuthClick}
            style={{
              background: '#c8f05a', border: 'none', color: '#0a0a0f',
              padding: '8px 20px', borderRadius: 10, fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
            }}
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  )
}
