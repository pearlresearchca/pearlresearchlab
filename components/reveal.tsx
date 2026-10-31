'use client'

import { useEffect, useRef, useState } from 'react'

export function Reveal({ children, className = '', delay = 0, as: Tag = 'div', id }: { children: React.ReactNode; className?: string; delay?: number; as?: 'div' | 'li' | 'article' | 'section'; id?: string }) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref as React.Ref<never>} id={id} className={`${className} reveal ${visible ? 'is-visible' : ''}`} style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  )
}
