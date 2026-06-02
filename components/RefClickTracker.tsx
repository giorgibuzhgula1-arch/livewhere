'use client'

import { useEffect } from 'react'
import { REF_COOKIE_NAME } from '@/lib/affiliate'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export default function RefClickTracker() {
  useEffect(() => {
    const ref = getCookie(REF_COOKIE_NAME)
    if (!ref) return

    const key = `lw_ref_tracked_${ref}`
    if (sessionStorage.getItem(key)) return

    fetch('/api/track-click', { method: 'POST', credentials: 'include' })
      .then(() => sessionStorage.setItem(key, '1'))
      .catch(() => {})
  }, [])

  return null
}
