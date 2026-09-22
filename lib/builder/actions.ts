'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess, type SectionKey } from '@/lib/cms/permissions'
import { LEGACY_PAGES, normalizeSlug, validateSlug } from './defaults'
import { LEGACY_IMPORTERS } from './legacy-import'
import { BUILTIN_TEMPLATES } from './templates'
import { sanitizeDoc, sanitizeNode } from './sanitize'
import { cloneDocWithNewIds, cloneWithNewIds, normalizeDoc, uid } from './tree'
import { mergeTheme } from './theme'
import type { BuilderNode, CmsPage, NavItem, PageDoc, PageSeo, PageStatus } from './types'

// Server actions for the site builder. Every action checks permissions here
// *and* runs through the signed-in user's own InsForge client, so row-level
// security enforces the same rules again in the database.

type Fail = { error: string }
type Ok<T = object> = { ok: true } & T

function fail(message: string): Fail {
  return { error: message }
}

async function requireAny(sections: SectionKey[]) {
  const admin = await getCurrentAdmin()
  if (!admin?.profile) throw new Error('Please sign in again.')
  if (!sections.some((s) => canAccess(admin.profile, s))) throw new Error('You don’t have permission to do this.')
  return admin
}

async function run<T extends object>(fn: () => Promise<T>): Promise<Ok<T> | Fail> {
  try {
    const result = await fn()
    return { ok: true, ...result }
  } catch (err) {
    console.error(err)
    return fail(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
  }
}

function check<T>({ error }: { data: T; error: { message?: string; code?: string } | null }, friendly?: string) {
  if (!error) return
  if (error.code === '23505') throw new Error(friendly ?? 'That URL is already used by another page.')
  if (error.code === '42501' || /row-level security/i.test(error.message ?? '')) throw new Error('You don’t have permission to change this.')
  throw new Error(error.message || 'Save failed. Please try again.')
}

function pagePermissions(legacyKey: string | null): SectionKey[] {
  return legacyKey ? ['pages', legacyKey as SectionKey] : ['pages']
}

async function loadPage(id: string): Promise<CmsPage> {
  const insforge = await createInsForgeServerClient()
  const { data, error } = await insforge.database.from('cms_pages').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('This page no longer exists.')
  return data as CmsPage
}

function publicPath(slug: string) {
  return '/' + slug
}

function revalidatePage(slug: string) {
  revalidatePath(publicPath(slug))
  revalidatePath('/admin/pages')
  revalidatePath('/sitemap.xml')
}

function assertDoc(doc: unknown): PageDoc {
  const d = normalizeDoc(doc)
  const size = JSON.stringify(d).length
  if (size > 3_000_000) throw new Error('This page has become too large to save. Try splitting it into several pages.')
  return sanitizeDoc(d)
}

async function addRevision(pageId: string, title: string, content: PageDoc, seo: PageSeo, reason: 'save' | 'autosave' | 'publish' | 'restore' | 'import') {
  const insforge = await createInsForgeServerClient()
  check(await insforge.database.from('cms_page_revisions').insert([{ page_id: pageId, title, content, seo, reason }]))
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export type CreatePageInput = {
  title: string
  slug: string
  status: 'draft' | 'published'
  template: string
  parentId?: string | null
  addToNav?: boolean
  navLabel?: string
  seoTitle?: string
  seoDescription?: string
  featuredImage?: string
}

async function templateDoc(template: string): Promise<PageDoc> {
  if (template.startsWith('tpl:')) {
    const insforge = await createInsForgeServerClient()
    const { data } = await insforge.database.from('cms_templates').select('content').eq('id', template.slice(4)).maybeSingle()
    if (!data) throw new Error('That template no longer exists.')
    return cloneDocWithNewIds(normalizeDoc((data as { content: PageDoc }).content))
  }
  const builtin = BUILTIN_TEMPLATES.find((t) => t.key === template) ?? BUILTIN_TEMPLATES[0]
  return builtin.build()
}

export async function createPageAction(input: CreatePageInput) {
  return run(async () => {
    await requireAny(['pages'])
    const title = input.title.trim()
    if (!title) throw new Error('Please give the page a name.')
    const slug = normalizeSlug(input.slug || title)
    const slugError = validateSlug(slug)
    if (slugError) throw new Error(slugError)

    const content = sanitizeDoc(await templateDoc(input.template || 'blank'))
    const seo: PageSeo = { title: input.seoTitle?.trim() || undefined, description: input.seoDescription?.trim() || undefined }
    const publish = input.status === 'published'
    const insforge = await createInsForgeServerClient()
    const { data, error } = await insforge.database
      .from('cms_pages')
      .insert([
        {
          title,
          slug,
          status: publish ? 'published' : 'draft',
          template: input.template || 'blank',
          parent_id: input.parentId || null,
          content,
          published_content: publish ? content : null,
          published_at: publish ? new Date().toISOString() : null,
          seo,
          featured_image: input.featuredImage || null,
        },
      ])
      .select('id')
      .single()
    check({ data, error })
    const id = (data as { id: string }).id
    await addRevision(id, title, content, seo, 'save')

    if (input.addToNav) {
      await addNavItem({ id: uid(), label: input.navLabel?.trim() || title, kind: 'page', pageId: id, url: '/' + slug }, input.parentId ?? null).catch(() => {
        throw new Error('The page was created, but it couldn’t be added to the navigation (you may not have access to Navigation).')
      })
    }
    revalidatePage(slug)
    return { id }
  })
}

async function addNavItem(item: NavItem, parentPageId: string | null) {
  await requireAny(['design'])
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_settings').select('value').eq('key', 'navigation').maybeSingle()
  const { DEFAULT_NAVIGATION } = await import('./defaults')
  const nav = ((data as { value: { items: NavItem[] } } | null)?.value?.items ? (data as { value: { items: NavItem[] } }).value : structuredClone(DEFAULT_NAVIGATION)) as { items: NavItem[] }
  const parent = parentPageId ? nav.items.find((i) => i.kind === 'page' && i.pageId === parentPageId) : null
  if (parent) parent.children = [...(parent.children ?? []), item]
  else nav.items.push(item)
  await upsertSetting('navigation', nav)
}

export async function savePageDraftAction(id: string, doc: PageDoc, version: number, reason: 'save' | 'autosave' = 'autosave') {
  return run(async () => {
    const page = await loadPage(id)
    await requireAny(pagePermissions(page.legacy_key))
    const content = assertDoc(doc)
    const insforge = await createInsForgeServerClient()
    const { data, error } = await insforge.database.from('cms_pages').update({ content }).eq('id', id).eq('version', version).select('version, updated_at')
    check({ data, error })
    const rows = (data ?? []) as { version: number; updated_at: string }[]
    if (rows.length === 0) {
      return { conflict: true as const, version: page.version, updatedAt: page.updated_at }
    }
    // Keep a revision for explicit saves, and at most one autosave revision
    // every 10 minutes so history stays useful without ballooning.
    if (reason === 'save') await addRevision(id, page.title, content, page.seo ?? {}, 'save')
    else {
      const { data: last } = await insforge.database.from('cms_page_revisions').select('created_at').eq('page_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      const lastAt = (last as { created_at: string } | null)?.created_at
      if (!lastAt || Date.now() - new Date(lastAt).getTime() > 10 * 60 * 1000) await addRevision(id, page.title, content, page.seo ?? {}, 'autosave')
    }
    return { conflict: false as const, version: rows[0].version, updatedAt: rows[0].updated_at }
  })
}

export type PageSettingsInput = {
  title: string
  slug: string
  parentId: string | null
  seo: PageSeo
  featuredImage: string | null
  createRedirect: boolean
}

export async function updatePageSettingsAction(id: string, input: PageSettingsInput) {
  return run(async () => {
    const page = await loadPage(id)
    const admin = await requireAny([...pagePermissions(page.legacy_key), 'seo'])
    const insforge = await createInsForgeServerClient()
    const title = input.title.trim()
    if (!title) throw new Error('Please give the page a name.')

    let slug = page.slug
    if (!page.legacy_key) {
      slug = normalizeSlug(input.slug)
      const slugError = validateSlug(slug)
      if (slugError) throw new Error(slugError)
    }
    if (input.parentId === id) throw new Error('A page can’t be its own parent.')

    const seo: PageSeo = {
      title: input.seo.title?.trim() || undefined,
      description: input.seo.description?.trim() || undefined,
      canonical: input.seo.canonical?.trim() || undefined,
      ogImage: input.seo.ogImage?.trim() || undefined,
      socialTitle: input.seo.socialTitle?.trim() || undefined,
      socialDescription: input.seo.socialDescription?.trim() || undefined,
      noIndex: !!input.seo.noIndex,
      noFollow: !!input.seo.noFollow,
    }
    // SEO managers without page access may only change SEO + URL.
    const pageAccess = pagePermissions(page.legacy_key).some((s) => canAccess(admin.profile, s))
    const patch: Record<string, unknown> = { seo, slug }
    if (pageAccess) Object.assign(patch, { title, parent_id: input.parentId || null, featured_image: input.featuredImage || null })

    check(await insforge.database.from('cms_pages').update(patch).eq('id', id))

    if (slug !== page.slug) {
      if (input.createRedirect && page.published_at) {
        await insforge.database.from('cms_redirects').delete().eq('from_path', publicPath(slug))
        const { data: existing } = await insforge.database.from('cms_redirects').select('from_path').eq('from_path', publicPath(page.slug)).maybeSingle()
        if (existing) check(await insforge.database.from('cms_redirects').update({ to_path: publicPath(slug) }).eq('from_path', publicPath(page.slug)))
        else check(await insforge.database.from('cms_redirects').insert([{ from_path: publicPath(page.slug), to_path: publicPath(slug) }]))
        // Existing redirects pointing at the old URL follow the page too.
        await insforge.database.from('cms_redirects').update({ to_path: publicPath(slug) }).eq('to_path', publicPath(page.slug))
      }
      revalidatePage(page.slug)
    }
    revalidatePage(slug)
    return { slug }
  })
}

export async function publishPageAction(id: string, opts: { doc?: PageDoc; version?: number; status?: 'published' | 'scheduled' | 'private'; scheduledAt?: string | null } = {}) {
  return run(async () => {
    const page = await loadPage(id)
    const admin = await requireAny(pagePermissions(page.legacy_key))
    const insforge = await createInsForgeServerClient()
    let content = normalizeDoc(page.content)
    if (opts.doc) {
      content = assertDoc(opts.doc)
      if (opts.version !== undefined && opts.version !== page.version) {
        return { conflict: true as const, version: page.version }
      }
    }
    const status = opts.status ?? 'published'
    let scheduledAt: string | null = null
    if (status === 'scheduled') {
      if (!opts.scheduledAt || Number.isNaN(Date.parse(opts.scheduledAt))) throw new Error('Choose a date and time to publish.')
      scheduledAt = new Date(opts.scheduledAt).toISOString()
      if (Date.parse(scheduledAt) < Date.now() - 60_000) throw new Error('The scheduled time is in the past.')
    }
    const { data, error } = await insforge.database
      .from('cms_pages')
      .update({
        content,
        published_content: content,
        status,
        scheduled_at: scheduledAt,
        published_at: status === 'scheduled' ? scheduledAt : new Date().toISOString(),
        published_by: admin.id,
      })
      .eq('id', id)
      .select('version, updated_at')
    check({ data, error })
    await addRevision(id, page.title, content, page.seo ?? {}, 'publish')
    revalidatePage(page.slug)
    const row = ((data ?? []) as { version: number; updated_at: string }[])[0]
    return { conflict: false as const, version: row?.version ?? page.version + 1, updatedAt: row?.updated_at ?? new Date().toISOString(), status }
  })
}

export async function unpublishPageAction(id: string) {
  return run(async () => {
    const page = await loadPage(id)
    await requireAny(pagePermissions(page.legacy_key))
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('cms_pages').update({ status: 'unpublished', scheduled_at: null }).eq('id', id))
    revalidatePage(page.slug)
    return {}
  })
}

export async function duplicatePageAction(id: string) {
  return run(async () => {
    await requireAny(['pages'])
    const page = await loadPage(id)
    const insforge = await createInsForgeServerClient()
    const base = page.legacy_key ? page.legacy_key || 'home' : page.slug
    let slug = normalizeSlug(`${base || 'home'}-copy`)
    for (let i = 2; i < 50; i++) {
      const { data } = await insforge.database.from('cms_pages').select('id').eq('slug', slug).maybeSingle()
      if (!data && !validateSlug(slug)) break
      slug = normalizeSlug(`${base || 'home'}-copy-${i}`)
    }
    const content = cloneDocWithNewIds(normalizeDoc(page.content))
    const { data, error } = await insforge.database
      .from('cms_pages')
      .insert([{ title: `${page.title} (copy)`, slug, status: 'draft', template: page.template, parent_id: page.parent_id, content, seo: page.seo, featured_image: page.featured_image }])
      .select('id')
      .single()
    check({ data, error })
    revalidatePath('/admin/pages')
    return { id: (data as { id: string }).id }
  })
}

export async function deletePageAction(id: string) {
  return run(async () => {
    await requireAny(['pages'])
    const page = await loadPage(id)
    if (page.legacy_key) throw new Error('The builder version of an original page can’t be deleted. Unpublish it to show the original page instead.')
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('cms_pages').delete().eq('id', id))
    await removeNavItemsForPage(id).catch(() => undefined)
    revalidatePage(page.slug)
    return {}
  })
}

async function removeNavItemsForPage(pageId: string) {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_settings').select('value').eq('key', 'navigation').maybeSingle()
  const nav = (data as { value: { items: NavItem[] } } | null)?.value
  if (!nav?.items) return
  const prune = (items: NavItem[]): NavItem[] => items.filter((i) => !(i.kind === 'page' && i.pageId === pageId)).map((i) => ({ ...i, children: i.children ? prune(i.children) : undefined }))
  await upsertSetting('navigation', { items: prune(nav.items) })
}

export async function bulkPagesAction(ids: string[], action: 'publish' | 'unpublish' | 'delete') {
  return run(async () => {
    const failures: string[] = []
    for (const id of ids.slice(0, 100)) {
      const result = action === 'publish' ? await publishPageAction(id) : action === 'unpublish' ? await unpublishPageAction(id) : await deletePageAction(id)
      if ('error' in result) failures.push(result.error)
    }
    revalidatePath('/admin/pages')
    if (failures.length) throw new Error(`${ids.length - failures.length} of ${ids.length} pages updated. ${failures[0]}`)
    return {}
  })
}

export async function restoreRevisionAction(pageId: string, revisionId: string) {
  return run(async () => {
    const page = await loadPage(pageId)
    await requireAny(pagePermissions(page.legacy_key))
    const insforge = await createInsForgeServerClient()
    const { data: rev } = await insforge.database.from('cms_page_revisions').select('content, title').eq('id', revisionId).eq('page_id', pageId).maybeSingle()
    if (!rev) throw new Error('That version no longer exists.')
    // Keep the current state recoverable before overwriting it.
    await addRevision(pageId, page.title, normalizeDoc(page.content), page.seo ?? {}, 'restore')
    const content = sanitizeDoc(normalizeDoc((rev as { content: PageDoc }).content))
    const { data, error } = await insforge.database.from('cms_pages').update({ content }).eq('id', pageId).select('version, updated_at')
    check({ data, error })
    const row = ((data ?? []) as { version: number; updated_at: string }[])[0]
    return { doc: content, version: row.version, updatedAt: row.updated_at }
  })
}

export async function getPageStateAction(id: string) {
  return run(async () => {
    const page = await loadPage(id)
    await requireAny([...pagePermissions(page.legacy_key), 'seo'])
    return { doc: normalizeDoc(page.content), version: page.version, updatedAt: page.updated_at, title: page.title, status: page.status }
  })
}

export async function listRevisionsAction(pageId: string) {
  return run(async () => {
    const page = await loadPage(pageId)
    await requireAny(pagePermissions(page.legacy_key))
    const insforge = await createInsForgeServerClient()
    const { data } = await insforge.database
      .from('cms_page_revisions')
      .select('id, title, content, reason, created_at, created_by_email')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .limit(40)
    return { revisions: (data ?? []) as { id: string; title: string; content: PageDoc; reason: string; created_at: string; created_by_email: string | null }[] }
  })
}

// Import the original pages as builder drafts (live site unchanged until published).
export async function importLegacyPagesAction(keys: string[]) {
  return run(async () => {
    const insforge = await createInsForgeServerClient()
    const created: string[] = []
    for (const key of keys) {
      const legacy = LEGACY_PAGES.find((p) => p.key === key)
      if (!legacy) continue
      await requireAny(['pages', key as SectionKey])
      const { data: existing } = await insforge.database.from('cms_pages').select('id').eq('legacy_key', key).maybeSingle()
      if (existing) continue
      const content = sanitizeDoc(await LEGACY_IMPORTERS[key]())
      const { data, error } = await insforge.database
        .from('cms_pages')
        .insert([{ title: legacy.title, slug: legacy.slug, status: 'draft', template: 'imported', legacy_key: key, content, seo: {} }])
        .select('id')
        .single()
      check({ data, error }, `A page already uses the URL “/${legacy.slug}”. Change that page’s URL first.`)
      await addRevision((data as { id: string }).id, legacy.title, content, {}, 'import')
      created.push((data as { id: string }).id)
    }
    revalidatePath('/admin/pages')
    return { created }
  })
}

// Rebuild a builder draft of an original page from the current content (e.g.
// after editing it in the classic editor). Current draft is kept in history.
export async function reimportLegacyPageAction(pageId: string) {
  return run(async () => {
    const page = await loadPage(pageId)
    if (!page.legacy_key) throw new Error('Only original pages can be re-imported.')
    await requireAny(pagePermissions(page.legacy_key))
    await addRevision(pageId, page.title, normalizeDoc(page.content), page.seo ?? {}, 'restore')
    const content = sanitizeDoc(await LEGACY_IMPORTERS[page.legacy_key]())
    const insforge = await createInsForgeServerClient()
    const { data, error } = await insforge.database.from('cms_pages').update({ content }).eq('id', pageId).select('version, updated_at')
    check({ data, error })
    const row = ((data ?? []) as { version: number; updated_at: string }[])[0]
    return { doc: content, version: row.version, updatedAt: row.updated_at }
  })
}

// ---------------------------------------------------------------------------
// Templates & reusable blocks
// ---------------------------------------------------------------------------

export async function saveTemplateAction(name: string, description: string, doc: PageDoc) {
  return run(async () => {
    await requireAny(['pages'])
    if (!name.trim()) throw new Error('Please name the template.')
    const insforge = await createInsForgeServerClient()
    const { data, error } = await insforge.database
      .from('cms_templates')
      .insert([{ name: name.trim().slice(0, 120), description: description.trim().slice(0, 300) || null, content: assertDoc(doc) }])
      .select('id')
      .single()
    check({ data, error })
    revalidatePath('/admin/pages')
    return { id: (data as { id: string }).id }
  })
}

export async function deleteTemplateAction(id: string) {
  return run(async () => {
    await requireAny(['pages'])
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('cms_templates').delete().eq('id', id))
    revalidatePath('/admin/pages')
    revalidatePath('/admin/blocks')
    return {}
  })
}

export async function saveReusableBlockAction(name: string, node: BuilderNode, isGlobal: boolean) {
  return run(async () => {
    await requireAny(['pages'])
    if (!name.trim()) throw new Error('Please name the block.')
    if (node.type === 'global') throw new Error('This is already a global block.')
    const block = sanitizeNode(cloneWithNewIds(node))
    const insforge = await createInsForgeServerClient()
    const { data, error } = await insforge.database
      .from('cms_blocks')
      .insert([{ name: name.trim().slice(0, 120), block, is_global: isGlobal }])
      .select('id, name, block, is_global, updated_at')
      .single()
    check({ data, error })
    revalidatePath('/admin/blocks')
    return { block: data as { id: string; name: string; block: BuilderNode; is_global: boolean; updated_at: string } }
  })
}

export async function updateReusableBlockAction(id: string, patch: { name?: string; block?: BuilderNode; isGlobal?: boolean }) {
  return run(async () => {
    await requireAny(['pages'])
    const insforge = await createInsForgeServerClient()
    const update: Record<string, unknown> = {}
    if (patch.name !== undefined) update.name = patch.name.trim().slice(0, 120)
    if (patch.block !== undefined) update.block = sanitizeNode(patch.block)
    if (patch.isGlobal !== undefined) update.is_global = patch.isGlobal
    check(await insforge.database.from('cms_blocks').update(update).eq('id', id))
    revalidatePath('/admin/blocks')
    // Global blocks appear on any page; refresh the whole site.
    revalidatePath('/', 'layout')
    return {}
  })
}

export async function deleteReusableBlockAction(id: string) {
  return run(async () => {
    await requireAny(['pages'])
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('cms_blocks').delete().eq('id', id))
    revalidatePath('/admin/blocks')
    revalidatePath('/', 'layout')
    return {}
  })
}

// ---------------------------------------------------------------------------
// Global settings
// ---------------------------------------------------------------------------

type SettingKey = 'theme' | 'navigation' | 'header' | 'footer' | 'site'

async function upsertSetting(key: SettingKey, value: unknown) {
  const insforge = await createInsForgeServerClient()
  const { data: existing } = await insforge.database.from('cms_settings').select('key').eq('key', key).maybeSingle()
  if (existing) check(await insforge.database.from('cms_settings').update({ value }).eq('key', key))
  else check(await insforge.database.from('cms_settings').insert([{ key, value }]))
}

function cleanNav(items: NavItem[], depth = 0): NavItem[] {
  if (depth > 2) return []
  return items.slice(0, 50).map((i) => ({
    id: String(i.id || uid()).slice(0, 40),
    label: String(i.label ?? '').trim().slice(0, 80) || 'Untitled',
    kind: i.kind === 'page' ? 'page' : 'url',
    pageId: i.kind === 'page' ? i.pageId : undefined,
    url: String(i.url ?? '').trim().slice(0, 500),
    newTab: !!i.newTab,
    hidden: !!i.hidden,
    children: i.children?.length ? cleanNav(i.children, depth + 1) : undefined,
  }))
}

export async function saveSettingAction(key: SettingKey, value: unknown) {
  return run(async () => {
    await requireAny(key === 'site' ? ['global', 'seo'] : ['design'])
    let clean = value
    if (key === 'theme') clean = mergeTheme(value)
    if (key === 'navigation') clean = { items: cleanNav(((value as { items?: NavItem[] })?.items ?? []) as NavItem[]) }
    if (JSON.stringify(clean).length > 200_000) throw new Error('These settings are too large to save.')
    await upsertSetting(key, clean)
    revalidatePath('/', 'layout')
    return {}
  })
}

// ---------------------------------------------------------------------------
// Media library
// ---------------------------------------------------------------------------

export type MediaInput = {
  url: string
  key: string
  filename: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  checksum: string | null
  alt?: string
  title?: string
}

export async function registerMediaAction(input: MediaInput) {
  return run(async () => {
    await requireAny(['media', 'pages', 'home', 'about', 'research', 'projects', 'team', 'partners', 'contact', 'global', 'design', 'seo'])
    const insforge = await createInsForgeServerClient()
    const { data, error } = await insforge.database
      .from('cms_media')
      .insert([{ ...input, title: input.title ?? input.filename.replace(/\.[a-z0-9]+$/i, '') }])
      .select('*')
      .single()
    check({ data, error })
    revalidatePath('/admin/media')
    return { media: data }
  })
}

export async function findMediaByChecksumAction(checksum: string) {
  return run(async () => {
    await requireAny(['media', 'pages', 'home', 'about', 'research', 'projects', 'team', 'partners', 'contact', 'global', 'design', 'seo'])
    const insforge = await createInsForgeServerClient()
    const { data } = await insforge.database.from('cms_media').select('*').eq('checksum', checksum).limit(1).maybeSingle()
    return { media: data ?? null }
  })
}

export async function updateMediaAction(id: string, patch: { title?: string; alt?: string; caption?: string; description?: string; filename?: string }) {
  return run(async () => {
    await requireAny(['media', 'pages'])
    const insforge = await createInsForgeServerClient()
    const clean: Record<string, string> = {}
    for (const [k, v] of Object.entries(patch)) if (typeof v === 'string') clean[k] = v.trim().slice(0, k === 'description' ? 2000 : 300)
    if (clean.filename === '') throw new Error('The file name can’t be empty.')
    check(await insforge.database.from('cms_media').update(clean).eq('id', id))
    revalidatePath('/admin/media')
    return {}
  })
}

// Pages, blocks and settings that reference a file URL.
export async function mediaUsageAction(url: string) {
  return run(async () => {
    await requireAny(['media', 'pages'])
    const insforge = await createInsForgeServerClient()
    const [{ data: pages }, { data: blocks }, { data: settings }] = await Promise.all([
      insforge.database.from('cms_pages').select('id, title, content, published_content, featured_image, seo').limit(1000),
      insforge.database.from('cms_blocks').select('id, name, block').limit(500),
      insforge.database.from('cms_settings').select('key, value'),
    ])
    const uses: { kind: 'page' | 'block' | 'setting'; id: string; name: string }[] = []
    for (const p of (pages ?? []) as { id: string; title: string }[]) if (JSON.stringify(p).includes(url)) uses.push({ kind: 'page', id: p.id, name: p.title })
    for (const b of (blocks ?? []) as { id: string; name: string }[]) if (JSON.stringify(b).includes(url)) uses.push({ kind: 'block', id: b.id, name: b.name })
    for (const s of (settings ?? []) as { key: string }[]) if (JSON.stringify(s).includes(url)) uses.push({ kind: 'setting', id: s.key, name: s.key })
    return { uses }
  })
}

// Swap a file for a new upload and update every page/block/setting that used
// the old URL, so replacing an image never leaves broken images behind.
export async function replaceMediaAction(id: string, next: Omit<MediaInput, 'alt' | 'title'>) {
  return run(async () => {
    await requireAny(['media'])
    const insforge = await createInsForgeServerClient()
    const { data: current } = await insforge.database.from('cms_media').select('url, key').eq('id', id).maybeSingle()
    if (!current) throw new Error('That file no longer exists.')
    const oldUrl = (current as { url: string }).url
    const oldKey = (current as { key: string }).key

    check(await insforge.database.from('cms_media').update({ ...next }).eq('id', id))

    const swap = <T>(v: T): T => JSON.parse(JSON.stringify(v).split(JSON.stringify(oldUrl).slice(1, -1)).join(JSON.stringify(next.url).slice(1, -1)))
    const [{ data: pages }, { data: blocks }, { data: settings }] = await Promise.all([
      insforge.database.from('cms_pages').select('id, content, published_content, featured_image, seo').limit(1000),
      insforge.database.from('cms_blocks').select('id, block').limit(500),
      insforge.database.from('cms_settings').select('key, value'),
    ])
    let updated = 0
    for (const p of (pages ?? []) as Record<string, unknown>[]) {
      if (!JSON.stringify(p).includes(oldUrl)) continue
      const s = swap(p)
      await insforge.database.from('cms_pages').update({ content: s.content, published_content: s.published_content, featured_image: s.featured_image, seo: s.seo }).eq('id', p.id as string)
      updated++
    }
    for (const b of (blocks ?? []) as Record<string, unknown>[]) {
      if (!JSON.stringify(b).includes(oldUrl)) continue
      await insforge.database.from('cms_blocks').update({ block: swap(b).block }).eq('id', b.id as string)
      updated++
    }
    for (const s of (settings ?? []) as Record<string, unknown>[]) {
      if (!JSON.stringify(s).includes(oldUrl)) continue
      await insforge.database.from('cms_settings').update({ value: swap(s).value }).eq('key', s.key as string)
      updated++
    }
    revalidatePath('/admin/media')
    revalidatePath('/', 'layout')
    return { oldKey, updated }
  })
}

export async function deleteMediaAction(id: string) {
  return run(async () => {
    await requireAny(['media'])
    const insforge = await createInsForgeServerClient()
    const { data } = await insforge.database.from('cms_media').select('key').eq('id', id).maybeSingle()
    if (!data) return { key: null }
    check(await insforge.database.from('cms_media').delete().eq('id', id))
    revalidatePath('/admin/media')
    return { key: (data as { key: string }).key }
  })
}

// ---------------------------------------------------------------------------
// Form submissions
// ---------------------------------------------------------------------------

export async function markSubmissionAction(id: string, isRead: boolean) {
  return run(async () => {
    await requireAny(['pages', 'contact'])
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('cms_form_submissions').update({ is_read: isRead }).eq('id', id))
    revalidatePath('/admin/submissions')
    return {}
  })
}

export async function deleteSubmissionAction(id: string) {
  return run(async () => {
    await requireAny(['pages', 'contact'])
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('cms_form_submissions').delete().eq('id', id))
    revalidatePath('/admin/submissions')
    return {}
  })
}

// Used by the page list's "Change status" menu.
export async function setPageStatusAction(id: string, status: PageStatus) {
  if (status === 'published' || status === 'private') return publishPageAction(id, { status })
  if (status === 'unpublished') return unpublishPageAction(id)
  return run(async () => {
    const page = await loadPage(id)
    await requireAny(pagePermissions(page.legacy_key))
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('cms_pages').update({ status }).eq('id', id))
    revalidatePage(page.slug)
    return {}
  })
}
