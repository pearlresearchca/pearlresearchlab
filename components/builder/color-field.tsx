'use client'

import { useEffect, useRef, useState } from 'react'
import { HexAlphaColorPicker } from 'react-colorful'
import { X } from 'lucide-react'
import { cx, inputClass } from './ui'

// Theme tokens are stored as `var(--token)` so changing a theme colour later
// updates every element that uses it.
export const THEME_SWATCHES = [
  { label: 'Primary', value: 'var(--primary)' },
  { label: 'Secondary', value: 'var(--primary-dark)' },
  { label: 'Accent', value: 'var(--accent)' },
  { label: 'Text', value: 'var(--foreground)' },
  { label: 'Headings', value: 'var(--heading-color)' },
  { label: 'Muted text', value: 'var(--muted-foreground)' },
  { label: 'Background', value: 'var(--background)' },
  { label: 'Surface', value: 'var(--surface)' },
  { label: 'Border', value: 'var(--border)' },
]

const RECENT_KEY = 'pb-recent-colors'

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]').slice(0, 8)
  } catch {
    return []
  }
}

function pushRecent(color: string) {
  try {
    const next = [color, ...readRecent().filter((c) => c !== color)].slice(0, 8)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // Storage may be unavailable (private mode); recent colours are a nicety.
  }
}

// Converts rgb()/rgba() to #rrggbbaa for the picker; theme vars resolve via the DOM.
function toHex(value: string): string {
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value
  const m = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i)
  if (m) {
    const [r, g, b] = [m[1], m[2], m[3]].map((v) => Math.max(0, Math.min(255, Number(v))))
    let a = m[4] ? (m[4].endsWith('%') ? Number(m[4].slice(0, -1)) / 100 : Number(m[4])) : 1
    a = Math.max(0, Math.min(1, a))
    const hex = [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
    return '#' + hex + (a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : '')
  }
  if (value.startsWith('var(') && typeof window !== 'undefined') {
    const probe = document.createElement('span')
    probe.style.color = value
    document.body.appendChild(probe)
    const rgb = getComputedStyle(probe).color
    probe.remove()
    return toHex(rgb)
  }
  return '#000000'
}

export function isValidColor(v: string): boolean {
  if (!v) return true
  if (/^var\(--[a-z0-9-]+\)$/i.test(v)) return true
  if (typeof CSS !== 'undefined' && CSS.supports) return CSS.supports('color', v)
  return /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+)$/i.test(v)
}

// WCAG relative luminance contrast ratio between two CSS colours.
export function contrastRatio(a: string, b: string): number | null {
  const lum = (c: string) => {
    const hex = toHex(c).slice(1, 7)
    if (hex.length < 6) return null
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
  }
  const la = lum(a)
  const lb = lum(b)
  if (la === null || lb === null) return null
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function ColorField({ value, onChange, label, allowTheme = true, against }: { value: string | undefined; onChange: (v: string) => void; label: string; allowTheme?: boolean; against?: string }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [recent, setRecent] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setDraft(value ?? ''), [value])

  useEffect(() => {
    if (!open) return
    setRecent(readRecent())
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function commit(v: string) {
    if (!isValidColor(v)) return
    onChange(v)
    if (v && !v.startsWith('var(')) pushRecent(v)
  }

  const themeLabel = THEME_SWATCHES.find((s) => s.value === value)?.label
  const ratio = against && value ? contrastRatio(value, against) : null

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={`${label}: ${themeLabel ?? value ?? 'none'}. Open colour picker`}
          aria-expanded={open}
          className="size-8 shrink-0 rounded-md border border-border bg-[linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%),linear-gradient(45deg,#ddd_25%,transparent_25%,transparent_75%,#ddd_75%)] bg-[length:8px_8px] bg-[position:0_0,4px_4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="block size-full rounded-[5px]" style={{ background: value || 'transparent' }} />
        </button>
        <input
          aria-label={label}
          className={cx(inputClass, 'font-mono text-xs', draft && !isValidColor(draft) && 'border-red-400')}
          value={themeLabel ? `Theme: ${themeLabel}` : draft}
          placeholder="Default"
          onFocus={(e) => themeLabel && setDraft(value ?? '')}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== (value ?? '') && commit(draft.trim())}
          onKeyDown={(e) => e.key === 'Enter' && commit(draft.trim())}
        />
        {value && (
          <button type="button" onClick={() => onChange('')} aria-label={`Clear ${label}`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {ratio !== null && ratio < 4.5 && (
        <p className="mt-1 text-[11px] text-amber-700">Low contrast ({ratio.toFixed(1)}:1). Aim for at least 4.5:1 so text stays readable.</p>
      )}
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-60 rounded-lg border border-border bg-surface p-3 shadow-xl">
          <HexAlphaColorPicker color={toHex(value || '#146b68')} onChange={(hex) => onChange(hex)} style={{ width: '100%', height: 150 }} />
          {allowTheme && (
            <>
              <p className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Theme colours</p>
              <div className="grid grid-cols-9 gap-1">
                {THEME_SWATCHES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    title={s.label}
                    aria-label={`Theme colour: ${s.label}`}
                    onClick={() => commit(s.value)}
                    className={cx('size-5 rounded border border-black/10', value === s.value && 'ring-2 ring-primary ring-offset-1')}
                    style={{ background: s.value }}
                  />
                ))}
              </div>
            </>
          )}
          {recent.length > 0 && (
            <>
              <p className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recent</p>
              <div className="flex flex-wrap gap-1">
                {recent.map((c) => (
                  <button key={c} type="button" title={c} aria-label={`Recent colour ${c}`} onClick={() => commit(c)} className="size-5 rounded border border-black/10" style={{ background: c }} />
                ))}
              </div>
            </>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">Type HEX, RGB or RGBA in the box, e.g. rgba(20,107,104,0.5)</p>
        </div>
      )}
    </div>
  )
}
