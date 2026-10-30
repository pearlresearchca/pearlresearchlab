'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { POST_STYLES, type PostStyle } from '@/lib/blog/blocks'
import { createPostAction } from '@/app/admin/(dashboard)/blog/actions'

// Miniature wireframe of each style, so editors can see the layout at a glance.
function StylePreview({ style }: { style: PostStyle }) {
  const { bg, ink, accent } = style.swatch
  const line = (w: string, h = 4, c = ink, o = 0.85) => <span className="block rounded-full" style={{ width: w, height: h, background: c, opacity: o }} />
  const img = (h: number, extra: React.CSSProperties = {}) => <span className="block w-full rounded-md" style={{ height: h, background: `linear-gradient(135deg, ${accent}55, ${ink}33)`, ...extra }} />
  const k = style.key
  return (
    <span className="relative flex h-[132px] flex-col gap-1.5 overflow-hidden rounded-xl p-3" style={{ background: bg }} aria-hidden="true">
      {k === 'feature' || k === 'photo' ? (
        <>
          <span className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${accent}66, ${ink}22 40%, #00000088)` }} />
          <span className="relative mt-auto flex flex-col gap-1.5">{line('70%', 7, '#fff', 1)}{line('45%', 4, '#fff', 0.7)}</span>
        </>
      ) : k === 'magazine' ? (
        <span className="grid h-full grid-cols-2 items-center gap-2">
          <span className="flex flex-col gap-1.5">{line('90%', 6)}{line('70%', 6)}{line('80%', 3, ink, 0.4)}</span>
          {img(96)}
        </span>
      ) : k === 'news' ? (
        <>
          <span className="block h-1 w-full rounded-full" style={{ background: accent }} />
          {line('30%', 3, accent, 1)}{line('85%', 6)}{line('60%', 6)}
          <span className="mt-1 flex flex-col gap-1">{line('100%', 3, ink, 0.3)}{line('95%', 3, ink, 0.3)}{line('70%', 3, ink, 0.3)}</span>
        </>
      ) : k === 'research' ? (
        <>
          <span className="flex gap-1.5 border-l-2 pl-2" style={{ borderColor: accent }}><span className="flex flex-1 flex-col gap-1.5">{line('70%', 6)}{line('50%', 3, ink, 0.4)}</span></span>
          <span className="mt-1 grid grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="flex h-9 flex-col justify-center gap-1 rounded-md px-1.5" style={{ background: `${accent}22` }}>{line('60%', 5, ink, 0.9)}{line('80%', 2, ink, 0.4)}</span>)}</span>
          {line('90%', 3, ink, 0.3)}
        </>
      ) : k === 'interview' ? (
        <>
          {line('65%', 6)}
          {[0, 1].map((i) => (
            <span key={i} className="mt-1 flex items-start gap-1.5">
              <span className="size-3 shrink-0 rounded-full" style={{ background: accent }} />
              <span className="flex flex-1 flex-col gap-1">{line('80%', 4, ink, 0.9)}{line('95%', 3, ink, 0.35)}</span>
            </span>
          ))}
        </>
      ) : k === 'event' ? (
        <span className="flex gap-2">
          <span className="flex h-10 w-9 shrink-0 flex-col items-center justify-center rounded-md" style={{ background: ink }}><span className="h-1 w-4 rounded" style={{ background: accent }} /><span className="mt-1 h-2.5 w-3 rounded-sm bg-white" /></span>
          <span className="flex flex-1 flex-col gap-1.5">{line('85%', 6)}{line('55%', 3, ink, 0.4)}{['70%', '60%'].map((w, i) => <span key={i} className="flex items-center gap-1"><span className="text-[8px]" style={{ color: ink }}>✓</span>{line(w, 3, ink, 0.4)}</span>)}</span>
        </span>
      ) : k === 'editorial' || k === 'story' || k === 'spotlight' ? (
        <span className="flex h-full flex-col items-center gap-1.5 text-center">
          {k === 'spotlight' && line('25%', 3, accent, 1)}
          {line('80%', k === 'editorial' ? 9 : 7)}{line('60%', k === 'editorial' ? 9 : 7)}
          {k === 'editorial' ? <span className="mt-1 flex w-full gap-1.5"><span className="text-[22px] leading-none" style={{ color: accent, fontFamily: 'Georgia' }}>A</span><span className="flex flex-1 flex-col gap-1">{line('100%', 3, ink, 0.35)}{line('90%', 3, ink, 0.35)}</span></span> : img(46, { marginTop: 4 })}
        </span>
      ) : k === 'minimal' ? (
        <span className="flex flex-col gap-1.5 px-2 pt-2">{line('70%', 6)}<span className="my-1 block h-0.5 w-6" style={{ background: accent }} />{line('100%', 3, ink, 0.3)}{line('95%', 3, ink, 0.3)}{line('80%', 3, ink, 0.3)}</span>
      ) : (
        <>
          {line('30%', 3, accent, 1)}{line('80%', 6)}{line('55%', 6)}
          {img(52, { marginTop: 4 })}
        </>
      )}
    </span>
  )
}

export function NewPostButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [chosen, setChosen] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !pending && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, pending])

  function create(key: string) {
    setChosen(key)
    start(async () => {
      const r = await createPostAction(key)
      if ('error' in r) {
        toast.error(r.error)
        setChosen(null)
        return
      }
      router.push(`/admin/blog/${r.id}`)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-tour="new-post"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark active:scale-[.97]"
      >
        <Plus className="size-4" aria-hidden="true" /> New post
      </button>
      {open && mounted &&
        createPortal(
          <div className="admin-ui fixed inset-0 z-[200] flex items-end justify-center bg-transparent sm:items-center" role="dialog" aria-modal="true" aria-labelledby="new-post-title">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200" onClick={() => !pending && setOpen(false)} />
            <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-4 motion-safe:duration-300">
              <header className="flex items-start gap-4 border-b border-border px-6 py-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-500 text-white shadow-lg shadow-primary/25">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="new-post-title" className="text-lg font-bold text-foreground">Choose a look for your post</h2>
                  <p className="text-sm text-muted-foreground">Pick a style to start — it comes with a few ready blocks. You can change the style any time.</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-lg p-2 text-slate-500 transition hover:bg-muted" aria-label="Close">
                  <X className="size-5" />
                </button>
              </header>
              <div className="overflow-y-auto p-6">
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {POST_STYLES.map((s, i) => (
                    <li key={s.key} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both" style={{ animationDelay: `${Math.min(i, 11) * 35}ms`, animationDuration: '400ms' }}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => create(s.key)}
                        className={`group flex w-full flex-col gap-3 rounded-2xl border bg-surface p-2.5 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_18px_40px_-24px_rgba(67,97,238,.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[.98] disabled:cursor-wait ${chosen === s.key ? 'border-primary ring-4 ring-primary/15' : 'border-border'}`}
                      >
                        <StylePreview style={s} />
                        <span className="flex items-start justify-between gap-2 px-1.5 pb-1">
                          <span>
                            <span className="block text-sm font-semibold text-foreground">{s.name}</span>
                            <span className="block text-xs text-muted-foreground">{s.description}</span>
                          </span>
                          {chosen === s.key ? (
                            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" aria-label="Creating" />
                          ) : (
                            <Check className="mt-0.5 size-4 shrink-0 text-primary opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
