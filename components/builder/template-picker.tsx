'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Eye, Monitor, Smartphone, Tablet } from 'lucide-react'
import { PageBody } from '@/components/builder-render/render'
import type { RenderData } from '@/components/builder-render/context'
import { BUILTIN_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/builder/templates'
import { themeCss } from '@/lib/builder/theme'
import { sanitizeHtmlClient } from '@/lib/builder/sanitize-client'
import type { PageDoc, PageTemplateRow, ThemeSettings } from '@/lib/builder/types'
import { Btn, Dialog, Segmented, cx } from './ui'

const EMPTY_DATA: RenderData = {
  pageSlugs: {},
  site: { siteName: '', shortName: '', defaultSeoTitle: '', defaultSeoDescription: '', social: [{ id: 's', platform: 'linkedin', url: 'https://linkedin.com' }] },
}

const DESKTOP = 1280

// Renders a page at `width` CSS px, scaled to fill its container's width.
function ScaledPage({ doc, data, width = DESKTOP, height, live = true }: { doc: PageDoc; data: RenderData; width?: number; height?: number; live?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)
  const [innerH, setInnerH] = useState(0)
  const rc = useMemo(() => ({ data, html: sanitizeHtmlClient }), [data])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  useEffect(() => {
    const el = inner.current
    if (!el || height) return
    const ro = new ResizeObserver(() => setInnerH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [height])

  const scaledWidth = width * scale
  return (
    <div ref={box} className="relative w-full overflow-hidden" style={{ height: height ?? innerH * scale }}>
      {live && (
        <div
          ref={inner}
          className="pb-canvas-theme pointer-events-none absolute top-0 origin-top-left"
          // Centred horizontally when the page is narrower than the box (mobile).
          style={{ width, transform: `scale(${scale})`, left: `calc(50% - ${scaledWidth / 2}px)`, background: 'var(--background)' }}
        >
          <PageBody doc={doc} rc={rc} />
        </div>
      )}
    </div>
  )
}

// Thumbnail: only renders once scrolled into view to keep the dialog fast.
const Thumb = memo(function Thumb({ doc, data }: { doc: PageDoc; data: RenderData }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setVisible(true), io.disconnect()), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="relative h-48 overflow-hidden bg-background" aria-hidden="true">
      {doc.sections.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="flex size-10 items-center justify-center rounded-xl border-2 border-dashed border-border text-lg">+</span>
          Empty page
        </div>
      ) : (
        <ScaledPage doc={doc} data={data} height={192} live={visible} />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface/90 to-transparent" />
    </div>
  )
})

export type TemplateChoice = string // builtin key, or `tpl:<id>` for saved templates

type Item = { key: string; name: string; description: string; doc: PageDoc; mine: boolean; category?: string }

function PreviewDialog({ item, onClose, onUse, data, useLabel }: { item: Item | null; onClose: () => void; onUse: (key: string) => void; data: RenderData; useLabel: string }) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const width = device === 'desktop' ? DESKTOP : device === 'tablet' ? 820 : 390
  return (
    <Dialog
      open={!!item}
      onClose={onClose}
      title={item ? `Preview: ${item.name}` : ''}
      description={item?.description}
      size="xl"
      footer={
        <>
          <div className="mr-auto w-40">
            <Segmented
              size="sm"
              label="Preview size"
              value={device}
              onChange={setDevice}
              options={[
                { value: 'desktop', label: <Monitor />, title: 'Desktop' },
                { value: 'tablet', label: <Tablet />, title: 'Tablet' },
                { value: 'mobile', label: <Smartphone />, title: 'Mobile' },
              ]}
            />
          </div>
          <Btn onClick={onClose}>Back to templates</Btn>
          <Btn variant="primary" onClick={() => item && onUse(item.key)}><Check className="size-4" /> {useLabel}</Btn>
        </>
      }
    >
      {item && (
        <div className="mx-auto rounded-xl border border-border bg-[#e8ecf4] p-3">
          <div className="mx-auto overflow-hidden rounded-lg bg-white shadow-lg" style={{ maxWidth: device === 'desktop' ? '100%' : width }}>
            <ScaledPage key={device} doc={item.doc} data={data} width={width} />
          </div>
        </div>
      )}
    </Dialog>
  )
}

export function TemplatePicker({ value, onChange, custom = [], theme, data = EMPTY_DATA, useLabel = 'Use this template' }: { value: TemplateChoice; onChange: (v: TemplateChoice) => void; custom?: PageTemplateRow[]; theme?: ThemeSettings; data?: RenderData; useLabel?: string }) {
  const [cat, setCat] = useState<TemplateCategory | 'all' | 'mine'>('all')
  const [preview, setPreview] = useState<Item | null>(null)
  const docs = useMemo(() => Object.fromEntries(BUILTIN_TEMPLATES.map((t) => [t.key, t.build()])), [])
  const items: Item[] = [
    ...(cat === 'all' || cat === 'mine' ? custom.map((t) => ({ key: `tpl:${t.id}`, name: t.name, description: t.description ?? 'Saved template', doc: t.content, mine: true })) : []),
    ...(cat === 'mine' ? [] : BUILTIN_TEMPLATES.filter((t) => cat === 'all' || t.category === cat).map((t) => ({ key: t.key, name: t.name, description: t.description, doc: docs[t.key], mine: false, category: TEMPLATE_CATEGORIES.find((c) => c.key === t.category)?.label }))),
  ]

  return (
    <div className="flex flex-col gap-4">
      {theme && <style dangerouslySetInnerHTML={{ __html: themeCss(theme, '.pb-canvas-theme') }} />}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Template type">
        {[{ key: 'all', label: `All (${BUILTIN_TEMPLATES.length + custom.length})` }, ...(custom.length ? [{ key: 'mine', label: 'My templates' }] : []), ...TEMPLATE_CATEGORIES].map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={cat === c.key}
            onClick={() => setCat(c.key as typeof cat)}
            className={cx('rounded-full border px-3.5 py-1.5 text-xs font-semibold transition', cat === c.key ? 'border-primary bg-primary text-white shadow-sm shadow-primary/30' : 'border-border bg-surface text-slate-600 hover:border-primary hover:text-primary')}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="listbox" aria-label="Templates">
        {items.map((t) => (
          <li key={t.key} className="min-w-0">
            <div className={cx('group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-surface transition', value === t.key ? 'border-primary shadow-lg shadow-primary/15' : 'border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md')}>
              <button type="button" role="option" aria-selected={value === t.key} onClick={() => onChange(t.key)} className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40">
                <div className="relative w-full border-b border-border">
                  <Thumb doc={t.doc} data={data} />
                  {value === t.key && (
                    <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-md">
                      <Check className="size-4" />
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-2 px-4 pt-3 text-sm font-semibold">
                  {t.name}
                  {t.mine && <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">Mine</span>}
                </span>
                {t.category && <span className="px-4 text-[11px] font-medium uppercase tracking-wide text-primary">{t.category}</span>}
                <span className="px-4 pb-12 pt-1 text-xs text-muted-foreground">{t.description}</span>
              </button>
              {t.doc.sections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPreview(t)}
                  className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-primary hover:text-primary"
                  aria-label={`Preview ${t.name}`}
                >
                  <Eye className="size-3.5" /> Preview
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <PreviewDialog
        item={preview}
        data={data}
        useLabel={useLabel}
        onClose={() => setPreview(null)}
        onUse={(k) => {
          setPreview(null)
          onChange(k)
        }}
      />
    </div>
  )
}
