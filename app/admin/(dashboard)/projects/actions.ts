'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { setPageContentFields } from '@/lib/cms/mutations'
import { check, withErrorHandling, type ActionResult } from '@/lib/cms/action-result'

function revalidate(slug?: string) {
  revalidatePath('/admin/projects')
  revalidatePath('/projects')
  revalidatePath('/')
  if (slug) revalidatePath(`/admin/projects/${slug}`)
}

function paragraphs(raw: string): string[] {
  return raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

function csvList(raw: string): string[] {
  return raw.split(',').map((p) => p.trim()).filter(Boolean)
}

export async function updateProjectsHeroAction(formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await setPageContentFields('projects', formData, ['hero_kicker', 'hero_title', 'hero_intro'])
    revalidate()
  })
}

export async function createProjectAction(formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const slug = String(formData.get('slug') ?? '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    const title = String(formData.get('title') ?? '').trim()
    if (!slug) throw new Error('URL slug is required.')
    if (!title) throw new Error('Title is required.')

    const insforge = await createInsForgeServerClient()
    check(
      await insforge.database.from('projects').insert([
        { slug, title, sort_order: Number(formData.get('sort_order') ?? 0) },
      ])
    )
    revalidate()
    redirect(`/admin/projects/${slug}`)
  })
}

export async function updateProjectAction(id: string, slug: string, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(
      await insforge.database
        .from('projects')
        .update({
          index_label: String(formData.get('index_label') ?? '') || null,
          category_label: String(formData.get('category_label') ?? '') || null,
          title: String(formData.get('title') ?? ''),
          project_name: String(formData.get('project_name') ?? '') || null,
          subtitle: String(formData.get('subtitle') ?? '') || null,
          meta_line: csvList(String(formData.get('meta_line') ?? '')),
          intro_paragraphs: paragraphs(String(formData.get('intro_paragraphs') ?? '')),
          partners_context: String(formData.get('partners_context') ?? '') || null,
          published: formData.get('published') === 'on',
          sort_order: Number(formData.get('sort_order') ?? 0),
        })
        .eq('id', id)
    )
    revalidate(slug)
  })
}

export async function updateProjectBannerAction(id: string, slug: string, url: string, imageKey: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('projects').update({ banner_image_url: url, banner_image_key: imageKey }).eq('id', id))
    revalidate(slug)
  })
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('projects').delete().eq('id', id))
    revalidate()
    redirect('/admin/projects')
  })
}

export async function addProjectSectionAction(projectId: string, slug: string, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const heading = String(formData.get('heading') ?? '').trim()
    if (!heading) throw new Error('Heading is required.')

    const insforge = await createInsForgeServerClient()
    check(
      await insforge.database.from('project_sections').insert([
        {
          project_id: projectId,
          heading,
          body_paragraphs: paragraphs(String(formData.get('body_paragraphs') ?? '')),
          partners_context: String(formData.get('partners_context') ?? '') || null,
          sort_order: Number(formData.get('sort_order') ?? 0),
        },
      ])
    )
    revalidate(slug)
  })
}

export async function updateProjectSectionAction(id: string, slug: string, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(
      await insforge.database
        .from('project_sections')
        .update({
          heading: String(formData.get('heading') ?? ''),
          body_paragraphs: paragraphs(String(formData.get('body_paragraphs') ?? '')),
          partners_context: String(formData.get('partners_context') ?? '') || null,
          sort_order: Number(formData.get('sort_order') ?? 0),
        })
        .eq('id', id)
    )
    revalidate(slug)
  })
}

export async function updateProjectSectionImageAction(id: string, slug: string, url: string, imageKey: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('project_sections').update({ image_url: url, image_key: imageKey }).eq('id', id))
    revalidate(slug)
  })
}

export async function deleteProjectSectionAction(id: string, slug: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('project_sections').delete().eq('id', id))
    revalidate(slug)
  })
}
