'use client'

import { createContext, useContext, useId } from 'react'
import { linkKind, type LinkKind, type LinkValue } from '@/lib/builder/links'
import { Toggle, cx, inputClass } from './ui'

export type PageOption = { id: string; title: string; slug: string; status: string }

// Pages available for "link to a page" pickers.
export const PagesContext = createContext<PageOption[]>([])

export function usePages() {
  return useContext(PagesContext)
}

const KINDS: { value: LinkKind; label: string }[] = [
  { value: 'page', label: 'A page on this site' },
  { value: 'url', label: 'Web address' },
  { value: 'email', label: 'Email address' },
  { value: 'phone', label: 'Phone number' },
  { value: 'anchor', label: 'Section on this page' },
]

// Well-known routes that aren't builder pages (the original pages, before import).
const BUILTIN_ROUTES = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/research', label: 'Research' },
  { href: '/projects', label: 'Projects' },
  { href: '/team', label: 'Team' },
  { href: '/contact', label: 'Contact' },
]

export function LinkField({ value, onChange, label = 'Link', allowNone = true }: { value: LinkValue | undefined; onChange: (v: LinkValue) => void; label?: string; allowNone?: boolean }) {
  const pages = usePages()
  const id = useId()
  const kind = linkKind(value)
  const href = value?.href ?? ''
  const hasValue = !!(value?.href || value?.pageId)

  function setKind(k: LinkKind) {
    const base = { newTab: value?.newTab }
    if (k === 'page') onChange({ ...base, href: '/' })
    else if (k === 'email') onChange({ ...base, href: 'mailto:' })
    else if (k === 'phone') onChange({ ...base, href: 'tel:' })
    else if (k === 'anchor') onChange({ ...base, href: '#' })
    else onChange({ ...base, href: 'https://' })
  }

  const pageValue = value?.pageId ? `id:${value.pageId}` : `href:${href}`

  return (
    <fieldset className="flex flex-col gap-2 rounded-md border border-border p-2.5">
      <legend className="px-1 text-xs font-medium">{label}</legend>
      <select aria-label="Link type" className={inputClass} value={hasValue || kind !== 'url' ? kind : ''} onChange={(e) => (e.target.value ? setKind(e.target.value as LinkKind) : onChange({}))}>
        {allowNone && <option value="">No link</option>}
        {KINDS.map((k) => (
          <option key={k.value} value={k.value}>{k.label}</option>
        ))}
      </select>

      {(hasValue || kind !== 'url') && (
        <>
          {kind === 'page' && (
            <select
              aria-label="Page"
              className={inputClass}
              value={pageValue}
              onChange={(e) => {
                const v = e.target.value
                if (v.startsWith('id:')) {
                  const p = pages.find((pg) => pg.id === v.slice(3))
                  onChange({ ...value, pageId: v.slice(3), href: '/' + (p?.slug ?? '') })
                } else onChange({ ...value, pageId: undefined, href: v.slice(5) })
              }}
            >
              <optgroup label="Site pages">
                {BUILTIN_ROUTES.map((r) => (
                  <option key={r.href} value={`href:${r.href}`}>{r.label} ({r.href})</option>
                ))}
              </optgroup>
              {pages.length > 0 && (
                <optgroup label="Builder pages">
                  {pages.map((p) => (
                    <option key={p.id} value={`id:${p.id}`}>
                      {p.title} (/{p.slug}){p.status !== 'published' ? ` — ${p.status}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
          {kind === 'url' && <input id={id} className={inputClass} value={href} placeholder="https://example.com" onChange={(e) => onChange({ ...value, pageId: undefined, href: e.target.value })} aria-label="Web address" />}
          {kind === 'email' && (
            <input className={inputClass} type="email" value={href.replace(/^mailto:/, '')} placeholder="hello@example.com" onChange={(e) => onChange({ ...value, pageId: undefined, href: 'mailto:' + e.target.value.trim() })} aria-label="Email address" />
          )}
          {kind === 'phone' && (
            <input className={inputClass} type="tel" value={href.replace(/^tel:/, '')} placeholder="+1 902 555 0100" onChange={(e) => onChange({ ...value, pageId: undefined, href: 'tel:' + e.target.value.replace(/[^\d+]/g, '') })} aria-label="Phone number" />
          )}
          {kind === 'anchor' && (
            <>
              <input className={inputClass} value={href.replace(/^#/, '')} placeholder="contact" onChange={(e) => onChange({ ...value, pageId: undefined, href: '#' + e.target.value.replace(/[^A-Za-z0-9_-]/g, '') })} aria-label="Section ID" />
              <p className="text-[11px] text-muted-foreground">Give the target block this ID under its Advanced tab.</p>
            </>
          )}
          {kind !== 'anchor' && <Toggle checked={!!value?.newTab} onChange={(v) => onChange({ ...value, newTab: v })} label="Open in a new tab" />}
          {kind === 'url' && href && !/^https?:\/\//.test(href) && <p className={cx('text-[11px] text-amber-700')}>Web addresses should start with https://</p>}
        </>
      )}
    </fieldset>
  )
}
