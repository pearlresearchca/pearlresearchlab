'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { saveSettingAction } from '@/lib/builder/actions'
import { DEFAULT_THEME, FONT_OPTIONS, THEME_COLOR_TOKENS, googleFontsHref, isValidFontName, themeCss } from '@/lib/builder/theme'
import type { ThemeSettings } from '@/lib/builder/types'
import { ColorField, contrastRatio } from './color-field'
import { UnitInput } from './style-controls'
import { Btn, ConfirmProvider, FieldRow, Segmented, Spinner, Toggle, cx, inputClass, useConfirm } from './ui'

function FontSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const known = FONT_OPTIONS.some((f) => f.name === value)
  const [custom, setCustom] = useState(!known)
  return (
    <FieldRow label={label} hint={custom ? 'Enter the exact name of any Google Font, e.g. “Crimson Pro”.' : undefined}>
      {custom ? (
        <div className="flex gap-2">
          <input className={cx(inputClass, value && !isValidFontName(value) && 'border-red-400')} value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} (Google Font name)`} />
          <Btn size="sm" onClick={() => { setCustom(false); onChange(FONT_OPTIONS[0].name) }}>List</Btn>
        </div>
      ) : (
        <select className={inputClass} value={value} onChange={(e) => (e.target.value === '__custom' ? setCustom(true) : onChange(e.target.value))} aria-label={label}>
          {(['sans', 'serif', 'display', 'system'] as const).map((cat) => (
            <optgroup key={cat} label={{ sans: 'Sans-serif', serif: 'Serif', display: 'Display', system: 'System' }[cat]}>
              {FONT_OPTIONS.filter((f) => f.category === cat).map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
            </optgroup>
          ))}
          <option value="__custom">Other Google Font…</option>
        </select>
      )}
    </FieldRow>
  )
}

export function ThemeEditor(props: { initial: ThemeSettings }) {
  return (
    <ConfirmProvider>
      <Inner {...props} />
    </ConfirmProvider>
  )
}

function Inner({ initial }: { initial: ThemeSettings }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [theme, setTheme] = useState(initial)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(theme) !== JSON.stringify(initial)

  const set = <K extends keyof ThemeSettings>(group: K, patch: Partial<ThemeSettings[K]>) => setTheme((t) => ({ ...t, [group]: { ...t[group], ...patch } }))
  const fonts = useMemo(() => googleFontsHref([theme.typography.headingFont, theme.typography.bodyFont]), [theme.typography.headingFont, theme.typography.bodyFont])

  const textContrast = contrastRatio(theme.colors.text, theme.colors.background)
  const buttonContrast = contrastRatio('#ffffff', theme.colors.primary)

  async function save() {
    setSaving(true)
    const r = await saveSettingAction('theme', theme)
    setSaving(false)
    if ('error' in r) return toast.error(r.error)
    toast.success('Theme saved — the website now uses these styles')
    router.refresh()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold">Colours</h2>
          <p className="mb-4 text-sm text-muted-foreground">Blocks that use a theme colour update automatically when you change it here.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {THEME_COLOR_TOKENS.map((t) => (
              <FieldRow key={t.key} label={t.label} hint={t.hint}>
                <ColorField label={t.label} allowTheme={false} value={theme.colors[t.key]} onChange={(v) => set('colors', { [t.key]: v || DEFAULT_THEME.colors[t.key] })} />
              </FieldRow>
            ))}
          </div>
          {textContrast !== null && textContrast < 4.5 && <p className="mt-3 text-sm text-amber-700">Body text on the background has low contrast ({textContrast.toFixed(1)}:1). Aim for 4.5:1 or more.</p>}
          {buttonContrast !== null && buttonContrast < 4.5 && <p className="mt-1 text-sm text-amber-700">White button text on the primary colour has low contrast ({buttonContrast.toFixed(1)}:1). Choose a darker primary colour.</p>}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-base font-semibold">Typography</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FontSelect label="Heading font" value={theme.typography.headingFont} onChange={(v) => set('typography', { headingFont: v })} />
            <FontSelect label="Body font" value={theme.typography.bodyFont} onChange={(v) => set('typography', { bodyFont: v })} />
            <FieldRow label="Heading weight">
              <select className={inputClass} value={theme.typography.headingWeight} onChange={(e) => set('typography', { headingWeight: e.target.value })}>
                {[['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Body weight">
              <select className={inputClass} value={theme.typography.bodyWeight} onChange={(e) => set('typography', { bodyWeight: e.target.value })}>
                {[['300', 'Light'], ['400', 'Regular'], ['500', 'Medium']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FieldRow>
            <FieldRow label={`Base text size: ${theme.typography.baseSize}px`}>
              <input type="range" min={14} max={21} step={1} value={theme.typography.baseSize} onChange={(e) => set('typography', { baseSize: Number(e.target.value) })} className="accent-primary" aria-label="Base text size" />
            </FieldRow>
            <FieldRow label={`Line height: ${theme.typography.lineHeight}`}>
              <input type="range" min={1.3} max={2} step={0.05} value={theme.typography.lineHeight} onChange={(e) => set('typography', { lineHeight: Number(e.target.value) })} className="accent-primary" aria-label="Line height" />
            </FieldRow>
            <FieldRow label="Heading sizes">
              <Segmented value={theme.typography.headingScale} onChange={(v) => set('typography', { headingScale: v })} options={[{ value: 'compact', label: 'Compact' }, { value: 'default', label: 'Default' }, { value: 'large', label: 'Large' }]} />
            </FieldRow>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-base font-semibold">Buttons, cards & forms</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Button corners"><UnitInput label="Button corner radius" value={theme.buttons.radius} onChange={(v) => set('buttons', { radius: v ?? '0px' })} units={['px', 'rem']} /></FieldRow>
            <FieldRow label="Button weight">
              <select className={inputClass} value={theme.buttons.fontWeight} onChange={(e) => set('buttons', { fontWeight: e.target.value })}>
                {[['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Button padding (sides)"><UnitInput label="Button horizontal padding" value={theme.buttons.paddingX} onChange={(v) => set('buttons', { paddingX: v ?? '20px' })} units={['px', 'rem']} /></FieldRow>
            <FieldRow label="Button padding (top/bottom)"><UnitInput label="Button vertical padding" value={theme.buttons.paddingY} onChange={(v) => set('buttons', { paddingY: v ?? '14px' })} units={['px', 'rem']} /></FieldRow>
            <Toggle checked={theme.buttons.textTransform === 'uppercase'} onChange={(v) => set('buttons', { textTransform: v ? 'uppercase' : 'none' })} label="Uppercase button text" />
            <div />
            <FieldRow label="Card corners"><UnitInput label="Card corner radius" value={theme.cards.radius} onChange={(v) => set('cards', { radius: v ?? '0px' })} units={['px', 'rem']} /></FieldRow>
            <FieldRow label="Card shadow">
              <Segmented size="sm" value={theme.cards.shadow} onChange={(v) => set('cards', { shadow: v })} options={[{ value: 'none', label: 'None' }, { value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' }]} />
            </FieldRow>
            <Toggle checked={theme.cards.border} onChange={(v) => set('cards', { border: v })} label="Card border" />
            <FieldRow label="Form field corners"><UnitInput label="Form field corner radius" value={theme.forms.radius} onChange={(v) => set('forms', { radius: v ?? '4px' })} units={['px', 'rem']} /></FieldRow>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-base font-semibold">Layout & spacing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label={`Content width: ${theme.layout.containerWidth}px`} hint="Maximum width of boxed sections on large screens.">
              <input type="range" min={960} max={1600} step={20} value={theme.layout.containerWidth} onChange={(e) => set('layout', { containerWidth: Number(e.target.value) })} className="accent-primary" aria-label="Content width" />
            </FieldRow>
            <FieldRow label="Space between sections">
              <Segmented value={theme.layout.sectionSpacing} onChange={(v) => set('layout', { sectionSpacing: v })} options={[{ value: 'compact', label: 'Compact' }, { value: 'default', label: 'Default' }, { value: 'spacious', label: 'Spacious' }]} />
            </FieldRow>
            <FieldRow label="Default corner radius (medium)"><UnitInput label="Default radius" value={theme.layout.radius} onChange={(v) => set('layout', { radius: v ?? '6px' })} units={['px', 'rem']} /></FieldRow>
          </div>
        </section>
      </div>

      <div className="xl:sticky xl:top-20 xl:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
        {fonts && <link rel="stylesheet" href={fonts} />}
        <style dangerouslySetInnerHTML={{ __html: themeCss(theme, '.theme-preview') }} />
        <div className="theme-preview pb-page overflow-hidden rounded-xl border border-border" style={{ background: 'var(--background)' }}>
          <div className="flex flex-col gap-3 p-6">
            <p className="pb-heading pb-heading--eyebrow">Eyebrow label</p>
            <h2 className="pb-heading pb-heading--h2" style={{ fontSize: 'calc(var(--pb-base-size) * 2)' }}>Heading in your theme</h2>
            <p className="pb-text pb-text--muted">Body text looks like this. <a href="#" className="pb-link" style={{ display: 'inline', border: 0, textDecoration: 'underline' }} onClick={(e) => e.preventDefault()}>A text link</a>.</p>
            <div className="flex flex-wrap gap-2">
              <span className="pb-btn pb-btn--primary pb-btn--md">Primary</span>
              <span className="pb-btn pb-btn--outline pb-btn--md">Outline</span>
            </div>
            <div className="pb-card" style={{ height: 'auto' }}>
              <div className="pb-card-body">
                <span className="pb-card-eyebrow">Card</span>
                <h3>Card title</h3>
                <p>Cards use the card corner, border and shadow settings.</p>
              </div>
            </div>
            <div className="pb-form" style={{ gridTemplateColumns: '1fr' }}>
              <div className="pb-form-field"><label htmlFor="tp-in">Form field</label><input id="tp-in" placeholder="Type here" /></div>
            </div>
          </div>
          <div className="pb-tone-light flex flex-col gap-2 p-6" style={{ background: 'var(--primary-dark)' }}>
            <h3 className="pb-heading pb-heading--h4">A dark section</h3>
            <p className="pb-text">Text on the secondary colour.</p>
            <span className="pb-btn pb-btn--light pb-btn--sm self-start">Light button</span>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur xl:col-span-2">
        {dirty && <span className="mr-auto text-sm text-amber-700">Unsaved changes</span>}
        <Btn variant="ghost" onClick={async () => { if (await confirm({ title: 'Reset the theme?', body: 'All colours, fonts and styles go back to the original PEARL design (after you save).', confirmLabel: 'Reset' })) setTheme(DEFAULT_THEME) }}><RotateCcw className="size-4" /> Reset to original</Btn>
        <Btn onClick={() => setTheme(initial)} disabled={!dirty}>Discard</Btn>
        <Btn variant="primary" onClick={save} disabled={!dirty || saving}>{saving ? <><Spinner /> Saving…</> : 'Save theme'}</Btn>
      </div>
    </div>
  )
}
