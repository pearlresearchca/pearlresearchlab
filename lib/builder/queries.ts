import { cache } from 'react'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { getAboutValues, getPageContent, getPartnersByContext, getProjectSections, getProjects, getResearchAreas, getTeamMembers, text } from '@/lib/cms/queries'
import type { RenderData } from '@/components/builder-render/context'
import { mergeTheme } from './theme'
import { DEFAULT_HEADER, DEFAULT_NAVIGATION, defaultFooter, defaultSite } from './defaults'
import { BLOCKS } from './blocks'
import { normalizeDoc, walk } from './tree'
import type {
  BuilderNode,
  CmsPage,
  CmsPageSummary,
  FooterSettings,
  HeaderSettings,
  MediaItem,
  NavigationSettings,
  PageDoc,
  PageRevision,
  PageTemplateRow,
  ReusableBlock,
  SiteSettings,
  ThemeSettings,
} from './types'

export type SiteConfig = {
  theme: ThemeSettings
  navigation: NavigationSettings
  header: HeaderSettings
  footer: FooterSettings
  site: SiteSettings
  updatedAt: Record<string, string | undefined>
}

// All global settings in one query, deduplicated per request.
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const insforge = await createInsForgeServerClient()
  const [{ data }, legacy] = await Promise.all([
    insforge.database.from('cms_settings').select('key, value, updated_at'),
    getPageContent('global'),
  ])
  const rows = new Map<string, { value: any; updated_at: string }>()
  for (const r of (data ?? []) as { key: string; value: any; updated_at: string }[]) rows.set(r.key, r)

  const footerDefaults = defaultFooter({
    blurb: text(legacy, 'footer_blurb'),
    tagline: text(legacy, 'footer_tagline'),
    copyright: text(legacy, 'copyright_line'),
  })
  const siteDefaults = defaultSite({ logoUrl: legacy.brand_logo?.value ?? '' })

  const nav = rows.get('navigation')?.value as NavigationSettings | undefined
  return {
    theme: mergeTheme(rows.get('theme')?.value),
    navigation: nav && Array.isArray(nav.items) ? nav : DEFAULT_NAVIGATION,
    header: { ...DEFAULT_HEADER, ...(rows.get('header')?.value ?? {}) },
    footer: { ...footerDefaults, ...(rows.get('footer')?.value ?? {}) },
    site: { ...siteDefaults, ...(rows.get('site')?.value ?? {}) },
    updatedAt: Object.fromEntries([...rows.entries()].map(([k, v]) => [k, v.updated_at])),
  }
})

const PAGE_SUMMARY_COLUMNS =
  'id, title, slug, status, parent_id, template, legacy_key, seo, featured_image, scheduled_at, published_at, published_by, version, created_at, created_by, updated_at, updated_by'

function isLive(page: Pick<CmsPage, 'status' | 'scheduled_at'>): boolean {
  if (page.status === 'published') return true
  if (page.status === 'scheduled' && page.scheduled_at) return new Date(page.scheduled_at).getTime() <= Date.now()
  return false
}

// Public lookup: only live pages, or private pages for signed-in editors.
export async function getLivePage(match: { slug: string } | { legacyKey: string }) {
  const insforge = await createInsForgeServerClient()
  let q = insforge.database
    .from('cms_pages')
    .select('id, title, slug, status, legacy_key, published_content, seo, featured_image, scheduled_at, published_at, updated_at')
  q = 'slug' in match ? q.eq('slug', match.slug) : q.eq('legacy_key', match.legacyKey)
  const { data } = await q.maybeSingle()
  const page = data as (Pick<CmsPage, 'id' | 'title' | 'slug' | 'status' | 'legacy_key' | 'published_content' | 'seo' | 'featured_image' | 'scheduled_at' | 'published_at' | 'updated_at'>) | null
  if (!page || !page.published_content) return null
  if (isLive(page)) return page
  if (page.status === 'private') {
    const admin = await getCurrentAdmin()
    return admin?.profile ? page : null
  }
  return null
}

export async function getRedirect(path: string): Promise<string | null> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_redirects').select('to_path').eq('from_path', path).maybeSingle()
  return (data as { to_path: string } | null)?.to_path ?? null
}

export const getPageSlugs = cache(async (): Promise<Record<string, string>> => {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_pages').select('id, slug').limit(1000)
  return Object.fromEntries(((data ?? []) as { id: string; slug: string }[]).map((p) => [p.id, p.slug]))
})

export async function listLivePagesForSitemap() {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_pages').select('slug, status, scheduled_at, updated_at, legacy_key, seo').in('status', ['published', 'scheduled']).limit(1000)
  return ((data ?? []) as Pick<CmsPage, 'slug' | 'status' | 'scheduled_at' | 'updated_at' | 'legacy_key' | 'seo'>[]).filter((p) => isLive(p) && !p.seo?.noIndex)
}

// ---------------------------------------------------------------------------
// Admin reads (RLS limits these to editors)
// ---------------------------------------------------------------------------

export async function listPages(): Promise<CmsPageSummary[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_pages').select(PAGE_SUMMARY_COLUMNS).order('updated_at', { ascending: false }).limit(500)
  return (data ?? []) as CmsPageSummary[]
}

export async function getPageById(id: string): Promise<CmsPage | null> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_pages').select('*').eq('id', id).maybeSingle()
  if (!data) return null
  const page = data as CmsPage
  return { ...page, content: normalizeDoc(page.content), seo: page.seo ?? {} }
}

export async function listRevisions(pageId: string): Promise<PageRevision[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('cms_page_revisions')
    .select('id, page_id, title, content, seo, reason, created_at, created_by_email')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })
    .limit(40)
  return (data ?? []) as PageRevision[]
}

export async function listTemplates(): Promise<PageTemplateRow[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_templates').select('id, name, description, content, updated_at').order('updated_at', { ascending: false }).limit(100)
  return (data ?? []) as PageTemplateRow[]
}

export async function listReusableBlocks(): Promise<ReusableBlock[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_blocks').select('id, name, block, is_global, updated_at').order('updated_at', { ascending: false }).limit(200)
  return (data ?? []) as ReusableBlock[]
}

export async function getReusableBlock(id: string): Promise<ReusableBlock | null> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_blocks').select('id, name, block, is_global, updated_at').eq('id', id).maybeSingle()
  return (data as ReusableBlock) ?? null
}

export async function listMedia(): Promise<MediaItem[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_media').select('*').order('created_at', { ascending: false }).limit(1000)
  return (data ?? []) as MediaItem[]
}

// ---------------------------------------------------------------------------
// Render data: fetch only the collections the given documents actually use.
// ---------------------------------------------------------------------------

type Need = NonNullable<(typeof BLOCKS)[string]['data']>[number]

function collectNeeds(sections: BuilderNode[]) {
  const needs = new Set<Need>()
  const partnerContexts = new Set<string>()
  const globalIds = new Set<string>()
  const fonts = new Set<string>()
  walk(sections, (n) => {
    for (const d of BLOCKS[n.type]?.data ?? []) needs.add(d)
    if (n.type === 'partners' && n.props.context) partnerContexts.add(String(n.props.context))
    if (n.type === 'global' && n.props.blockId) globalIds.add(String(n.props.blockId))
    for (const device of ['desktop', 'tablet', 'mobile'] as const) {
      const f = n.style?.[device]?.fontFamily
      if (f && !f.startsWith('var(')) fonts.add(f)
    }
  })
  return { needs, partnerContexts, globalIds, fonts }
}

export async function loadRenderData(docs: PageDoc[], opts: { everything?: boolean } = {}): Promise<RenderData & { fonts: string[] }> {
  const insforge = await createInsForgeServerClient()
  let sections = docs.flatMap((d) => d.sections)
  const first = collectNeeds(sections)

  // Global blocks can themselves use collections, so resolve them first.
  const globalBlocks: RenderData['globalBlocks'] = {}
  if (first.globalIds.size > 0 || opts.everything) {
    let q = insforge.database.from('cms_blocks').select('id, name, block').eq('is_global', true)
    if (!opts.everything) q = q.in('id', [...first.globalIds])
    const { data } = await q.limit(200)
    for (const b of (data ?? []) as { id: string; name: string; block: BuilderNode }[]) {
      globalBlocks[b.id] = { name: b.name, block: b.block }
      sections = [...sections, b.block]
    }
  }
  const { needs, partnerContexts, fonts } = opts.everything || first.globalIds.size > 0 ? collectNeeds(sections) : first
  const all = opts.everything

  const [config, pageSlugs, researchAreas, team, projects, values] = await Promise.all([
    getSiteConfig(),
    getPageSlugs(),
    all || needs.has('researchAreas') ? getResearchAreas() : undefined,
    all || needs.has('team') ? getTeamMembers() : undefined,
    all || needs.has('projects') ? getProjects(true) : undefined,
    all || needs.has('values') ? getAboutValues() : undefined,
  ])

  const projectData = projects
    ? await Promise.all(projects.map(async (project) => ({ project, sections: await getProjectSections(project.id) })))
    : undefined

  if (projectData) {
    for (const { project, sections: ps } of projectData) {
      if (project.partners_context) partnerContexts.add(project.partners_context)
      for (const s of ps) if (s.partners_context) partnerContexts.add(s.partners_context)
    }
  }
  if (all) ['home', 'about'].forEach((c) => partnerContexts.add(c))
  const contexts = [...partnerContexts]
  const lists = await Promise.all(contexts.map((c) => getPartnersByContext(c)))
  const partners = Object.fromEntries(contexts.map((c, i) => [c, lists[i]]))

  return {
    pageSlugs,
    site: config.site,
    researchAreas,
    team,
    projects: projectData,
    partners,
    values,
    globalBlocks,
    fonts: [...fonts],
  }
}
