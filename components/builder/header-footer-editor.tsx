'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { saveSettingAction } from '@/lib/builder/actions'
import { uid } from '@/lib/builder/tree'
import type { FooterColumn, FooterSettings, HeaderSettings } from '@/lib/builder/types'
import { ColorField } from './color-field'
import { Btn, FieldRow, IconBtn, Segmented, Spinner, Toggle, cx, inputClass } from './ui'

const COLUMN_KINDS: { value: FooterColumn['kind']; label: string }[] = [
  { value: 'brand', label: 'Logo & description' },
  { value: 'links', label: 'Links' },
  { value: 'text', label: 'Text' },
  { value: 'contact', label: 'Contact information' },
  { value: 'social', label: 'Social links' },
  { value: 'newsletter', label: 'Newsletter / get in touch' },
]

function useSaver(key: 'header' | 'footer') {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  async function save(value: unknown) {
    setSaving(true)
    const r = await saveSettingAction(key, value)
    setSaving(false)
    if ('error' in r) return toast.error(r.error)
    toast.success(`${key === 'header' ? 'Header' : 'Footer'} saved — updated on every page`)
    router.refresh()
  }
  return { saving, save }
}

export function HeaderFooterEditor({ header: h0, footer: f0 }: { header: HeaderSettings; footer: FooterSettings }) {
  const [header, setHeader] = useState(h0)
  const [footer, setFooter] = useState(f0)
  const hs = useSaver('header')
  const fs = useSaver('footer')
  const setH = (p: Partial<HeaderSettings>) => setHeader((x) => ({ ...x, ...p }))
  const setCol = (i: number, p: Partial<FooterColumn>) => setFooter((f) => ({ ...f, columns: f.columns.map((c, j) => (j === i ? { ...c, ...p } : c)) }))
  const moveCol = (i: number, d: number) =>
    setFooter((f) => {
      const cols = [...f.columns]
      const [c] = cols.splice(i, 1)
      cols.splice(i + d, 0, c)
      return { ...f, columns: cols }
    })

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Header</h2>
          <Btn variant="primary" onClick={() => hs.save(header)} disabled={hs.saving || JSON.stringify(header) === JSON.stringify(h0)}>{hs.saving ? <Spinner /> : null} Save header</Btn>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Layout">
            <Segmented value={header.layout} onChange={(v) => setH({ layout: v })} options={[{ value: 'inline', label: 'Logo | Menu | Button' }, { value: 'stacked', label: 'Logo, menu below' }, { value: 'centered', label: 'Centred' }]} size="sm" />
          </FieldRow>
          <div className="flex flex-col gap-2">
            <Toggle checked={header.sticky} onChange={(v) => setH({ sticky: v })} label="Stay at the top while scrolling" />
            <Toggle checked={header.showLogo} onChange={(v) => setH({ showLogo: v })} label="Show logo (set in Site settings)" />
            <Toggle checked={header.showSiteName} onChange={(v) => setH({ showSiteName: v })} label="Show site name" />
            <Toggle checked={header.showNumbers} onChange={(v) => setH({ showNumbers: v })} label="Number the menu items (01, 02 …)" />
            <Toggle checked={header.showSocial} onChange={(v) => setH({ showSocial: v })} label="Show social links" />
            <Toggle checked={header.showContact} onChange={(v) => setH({ showContact: v })} label="Show contact email" />
          </div>
          {header.showSiteName && (
            <>
              <FieldRow label="Site name" htmlFor="h-name"><input id="h-name" className={inputClass} value={header.siteName} onChange={(e) => setH({ siteName: e.target.value })} /></FieldRow>
              <FieldRow label="Tagline (under the name)" htmlFor="h-tag" hint="Press Enter for a second line."><textarea id="h-tag" rows={2} className={inputClass} value={header.tagline} onChange={(e) => setH({ tagline: e.target.value })} /></FieldRow>
            </>
          )}
          <Toggle checked={header.showCta} onChange={(v) => setH({ showCta: v })} label="Show a button in the header" />
          <div />
          {header.showCta && (
            <>
              <FieldRow label="Button text" htmlFor="h-cta"><input id="h-cta" className={inputClass} value={header.ctaLabel} onChange={(e) => setH({ ctaLabel: e.target.value })} /></FieldRow>
              <FieldRow label="Button link" htmlFor="h-ctau"><input id="h-ctau" className={inputClass} value={header.ctaUrl} placeholder="/contact" onChange={(e) => setH({ ctaUrl: e.target.value })} /></FieldRow>
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Menu items are managed under Navigation.</p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Footer</h2>
          <Btn variant="primary" onClick={() => fs.save(footer)} disabled={fs.saving || JSON.stringify(footer) === JSON.stringify(f0)}>{fs.saving ? <Spinner /> : null} Save footer</Btn>
        </div>
        <div className="flex flex-col gap-3">
          {footer.columns.map((col, i) => (
            <div key={col.id} className="rounded-lg border border-border bg-background p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Column {i + 1}</span>
                <select className={cx(inputClass, 'w-auto py-1 text-xs')} value={col.kind} onChange={(e) => setCol(i, { kind: e.target.value as FooterColumn['kind'] })} aria-label={`Column ${i + 1} type`}>
                  {COLUMN_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
                <span className="ml-auto flex">
                  <IconBtn label="Move left" disabled={i === 0} onClick={() => moveCol(i, -1)}><ArrowUp /></IconBtn>
                  <IconBtn label="Move right" disabled={i === footer.columns.length - 1} onClick={() => moveCol(i, 1)}><ArrowDown /></IconBtn>
                  <IconBtn label="Remove column" className="hover:text-red-600" onClick={() => setFooter((f) => ({ ...f, columns: f.columns.filter((_, j) => j !== i) }))}><Trash2 /></IconBtn>
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldRow label={col.kind === 'brand' ? 'Subtitle under the name' : 'Heading'}><input className={inputClass} value={col.title ?? ''} onChange={(e) => setCol(i, { title: e.target.value })} /></FieldRow>
                {col.kind !== 'social' && col.kind !== 'links' && (
                  <FieldRow label="Text"><textarea rows={2} className={inputClass} value={col.text ?? ''} onChange={(e) => setCol(i, { text: e.target.value })} /></FieldRow>
                )}
                {col.kind === 'links' && <Toggle checked={!!col.useNavigation} onChange={(v) => setCol(i, { useNavigation: v })} label="Include the main menu links" />}
              </div>
              {(col.kind === 'links' || col.kind === 'contact') && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {(col.links ?? []).map((l, j) => (
                    <div key={l.id} className="flex gap-1.5">
                      <input className={inputClass} value={l.label} placeholder="Label" aria-label="Link label" onChange={(e) => setCol(i, { links: col.links!.map((x, k) => (k === j ? { ...x, label: e.target.value } : x)) })} />
                      <input className={inputClass} value={l.url} placeholder="/page or https://…" aria-label="Link address" onChange={(e) => setCol(i, { links: col.links!.map((x, k) => (k === j ? { ...x, url: e.target.value } : x)) })} />
                      <IconBtn label="Remove link" onClick={() => setCol(i, { links: col.links!.filter((_, k) => k !== j) })}><Trash2 /></IconBtn>
                    </div>
                  ))}
                  <div><Btn size="sm" onClick={() => setCol(i, { links: [...(col.links ?? []), { id: uid(), label: 'New link', url: '/' }] })}><Plus className="size-3.5" /> Add link</Btn></div>
                </div>
              )}
            </div>
          ))}
          <div><Btn onClick={() => setFooter((f) => ({ ...f, columns: [...f.columns, { id: uid(), kind: 'text', title: 'New column', text: '' }] }))}><Plus className="size-4" /> Add column</Btn></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Copyright line"><input className={inputClass} value={footer.copyright} onChange={(e) => setFooter({ ...footer, copyright: e.target.value })} /></FieldRow>
            <FieldRow label="Tagline (bottom right)"><input className={inputClass} value={footer.tagline} onChange={(e) => setFooter({ ...footer, tagline: e.target.value })} /></FieldRow>
            <FieldRow label="Background colour"><ColorField label="Footer background" value={footer.background} onChange={(v) => setFooter({ ...footer, background: v || undefined })} /></FieldRow>
            <FieldRow label="Text colour"><ColorField label="Footer text colour" value={footer.textColor} onChange={(v) => setFooter({ ...footer, textColor: v || undefined })} against={footer.background} /></FieldRow>
          </div>
        </div>
      </section>
    </div>
  )
}
