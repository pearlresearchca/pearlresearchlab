'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { setPageContentFields } from '@/lib/cms/mutations'
import type { TeamGroupKey } from '@/lib/cms/types'

function revalidate() {
  revalidatePath('/admin/team')
  revalidatePath('/team')
}

function paragraphs(raw: string): string[] {
  return raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

export async function updateTeamTextAction(formData: FormData) {
  await setPageContentFields('team', formData, [
    'hero_kicker',
    'hero_title',
    'hero_intro',
    'intro_eyebrow',
    'intro_title',
    'intro_body',
    'leadership_eyebrow',
    'leadership_title',
    'research_team_eyebrow',
    'research_team_title',
    'cta_eyebrow',
    'cta_title',
  ])
  revalidate()
}

export async function addTeamMemberAction(groupKey: TeamGroupKey, formData: FormData) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('team_members').insert([
    {
      name: String(formData.get('name') ?? ''),
      role: String(formData.get('role') ?? ''),
      bio_paragraphs: paragraphs(String(formData.get('bio') ?? '')),
      group_key: groupKey,
      sort_order: Number(formData.get('sort_order') ?? 0),
    },
  ])
  revalidate()
}

export async function updateTeamMemberAction(id: string, formData: FormData) {
  const insforge = await createInsForgeServerClient()
  await insforge.database
    .from('team_members')
    .update({
      name: String(formData.get('name') ?? ''),
      role: String(formData.get('role') ?? ''),
      bio_paragraphs: paragraphs(String(formData.get('bio') ?? '')),
      sort_order: Number(formData.get('sort_order') ?? 0),
      active: formData.get('active') === 'on',
    })
    .eq('id', id)
  revalidate()
}

export async function updateTeamMemberImageAction(id: string, url: string, imageKey: string) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('team_members').update({ image_url: url, image_key: imageKey }).eq('id', id)
  revalidate()
}

export async function deleteTeamMemberAction(id: string) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('team_members').delete().eq('id', id)
  revalidate()
}
