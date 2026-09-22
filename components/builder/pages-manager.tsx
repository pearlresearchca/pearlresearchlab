'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDownUp, Copy, ExternalLink, Eye, FileDown, MoreHorizontal, Pencil, Plus, Search, Settings2, Trash2, Upload } from 'lucide-react'
import { bulkPagesAction, createPageAction, deletePageAction, duplicatePageAction, importLegacyPagesAction, publishPageAction, unpublishPageAction } from '@/lib/builder/actions'
import { normalizeSlug, validateSlug } from '@/lib/builder/defaults'
import { relativeTime } from '@/lib/cms/format'
import type { CmsPageSummary, PageTemplateRow, ThemeSettings } from '@/lib/builder/types'
import { PagesContext } from './link-field'
import { PageSettingsDialog } from './page-dialogs'
import { MediaPickerDialog } from './media'
import { TemplatePicker } from './template-picker'
import { Btn, ConfirmProvider, Dialog, FieldRow, Spinner, StatusBadge, Toggle, cx, inputClass, useConfirm } from './ui'

type Row = CmsPageSummary & { inNav: boolean; updatedByName: string | null; publishedByName: string | null }

type Props = {
  pages: Row[]
  templates: PageTemplateRow[]
  theme: ThemeSettings
  siteUrl: string
  canCreate: boolean
  canNav: boolean
  openCreate?: boolean
  legacyToImport: { key: string; title: string; slug: string }[]
}

export function PagesManager(props: Props) {
  return (
    <ConfirmProvider>
      <PagesContext.Provider value={props.pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status }))}>
        <Inner {...props} />
      </PagesContext.Provider>
    </ConfirmProvider>
  )
}

function Inner({ pages, templates, theme, siteUrl, canCreate, canNav, legacyToImport, openCreate }: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [navFilter, setNavFilter] = useState('all')
  const [sort, setSort] = useState<'updated' | 'name'>('updated')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [creating, setCreating] = useState(!!openCreate && canCreate)
  const [settingsFor, setSettingsFor] = useState<{ row: Row; tab: 'general' | 'seo' } | null>(null)
  const [menu, setMenu] = useState<string | null>(null)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pages
      .filter((p) => (!q || `${p.title} /${p.slug}`.toLowerCase().includes(q)) && (status === 'all' || p.status === status) && (navFilter === 'all' || (navFilter === 'yes') === p.inNav))
      .sort((a, b) => (sort === 'name' ? a.title.localeCompare(b.title) : b.updated_at.localeCompare(a.updated_at)))
  }, [pages, query, status, navFilter, sort])

  async function act(id: string, fn: () => Promise<{ ok: true } | { error: string }>, success: string) {
    setBusy(id)
    setMenu(null)
    const r = await fn()
    setBusy(null)
    if ('error' in r) toast.error(r.error)
    else {
      toast.success(success)
      router.refresh()
    }
    return r
  }

  async function remove(row: Row) {
    if (!(await confirm({ title: `Delete “${row.title}”?`, body: 'The page and its version history will be permanently deleted. Links to it will stop working.', confirmLabel: 'Delete', danger: true }))) return
    act(row.id, () => deletePageAction(row.id), 'Page deleted')
  }

  async function bulk(action: 'publish' | 'unpublish' | 'delete') {
    const ids = [...selected]
    if (!ids.length) return
    const labels = { publish: 'Publish', unpublish: 'Unpublish', delete: 'Delete' }
    if (!(await confirm({ title: `${labels[action]} ${ids.length} page${ids.length > 1 ? 's' : ''}?`, body: action === 'delete' ? 'This can’t be undone. Builder versions of the original pages are skipped.' : undefined, confirmLabel: labels[action], danger: action === 'delete' }))) return
    setBusy('bulk')
    const r = await bulkPagesAction(ids, action)
    setBusy(null)
    if ('error' in r) toast.error(r.error)
    else toast.success('Done')
    setSelected(new Set())
    router.refresh()
  }

  const allSelected = list.length > 0 && list.every((p) => selected.has(p.id))

  return (
    <div className="flex flex-col gap-5">
      {legacyToImport.length > 0 && <ImportCard items={legacyToImport} />}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input className={cx(inputClass, 'py-2 pl-8')} placeholder="Search pages" aria-label="Search pages" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select aria-label="Filter by status" className={cx(inputClass, 'w-auto py-2')} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {['published', 'draft', 'scheduled', 'private', 'unpublished'].map((s) => <option key={s} value={s} className="capitalize">{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select aria-label="Filter by navigation" className={cx(inputClass, 'w-auto py-2')} value={navFilter} onChange={(e) => setNavFilter(e.target.value)}>
          <option value="all">In menu: any</option>
          <option value="yes">In the menu</option>
          <option value="no">Not in the menu</option>
        </select>
        <Btn onClick={() => setSort(sort === 'updated' ? 'name' : 'updated')} aria-label="Change sort order"><ArrowDownUp className="size-4" /> {sort === 'updated' ? 'Recently updated' : 'Name A–Z'}</Btn>
        {canCreate && <Btn variant="primary" onClick={() => setCreating(true)}><Plus className="size-4" /> Create new page</Btn>}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm" role="region" aria-label="Bulk actions">
          <span className="font-medium">{selected.size} selected</span>
          <Btn size="sm" onClick={() => bulk('publish')} disabled={busy === 'bulk'}>Publish</Btn>
          <Btn size="sm" onClick={() => bulk('unpublish')} disabled={busy === 'bulk'}>Unpublish</Btn>
          <Btn size="sm" variant="danger" onClick={() => bulk('delete')} disabled={busy === 'bulk'}>Delete</Btn>
          {busy === 'bulk' && <Spinner className="text-primary" />}
          <button type="button" className="ml-auto text-xs text-muted-foreground hover:underline" onClick={() => setSelected(new Set())}>Clear selection</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border bg-background/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input type="checkbox" aria-label="Select all pages" className="size-4 accent-primary" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(list.map((p) => p.id)))} />
              </th>
              <th className="px-3 py-2.5 font-semibold">Page</th>
              <th className="px-3 py-2.5 font-semibold">URL</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">In menu</th>
              <th className="px-3 py-2.5 font-semibold">Updated</th>
              <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                  {pages.length === 0 ? 'No pages yet. Create one, or import the original site pages above.' : 'No pages match your filters.'}
                </td>
              </tr>
            )}
            {list.map((p) => {
              const live = p.status === 'published' || p.status === 'private' || p.status === 'scheduled'
              return (
                <tr key={p.id} className={cx('transition hover:bg-background/60', busy === p.id && 'opacity-60')}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" aria-label={`Select ${p.title}`} className="size-4 accent-primary" checked={selected.has(p.id)} onChange={() => setSelected((s) => { const x = new Set(s); if (x.has(p.id)) x.delete(p.id); else x.add(p.id); return x })} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/builder/${p.id}`} className="font-medium text-foreground hover:text-primary">{p.title}</Link>
                    {p.legacy_key && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground" title="Builder version of one of the original pages">Original page</span>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">/{p.slug}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={p.status} />
                    {p.status === 'scheduled' && p.scheduled_at && <span className="ml-1 text-xs text-muted-foreground">{new Date(p.scheduled_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs">{p.inNav ? 'Yes' : <span className="text-muted-foreground">No</span>}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground" title={p.publishedByName && p.published_at ? `Published by ${p.publishedByName}, ${new Date(p.published_at).toLocaleString()}` : undefined}>
                    {relativeTime(p.updated_at)}
                    {p.updatedByName && <span className="block">by {p.updatedByName}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/builder/${p.id}`} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"><Pencil className="size-3.5" /> Edit</Link>
                      <span className="relative">
                        <button type="button" aria-label={`More actions for ${p.title}`} aria-expanded={menu === p.id} onClick={() => setMenu(menu === p.id ? null : p.id)} className="rounded-md p-1.5 hover:bg-muted"><MoreHorizontal className="size-4" /></button>
                        {menu === p.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 flex w-52 flex-col rounded-lg border border-border bg-surface p-1 text-left text-sm shadow-xl" role="menu" onMouseLeave={() => setMenu(null)}>
                            <a role="menuitem" href={`/admin/preview/${p.id}`} target="_blank" className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-muted"><Eye className="size-4" /> Preview</a>
                            {live && <a role="menuitem" href={`/${p.slug}`} target="_blank" className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-muted"><ExternalLink className="size-4" /> View live page</a>}
                            {p.status !== 'published' ? (
                              <button role="menuitem" type="button" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-muted" onClick={async () => { if (await confirm({ title: `Publish “${p.title}”?`, body: 'Its current draft becomes visible to visitors.', confirmLabel: 'Publish' })) act(p.id, () => publishPageAction(p.id), 'Page published') }}><Upload className="size-4" /> Publish</button>
                            ) : (
                              <button role="menuitem" type="button" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-muted" onClick={async () => { if (await confirm({ title: `Unpublish “${p.title}”?`, body: p.legacy_key ? 'Visitors will see the original version of this page again.' : 'Visitors will no longer see this page.', confirmLabel: 'Unpublish', danger: true })) act(p.id, () => unpublishPageAction(p.id), 'Page unpublished') }}><FileDown className="size-4" /> Unpublish</button>
                            )}
                            <button role="menuitem" type="button" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-muted" onClick={() => { setMenu(null); setSettingsFor({ row: p, tab: 'general' }) }}><Settings2 className="size-4" /> Change URL & settings</button>
                            <button role="menuitem" type="button" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-muted" onClick={() => { setMenu(null); setSettingsFor({ row: p, tab: 'seo' }) }}><Search className="size-4" /> SEO</button>
                            {canNav && <Link role="menuitem" href="/admin/navigation" className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-muted"><ArrowDownUp className="size-4" /> Manage navigation</Link>}
                            {canCreate && <button role="menuitem" type="button" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-muted" onClick={() => act(p.id, () => duplicatePageAction(p.id), 'Page duplicated as a draft')}><Copy className="size-4" /> Duplicate</button>}
                            {canCreate && !p.legacy_key && <button role="menuitem" type="button" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-red-600 hover:bg-red-50" onClick={() => { setMenu(null); remove(p) }}><Trash2 className="size-4" /> Delete</button>}
                          </div>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <CreatePageDialog open={creating} onClose={() => setCreating(false)} templates={templates} theme={theme} siteUrl={siteUrl} pages={pages} canNav={canNav} />
      {settingsFor && (
        <PageSettingsDialog
          open
          defaultTab={settingsFor.tab}
          onClose={() => setSettingsFor(null)}
          page={{ id: settingsFor.row.id, title: settingsFor.row.title, slug: settingsFor.row.slug, status: settingsFor.row.status, legacy_key: settingsFor.row.legacy_key, parent_id: settingsFor.row.parent_id, seo: settingsFor.row.seo ?? {}, featured_image: settingsFor.row.featured_image, published_at: settingsFor.row.published_at }}
          siteUrl={siteUrl}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  )
}

function ImportCard({ items }: { items: { key: string; title: string; slug: string }[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [chosen, setChosen] = useState<Set<string>>(new Set(items.map((i) => i.key)))
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
      <h2 className="text-sm font-semibold text-blue-950">Edit the original site pages with the page builder</h2>
      <p className="mt-1 text-sm text-blue-900/80">
        We’ll copy the current content of these pages into the builder as drafts. The live website doesn’t change until you publish each page — and unpublishing brings the original back.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {items.map((i) => (
          <label key={i.key} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-sm shadow-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={chosen.has(i.key)} onChange={() => setChosen((s) => { const x = new Set(s); if (x.has(i.key)) x.delete(i.key); else x.add(i.key); return x })} />
            {i.title} <span className="font-mono text-xs text-muted-foreground">/{i.slug}</span>
          </label>
        ))}
      </div>
      <Btn
        variant="primary"
        className="mt-4"
        disabled={busy || chosen.size === 0}
        onClick={async () => {
          setBusy(true)
          const r = await importLegacyPagesAction([...chosen])
          setBusy(false)
          if ('error' in r) return toast.error(r.error)
          toast.success(`${r.created.length} page${r.created.length === 1 ? '' : 's'} imported as drafts`)
          router.refresh()
        }}
      >
        {busy ? <><Spinner /> Importing…</> : `Import ${chosen.size} page${chosen.size === 1 ? '' : 's'}`}
      </Btn>
    </div>
  )
}

function CreatePageDialog({ open, onClose, templates, theme, siteUrl, pages, canNav }: { open: boolean; onClose: () => void; templates: PageTemplateRow[]; theme: ThemeSettings; siteUrl: string; pages: Row[]; canNav: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<'details' | 'template'>('details')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [publish, setPublish] = useState(false)
  const [addToNav, setAddToNav] = useState(false)
  const [navLabel, setNavLabel] = useState('')
  const [parentId, setParentId] = useState('')
  const [template, setTemplate] = useState('blank')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [featured, setFeatured] = useState('')
  const [picker, setPicker] = useState(false)
  const [busy, setBusy] = useState(false)

  const effectiveSlug = normalizeSlug(slugTouched ? slug : title)
  const taken = pages.some((p) => p.slug === effectiveSlug)
  const slugError = title || slugTouched ? (taken ? 'Another page already uses this URL.' : validateSlug(effectiveSlug)) : null

  function reset() {
    setStep('details')
    setTitle('')
    setSlug('')
    setSlugTouched(false)
    setPublish(false)
    setAddToNav(false)
    setNavLabel('')
    setParentId('')
    setTemplate('blank')
    setSeoTitle('')
    setSeoDesc('')
    setFeatured('')
  }

  async function create() {
    if (!title.trim()) return toast.error('Please give the page a name.')
    if (slugError) return toast.error(slugError)
    setBusy(true)
    const r = await createPageAction({ title, slug: effectiveSlug, status: publish ? 'published' : 'draft', template, parentId: parentId || null, addToNav, navLabel, seoTitle, seoDescription: seoDesc, featuredImage: featured })
    setBusy(false)
    if ('error' in r) return toast.error(r.error)
    toast.success('Page created — opening the page builder')
    reset()
    onClose()
    router.push(`/admin/builder/${r.id}`)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={step === 'details' ? 'Create new page' : 'Choose a design'}
      description={step === 'details' ? 'Step 1 of 2 — page details' : 'Step 2 of 2 — start from a ready-made design. You can change everything afterwards.'}
      size={step === 'template' ? 'xl' : 'md'}
      footer={
        step === 'details' ? (
          <>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" disabled={!title.trim() || !!slugError} onClick={() => setStep('template')}>Next: choose a design</Btn>
          </>
        ) : (
          <>
            <Btn onClick={() => setStep('details')}>Back</Btn>
            <Btn variant="primary" onClick={create} disabled={busy}>{busy ? <><Spinner /> Creating…</> : 'Create page & open builder'}</Btn>
          </>
        )
      }
    >
      {step === 'details' ? (
        <div className="flex flex-col gap-4">
          <FieldRow label="Page name" htmlFor="np-title">
            <input id="np-title" className={inputClass} value={title} autoFocus placeholder="e.g. About Us" onChange={(e) => setTitle(e.target.value)} />
          </FieldRow>
          <FieldRow label="Page URL" htmlFor="np-slug" hint={`${siteUrl}/${effectiveSlug}`}>
            <div className="flex items-center">
              <span className="rounded-l-md border border-r-0 border-border bg-muted px-2.5 py-1.5 text-sm text-muted-foreground">/</span>
              <input id="np-slug" className={cx(inputClass, 'rounded-l-none', slugError && 'border-red-400')} value={slugTouched ? slug : effectiveSlug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value) }} placeholder="about-us" />
            </div>
            {slugError && <p className="text-xs text-red-600">{slugError}</p>}
          </FieldRow>
          <FieldRow label="Parent page (optional)" htmlFor="np-parent">
            <select id="np-parent" className={inputClass} value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">None</option>
              {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </FieldRow>
          <Toggle checked={publish} onChange={setPublish} label="Publish immediately (otherwise it starts as a draft)" />
          {canNav && <Toggle checked={addToNav} onChange={setAddToNav} label="Add to the navigation menu" />}
          {addToNav && (
            <FieldRow label="Menu label" htmlFor="np-nav"><input id="np-nav" className={inputClass} value={navLabel} placeholder={title || 'About'} onChange={(e) => setNavLabel(e.target.value)} /></FieldRow>
          )}
          <details className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">SEO & featured image (optional)</summary>
            <div className="mt-3 flex flex-col gap-3">
              <FieldRow label="SEO title" htmlFor="np-seot"><input id="np-seot" className={inputClass} value={seoTitle} placeholder={title} onChange={(e) => setSeoTitle(e.target.value)} /></FieldRow>
              <FieldRow label="SEO description" htmlFor="np-seod"><textarea id="np-seod" rows={2} className={inputClass} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} /></FieldRow>
              <FieldRow label="Featured image">
                <div className="flex items-center gap-2">
                  {featured && <img src={featured} alt="" className="size-12 rounded border border-border object-cover" />}
                  <Btn size="sm" onClick={() => setPicker(true)}>{featured ? 'Replace' : 'Choose image'}</Btn>
                </div>
              </FieldRow>
            </div>
          </details>
          <MediaPickerDialog open={picker} onClose={() => setPicker(false)} onSelect={({ url }) => setFeatured(url)} />
        </div>
      ) : (
        <TemplatePicker value={template} onChange={setTemplate} custom={templates} theme={theme} />
      )}
    </Dialog>
  )
}
