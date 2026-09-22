'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { History, RotateCcw } from 'lucide-react'
import { PageBody } from '@/components/builder-render/render'
import type { RenderData } from '@/components/builder-render/context'
import { listRevisionsAction, restoreRevisionAction, updatePageSettingsAction } from '@/lib/builder/actions'
import { normalizeSlug, validateSlug } from '@/lib/builder/defaults'
import { sanitizeHtmlClient } from '@/lib/builder/sanitize-client'
import { relativeTime } from '@/lib/cms/format'
import type { PageDoc, PageSeo } from '@/lib/builder/types'
import { usePages } from './link-field'
import { MediaPickerDialog } from './media'
import { Btn, Dialog, FieldRow, Segmented, Skeleton, Spinner, Toggle, cx, inputClass } from './ui'

export type PageMeta = {
  id: string
  title: string
  slug: string
  status: string
  legacy_key: string | null
  parent_id: string | null
  seo: PageSeo
  featured_image: string | null
  published_at: string | null
}

function Counter({ value, ideal }: { value: string; ideal: [number, number] }) {
  const len = value.length
  const ok = len >= ideal[0] && len <= ideal[1]
  return <span className={cx('text-[11px]', len === 0 ? 'text-muted-foreground' : ok ? 'text-green-700' : 'text-amber-700')}>{len} characters · aim for {ideal[0]}–{ideal[1]}</span>
}

export function SeoPreview({ title, description, url, image }: { title: string; description: string; url: string; image?: string | null }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-white p-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Search result</p>
        <p className="truncate text-xs text-[#202124]">{url}</p>
        <p className="truncate text-base text-[#1a0dab]">{title || 'Page title'}</p>
        <p className="line-clamp-2 text-xs text-[#4d5156]">{description || 'Add a description to control what search engines show here.'}</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Social share</p>
        <div className="mt-1 aspect-[1.91/1] bg-muted">{image && <img src={image} alt="" className="h-full w-full object-cover" />}</div>
        <div className="p-2.5">
          <p className="truncate text-[11px] uppercase text-muted-foreground">{url.replace(/^https?:\/\//, '').split('/')[0]}</p>
          <p className="truncate text-sm font-semibold">{title || 'Page title'}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

export function PageSettingsDialog({ open, onClose, page, onSaved, siteUrl, defaultTab = 'general', seoOnly = false }: { open: boolean; onClose: () => void; page: PageMeta; onSaved: (p: PageMeta) => void; siteUrl: string; defaultTab?: 'general' | 'seo'; seoOnly?: boolean }) {
  const pages = usePages()
  const [tab, setTab] = useState<'general' | 'seo'>(defaultTab)
  const [title, setTitle] = useState(page.title)
  const [slug, setSlug] = useState(page.slug)
  const [parentId, setParentId] = useState(page.parent_id ?? '')
  const [featured, setFeatured] = useState(page.featured_image ?? '')
  const [seo, setSeo] = useState<PageSeo>(page.seo ?? {})
  const [redirect, setRedirect] = useState(true)
  const [busy, setBusy] = useState(false)
  const [picker, setPicker] = useState<'featured' | 'og' | null>(null)

  useEffect(() => {
    if (!open) return
    setTab(seoOnly ? 'seo' : defaultTab)
    setTitle(page.title)
    setSlug(page.slug)
    setParentId(page.parent_id ?? '')
    setFeatured(page.featured_image ?? '')
    setSeo(page.seo ?? {})
  }, [open, page, defaultTab, seoOnly])

  const cleanSlug = normalizeSlug(slug)
  const slugError = page.legacy_key ? null : validateSlug(cleanSlug)
  const slugChanged = cleanSlug !== page.slug
  const s = (patch: Partial<PageSeo>) => setSeo({ ...seo, ...patch })

  async function save() {
    if (slugError) return toast.error(slugError)
    setBusy(true)
    const res = await updatePageSettingsAction(page.id, { title, slug: cleanSlug, parentId: parentId || null, seo, featuredImage: featured || null, createRedirect: redirect })
    setBusy(false)
    if ('error' in res) return toast.error(res.error)
    toast.success('Page settings saved')
    onSaved({ ...page, title, slug: res.slug, parent_id: parentId || null, seo, featured_image: featured || null })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Page settings"
      size="lg"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={busy || !!slugError}>{busy ? <><Spinner /> Saving…</> : 'Save settings'}</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!seoOnly && <Segmented label="Settings section" value={tab} onChange={setTab} options={[{ value: 'general', label: 'General' }, { value: 'seo', label: 'SEO & sharing' }]} />}
        {tab === 'general' ? (
          <>
            <FieldRow label="Page name" htmlFor="ps-title">
              <input id="ps-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
            </FieldRow>
            <FieldRow label="Page URL" htmlFor="ps-slug" hint={page.legacy_key ? 'This is one of the original site pages, so its URL is fixed.' : `The page will be at ${siteUrl}/${cleanSlug}`}>
              <div className="flex items-center">
                <span className="rounded-l-md border border-r-0 border-border bg-muted px-2.5 py-1.5 text-sm text-muted-foreground">/</span>
                <input id="ps-slug" className={cx(inputClass, 'rounded-l-none', slugError && 'border-red-400')} value={slug} disabled={!!page.legacy_key} onChange={(e) => setSlug(e.target.value)} onBlur={() => setSlug(cleanSlug)} />
              </div>
              {slugError && <p className="text-xs text-red-600">{slugError}</p>}
            </FieldRow>
            {slugChanged && page.published_at && !page.legacy_key && (
              <Toggle checked={redirect} onChange={setRedirect} label={`Redirect the old URL (/${page.slug}) to the new one so existing links keep working`} />
            )}
            <FieldRow label="Parent page" hint="Used for organising pages and nesting in navigation." htmlFor="ps-parent">
              <select id="ps-parent" className={inputClass} value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">None (top level)</option>
                {pages.filter((p) => p.id !== page.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Featured image" hint="Used as the default social share image and in page lists.">
              <div className="flex items-center gap-2">
                {featured && <img src={featured} alt="" className="size-14 rounded border border-border object-cover" />}
                <Btn size="sm" onClick={() => setPicker('featured')}>{featured ? 'Replace' : 'Choose image'}</Btn>
                {featured && <Btn size="sm" variant="ghost" onClick={() => setFeatured('')}>Remove</Btn>}
              </div>
            </FieldRow>
          </>
        ) : (
          <>
            <FieldRow label="SEO title" htmlFor="seo-title" extra={<Counter value={seo.title ?? ''} ideal={[30, 60]} />}>
              <input id="seo-title" className={inputClass} value={seo.title ?? ''} placeholder={title} onChange={(e) => s({ title: e.target.value })} />
            </FieldRow>
            <FieldRow label="Meta description" htmlFor="seo-desc" extra={<Counter value={seo.description ?? ''} ideal={[70, 160]} />}>
              <textarea id="seo-desc" rows={3} className={inputClass} value={seo.description ?? ''} onChange={(e) => s({ description: e.target.value })} />
            </FieldRow>
            <SeoPreview title={seo.socialTitle || seo.title || title} description={seo.socialDescription || seo.description || ''} url={`${siteUrl}/${cleanSlug}`} image={seo.ogImage || featured} />
            <details className="rounded-lg border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">Social sharing & advanced</summary>
              <div className="mt-3 flex flex-col gap-3">
                <FieldRow label="Social title" htmlFor="seo-st"><input id="seo-st" className={inputClass} value={seo.socialTitle ?? ''} placeholder="Same as SEO title" onChange={(e) => s({ socialTitle: e.target.value })} /></FieldRow>
                <FieldRow label="Social description" htmlFor="seo-sd"><textarea id="seo-sd" rows={2} className={inputClass} value={seo.socialDescription ?? ''} placeholder="Same as meta description" onChange={(e) => s({ socialDescription: e.target.value })} /></FieldRow>
                <FieldRow label="Social share image (Open Graph)">
                  <div className="flex items-center gap-2">
                    {seo.ogImage && <img src={seo.ogImage} alt="" className="h-12 w-20 rounded border border-border object-cover" />}
                    <Btn size="sm" onClick={() => setPicker('og')}>{seo.ogImage ? 'Replace' : 'Choose image'}</Btn>
                    {seo.ogImage && <Btn size="sm" variant="ghost" onClick={() => s({ ogImage: '' })}>Remove</Btn>}
                  </div>
                </FieldRow>
                <FieldRow label="Canonical URL" hint="Only needed if this content also lives at another address." htmlFor="seo-can"><input id="seo-can" className={inputClass} value={seo.canonical ?? ''} placeholder={`${siteUrl}/${cleanSlug}`} onChange={(e) => s({ canonical: e.target.value })} /></FieldRow>
                <Toggle checked={!!seo.noIndex} onChange={(v) => s({ noIndex: v })} label="Hide from search engines (noindex)" />
                <Toggle checked={!!seo.noFollow} onChange={(v) => s({ noFollow: v })} label="Ask search engines not to follow links (nofollow)" />
              </div>
            </details>
          </>
        )}
      </div>
      <MediaPickerDialog open={picker !== null} onClose={() => setPicker(null)} onSelect={({ url }) => (picker === 'og' ? s({ ogImage: url }) : setFeatured(url))} />
    </Dialog>
  )
}

type Revision = { id: string; title: string; content: PageDoc; reason: string; created_at: string; created_by_email: string | null }

const REASONS: Record<string, string> = { save: 'Saved', autosave: 'Autosaved', publish: 'Published', restore: 'Before restore', import: 'Imported' }

export function HistoryDialog({ open, onClose, pageId, data, onRestored }: { open: boolean; onClose: () => void; pageId: string; data: RenderData; onRestored: (doc: PageDoc, version: number, updatedAt: string) => void }) {
  const [revisions, setRevisions] = useState<Revision[] | null>(null)
  const [viewing, setViewing] = useState<Revision | null>(null)
  const [busy, setBusy] = useState(false)
  const rc = useMemo(() => ({ data, html: sanitizeHtmlClient }), [data])

  useEffect(() => {
    if (!open) return
    setRevisions(null)
    setViewing(null)
    listRevisionsAction(pageId).then((r) => {
      if ('error' in r) {
        toast.error(r.error)
        setRevisions([])
      } else {
        setRevisions(r.revisions)
        setViewing(r.revisions[0] ?? null)
      }
    })
  }, [open, pageId])

  async function restore(rev: Revision) {
    setBusy(true)
    const r = await restoreRevisionAction(pageId, rev.id)
    setBusy(false)
    if ('error' in r) return toast.error(r.error)
    toast.success('Version restored as your draft. Publish to make it live.')
    onRestored(r.doc, r.version, r.updatedAt)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Version history" description="Restoring a version replaces your current draft. Your current draft is kept in history too." size="xl">
      <div className="flex min-h-[60vh] gap-4">
        <ul className="flex w-64 shrink-0 flex-col gap-1 overflow-y-auto">
          {revisions === null && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}
          {revisions?.length === 0 && <p className="text-sm text-muted-foreground">No saved versions yet.</p>}
          {revisions?.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => setViewing(r)} className={cx('flex w-full flex-col rounded-md border px-3 py-2 text-left text-xs transition', viewing?.id === r.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted')}>
                <span className="font-semibold">{new Date(r.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span className="text-muted-foreground">{REASONS[r.reason] ?? r.reason} · {r.created_by_email ?? 'unknown'} · {relativeTime(r.created_at)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {viewing ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-medium"><History className="size-4" /> {REASONS[viewing.reason] ?? viewing.reason} — {new Date(viewing.created_at).toLocaleString()}</p>
                <Btn variant="primary" onClick={() => restore(viewing)} disabled={busy}><RotateCcw className="size-4" /> Restore this version</Btn>
              </div>
              <div className="relative flex-1 overflow-auto rounded-lg border border-border bg-background">
                <div className="pb-canvas-theme pointer-events-none origin-top-left" style={{ width: 1280, transform: 'scale(0.6)', background: 'var(--background)' }}>
                  <PageBody doc={viewing.content} rc={rc} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a version to preview it.</p>
          )}
        </div>
      </div>
    </Dialog>
  )
}

export function PublishDialog({ open, onClose, onPublish, status, busy }: { open: boolean; onClose: () => void; onPublish: (opts: { status: 'published' | 'scheduled' | 'private'; scheduledAt?: string }) => void; status: string; busy: boolean }) {
  const [mode, setMode] = useState<'published' | 'scheduled' | 'private'>('published')
  const [when, setWhen] = useState('')
  useEffect(() => {
    if (open) {
      setMode('published')
      const d = new Date(Date.now() + 24 * 3600 * 1000)
      d.setMinutes(0, 0, 0)
      setWhen(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16))
    }
  }, [open])
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={status === 'published' ? 'Publish changes?' : 'Publish this page?'}
      description="Visitors will see the current version of this page."
      size="sm"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={busy || (mode === 'scheduled' && !when)} onClick={() => onPublish({ status: mode, scheduledAt: mode === 'scheduled' ? new Date(when).toISOString() : undefined })}>
            {busy ? <><Spinner /> Publishing…</> : mode === 'scheduled' ? 'Schedule' : mode === 'private' ? 'Publish privately' : 'Publish'}
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-sm">
        {(
          [
            ['published', 'Publish now', 'Everyone can see the page immediately.'],
            ['scheduled', 'Schedule', 'The page goes live automatically at a date and time you choose.'],
            ['private', 'Private', 'Only signed-in admins can see the page.'],
          ] as const
        ).map(([v, label, hint]) => (
          <label key={v} className={cx('flex cursor-pointer gap-3 rounded-lg border p-3', mode === v ? 'border-primary bg-primary/5' : 'border-border')}>
            <input type="radio" name="publish-mode" checked={mode === v} onChange={() => setMode(v)} className="mt-0.5 accent-primary" />
            <span>
              <span className="block font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </span>
          </label>
        ))}
        {mode === 'scheduled' && (
          <FieldRow label="Publish on" htmlFor="pub-when">
            <input id="pub-when" type="datetime-local" className={inputClass} value={when} onChange={(e) => setWhen(e.target.value)} />
          </FieldRow>
        )}
      </div>
    </Dialog>
  )
}
