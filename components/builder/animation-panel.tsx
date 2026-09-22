'use client'

import { useEffect, useRef } from 'react'
import { Layers, Play, Sparkles, X } from 'lucide-react'
import type { Animation, AnimationType, BuilderNode, HoverEffect } from '@/lib/builder/types'
import { Btn, FieldRow, Segmented, Toggle, cx } from './ui'

export const ENTRANCE_EFFECTS: { value: AnimationType; label: string }[] = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide-up', label: 'Slide up' },
  { value: 'slide-down', label: 'Slide down' },
  { value: 'slide-left', label: 'From left' },
  { value: 'slide-right', label: 'From right' },
  { value: 'zoom-in', label: 'Zoom in' },
  { value: 'zoom-out', label: 'Zoom out' },
  { value: 'flip', label: 'Flip' },
  { value: 'blur', label: 'Blur in' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'rotate', label: 'Rotate' },
]

const HOVER_EFFECTS: { value: HoverEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'lift', label: 'Lift' },
  { value: 'grow', label: 'Grow' },
  { value: 'shrink', label: 'Press' },
  { value: 'glow', label: 'Glow' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'brighten', label: 'Brighten' },
]

// Replays a block's entrance effect on the builder canvas.
export function playAnimation(nodeId: string) {
  const el = document.querySelector<HTMLElement>(`.pb-editing [data-node-id="${nodeId}"]`)
  if (!el) return
  el.classList.remove('pb-anim-play')
  void el.offsetWidth // restart the animation
  el.classList.add('pb-anim-play')
  const done = () => el.classList.remove('pb-anim-play')
  el.addEventListener('animationend', done, { once: true })
}

// Little looping demo tile for each effect in the picker.
function EffectTile({ value, label, active, onPick }: { value: AnimationType; label: string; active: boolean; onPick: () => void }) {
  const dot = useRef<HTMLSpanElement>(null)
  const play = () => {
    const el = dot.current
    if (!el) return
    el.classList.remove('pb-anim-play')
    void el.offsetWidth
    el.classList.add('pb-anim-play')
  }
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={play}
      onFocus={play}
      aria-pressed={active}
      className={cx('flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] font-semibold transition', active ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'border-border text-slate-600 hover:border-primary/50')}
    >
      <span className="flex h-9 w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
        <span ref={dot} className={cx('block size-5 rounded-md bg-gradient-to-br from-primary to-indigo-400 shadow', `pb-anim-fx--${value}`)} style={{ ['--pb-anim-duration' as string]: '700ms' }} />
      </span>
      {label}
    </button>
  )
}

export function AnimationPanel({ node, onNode, onChildren }: { node: BuilderNode; onNode: (fn: (n: BuilderNode) => BuilderNode) => void; onChildren: (fn: (children: BuilderNode[]) => BuilderNode[]) => void }) {
  const a: Animation = node.animation ?? {}
  const hasEntrance = !!a.type && a.type !== 'none'
  const set = (patch: Partial<Animation>) => onNode((n) => ({ ...n, animation: { duration: 700, delay: 0, easing: 'ease-out', ...n.animation, ...patch } }))
  const lastPlayed = useRef<string | null>(null)

  // Preview right after choosing an effect.
  useEffect(() => {
    const key = `${node.id}:${a.type}:${a.duration}:${a.easing}`
    if (hasEntrance && lastPlayed.current && lastPlayed.current !== key) requestAnimationFrame(() => playAnimation(node.id))
    lastPlayed.current = key
  }, [node.id, a.type, a.duration, a.easing, hasEntrance])

  const kids = node.children ?? []
  const container = kids.length > 1

  return (
    <div className="flex flex-col gap-5 p-4">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><Sparkles className="size-3.5" /> Entrance effect</h3>
          {hasEntrance && (
            <button type="button" className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600" onClick={() => onNode((n) => ({ ...n, animation: n.animation?.hover ? { hover: n.animation.hover } : undefined }))}>
              <X className="size-3" /> Remove
            </button>
          )}
        </div>
        <p className="-mt-1 text-[11px] text-muted-foreground">Plays when the block scrolls into view. Hover a tile to see it.</p>
        <div className="grid grid-cols-3 gap-1.5">
          {ENTRANCE_EFFECTS.map((e) => (
            <EffectTile key={e.value} value={e.value} label={e.label} active={a.type === e.value || (e.value === 'zoom-in' && a.type === 'zoom')} onPick={() => set({ type: e.value })} />
          ))}
        </div>
        {hasEntrance && (
          <>
            <FieldRow label={`Duration: ${((a.duration ?? 700) / 1000).toFixed(1)}s`}>
              <input type="range" min={200} max={2000} step={100} value={a.duration ?? 700} onChange={(e) => set({ duration: Number(e.target.value) })} className="accent-primary" aria-label="Duration" />
            </FieldRow>
            <FieldRow label={`Delay: ${((a.delay ?? 0) / 1000).toFixed(1)}s`}>
              <input type="range" min={0} max={2000} step={100} value={a.delay ?? 0} onChange={(e) => set({ delay: Number(e.target.value) })} className="accent-primary" aria-label="Delay" />
            </FieldRow>
            <FieldRow label="Motion style">
              <Segmented size="sm" value={a.easing ?? 'ease-out'} onChange={(v) => set({ easing: v })} options={[{ value: 'ease-out', label: 'Smooth' }, { value: 'spring', label: 'Springy' }, { value: 'ease-in-out', label: 'Gentle' }, { value: 'linear', label: 'Even' }]} />
            </FieldRow>
            <Toggle checked={!!a.repeat} onChange={(v) => set({ repeat: v })} label="Play again each time it comes into view" />
            <Btn onClick={() => playAnimation(node.id)}><Play className="size-4" /> Preview animation</Btn>
          </>
        )}
      </section>

      {container && (
        <section className="flex flex-col gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary"><Layers className="size-3.5" /> Animate items inside</h3>
          <p className="text-[11px] text-slate-600">Give each of the {kids.length} items inside the same effect, one after another.</p>
          <div className="flex flex-wrap gap-1.5">
            {(['fade', 'slide-up', 'zoom-in', 'slide-left'] as AnimationType[]).map((t) => (
              <Btn
                key={t}
                size="sm"
                onClick={() => {
                  onChildren((children) => children.map((c, i) => ({ ...c, animation: { ...c.animation, type: t, duration: 650, delay: i * 120, easing: 'ease-out' } })))
                  requestAnimationFrame(() => kids.forEach((c) => playAnimation(c.id)))
                }}
              >
                {ENTRANCE_EFFECTS.find((e) => e.value === t)?.label}
              </Btn>
            ))}
            <Btn size="sm" variant="ghost" onClick={() => onChildren((children) => children.map((c) => ({ ...c, animation: c.animation?.hover ? { hover: c.animation.hover } : undefined })))}>Clear</Btn>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Hover effect</h3>
        <p className="-mt-1 text-[11px] text-muted-foreground">What happens when visitors point at this block. Great for cards and buttons.</p>
        <div className="grid grid-cols-4 gap-1.5">
          {HOVER_EFFECTS.map((h) => (
            <button
              key={h.value}
              type="button"
              aria-pressed={(a.hover ?? 'none') === h.value}
              onClick={() => onNode((n) => ({ ...n, animation: { ...n.animation, hover: h.value === 'none' ? undefined : h.value } }))}
              className={cx(
                'rounded-lg border px-1 py-2 text-[11px] font-semibold transition',
                (a.hover ?? 'none') === h.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-slate-600 hover:border-primary/50',
                h.value !== 'none' && `pb-hover--${h.value}`
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </section>
      <p className="text-[11px] text-muted-foreground">Visitors who have asked their device to reduce motion won’t see movement — the content simply appears.</p>
    </div>
  )
}
