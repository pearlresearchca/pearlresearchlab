'use client'

import { useState, type ReactNode } from 'react'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Eye, EyeOff, Link, Monitor, RotateCcw, Smartphone, Tablet, Unlink } from 'lucide-react'
import type { StyleGroup } from '@/lib/builder/blocks'
import { RADIUS_PRESETS, SHADOW_PRESETS, SPACING_PRESETS, resolveStyle } from '@/lib/builder/styles'
import { FONT_OPTIONS } from '@/lib/builder/theme'
import type { BackgroundValue, BoxValue, BuilderNode, Device, Style } from '@/lib/builder/types'
import { ColorField } from './color-field'
import { MediaPickerDialog } from './media'
import { Btn, Collapsible, FieldRow, Segmented, Toggle, cx, inputClass } from './ui'

type Props = {
  node: BuilderNode
  device: Device
  onStyle: (device: Device, patch: Partial<Style>) => void
  onNode: (fn: (n: BuilderNode) => BuilderNode) => void
}

const UNITS = ['px', '%', 'rem', 'em', 'vh', 'vw'] as const
const NUMERIC = /^(-?\d*\.?\d+)(px|%|rem|em|vh|vw)?$/

// Number + unit input that also accepts keywords (auto) and raw CSS values.
export function UnitInput({ value, onChange, placeholder, label, units = UNITS as unknown as string[], allowKeywords = true }: { value: string | undefined; onChange: (v: string | undefined) => void; placeholder?: string; label: string; units?: string[]; allowKeywords?: boolean }) {
  const m = (value ?? '').match(NUMERIC)
  const [raw, setRaw] = useState<string | null>(null)
  const num = m ? m[1] : ''
  const unit = m ? m[2] ?? 'px' : 'px'
  const isRaw = !!value && !m

  if (isRaw || raw !== null) {
    return (
      <input
        aria-label={label}
        className={cx(inputClass, 'font-mono text-xs')}
        value={raw ?? value ?? ''}
        placeholder={placeholder}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() => {
          if (raw !== null) onChange(raw.trim() || undefined)
          setRaw(null)
        }}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
      />
    )
  }

  return (
    <div className="flex">
      <input
        aria-label={label}
        type="text"
        inputMode="decimal"
        className={cx(inputClass, 'rounded-r-none')}
        value={num}
        placeholder={placeholder ?? '—'}
        onChange={(e) => {
          const v = e.target.value.trim()
          if (!v) return onChange(undefined)
          if (allowKeywords && /^[a-z]/i.test(v)) return setRaw(v)
          if (/^-?\d*\.?\d*$/.test(v)) onChange(v === '-' || v === '.' ? undefined : `${v}${unit}`)
        }}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
          e.preventDefault()
          const step = e.shiftKey ? 10 : 1
          onChange(`${(Number(num) || 0) + (e.key === 'ArrowUp' ? step : -step)}${unit}`)
        }}
      />
      <select aria-label={`${label} unit`} className={cx(inputClass, 'w-16 rounded-l-none border-l-0 px-1 text-xs')} value={unit} onChange={(e) => num && onChange(`${num}${e.target.value}`)}>
        {units.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
    </div>
  )
}

function Overridden({ node, device, keys, onReset }: { node: BuilderNode; device: Device; keys: (keyof Style)[]; onReset: () => void }) {
  if (device === 'desktop') return null
  const has = keys.some((k) => node.style?.[device]?.[k] !== undefined)
  if (!has) return null
  return (
    <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline" title={`Remove the ${device} override`}>
      <RotateCcw className="size-3" /> {device} override
    </button>
  )
}

export function DeviceHint({ device }: { device: Device }) {
  if (device === 'desktop') return null
  const Icon = device === 'tablet' ? Tablet : Smartphone
  return (
    <p className="mx-4 mt-3 flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-2 text-[11px] text-blue-800">
      <Icon className="size-3.5 shrink-0" aria-hidden="true" /> Style changes now apply to <strong className="capitalize">{device}</strong> and smaller screens only.
    </p>
  )
}

function BoxControl({ label, value, onChange }: { label: string; value: BoxValue | undefined; onChange: (v: BoxValue | undefined) => void }) {
  const sides = ['top', 'right', 'bottom', 'left'] as const
  const values = sides.map((s) => value?.[s])
  const uniform = values.every((v) => v === values[0])
  const [linked, setLinked] = useState(uniform)
  const current = uniform ? values[0] : undefined
  const isPreset = current !== undefined && SPACING_PRESETS.some((p) => p.value === current)

  function setAll(v: string | undefined) {
    onChange(v === undefined ? undefined : { top: v, right: v, bottom: v, left: v })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <button type="button" onClick={() => setLinked(!linked)} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground" aria-pressed={!linked}>
          {linked ? <Link className="size-3" /> : <Unlink className="size-3" />} {linked ? 'All sides' : 'Each side'}
        </button>
      </div>
      <Segmented
        size="sm"
        label={`${label} preset`}
        value={isPreset ? current : uniform && current === undefined ? undefined : 'custom'}
        onChange={(v) => (v === 'custom' ? undefined : setAll(v))}
        options={[...SPACING_PRESETS.map((p) => ({ value: p.value, label: p.label })), { value: 'custom', label: '…' }]}
      />
      {linked ? (
        <UnitInput label={`${label} (all sides)`} value={isPreset ? undefined : current} placeholder={isPreset ? 'Preset' : 'Default'} onChange={setAll} />
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {sides.map((s) => (
            <div key={s} className="flex flex-col gap-0.5">
              <span className="text-[10px] capitalize text-muted-foreground">{s}</span>
              <UnitInput
                label={`${label} ${s}`}
                value={SPACING_PRESETS.some((p) => p.value === value?.[s]) ? undefined : value?.[s]}
                placeholder={value?.[s] ?? '—'}
                onChange={(v) => {
                  const next = { ...(value ?? {}), [s]: v }
                  if (v === undefined) delete next[s]
                  onChange(Object.keys(next).length ? next : undefined)
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BackgroundControl({ value, onChange, allowVideo }: { value: BackgroundValue | undefined; onChange: (v: BackgroundValue | undefined) => void; allowVideo: boolean }) {
  const [picker, setPicker] = useState<'image' | 'video' | null>(null)
  const bg = value ?? {}
  const set = (patch: Partial<BackgroundValue>) => onChange({ ...bg, ...patch })
  return (
    <div className="flex flex-col gap-3">
      <Segmented
        size="sm"
        label="Background type"
        value={bg.type ?? 'none'}
        onChange={(t) => (t === 'none' ? onChange(undefined) : set({ type: t }))}
        options={[
          { value: 'none', label: 'None' },
          { value: 'color', label: 'Colour' },
          { value: 'gradient', label: 'Gradient' },
          { value: 'image', label: 'Image' },
          ...(allowVideo ? [{ value: 'video' as const, label: 'Video' }] : []),
        ]}
      />
      {bg.type === 'color' && <ColorField label="Background colour" value={bg.color} onChange={(c) => set({ color: c })} />}
      {bg.type === 'gradient' && (
        <>
          <FieldRow label="From"><ColorField label="Gradient start" value={bg.gradientFrom} onChange={(c) => set({ gradientFrom: c })} /></FieldRow>
          <FieldRow label="To"><ColorField label="Gradient end" value={bg.gradientTo} onChange={(c) => set({ gradientTo: c })} /></FieldRow>
          <FieldRow label={`Angle: ${bg.gradientAngle ?? 135}°`}>
            <input type="range" min={0} max={360} step={5} value={bg.gradientAngle ?? 135} onChange={(e) => set({ gradientAngle: Number(e.target.value) })} className="accent-primary" aria-label="Gradient angle" />
          </FieldRow>
        </>
      )}
      {(bg.type === 'image' || bg.type === 'video') && (
        <>
          {bg.type === 'image' ? (
            <div className="flex items-center gap-2">
              {bg.image && <img src={bg.image} alt="" className="size-12 rounded border border-border object-cover" />}
              <Btn size="sm" onClick={() => setPicker('image')}>{bg.image ? 'Replace image' : 'Choose image'}</Btn>
              {bg.image && <Btn size="sm" variant="ghost" onClick={() => set({ image: '' })}>Remove</Btn>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Btn size="sm" onClick={() => setPicker('video')}>{bg.video ? 'Replace video' : 'Choose video'}</Btn>
              {bg.video && <span className="truncate text-[11px] text-muted-foreground">{bg.video.split('/').pop()}</span>}
            </div>
          )}
          {bg.type === 'image' && (
            <>
              <FieldRow label="Position">
                <select className={inputClass} value={bg.imagePosition ?? 'center'} onChange={(e) => set({ imagePosition: e.target.value })}>
                  {['top left', 'top center', 'top right', 'center left', 'center', 'center right', 'bottom left', 'bottom center', 'bottom right'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="Size">
                <Segmented size="sm" value={bg.imageSize ?? 'cover'} onChange={(v) => set({ imageSize: v })} options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'auto', label: 'Original' }]} />
              </FieldRow>
              <Toggle checked={bg.imageRepeat === 'repeat'} onChange={(v) => set({ imageRepeat: v ? 'repeat' : 'no-repeat' })} label="Repeat (tile) image" />
              <Toggle checked={!!bg.imageFixed} onChange={(v) => set({ imageFixed: v })} label="Fixed while scrolling (parallax)" />
            </>
          )}
          <FieldRow label="Overlay colour" hint="Darkens the image so text on top stays readable.">
            <ColorField label="Overlay colour" value={bg.overlayColor} onChange={(c) => set({ overlayColor: c })} />
          </FieldRow>
          {bg.overlayColor && (
            <FieldRow label={`Overlay opacity: ${Math.round((bg.overlayOpacity ?? 0.5) * 100)}%`}>
              <input type="range" min={0} max={1} step={0.05} value={bg.overlayOpacity ?? 0.5} onChange={(e) => set({ overlayOpacity: Number(e.target.value) })} className="accent-primary" aria-label="Overlay opacity" />
            </FieldRow>
          )}
          <FieldRow label="Fallback colour"><ColorField label="Fallback colour" value={bg.color} onChange={(c) => set({ color: c })} /></FieldRow>
        </>
      )}
      <MediaPickerDialog
        open={picker !== null}
        kind={picker ?? 'image'}
        onClose={() => setPicker(null)}
        onSelect={({ url }) => (picker === 'video' ? set({ video: url }) : set({ image: url }))}
      />
    </div>
  )
}

function Presets({ label, value, presets, onChange }: { label: string; value: string | undefined; presets: { value: string; label: string }[]; onChange: (v: string | undefined) => void }) {
  const isPreset = value === undefined || presets.some((p) => p.value === value)
  return (
    <FieldRow label={label}>
      <Segmented size="sm" label={label} value={isPreset ? value : 'custom'} onChange={(v) => onChange(v === 'custom' ? (isPreset ? '' : value) || '12px' : v)} options={[...presets, { value: 'custom', label: 'Custom' }]} />
      {!isPreset && <input className={cx(inputClass, 'font-mono text-xs')} aria-label={`Custom ${label}`} defaultValue={value} onBlur={(e) => onChange(e.target.value.trim() || undefined)} />}
    </FieldRow>
  )
}

const FONT_SIZE_PRESETS = [
  { value: '14px', label: 'S' },
  { value: '17px', label: 'M' },
  { value: '22px', label: 'L' },
  { value: '32px', label: 'XL' },
  { value: '48px', label: '2XL' },
]

export function StyleControls({ node, device, onStyle, onNode, groups }: Props & { groups: StyleGroup[] }) {
  const s = resolveStyle(node, device)
  const own = node.style?.[device] ?? {}
  const set = (patch: Partial<Style>) => onStyle(device, patch)
  const reset = (keys: (keyof Style)[]) => () => onStyle(device, Object.fromEntries(keys.map((k) => [k, undefined])) as Partial<Style>)
  const section = (title: string, keys: (keyof Style)[], children: ReactNode, open = true) => (
    <Collapsible title={title} defaultOpen={open} extra={<Overridden node={node} device={device} keys={keys} onReset={reset(keys)} />}>
      {children}
    </Collapsible>
  )
  const has = (g: StyleGroup) => groups.includes(g)
  const isSection = node.type === 'section'

  return (
    <div>
      {has('typography') &&
        section(
          'Typography',
          ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'textAlign', 'fontStyle'],
          <>
            <FieldRow label="Alignment">
              <Segmented
                label="Text alignment"
                value={s.textAlign}
                onChange={(v) => set({ textAlign: v === s.textAlign ? undefined : v })}
                options={[
                  { value: 'left', label: <AlignLeft />, title: 'Left' },
                  { value: 'center', label: <AlignCenter />, title: 'Centre' },
                  { value: 'right', label: <AlignRight />, title: 'Right' },
                  { value: 'justify', label: <AlignJustify />, title: 'Justify' },
                ]}
              />
            </FieldRow>
            <FieldRow label="Colour">
              <ColorField label="Text colour" value={own.color ?? (device === 'desktop' ? undefined : s.color)} onChange={(c) => set({ color: c || undefined })} />
            </FieldRow>
            <FieldRow label="Font">
              <select className={inputClass} value={s.fontFamily ?? ''} onChange={(e) => set({ fontFamily: e.target.value || undefined })}>
                <option value="">Theme default</option>
                <option value="var(--heading-font)">Theme heading font</option>
                <option value="var(--body-font)">Theme body font</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Size">
              <Segmented size="sm" label="Font size preset" value={FONT_SIZE_PRESETS.some((p) => p.value === s.fontSize) ? s.fontSize : undefined} onChange={(v) => set({ fontSize: v })} options={FONT_SIZE_PRESETS} />
              <UnitInput label="Font size" value={s.fontSize} onChange={(v) => set({ fontSize: v })} placeholder="Default" />
            </FieldRow>
            <div className="grid grid-cols-2 gap-2">
              <FieldRow label="Weight">
                <select className={inputClass} value={s.fontWeight ?? ''} onChange={(e) => set({ fontWeight: e.target.value || undefined })}>
                  <option value="">Default</option>
                  {[['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extra bold']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="Line height">
                <input className={inputClass} inputMode="decimal" placeholder="Default" value={s.lineHeight ?? ''} onChange={(e) => set({ lineHeight: e.target.value.trim() || undefined })} aria-label="Line height" />
              </FieldRow>
              <FieldRow label="Letter spacing">
                <UnitInput label="Letter spacing" value={s.letterSpacing} onChange={(v) => set({ letterSpacing: v })} units={['px', 'em']} />
              </FieldRow>
              <FieldRow label="Case">
                <select className={inputClass} value={s.textTransform ?? ''} onChange={(e) => set({ textTransform: (e.target.value || undefined) as Style['textTransform'] })}>
                  <option value="">Default</option>
                  <option value="none">As typed</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                  <option value="capitalize">Capitalize</option>
                </select>
              </FieldRow>
            </div>
            <Toggle checked={s.fontStyle === 'italic'} onChange={(v) => set({ fontStyle: v ? 'italic' : undefined })} label="Italic" />
          </>
        )}

      {has('spacing') &&
        section(
          'Spacing',
          ['margin', 'padding'],
          <>
            <BoxControl label="Inner space (padding)" value={s.padding} onChange={(v) => set({ padding: v })} />
            <BoxControl label="Outer space (margin)" value={s.margin} onChange={(v) => set({ margin: v })} />
          </>,
          isSection
        )}

      {has('size') &&
        section(
          'Size',
          ['width', 'maxWidth', 'height', 'minHeight', 'align'],
          <>
            <div className="grid grid-cols-2 gap-2">
              <FieldRow label="Width"><UnitInput label="Width" value={s.width} onChange={(v) => set({ width: v })} placeholder="Auto" /></FieldRow>
              <FieldRow label="Max width"><UnitInput label="Maximum width" value={s.maxWidth} onChange={(v) => set({ maxWidth: v })} placeholder="None" /></FieldRow>
              <FieldRow label="Height"><UnitInput label="Height" value={s.height} onChange={(v) => set({ height: v })} placeholder="Auto" /></FieldRow>
              <FieldRow label="Min height"><UnitInput label="Minimum height" value={s.minHeight} onChange={(v) => set({ minHeight: v })} placeholder="None" /></FieldRow>
            </div>
            {!isSection && (
              <FieldRow label="Position in its container" hint="Takes effect when the block is narrower than its container.">
                <Segmented
                  size="sm"
                  label="Block alignment"
                  value={s.align}
                  onChange={(v) => set({ align: v === s.align ? undefined : v })}
                  options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }, { value: 'full', label: 'Full' }]}
                />
              </FieldRow>
            )}
          </>,
          node.type === 'spacer' || node.type === 'image'
        )}

      {has('layout') &&
        section(
          'Layout',
          ['gap', 'alignItems', 'justifyContent'],
          <>
            <FieldRow label="Space between items"><UnitInput label="Gap" value={s.gap} onChange={(v) => set({ gap: v })} placeholder="Default" /></FieldRow>
            <FieldRow label={node.type === 'columns' ? 'Vertical alignment of columns' : 'Align items'}>
              <Segmented
                size="sm"
                label="Align items"
                value={s.alignItems}
                onChange={(v) => set({ alignItems: v === s.alignItems ? undefined : v })}
                options={[{ value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Centre' }, { value: 'flex-end', label: 'End' }, { value: 'stretch', label: 'Stretch' }]}
              />
            </FieldRow>
            {(node.type === 'group' || node.type === 'column' || isSection) && (
              <FieldRow label="Distribute items">
                <Segmented
                  size="sm"
                  label="Justify content"
                  value={s.justifyContent}
                  onChange={(v) => set({ justifyContent: v === s.justifyContent ? undefined : v })}
                  options={[{ value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Centre' }, { value: 'flex-end', label: 'End' }, { value: 'space-between', label: 'Spread' }]}
                />
              </FieldRow>
            )}
          </>,
          false
        )}

      {has('background') &&
        section(
          'Background',
          ['background'],
          device === 'desktop' ? (
            <BackgroundControl value={own.background} onChange={(v) => set({ background: v })} allowVideo={isSection} />
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground">Backgrounds are shared across devices. You can change just the colour for this device:</p>
              <ColorField label="Background colour on this device" value={own.background?.color} onChange={(c) => set({ background: c ? { type: 'color', color: c } : undefined })} />
            </>
          ),
          isSection
        )}

      {has('border') &&
        section(
          'Border',
          ['borderWidth', 'borderStyle', 'borderColor', 'borderRadius'],
          <>
            <FieldRow label="Line">
              <Segmented size="sm" label="Border style" value={s.borderStyle ?? 'none'} onChange={(v) => set({ borderStyle: v === 'none' ? undefined : v, ...(v === 'none' ? { borderWidth: undefined } : {}) })} options={[{ value: 'none', label: 'None' }, { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} />
            </FieldRow>
            {s.borderStyle && s.borderStyle !== 'none' && (
              <div className="grid grid-cols-2 gap-2">
                <FieldRow label="Width"><UnitInput label="Border width" value={s.borderWidth} onChange={(v) => set({ borderWidth: v })} units={['px']} placeholder="1" /></FieldRow>
                <FieldRow label="Colour"><ColorField label="Border colour" value={s.borderColor} onChange={(c) => set({ borderColor: c || undefined })} /></FieldRow>
              </div>
            )}
            <Presets label="Corner radius" value={s.borderRadius} presets={RADIUS_PRESETS} onChange={(v) => set({ borderRadius: v })} />
          </>,
          false
        )}

      {has('shadow') && section('Shadow', ['boxShadow'], <Presets label="Shadow" value={s.boxShadow} presets={SHADOW_PRESETS} onChange={(v) => set({ boxShadow: v })} />, false)}

      {has('position') &&
        section(
          'Position (advanced)',
          ['position', 'top', 'right', 'bottom', 'left', 'zIndex', 'opacity'],
          <>
            <FieldRow label="Positioning" hint="Absolute positioning places the block relative to the nearest section. Use sparingly — it can overlap content on small screens.">
              <Segmented size="sm" value={s.position ?? 'static'} onChange={(v) => set({ position: v === 'static' ? undefined : v })} options={[{ value: 'static', label: 'Normal' }, { value: 'relative', label: 'Relative' }, { value: 'absolute', label: 'Absolute' }]} />
            </FieldRow>
            {s.position && s.position !== 'static' && (
              <div className="grid grid-cols-2 gap-2">
                {(['top', 'right', 'bottom', 'left'] as const).map((k) => (
                  <FieldRow key={k} label={k[0].toUpperCase() + k.slice(1)}><UnitInput label={k} value={s[k]} onChange={(v) => set({ [k]: v })} /></FieldRow>
                ))}
                <FieldRow label="Layer (z-index)"><input className={inputClass} inputMode="numeric" value={s.zIndex ?? ''} onChange={(e) => set({ zIndex: e.target.value.replace(/[^\d-]/g, '') || undefined })} /></FieldRow>
              </div>
            )}
            <FieldRow label={`Opacity: ${Math.round(Number(s.opacity ?? 1) * 100)}%`}>
              <input type="range" min={0} max={1} step={0.05} value={Number(s.opacity ?? 1)} onChange={(e) => set({ opacity: e.target.value === '1' ? undefined : e.target.value })} className="accent-primary" aria-label="Opacity" />
            </FieldRow>
          </>,
          false
        )}

      {has('visibility') && (
        <Collapsible title="Visibility" defaultOpen={false}>
          <p className="text-[11px] text-muted-foreground">Hide this block on some screen sizes.</p>
          {(['desktop', 'tablet', 'mobile'] as const).map((d) => {
            const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone
            const hidden = node.style?.[d]?.display === 'none'
            return (
              <button
                key={d}
                type="button"
                aria-pressed={hidden}
                onClick={() => onStyle(d, { display: hidden ? undefined : 'none' })}
                className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <span className="flex items-center gap-2 capitalize"><Icon className="size-3.5" />{d}</span>
                <span className={cx('flex items-center gap-1', hidden ? 'text-red-600' : 'text-green-700')}>
                  {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />} {hidden ? 'Hidden' : 'Visible'}
                </span>
              </button>
            )
          })}
        </Collapsible>
      )}

    </div>
  )
}
