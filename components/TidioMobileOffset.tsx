'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    tidioChatApi?: {
      on: (event: string, callback: () => void) => void
      adjustStyles: (css: string) => void
    }
  }
}

function applyOffset() {
  window.tidioChatApi?.adjustStyles(
    '@media only screen and (max-width: 980px) { #tidio, #tidio-chat { bottom: 16px !important; right: 12px !important; z-index: 80 !important; } }',
  )
}

export default function TidioMobileOffset() {
  useEffect(() => {
    if (window.tidioChatApi) {
      window.tidioChatApi.on('ready', applyOffset)
    } else {
      document.addEventListener('tidioChat-ready', applyOffset)
    }

    return () => {
      document.removeEventListener('tidioChat-ready', applyOffset)
    }
  }, [])

  return null
}
