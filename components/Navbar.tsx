'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Props {
  onAuthClick: () => void
  onLogoClick?: () => void
}

function userAvatar(user: User): string | null {
  const meta = user.user_metadata
  if (!meta || typeof meta !== 'object') return null
  const url = meta.avatar_url ?? meta.picture
  return typeof url === 'string' && url.length > 0 ? url : null
}

function userLabel(user: User): string {
  const meta = user.user_metadata
  if (meta && typeof meta === 'object' && typeof meta.full_name === 'string' && meta.full_name) {
    return meta.full_name
  }
  return user.email?.split('@')[0] ?? 'Account'
}

export default function Navbar({ onAuthClick, onLogoClick }: Props) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const avatar = user ? userAvatar(user) : null

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      padding: '20px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 100,
      background: 'linear-gradient(to bottom, rgba(10,10,15,0.95), transparent)',
      backdropFilter: 'blur(10px)',
    }}>
      <Link
        href="/"
        onClick={(e) => {
          if (pathname === '/') {
            e.preventDefault()
            onLogoClick?.()
          }
        }}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32,
          fontWeight: 900,
          color: '#f0ede8',
          textDecoration: 'none',
          cursor: 'pointer',
          letterSpacing: -0.5,
        }}
      >
        <span style={{ color: '#f0ede8' }}>Live</span><span style={{ color: '#c8f05a' }}>Where</span>
      </Link>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link
          href="/city-guides"
          style={{
            fontSize: 13, color: 'rgba(240,237,232,0.6)', textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}
        >
          City Guides
        </Link>
        <Link
          href="/blog"
          style={{
            fontSize: 13, color: 'rgba(240,237,232,0.6)', textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}
        >
          Blog
        </Link>
        <Link
          href="/affiliates"
          style={{
            fontSize: 13, color: 'rgba(240,237,232,0.6)', textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}
        >
          Affiliates
        </Link>
        <div style={{
          background: 'rgba(200,240,90,0.1)', border: '1px solid rgba(200,240,90,0.3)',
          color: '#c8f05a', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500
        }}>
          ✦ AI-Powered
        </div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {avatar ? (
              <img
                src={avatar}
                alt=""
                width={32}
                height={32}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(200,240,90,0.15)',
                  border: '1px solid rgba(200,240,90,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#c8f05a',
                }}
                aria-hidden
              >
                {userLabel(user).charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: 180 }}>
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#f0ede8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}>
                {userLabel(user)}
              </span>
              {user.email && (
                <span style={{
                  fontSize: 11,
                  color: 'rgba(240,237,232,0.45)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}>
                  {user.email}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(240,237,232,0.6)',
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
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
