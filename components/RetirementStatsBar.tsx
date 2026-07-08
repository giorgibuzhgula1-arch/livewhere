'use client'

import { useEffect, useState } from 'react'
import WhyPeopleUseLiveWhere from '@/components/WhyPeopleUseLiveWhere'

const INITIAL_COUNT = 11683

function randomIncrementDelayMs(): number {
  return 8000 + Math.random() * 7000
}

function randomIncrementAmount(): number {
  return 1 + Math.floor(Math.random() * 3)
}

export default function RetirementStatsBar() {
  const [plansExplored, setPlansExplored] = useState(INITIAL_COUNT)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      setPlansExplored((count) => count + randomIncrementAmount())
      timeoutId = setTimeout(tick, randomIncrementDelayMs())
    }

    timeoutId = setTimeout(tick, randomIncrementDelayMs())

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px', position: 'relative', zIndex: 1 }}>
      <WhyPeopleUseLiveWhere embedded plansExplored={plansExplored} />
    </section>
  )
}
