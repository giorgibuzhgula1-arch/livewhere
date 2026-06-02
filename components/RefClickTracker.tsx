'use client'

import { useEffect } from 'react'
import { REF_COOKIE_NAME, normalizeReferralCode } from '@/lib/affiliate'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export default function RefClickTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const refFromUrl = params.get('ref')
    const refRaw = refFromUrl || getCookie(REF_COOKIE_NAME)
    if (!refRaw) return

    const ref = normalizeReferralCode(refRaw)
    if (!ref) return

    const key = `lw_ref_tracked_${ref}`
    if (sessionStorage.getItem(key)) return

    const trackUrl = refFromUrl
      ? `/api/track-click?ref=${encodeURIComponent(refFromUrl)}`
      : '/api/track-click'

    fetch(trackUrl, { method: 'POST', credentials: 'include' })
      .then(() => sessionStorage.setItem(key, '1'))
      .catch(() => {})
  }, [])

  return null
}
