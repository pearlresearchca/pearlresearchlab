import { createInsForgeServerClient } from '@/lib/insforge/server'
import { unwrap } from './data-error'
import type {
  AboutValue,
  PageContentMap,
  PageContentRow,
  Partner,
  PartnerPlacement,
  Project,
  ProjectSection,
  ResearchArea,
  TeamMember,
  UserDirectory,
} from './types'

export async function getPageContent(page: string): Promise<PageContentMap> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database
    .from('page_content')
    .select('id, page, key, value_type, value, image_key, updated_at, updated_by')
    .eq('page', page), 'getPageContent')

  const rows = (data ?? []) as PageContentRow[]
  const map: PageContentMap = {}
  for (const row of rows) map[row.key] = row
  return map
}

export function text(map: PageContentMap, key: string, fallback = ''): string {
  return map[key]?.value ?? fallback
}

export function prose(map: PageContentMap, key: string): string[] {
  const raw = map[key]?.value ?? ''
  return raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

export function lines(map: PageContentMap, key: string): string[] {
  const raw = map[key]?.value ?? ''
  return raw.split('\n').map((l) => l.trim()).filter(Boolean)
}

export function image(map: PageContentMap, key: string): { url: string; key: string } | null {
  const row = map[key]
  if (!row || row.value_type !== 'image' || !row.value) return null
  return { url: row.value, key: row.image_key ?? '' }
}

// Most recent edit across a set of page_content keys, for a section-level
// "last edited by / at" caption.
export function latestEdit(map: PageContentMap, keys: string[]): { at: string; by: string | null } | null {
  let best: { at: string; by: string | null } | null = null
  for (const key of keys) {
    const row = map[key]
    if (!row?.updated_at) continue
    if (!best || row.updated_at > best.at) best = { at: row.updated_at, by: row.updated_by ?? null }
  }
  return best
}

export async function getResearchAreas(): Promise<ResearchArea[]> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database
    .from('research_areas')
    .select('id, title, summary, home_summary, icon_name, image_url, image_key, show_on_home, sort_order, updated_at, updated_by')
    .order('sort_order', { ascending: true })
    .limit(50), 'getResearchAreas')

  return (data ?? []) as ResearchArea[]
}

export async function getAboutValues(): Promise<AboutValue[]> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database
    .from('about_values')
    .select('id, letter, title, body, sort_order, updated_at, updated_by')
    .order('sort_order', { ascending: true })
    .limit(50), 'getAboutValues')

  return (data ?? []) as AboutValue[]
}

export async function getPartnersByContext(context: string): Promise<Partner[]> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database
    .from('partner_placements')
    .select('id, partner_id, context, sort_order, partners(id, name, image_url, image_key)')
    .eq('context', context)
    .order('sort_order', { ascending: true })
    .limit(100), 'getPartnersByContext')

  const rows = (data ?? []) as unknown as PartnerPlacement[]
  return rows.map((row) => row.partners).filter(Boolean)
}

export async function getAllPlacements(): Promise<PartnerPlacement[]> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database
    .from('partner_placements')
    .select('id, partner_id, context, sort_order, partners(id, name, image_url, image_key)')
    .order('context', { ascending: true })
    .order('sort_order', { ascending: true })
    .limit(300), 'getAllPlacements')

  return (data ?? []) as unknown as PartnerPlacement[]
}

export async function getAllPartners(): Promise<Partner[]> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database
    .from('partners')
    .select('id, name, image_url, image_key, updated_at, updated_by')
    .order('name', { ascending: true })
    .limit(200), 'getAllPartners')

  return (data ?? []) as Partner[]
}

const PROJECT_COLUMNS =
  'id, slug, index_label, category_label, title, project_name, subtitle, meta_line, banner_image_url, banner_image_key, intro_paragraphs, partners_context, published, sort_order, updated_at, updated_by'

export async function getProjects(publishedOnly = true): Promise<Project[]> {
  const insforge = await createInsForgeServerClient()
  let query = insforge.database.from('projects').select(PROJECT_COLUMNS).order('sort_order', { ascending: true }).limit(50)

  if (publishedOnly) query = query.eq('published', true)

  const data = unwrap(await query, 'getProjects')
  return (data ?? []) as Project[]
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database.from('projects').select(PROJECT_COLUMNS).eq('slug', slug).maybeSingle(), 'getProjectBySlug')

  return (data as Project) ?? null
}

export async function getProjectSections(projectId: string): Promise<ProjectSection[]> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database
    .from('project_sections')
    .select('id, project_id, heading, body_paragraphs, image_url, image_key, partners_context, sort_order, updated_at, updated_by')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .limit(50), 'getProjectSections')

  return (data ?? []) as ProjectSection[]
}

const TEAM_MEMBER_COLUMNS = 'id, name, role, image_url, image_key, bio_paragraphs, group_key, active, sort_order, updated_at, updated_by'

export async function getTeamMembers(): Promise<TeamMember[]> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database
    .from('team_members')
    .select(TEAM_MEMBER_COLUMNS)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(200), 'getTeamMembers')

  return (data ?? []) as TeamMember[]
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database
    .from('team_members')
    .select(TEAM_MEMBER_COLUMNS)
    .order('sort_order', { ascending: true })
    .limit(200), 'getAllTeamMembers')

  return (data ?? []) as TeamMember[]
}

// Maps auth user id -> display info, for showing "last edited by" against the
// updated_by uuid stored on content rows. Admin-only (app_users RLS).
export async function getUserDirectory(): Promise<UserDirectory> {
  const insforge = await createInsForgeServerClient()
  const data = unwrap(await insforge.database.from('app_users').select('id, email, full_name').limit(200), 'getUserDirectory')

  const map: UserDirectory = {}
  for (const row of (data ?? []) as { id: string; email: string; full_name: string | null }[]) {
    map[row.id] = { email: row.email, full_name: row.full_name }
  }
  return map
}
