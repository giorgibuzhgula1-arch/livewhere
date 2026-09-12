'use client'

import { useEffect, useState } from 'react'

function readProgress() {
  const el = document.documentElement
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) return 0
  return Math.min(1, Math.max(0, el.scrollTop / max))
}

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setProgress(readProgress()))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const ro = new ResizeObserver(update)
    ro.observe(document.documentElement)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="scroll-progress" aria-hidden>
      <div className="scroll-progress-fill" style={{ transform: `scaleY(${progress})` }} />
    </div>
  )
}
