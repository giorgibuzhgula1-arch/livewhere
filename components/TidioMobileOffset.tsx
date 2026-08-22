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
  window.tidioChatApi.adjustStyles(
    '@media only screen and (max-width: 980px) { #tidio { bottom: 100px !important; } }',
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
