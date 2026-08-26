import { createInsForgeServerClient } from '@/lib/insforge/server'
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
} from './types'

export async function getPageContent(page: string): Promise<PageContentMap> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('page_content')
    .select('id, page, key, value_type, value, image_key')
    .eq('page', page)

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

export async function getResearchAreas(): Promise<ResearchArea[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('research_areas')
    .select('id, title, summary, home_summary, icon_name, image_url, image_key, show_on_home, sort_order')
    .order('sort_order', { ascending: true })
    .limit(50)

  return (data ?? []) as ResearchArea[]
}

export async function getAboutValues(): Promise<AboutValue[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('about_values')
    .select('id, letter, title, body, sort_order')
    .order('sort_order', { ascending: true })
    .limit(50)

  return (data ?? []) as AboutValue[]
}

export async function getPartnersByContext(context: string): Promise<Partner[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('partner_placements')
    .select('id, partner_id, context, sort_order, partners(id, name, image_url, image_key)')
    .eq('context', context)
    .order('sort_order', { ascending: true })
    .limit(100)

  const rows = (data ?? []) as unknown as PartnerPlacement[]
  return rows.map((row) => row.partners).filter(Boolean)
}

export async function getAllPlacements(): Promise<PartnerPlacement[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('partner_placements')
    .select('id, partner_id, context, sort_order, partners(id, name, image_url, image_key)')
    .order('context', { ascending: true })
    .order('sort_order', { ascending: true })
    .limit(300)

  return (data ?? []) as unknown as PartnerPlacement[]
}

export async function getAllPartners(): Promise<Partner[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('partners')
    .select('id, name, image_url, image_key')
    .order('name', { ascending: true })
    .limit(200)

  return (data ?? []) as Partner[]
}

export async function getProjects(publishedOnly = true): Promise<Project[]> {
  const insforge = await createInsForgeServerClient()
  let query = insforge.database
    .from('projects')
    .select(
      'id, slug, index_label, category_label, title, project_name, subtitle, meta_line, banner_image_url, banner_image_key, intro_paragraphs, partners_context, published, sort_order'
    )
    .order('sort_order', { ascending: true })
    .limit(50)

  if (publishedOnly) query = query.eq('published', true)

  const { data } = await query
  return (data ?? []) as Project[]
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('projects')
    .select(
      'id, slug, index_label, category_label, title, project_name, subtitle, meta_line, banner_image_url, banner_image_key, intro_paragraphs, partners_context, published, sort_order'
    )
    .eq('slug', slug)
    .maybeSingle()

  return (data as Project) ?? null
}

export async function getProjectSections(projectId: string): Promise<ProjectSection[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('project_sections')
    .select('id, project_id, heading, body_paragraphs, image_url, image_key, partners_context, sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .limit(50)

  return (data ?? []) as ProjectSection[]
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('team_members')
    .select('id, name, role, image_url, image_key, bio_paragraphs, group_key, active, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(200)

  return (data ?? []) as TeamMember[]
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('team_members')
    .select('id, name, role, image_url, image_key, bio_paragraphs, group_key, active, sort_order')
    .order('sort_order', { ascending: true })
    .limit(200)

  return (data ?? []) as TeamMember[]
}
