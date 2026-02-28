import { useMemo } from 'react'
import type { CSSProperties } from 'react'

interface Particle {
  id:      number
  size:    number
  left:    number
  dur:     number
  delay:   number
  opacity: number
}

// Fixed list — no random() to keep renders deterministic
const PARTICLES: Particle[] = [
  { id:  0, size: 28, left:  7,  dur: 22, delay:  0,   opacity: 0.12 },
  { id:  1, size: 16, left: 17,  dur: 17, delay:  3.2, opacity: 0.09 },
  { id:  2, size: 44, left: 27,  dur: 27, delay:  7,   opacity: 0.06 },
  { id:  3, size: 14, left: 37,  dur: 15, delay:  1.5, opacity: 0.14 },
  { id:  4, size: 34, left: 47,  dur: 25, delay:  9,   opacity: 0.08 },
  { id:  5, size: 20, left: 57,  dur: 20, delay:  4.5, opacity: 0.11 },
  { id:  6, size: 58, left: 67,  dur: 30, delay:  2,   opacity: 0.05 },
  { id:  7, size: 18, left: 77,  dur: 18, delay: 11,   opacity: 0.13 },
  { id:  8, size: 40, left: 87,  dur: 24, delay:  5.5, opacity: 0.07 },
  { id:  9, size: 26, left: 93,  dur: 19, delay:  8,   opacity: 0.1  },
  { id: 10, size: 50, left: 13,  dur: 32, delay: 13,   opacity: 0.04 },
  { id: 11, size: 22, left: 72,  dur: 21, delay: 15,   opacity: 0.13 },
]

export default function BackgroundParticles() {
  const particles = useMemo(() => PARTICLES, [])

  return (
    <>
      <div className="auth-bg-gradient" aria-hidden="true" />
      <div className="auth-particles" aria-hidden="true">
        {particles.map(p => (
          <div
            key={p.id}
            className="auth-particle"
            style={{
              width:   p.size,
              height:  p.size,
              left:    `${p.left}%`,
              opacity: p.opacity,
              '--dur':   `${p.dur}s`,
              '--delay': `${p.delay}s`,
            } as CSSProperties}
          />
        ))}
      </div>
    </>
  )
}
