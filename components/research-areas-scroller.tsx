'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

// "Scroll" layout of the Research areas block: the stream copy scrolls while a
// pinned image panel cross-fades to whichever stream is in the middle of the
// viewport. Copy and markup are rendered on the server (site-blocks.tsx); this
// only tracks which item is active.

export type ScrollerArea = { id: string; anchor: string; title: string; image: string | null; content: ReactNode }

export function ResearchAreasScroller({ areas }: { areas: ScrollerArea[] }) {
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const items = Array.from(listRef.current?.children ?? []) as HTMLElement[]
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(items.indexOf(e.target as HTMLElement))
      },
      { rootMargin: '-45% 0px -45% 0px' }
    )
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [areas.length])

  const current = areas[active]
  return (
    <div className="ras">
      <ol className="ras-list" ref={listRef}>
        {areas.map((area, i) => (
          <li key={area.id} id={area.anchor} className={i === active ? 'ras-item is-active' : 'ras-item'}>
            {area.image && (
              <div className="ras-item-media">
                <img src={area.image} alt="" loading="lazy" decoding="async" />
              </div>
            )}
            {area.content}
          </li>
        ))}
      </ol>
      <div className="ras-stage" aria-hidden="true">
        <div className="ras-frame">
          {areas.map((area, i) =>
            area.image ? <img key={area.id} src={area.image} alt="" className={i === active ? 'is-active' : ''} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" /> : null
          )}
          <div className="ras-caption">
            <span className="ras-caption-count">
              {String(active + 1).padStart(2, '0')} <span>/ {String(areas.length).padStart(2, '0')}</span>
            </span>
            <span className="ras-caption-title">{current?.title}</span>
          </div>
        </div>
        <div className="ras-progress">
          {areas.map((area, i) => <span key={area.id} className={i === active ? 'is-active' : ''} />)}
        </div>
      </div>
    </div>
  )
}
