'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './ui'

// Dropdown menu rendered in a portal with fixed positioning, so it's never
// clipped by tables, scroll areas or cards (overflow: hidden/auto).

type Ctx = { close: () => void }
const MenuCtx = createContext<Ctx>({ close: () => undefined })

export function Menu({
  trigger,
  children,
  align = 'end',
  width = 220,
  label,
}: {
  trigger: (props: { ref: (el: HTMLElement | null) => void; onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu' }) => ReactNode
  children: ReactNode
  align?: 'start' | 'end'
  width?: number
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null)
  const triggerEl = useRef<HTMLElement | null>(null)
  const menuEl = useRef<HTMLDivElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    triggerEl.current?.focus()
  }, [])

  const place = useCallback(() => {
    const t = triggerEl.current
    if (!t) return
    const r = t.getBoundingClientRect()
    const menuH = menuEl.current?.offsetHeight ?? 240
    const spaceBelow = window.innerHeight - r.bottom
    const up = spaceBelow < menuH + 12 && r.top > menuH + 12
    let left = align === 'end' ? r.right - width : r.left
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
    setPos({ top: up ? r.top - menuH - 6 : r.bottom + 6, left, up })
  }, [align, width])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (menuEl.current?.contains(e.target as Node) || triggerEl.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = Array.from(menuEl.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [])
        const i = items.indexOf(document.activeElement as HTMLElement)
        const next = e.key === 'ArrowDown' ? items[(i + 1) % items.length] : items[(i - 1 + items.length) % items.length]
        next?.focus()
      }
    }
    const onScroll = () => place()
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    // Focus the first item for keyboard users.
    requestAnimationFrame(() => menuEl.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus())
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, close, place])

  return (
    <MenuCtx.Provider value={{ close }}>
      {trigger({
        ref: (el) => {
          triggerEl.current = el
        },
        onClick: () => setOpen((o) => !o),
        'aria-expanded': open,
        'aria-haspopup': 'menu',
      })}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuEl}
            role="menu"
            aria-label={label}
            style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, zIndex: 1000 }}
            className={cx('admin-ui flex flex-col rounded-xl border border-border bg-surface p-1.5 text-sm text-foreground shadow-[0_12px_40px_-8px_rgba(15,23,42,.25)] ring-1 ring-black/5', pos?.up ? 'animate-in fade-in slide-in-from-bottom-1' : 'animate-in fade-in slide-in-from-top-1')}
          >
            {children}
          </div>,
          document.body
        )}
    </MenuCtx.Provider>
  )
}

export function MenuItem({
  children,
  onSelect,
  href,
  icon,
  danger,
  disabled,
  external,
}: {
  children: ReactNode
  onSelect?: () => void
  href?: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  external?: boolean
}) {
  const { close } = useContext(MenuCtx)
  const cls = cx(
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium outline-none transition [&_svg]:size-4 [&_svg]:shrink-0',
    danger ? 'text-red-600 hover:bg-red-50 focus:bg-red-50' : 'text-foreground hover:bg-muted focus:bg-muted',
    disabled && 'pointer-events-none opacity-40'
  )
  if (href) {
    return (
      <a role="menuitem" href={href} className={cls} aria-disabled={disabled} onClick={() => close()} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        <span className={danger ? '' : 'text-muted-foreground'}>{icon}</span>
        {children}
      </a>
    )
  }
  return (
    <button
      type="button"
      role="menuitem"
      className={cls}
      aria-disabled={disabled}
      onClick={() => {
        close()
        onSelect?.()
      }}
    >
      <span className={danger ? '' : 'text-muted-foreground'}>{icon}</span>
      {children}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" role="separator" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</div>
}
