'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchUserProfile, hasMonitorAccess, isPaidPlan } from '@/lib/plan'
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

const mainPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  color: 'rgba(200,240,90,0.85)',
  textDecoration: 'none',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  padding: '5px 12px',
  borderRadius: 20,
  background: 'rgba(200,240,90,0.06)',
  border: '1px solid rgba(200,240,90,0.18)',
}

const mobilePillStyle: React.CSSProperties = {
  ...mainPillStyle,
  width: '100%',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 12,
  boxSizing: 'border-box',
}

const newBadgeStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  color: '#c8f05a',
  background: 'rgba(200,240,90,0.12)',
  border: '1px solid rgba(200,240,90,0.22)',
  padding: '2px 5px',
  borderRadius: 6,
  lineHeight: 1.2,
}

const secondaryLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'rgba(200,240,90,0.42)',
  textDecoration: 'none',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 500,
}

const mobileSecondaryStyle: React.CSSProperties = {
  ...mobilePillStyle,
  color: 'rgba(200,240,90,0.55)',
  background: 'rgba(200,240,90,0.03)',
  border: '1px solid rgba(200,240,90,0.1)',
  fontWeight: 500,
}

export default function Navbar({ onAuthClick, onLogoClick }: Props) {
  const pathname = usePathname()
  const navRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [paid, setPaid] = useState(false)
  const [monitorAccess, setMonitorAccess] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        void fetchUserProfile().then((profile) => {
          setPaid(isPaidPlan(profile.plan))
          setMonitorAccess(hasMonitorAccess(profile))
        })
      } else {
        setPaid(false)
        setMonitorAccess(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        void fetchUserProfile().then((profile) => {
          setPaid(isPaidPlan(profile.plan))
          setMonitorAccess(hasMonitorAccess(profile))
        })
      } else {
        setPaid(false)
        setMonitorAccess(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    closeMobile()
  }, [pathname, closeMobile])

  useEffect(() => {
    if (!mobileOpen) return

    function handleOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeMobile()
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside as EventListener)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside as EventListener)
    }
  }, [mobileOpen, closeMobile])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => {
      if (mq.matches) closeMobile()
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [closeMobile])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const avatar = user ? userAvatar(user) : null

  function renderMobileLinks(onNavigate?: () => void) {
    const pill = { ...mobilePillStyle }
    const secondary = { ...mobileSecondaryStyle }

    return (
      <>
        <Link href="/compare" style={pill} onClick={onNavigate}>
          Compare Cities
          <span style={newBadgeStyle}>New</span>
        </Link>
        {user && (
          <Link href="/plans" style={pill} onClick={onNavigate}>
            My Plans
          </Link>
        )}
        {user && monitorAccess && (
          <Link href="/plans?tab=monitor" style={pill} onClick={onNavigate}>
            Monitor
          </Link>
        )}
        <Link href="/city-guides" style={secondary} onClick={onNavigate}>
          City Guides
        </Link>
        <Link href="/blog" style={secondary} onClick={onNavigate}>
          Blog
        </Link>
        <Link href="/affiliates" style={secondary} onClick={onNavigate}>
          Affiliates
        </Link>
      </>
    )
  }

  return (
    <div ref={navRef}>
      <style>{`
        .navbar-desktop-links {
          display: flex;
        }
        .navbar-desktop-auth-extras {
          display: flex;
        }
        .navbar-hamburger {
          display: none;
        }
        .navbar-mobile-panel {
          display: none;
        }
        @media (max-width: 767px) {
          .navbar-root {
            padding: 16px 20px !important;
          }
          .navbar-logo {
            font-size: 28px !important;
          }
          .navbar-desktop-links,
          .navbar-desktop-auth-extras {
            display: none !important;
          }
          .navbar-hamburger {
            display: inline-flex;
          }
          .navbar-mobile-panel {
            display: flex;
          }
        }
        @keyframes navbarSlideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .navbar-mobile-panel-open {
          animation: navbarSlideDown 0.22s ease forwards;
        }
      `}</style>

      <nav
        className="navbar-root"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          zIndex: 100,
          background: 'linear-gradient(to bottom, rgba(10,10,15,0.95), transparent)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link
          href="/"
          className="navbar-logo"
          onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault()
              onLogoClick?.()
            }
            closeMobile()
          }}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 36,
            fontWeight: 900,
            color: '#f0ede8',
            textDecoration: 'none',
            cursor: 'pointer',
            letterSpacing: -0.5,
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#f0ede8' }}>Live</span>
          <span style={{ color: '#c8f05a' }}>Where</span>
        </Link>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexShrink: 0,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <div
            className="navbar-desktop-links"
            style={{
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/compare" style={mainPillStyle}>
              Compare Cities
              <span style={newBadgeStyle}>New</span>
            </Link>
            {user && (
              <Link href="/plans" style={mainPillStyle}>
                My Plans
              </Link>
            )}
            {user && monitorAccess && (
              <Link href="/plans?tab=monitor" style={mainPillStyle}>
                Monitor
              </Link>
            )}
            <Link href="/city-guides" style={secondaryLinkStyle}>
              City Guides
            </Link>
            <Link href="/blog" style={secondaryLinkStyle}>
              Blog
            </Link>
            <Link href="/affiliates" style={secondaryLinkStyle}>
              Affiliates
            </Link>
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
              <div
                className="navbar-desktop-auth-extras"
                style={{ flexDirection: 'column', alignItems: 'flex-end', maxWidth: 180 }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#f0ede8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {userLabel(user)}
                </span>
                {user.email && (
                  <span
                    style={{
                      fontSize: 11,
                      color: 'rgba(240,237,232,0.45)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {user.email}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="navbar-desktop-auth-extras"
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
                background: '#c8f05a',
                border: 'none',
                color: '#0a0a0f',
                padding: '8px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Sign in
            </button>
          )}

          <button
            type="button"
            className="navbar-hamburger"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              background: 'rgba(200,240,90,0.08)',
              border: '1px solid rgba(200,240,90,0.25)',
              borderRadius: 10,
              color: '#c8f05a',
              fontSize: 20,
              lineHeight: 1,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              flexShrink: 0,
            }}
          >
            ☰
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="navbar-mobile-panel navbar-mobile-panel-open"
          style={{
            position: 'fixed',
            top: 68,
            left: 0,
            right: 0,
            zIndex: 99,
            flexDirection: 'column',
            gap: 10,
            padding: '16px 20px 24px',
            background: 'rgba(10,10,15,0.98)',
            borderBottom: '1px solid rgba(200,240,90,0.15)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            maxHeight: 'calc(100vh - 68px)',
            overflowY: 'auto',
          }}
        >
          {renderMobileLinks(closeMobile)}

          {user && (
            <button
              type="button"
              onClick={() => {
                closeMobile()
                void supabase.auth.signOut()
              }}
              style={{
                width: '100%',
                marginTop: 4,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(240,237,232,0.6)',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  )
}
