'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { PageBody } from '@/components/builder-render/render'
import type { RenderData } from '@/components/builder-render/context'
import { BUILTIN_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/builder/templates'
import { themeCss } from '@/lib/builder/theme'
import { sanitizeHtmlClient } from '@/lib/builder/sanitize-client'
import type { PageDoc, PageTemplateRow, ThemeSettings } from '@/lib/builder/types'
import { cx } from './ui'

const EMPTY_DATA: RenderData = {
  pageSlugs: {},
  site: { siteName: '', shortName: '', defaultSeoTitle: '', defaultSeoDescription: '', social: [{ id: 's', platform: 'linkedin', url: 'https://linkedin.com' }] },
}

// Live thumbnail: renders the real page at desktop width, scaled down. Only
// renders once scrolled into view to keep the dialog fast.
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
  const rc = useMemo(() => ({ data, html: sanitizeHtmlClient }), [data])
  return (
    <div ref={ref} className="pointer-events-none relative h-44 overflow-hidden bg-background" aria-hidden="true">
      {visible && doc.sections.length > 0 && (
        <div className="pb-canvas-theme absolute left-0 top-0 origin-top-left" style={{ width: 1280, transform: 'scale(0.215)', background: 'var(--background)' }}>
          <PageBody doc={doc} rc={rc} />
        </div>
      )}
      {doc.sections.length === 0 && <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Empty page</div>}
    </div>
  )
})

export type TemplateChoice = string // builtin key, or `tpl:<id>` for saved templates

export function TemplatePicker({ value, onChange, custom = [], theme, data = EMPTY_DATA }: { value: TemplateChoice; onChange: (v: TemplateChoice) => void; custom?: PageTemplateRow[]; theme?: ThemeSettings; data?: RenderData }) {
  const [cat, setCat] = useState<TemplateCategory | 'all' | 'mine'>('all')
  const docs = useMemo(() => Object.fromEntries(BUILTIN_TEMPLATES.map((t) => [t.key, t.build()])), [])
  const items = [
    ...(cat === 'all' || cat === 'mine' ? custom.map((t) => ({ key: `tpl:${t.id}`, name: t.name, description: t.description ?? 'Saved template', doc: t.content, mine: true })) : []),
    ...(cat === 'mine' ? [] : BUILTIN_TEMPLATES.filter((t) => cat === 'all' || t.category === cat).map((t) => ({ key: t.key, name: t.name, description: t.description, doc: docs[t.key], mine: false }))),
  ]

  return (
    <div className="flex flex-col gap-3">
      {theme && <style dangerouslySetInnerHTML={{ __html: themeCss(theme, '.pb-canvas-theme') }} />}
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Template type">
        {[{ key: 'all', label: 'All' }, ...(custom.length ? [{ key: 'mine', label: 'My templates' }] : []), ...TEMPLATE_CATEGORIES].map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={cat === c.key}
            onClick={() => setCat(c.key as typeof cat)}
            className={cx('rounded-full border px-3 py-1 text-xs font-medium transition', cat === c.key ? 'border-primary bg-primary text-white' : 'border-border bg-surface hover:border-primary')}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="listbox" aria-label="Templates">
        {items.map((t) => (
          <li key={t.key}>
            <button
              type="button"
              role="option"
              aria-selected={value === t.key}
              onClick={() => onChange(t.key)}
              className={cx('flex w-full flex-col overflow-hidden rounded-lg border-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40', value === t.key ? 'border-primary shadow-md' : 'border-border hover:border-primary/50')}
            >
              <div className="relative border-b border-border">
                <Thumb doc={t.doc} data={data} />
                {value === t.key && (
                  <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-4" />
                  </span>
                )}
              </div>
              <span className="px-3 pt-2 text-sm font-semibold">
                {t.name} {t.mine && <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">Mine</span>}
              </span>
              <span className="px-3 pb-3 pt-0.5 text-xs text-muted-foreground">{t.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
