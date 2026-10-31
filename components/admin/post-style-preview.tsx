import type { PostStyle } from '@/lib/blog/blocks'

// Miniature wireframe of each style, so editors can see the layout at a glance.
export function StylePreview({ style }: { style: PostStyle }) {
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
