'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Lightbulb, X } from 'lucide-react'
import { TOURS, TOUR_ACTIVE_KEY, markDone, type Tour, type TourTarget } from '@/lib/tours'

// Plays the guided tour started from /admin/tours: dims the screen, cuts a
// spotlight around the control each step is about, and shows an explanation
// card next to it. Mounted on every admin screen and in the page builder.

type Active = { id: string; step: number }
type Rect = { top: number; left: number; width: number; height: number }

const PAD = 8 // spotlight padding around the target
const GAP = 14 // distance between spotlight and card
const EDGE = 12 // minimum distance from the viewport edge

function readActive(): Active | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(TOUR_ACTIVE_KEY) ?? 'null')
    return v && typeof v.id === 'string' && Number.isInteger(v.step) ? v : null
  } catch {
    return null
  }
}

function writeActive(a: Active | null) {
  try {
    if (a) sessionStorage.setItem(TOUR_ACTIVE_KEY, JSON.stringify(a))
    else sessionStorage.removeItem(TOUR_ACTIVE_KEY)
  } catch {}
}

function runsHere(tour: Tour, pathname: string) {
  return tour.href === 'builder' ? pathname.startsWith('/admin/builder/') : pathname === tour.href
}

function findTarget(target: TourTarget | undefined): HTMLElement | null {
  if (!target) return null
  if (typeof target === 'string') {
    // First match that is actually on screen (menus are often duplicated for mobile).
    for (const el of document.querySelectorAll<HTMLElement>(target)) if (visible(el)) return el
    return null
  }
  for (const h of document.querySelectorAll<HTMLElement>('h1, h2, h3')) {
    if (h.textContent?.trim() !== target.heading || !visible(h)) continue
    return h.closest<HTMLElement>('section, [class*="rounded-2xl"], [class*="rounded-xl"]') ?? h.parentElement
  }
  return null
}

function visible(el: Element) {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

function sameRect(a: Rect | null, b: Rect | null) {
  return !!a && !!b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5
}

// Card position: below, above, right or left of the spotlight — whichever fits.
function place(spot: Rect, card: { width: number; height: number }) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clampX = (x: number) => Math.min(Math.max(x, EDGE), vw - card.width - EDGE)
  const clampY = (y: number) => Math.min(Math.max(y, EDGE), vh - card.height - EDGE)
  const cx = spot.left + spot.width / 2
  const cy = spot.top + spot.height / 2
  const options = [
    { side: 'bottom' as const, fits: spot.top + spot.height + GAP + card.height <= vh - EDGE, top: spot.top + spot.height + GAP, left: clampX(cx - card.width / 2) },
    { side: 'top' as const, fits: spot.top - GAP - card.height >= EDGE, top: spot.top - GAP - card.height, left: clampX(cx - card.width / 2) },
    { side: 'right' as const, fits: spot.left + spot.width + GAP + card.width <= vw - EDGE, top: clampY(cy - card.height / 2), left: spot.left + spot.width + GAP },
    { side: 'left' as const, fits: spot.left - GAP - card.width >= EDGE, top: clampY(cy - card.height / 2), left: spot.left - GAP - card.width },
  ]
  const pick = options.find((o) => o.fits) ?? { side: 'inside' as const, top: clampY(vh - card.height - EDGE * 2), left: clampX(cx - card.width / 2) }
  // Arrow offset along the card edge, pointing at the target's centre.
  const arrow = pick.side === 'top' || pick.side === 'bottom' ? Math.min(Math.max(cx - pick.left, 22), card.width - 22) : Math.min(Math.max(cy - pick.top, 22), card.height - 22)
  return { ...pick, arrow }
}

export function TourRunner() {
  const pathname = usePathname()
  const router = useRouter()
  const [active, setActive] = useState<Active | null>(null)
  const [spot, setSpot] = useState<Rect | null>(null)
  const [ready, setReady] = useState(false)
  const [cardSize, setCardSize] = useState({ width: 360, height: 220 })
  const card = useRef<HTMLDivElement>(null)
  const targetEl = useRef<HTMLElement | null>(null)
  const titleId = useId()

  const tour = active ? TOURS.find((t) => t.id === active.id) : undefined
  const step = tour?.steps[active!.step]

  // Pick up a tour started on another screen (or before a reload).
  useEffect(() => {
    const a = readActive()
    const t = a && TOURS.find((x) => x.id === a.id)
    if (!a || !t) return setActive(null)
    if (runsHere(t, pathname)) setActive(a)
    else {
      // Left the tour's screen: end it quietly.
      writeActive(null)
      setActive(null)
    }
  }, [pathname])

  const go = useCallback(
    (next: number) => {
      if (!tour || !active) return
      if (next >= tour.steps.length) {
        markDone(tour.id)
        writeActive(null)
        setActive(null)
        toast.success(`Tour complete: ${tour.title}`, { action: { label: 'More tours', onClick: () => router.push('/admin/tours') } })
        return
      }
      const a = { id: tour.id, step: Math.max(0, next) }
      writeActive(a)
      setActive(a)
    },
    [tour, active, router]
  )

  const close = useCallback(() => {
    writeActive(null)
    setActive(null)
  }, [])

  // Prepare each step: run its click, wait for the target, scroll it into view.
  useEffect(() => {
    if (!step) return
    let cancelled = false
    setReady(false)
    targetEl.current = null
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ;(async () => {
      if (step.click) {
        const el = document.querySelector<HTMLElement>(step.click)
        el?.click()
      }
      const started = Date.now()
      let el = findTarget(step.target)
      while (step.target && !el && Date.now() - started < 2500 && !cancelled) {
        await new Promise((r) => setTimeout(r, 100))
        el = findTarget(step.target)
      }
      if (cancelled) return
      targetEl.current = el
      if (el) {
        const r = el.getBoundingClientRect()
        const inView = r.top >= 0 && r.bottom <= window.innerHeight
        if (!inView) {
          el.scrollIntoView({ block: r.height > window.innerHeight * 0.7 ? 'start' : 'center', behavior: reduce ? 'auto' : 'smooth' })
          await new Promise((res) => setTimeout(res, reduce ? 0 : 380))
        }
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [step])

  // Follow the target while it moves (scrolling, resizing, layout changes).
  useEffect(() => {
    if (!step || !ready) return
    let frame = 0
    let last: Rect | null = null
    const tick = () => {
      const el = targetEl.current
      if (el && el.isConnected && visible(el)) {
        const r = el.getBoundingClientRect()
        const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
        if (!sameRect(next, last)) setSpot((last = next))
      } else if (last !== null || !el) {
        last = null
        setSpot(null)
      }
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [step, ready])

  // Measure the card so it can be positioned without overflowing.
  useLayoutEffect(() => {
    if (!card.current) return
    const { width, height } = card.current.getBoundingClientRect()
    if (Math.abs(width - cardSize.width) > 1 || Math.abs(height - cardSize.height) > 1) setCardSize({ width, height })
  })

  // Keyboard: Esc closes, arrows step, Tab stays inside the card.
  useEffect(() => {
    if (!step || !ready) return
    card.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (e.preventDefault(), close())
      else if (e.key === 'ArrowRight') (e.preventDefault(), go(active!.step + 1))
      else if (e.key === 'ArrowLeft' && active!.step > 0) (e.preventDefault(), go(active!.step - 1))
      else if (e.key === 'Tab' && card.current) {
        const items = [...card.current.querySelectorAll<HTMLElement>('button')]
        const i = items.indexOf(document.activeElement as HTMLElement)
        e.preventDefault()
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [step, ready, active, go, close])

  if (!tour || !step || !active) return null

  const total = tour.steps.length
  const last = active.step === total - 1
  const pos = spot ? place(spot, cardSize) : null
  // The card itself takes focus for keyboard users; its buttons show the focus ring.
  const cardStyle: React.CSSProperties = { outline: 'none', ...(pos ? { top: pos.top, left: pos.left } : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }) }

  return (
    <div className="fixed inset-0 z-[1000]" aria-hidden={!ready}>
      {/* Click shield + dimmer. With a target, the spotlight's shadow does the dimming. */}
      <div className={`absolute inset-0 transition-colors duration-300 ${spot ? 'bg-transparent' : 'bg-slate-950/55'}`} />
      {spot && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-white/90 motion-safe:transition-[top,left,width,height] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.22,1,.36,1)]"
          style={{ ...spot, boxShadow: '0 0 0 9999px rgb(2 6 23 / .55), 0 0 0 6px rgb(255 255 255 / .18)' }}
        >
          <span className="absolute -inset-1 rounded-[14px] ring-2 ring-white/50 motion-safe:animate-[tour-pulse_2s_ease-out_infinite]" />
        </div>
      )}

      {ready && (
        <div
          ref={card}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="absolute w-[min(360px,calc(100vw-24px))] outline-none motion-safe:transition-[top,left] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(.22,1,.36,1)]"
          style={cardStyle}
        >
          {pos && pos.side !== 'inside' && (
            <span
              aria-hidden="true"
              className="absolute size-3.5 rotate-45 rounded-[3px] bg-primary"
              style={
                pos.side === 'bottom' ? { top: -6, left: pos.arrow - 7 }
                : pos.side === 'top' ? { bottom: -6, left: pos.arrow - 7, background: 'var(--tour-arrow-bottom, #4f46e5)' }
                : pos.side === 'right' ? { left: -6, top: pos.arrow - 7 }
                : { right: -6, top: pos.arrow - 7 }
              }
            />
          )}
          <div
            key={active.step}
            style={{ transformOrigin: !pos || pos.side === 'inside' ? 'center' : pos.side === 'bottom' ? `${pos.arrow}px 0` : pos.side === 'top' ? `${pos.arrow}px 100%` : pos.side === 'right' ? `0 ${pos.arrow}px` : `100% ${pos.arrow}px` }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-indigo-600 p-5 text-white shadow-[0_24px_60px_-12px_rgba(2,6,23,.55)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary">P</span>
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-white/85">PEARL guide · {tour.title}</p>
              <button type="button" onClick={close} className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close tour">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 flex gap-1" aria-hidden="true">
              {tour.steps.map((_, i) => (
                <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                  <span className={`block h-full rounded-full bg-white motion-safe:transition-[width] motion-safe:duration-500 ${i <= active.step ? 'w-full' : 'w-0'}`} />
                </span>
              ))}
            </div>

            <h2 id={titleId} className="mt-4 text-[17px] font-bold leading-snug">{step.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/85">{step.body}</p>
            {step.tryIt && (
              <p className="mt-3 flex gap-2 rounded-xl bg-white/12 px-3 py-2 text-[13px] leading-snug text-white">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-200" aria-hidden="true" />
                <span>{step.tryIt}</span>
              </p>
            )}

            <div className="mt-5 flex items-center gap-2">
              <span className="text-xs font-medium text-white/70" aria-live="polite">
                Step {active.step + 1} of {total}
              </span>
              <span className="ml-auto" />
              {active.step > 0 && (
                <button type="button" onClick={() => go(active.step - 1)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Previous step">
                  <ArrowLeft className="size-4" />
                </button>
              )}
              <button type="button" onClick={() => go(active.step + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-white/90 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                {last ? <>Finish <Check className="size-4" /></> : <>Next <ArrowRight className="size-4" /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
