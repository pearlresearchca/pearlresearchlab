'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDownUp, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, FileDown, FileText, Home, ListTree, MoreVertical, Pencil, Plus, Search, Settings2, Trash2, Upload } from 'lucide-react'
import { bulkPagesAction, createPageAction, deletePageAction, duplicatePageAction, importLegacyPagesAction, publishPageAction, unpublishPageAction } from '@/lib/builder/actions'
import { normalizeSlug, validateSlug } from '@/lib/builder/defaults'
import { relativeTime } from '@/lib/cms/format'
import type { CmsPageSummary, PageTemplateRow, ThemeSettings } from '@/lib/builder/types'
import { PagesContext } from './link-field'
import { PageSettingsDialog } from './page-dialogs'
import { MediaPickerDialog } from './media'
import { TemplatePicker } from './template-picker'
import { Btn, ConfirmProvider, Dialog, FieldRow, IconBtn, Spinner, StatusBadge, Toggle, cx, inputClass, useConfirm } from './ui'
import { Menu, MenuItem, MenuSeparator } from './menu'

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
  const [kind, setKind] = useState<'all' | 'core' | 'custom'>('all')
  const [sort, setSort] = useState<'updated' | 'name'>('updated')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [creating, setCreating] = useState(!!openCreate && canCreate)
  const [settingsFor, setSettingsFor] = useState<{ row: Row; tab: 'general' | 'seo' } | null>(null)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pages
      .filter((p) => (!q || `${p.title} /${p.slug}`.toLowerCase().includes(q)) && (status === 'all' || p.status === status) && (navFilter === 'all' || (navFilter === 'yes') === p.inNav) && (kind === 'all' || (kind === 'core') === !!p.legacy_key))
      .sort((a, b) => (sort === 'name' ? a.title.localeCompare(b.title) : b.updated_at.localeCompare(a.updated_at)))
  }, [pages, query, status, navFilter, sort, kind])
  const pageRows = list.slice(page * perPage, (page + 1) * perPage)

  async function act(id: string, fn: () => Promise<{ ok: true } | { error: string }>, success: string) {
    setBusy(id)
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

  const allSelected = pageRows.length > 0 && pageRows.every((p) => selected.has(p.id))
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: pages.length }
    for (const p of pages) c[p.status] = (c[p.status] ?? 0) + 1
    return c
  }, [pages])

  return (
    <div className="flex flex-col gap-5">
      {legacyToImport.length > 0 && <ImportCard items={legacyToImport} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: 'all', label: 'All pages', tone: 'from-indigo-500 to-sky-400' },
          { key: 'published', label: 'Published', tone: 'from-emerald-500 to-teal-400' },
          { key: 'draft', label: 'Drafts', tone: 'from-amber-500 to-orange-400' },
          { key: 'scheduled', label: 'Scheduled', tone: 'from-violet-500 to-fuchsia-400' },
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStatus(s.key)}
            aria-pressed={status === s.key}
            className={cx('flex items-center gap-3 rounded-2xl border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', status === s.key ? 'border-primary ring-4 ring-primary/10' : 'border-border')}
          >
            <span className={cx('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', s.tone)}>
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-2xl font-bold leading-none text-foreground">{counts[s.key] ?? 0}</span>
              <span className="mt-1 block text-xs font-medium text-muted-foreground">{s.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04),0_4px_16px_-8px_rgba(15,23,42,.08)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="mr-auto flex flex-col gap-2">
            <div className="flex rounded-lg bg-muted p-1" role="tablist" aria-label="Page type">
              {([
                ['all', `All (${pages.length})`],
                ['core', `Core pages (${pages.filter((p) => p.legacy_key).length})`],
                ['custom', `Your pages (${pages.filter((p) => !p.legacy_key).length})`],
              ] as const).map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => (setKind(k), setPage(0))} className={cx('rounded-md px-3 py-1.5 text-xs font-semibold transition', kind === k ? 'bg-surface text-primary shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-foreground')}>
                  {label}
                </button>
              ))}
            </div>
            {kind === 'core' && <p className="max-w-md text-[11px] text-muted-foreground">The website’s main pages. Change their layout here, or quick-edit their text under Core pages in the menu.</p>}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input className={cx(inputClass, 'pl-9')} placeholder="Search pages…" aria-label="Search pages" value={query} onChange={(e) => (setQuery(e.target.value), setPage(0))} />
          </div>
          <select aria-label="Filter by status" className={cx(inputClass, 'w-auto')} value={status} onChange={(e) => (setStatus(e.target.value), setPage(0))}>
            <option value="all">All statuses</option>
            {['published', 'draft', 'scheduled', 'private', 'unpublished'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select aria-label="Filter by navigation" className={cx(inputClass, 'w-auto')} value={navFilter} onChange={(e) => (setNavFilter(e.target.value), setPage(0))}>
            <option value="all">In menu: any</option>
            <option value="yes">In the menu</option>
            <option value="no">Not in the menu</option>
          </select>
          <Btn onClick={() => setSort(sort === 'updated' ? 'name' : 'updated')} aria-label="Change sort order"><ArrowDownUp className="size-4" /> {sort === 'updated' ? 'Recent' : 'A–Z'}</Btn>
          {canCreate && <Btn variant="primary" onClick={() => setCreating(true)}><Plus className="size-4" /> Create page</Btn>}
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-5 py-2.5 text-sm" role="region" aria-label="Bulk actions">
            <span className="font-semibold text-primary">{selected.size} selected</span>
            <Btn size="sm" onClick={() => bulk('publish')} disabled={busy === 'bulk'}><Upload className="size-3.5" /> Publish</Btn>
            <Btn size="sm" onClick={() => bulk('unpublish')} disabled={busy === 'bulk'}><FileDown className="size-3.5" /> Unpublish</Btn>
            <Btn size="sm" variant="danger" onClick={() => bulk('delete')} disabled={busy === 'bulk'}><Trash2 className="size-3.5" /> Delete</Btn>
            {busy === 'bulk' && <Spinner className="text-primary" />}
            <button type="button" className="ml-auto text-xs font-medium text-muted-foreground hover:underline" onClick={() => setSelected(new Set())}>Clear selection</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-background text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-12 px-5 py-3">
                  <input type="checkbox" aria-label="Select all pages on this page" className="admin-check" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(pageRows.map((p) => p.id)))} />
                </th>
                <th className="px-3 py-3 font-semibold">Page</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">In menu</th>
                <th className="px-3 py-3 font-semibold">Last updated</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                    {pages.length === 0 ? 'No pages yet. Create one, or import the original site pages above.' : 'No pages match your filters.'}
                  </td>
                </tr>
              )}
              {pageRows.map((p) => {
                const live = p.status === 'published' || p.status === 'private' || p.status === 'scheduled'
                return (
                  <tr key={p.id} className={cx('transition hover:bg-background/70', busy === p.id && 'opacity-60', selected.has(p.id) && 'bg-primary/[.03]')}>
                    <td className="px-5 py-3">
                      <input type="checkbox" aria-label={`Select ${p.title}`} className="admin-check" checked={selected.has(p.id)} onChange={() => setSelected((s) => { const x = new Set(s); if (x.has(p.id)) x.delete(p.id); else x.add(p.id); return x })} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold', p.legacy_key ? 'bg-amber-50 text-amber-700' : 'bg-primary/10 text-primary')} aria-hidden="true">
                          {p.slug === '' ? <Home className="size-4" /> : p.title.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <Link href={`/admin/builder/${p.id}`} className="block truncate font-semibold text-foreground hover:text-primary">
                            {p.title}
                            {p.legacy_key && <span className="ml-2 rounded-md bg-amber-50 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase text-amber-700" title="One of the website’s main pages. Its text can also be quick-edited under Core pages.">Core</span>}
                          </Link>
                          <span className="block truncate font-mono text-xs text-slate-500">/{p.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={p.status} />
                      {p.status === 'scheduled' && p.scheduled_at && <span suppressHydrationWarning className="mt-1 block text-[11px] text-muted-foreground">{new Date(p.scheduled_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                    </td>
                    <td className="px-3 py-3">
                      {p.inNav ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check className="size-3.5" /> Yes</span> : <span className="text-xs text-slate-400">No</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground" title={p.publishedByName && p.published_at ? `Published by ${p.publishedByName}, ${new Date(p.published_at).toLocaleString()}` : undefined}>
                      <span suppressHydrationWarning className="font-medium text-foreground">{relativeTime(p.updated_at)}</span>
                      {p.updatedByName && <span className="block">by {p.updatedByName}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <a href={`/admin/preview/${p.id}`} target="_blank" rel="noopener noreferrer" title="Preview" aria-label={`Preview ${p.title}`} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"><Eye className="size-4" /></a>
                        <Link href={`/admin/builder/${p.id}`} title="Edit" aria-label={`Edit ${p.title}`} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-primary/10 hover:text-primary"><Pencil className="size-4" /></Link>
                        {canCreate && !p.legacy_key ? (
                          <button type="button" title="Delete" aria-label={`Delete ${p.title}`} onClick={() => remove(p)} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
                        ) : (
                          <span className="inline-block size-8" aria-hidden="true" />
                        )}
                        <Menu
                          label={`More actions for ${p.title}`}
                          width={230}
                          trigger={(t) => (
                            <button type="button" {...t} title="More actions" aria-label={`More actions for ${p.title}`} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-muted hover:text-foreground"><MoreVertical className="size-4" /></button>
                          )}
                        >
                          {live && <MenuItem href={`/${p.slug}`} external icon={<ExternalLink />}>View live page</MenuItem>}
                          {p.status !== 'published' ? (
                            <MenuItem icon={<Upload />} onSelect={async () => { if (await confirm({ title: `Publish “${p.title}”?`, body: 'Its current draft becomes visible to visitors.', confirmLabel: 'Publish' })) act(p.id, () => publishPageAction(p.id), 'Page published') }}>Publish</MenuItem>
                          ) : (
                            <MenuItem icon={<FileDown />} onSelect={async () => { if (await confirm({ title: `Unpublish “${p.title}”?`, body: p.legacy_key ? 'Visitors will see the original version of this page again.' : 'Visitors will no longer see this page.', confirmLabel: 'Unpublish', danger: true })) act(p.id, () => unpublishPageAction(p.id), 'Page unpublished') }}>Unpublish</MenuItem>
                          )}
                          <MenuSeparator />
                          <MenuItem icon={<Settings2 />} onSelect={() => setSettingsFor({ row: p, tab: 'general' })}>Change URL &amp; settings</MenuItem>
                          <MenuItem icon={<Search />} onSelect={() => setSettingsFor({ row: p, tab: 'seo' })}>SEO &amp; sharing</MenuItem>
                          {canNav && <MenuItem href="/admin/navigation" icon={<ListTree />}>Manage navigation</MenuItem>}
                          {canCreate && <MenuItem icon={<Copy />} onSelect={() => act(p.id, () => duplicatePageAction(p.id), 'Page duplicated as a draft')}>Duplicate</MenuItem>}
                          {canCreate && !p.legacy_key && (
                            <>
                              <MenuSeparator />
                              <MenuItem danger icon={<Trash2 />} onSelect={() => remove(p)}>Delete page</MenuItem>
                            </>
                          )}
                        </Menu>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            Rows per page
            <select className={cx(inputClass, 'w-auto py-1')} value={perPage} onChange={(e) => (setPerPage(Number(e.target.value)), setPage(0))}>
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <span>{list.length === 0 ? '0' : `${page * perPage + 1}–${Math.min(list.length, (page + 1) * perPage)}`} of {list.length}</span>
          <div className="flex items-center gap-1">
            <IconBtn label="Previous page" disabled={page === 0} onClick={() => setPage((x) => x - 1)}><ChevronLeft /></IconBtn>
            <IconBtn label="Next page" disabled={(page + 1) * perPage >= list.length} onClick={() => setPage((x) => x + 1)}><ChevronRight /></IconBtn>
          </div>
        </div>
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
      <h2 className="text-sm font-semibold text-blue-950">Design your core pages with the page builder</h2>
      <p className="mt-1 text-sm text-blue-900/80">
        We’ll copy the current content of these pages into the builder as drafts. The live website doesn’t change until you publish each page — and unpublishing brings the original back.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {items.map((i) => (
          <label key={i.key} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-sm shadow-sm">
            <input type="checkbox" className="admin-check" checked={chosen.has(i.key)} onChange={() => setChosen((s) => { const x = new Set(s); if (x.has(i.key)) x.delete(i.key); else x.add(i.key); return x })} />
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
    if (r.warning) toast.warning(r.warning)
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
