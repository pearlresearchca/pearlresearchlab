'use client'

import { useState } from 'react'
import { Check, Wand2 } from 'lucide-react'
import { THEME_PRESETS, paletteFromBrand, type ThemePreset } from '@/lib/builder/theme-presets'
import type { ThemeSettings } from '@/lib/builder/types'
import { Btn, Toggle, cx, inputClass } from './ui'

function sameColors(a: ThemeSettings['colors'], b: ThemeSettings['colors']) {
  return (Object.keys(a) as (keyof ThemeSettings['colors'])[]).every((k) => a[k]?.toLowerCase() === b[k]?.toLowerCase())
}

// Mini page mock-up drawn in the preset's colours.
export function PresetSwatch({ preset, className }: { preset: ThemePreset; className?: string }) {
  const c = preset.colors
  const radius = preset.buttons?.radius ?? '0px'
  return (
    <div className={cx('overflow-hidden rounded-xl border border-black/5', className)} style={{ background: c.background }} aria-hidden="true">
      <div className="flex items-center justify-between px-3 py-2" style={{ background: c.surface, borderBottom: `1px solid ${c.border}` }}>
        <span className="h-2 w-10 rounded-full" style={{ background: c.heading }} />
        <span className="flex gap-1">
          <span className="h-1.5 w-5 rounded-full" style={{ background: c.muted }} />
          <span className="h-1.5 w-5 rounded-full" style={{ background: c.muted }} />
        </span>
      </div>
      <div className="px-3 py-3" style={{ background: c.tint }}>
        <span className="mb-1.5 block h-1.5 w-8 rounded-full" style={{ background: c.primary }} />
        <span className="mb-1 block h-2.5 w-3/4 rounded-full" style={{ background: c.heading }} />
        <span className="mb-2.5 block h-1.5 w-1/2 rounded-full" style={{ background: c.muted, opacity: 0.6 }} />
        <span className="inline-block h-4 w-14" style={{ background: c.primary, borderRadius: radius === '999px' ? 999 : Math.min(8, parseInt(radius) || 0) }} />
        <span className="ml-1.5 inline-block h-4 w-4 rounded-full align-top" style={{ background: c.accent }} />
      </div>
      <div className="h-3" style={{ background: c.footer }} />
    </div>
  )
}

export function ThemePresetGallery({ theme, onApply }: { theme: ThemeSettings; onApply: (preset: ThemePreset, withStyle: boolean) => void }) {
  const [withStyle, setWithStyle] = useState(true)
  const [brand, setBrand] = useState('#146b68')
  const generated = paletteFromBrand(brand)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {THEME_PRESETS.map((p) => {
          const active = sameColors(theme.colors, p.colors)
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onApply(p, withStyle)}
              aria-pressed={active}
              className={cx('group relative flex flex-col gap-2 rounded-2xl border-2 bg-surface p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md', active ? 'border-primary shadow-lg shadow-primary/15' : 'border-border')}
            >
              <PresetSwatch preset={p} />
              <span className="px-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {p.name}
                  {active && <Check className="size-4 text-primary" />}
                </span>
                <span className="block text-[11px] leading-snug text-muted-foreground">{p.description}</span>
              </span>
              <span className="flex gap-1 px-1 pb-0.5">
                {[p.colors.primary, p.colors.secondary, p.colors.accent, p.colors.tint, p.colors.footer].map((c, i) => (
                  <span key={i} className="size-4 rounded-full border border-black/10" style={{ background: c }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-dashed border-border bg-background p-4">
        <div className="w-72">
          <Toggle checked={withStyle} onChange={setWithStyle} label="Also apply the preset’s fonts and shapes" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold"><Wand2 className="size-4 text-primary" /> Generate from your brand colour</span>
          <input type="color" value={brand} onChange={(e) => setBrand(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-surface p-1" aria-label="Brand colour" />
          <input className={cx(inputClass, 'w-28 font-mono text-xs')} value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Brand colour hex" />
          {generated && (
            <span className="flex gap-1">
              {[generated.primary, generated.secondary, generated.accent, generated.tint, generated.footer].map((c, i) => (
                <span key={i} className="size-5 rounded-full border border-black/10" style={{ background: c }} />
              ))}
            </span>
          )}
          <Btn size="sm" variant="primary" disabled={!generated} onClick={() => generated && onApply({ key: 'custom', name: 'Custom', description: '', colors: generated }, false)}>
            Use these colours
          </Btn>
        </div>
      </div>
    </div>
  )
}
