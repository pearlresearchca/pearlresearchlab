'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Compass, LayoutTemplate, Palette, RotateCcw, Rocket, Users2, type LucideIcon } from 'lucide-react'
import { TOURS, TOUR_DONE_KEY, TOUR_GROUPS, readDone, setActiveTour, type Tour } from '@/lib/tours'

const GROUP_ICONS: Record<Tour['group'], LucideIcon> = { 'Get started': Rocket, 'Build pages': LayoutTemplate, Design: Palette, Content: Users2 }

// Checklist of guided tours. Starting one remembers it for this browser tab
// and opens the screen it runs on, where the tour runner takes over.
export function ToursList({ builderHref }: { builderHref: string | null }) {
  const router = useRouter()
  const [done, setDone] = useState<string[]>([])
  useEffect(() => setDone(readDone()), [])

  const available = TOURS.filter((t) => t.href !== 'builder' || builderHref)
  const completed = available.filter((t) => done.includes(t.id)).length
  const pct = available.length ? Math.round((completed / available.length) * 100) : 0
  const next = available.find((t) => !done.includes(t.id))

  function start(tour: Tour) {
    setActiveTour(tour.id)
    router.push(tour.href === 'builder' ? builderHref! : tour.href)
  }

  function reset() {
    try {
      localStorage.removeItem(TOUR_DONE_KEY)
    } catch {}
    setDone([])
  }

  let number = 0
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        {TOUR_GROUPS.map((group) => {
          const tours = available.filter((t) => t.group === group)
          if (!tours.length) return null
          const Icon = GROUP_ICONS[group]
          return (
            <section key={group} className="rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)]">
              <header className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                <h2 className="text-[15px] font-semibold text-foreground">{group}</h2>
              </header>
              <ol className="divide-y divide-border">
                {tours.map((tour) => {
                  number++
                  const isDone = done.includes(tour.id)
                  return (
                    <li key={tour.id}>
                      <button
                        type="button"
                        onClick={() => start(tour)}
                        className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-background focus-visible:bg-background focus-visible:outline-none"
                      >
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                            isDone ? 'bg-emerald-500 text-white' : 'bg-muted text-slate-600 group-hover:bg-primary/10 group-hover:text-primary'
                          }`}
                          aria-hidden="true"
                        >
                          {isDone ? <Check className="size-4" /> : number}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">{tour.title}</span>
                          <span className="block text-[13px] text-muted-foreground">{tour.description}</span>
                        </span>
                        <span className="hidden text-xs text-muted-foreground sm:block">{tour.steps.length} steps</span>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            isDone ? 'text-slate-500 group-hover:text-primary' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                          }`}
                        >
                          {isDone ? <><RotateCcw className="size-3.5" aria-hidden="true" /> Replay</> : <>Start <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></>}
                          <span className="sr-only"> tour: {tour.title}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-indigo-600 p-5 text-white shadow-lg shadow-primary/25">
          <Compass className="size-6 text-white/90" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-white/80">Your progress</p>
          <p className="mt-0.5 text-2xl font-bold">
            {completed} of {available.length} tours
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tours completed">
            <div className="h-full rounded-full bg-white motion-safe:transition-[width] motion-safe:duration-700" style={{ width: `${pct}%` }} />
          </div>
          {next ? (
            <button type="button" onClick={() => start(next)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-white/90 active:scale-[.98]">
              {completed === 0 ? 'Start with the basics' : `Next: ${next.title}`} <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <p className="mt-4 text-sm font-medium">All done — nicely navigated! 🎉</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">How tours work</p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4">
            <li>Each tour opens the screen it’s about and highlights the real controls.</li>
            <li>Use <kbd className="rounded border border-border bg-muted px-1 text-[11px]">←</kbd> <kbd className="rounded border border-border bg-muted px-1 text-[11px]">→</kbd> to move between steps, <kbd className="rounded border border-border bg-muted px-1 text-[11px]">Esc</kbd> to stop.</li>
            <li>Nothing is changed or saved while you take a tour.</li>
          </ul>
          {completed > 0 && (
            <button type="button" onClick={reset} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary">
              <RotateCcw className="size-3.5" aria-hidden="true" /> Reset progress
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
