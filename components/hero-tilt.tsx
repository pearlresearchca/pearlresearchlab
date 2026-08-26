'use client'

import { useRef } from 'react'

export function HeroTilt({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const node = ref.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = node.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    node.style.setProperty('--tilt-x', `${(-y * 6).toFixed(2)}deg`)
    node.style.setProperty('--tilt-y', `${(x * 8).toFixed(2)}deg`)
    node.style.setProperty('--tilt-lift', '-6px')
  }

  function handleLeave() {
    const node = ref.current
    if (!node) return
    node.style.setProperty('--tilt-x', '0deg')
    node.style.setProperty('--tilt-y', '0deg')
    node.style.setProperty('--tilt-lift', '0px')
  }

  return (
    <div ref={ref} className={`hero-tilt ${className}`} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </div>
  )
}
