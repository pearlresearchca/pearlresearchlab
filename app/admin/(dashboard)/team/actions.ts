'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { check, withErrorHandling, type ActionResult } from '@/lib/cms/action-result'
import type { TeamGroupKey } from '@/lib/cms/types'

function revalidate() {
  revalidatePath('/admin/team')
  // Shown by page-builder blocks that can sit on any page.
  revalidatePath('/', 'layout')
}

// Site paths ("/portfolio") or full web addresses; anything else is rejected.
function profileUrl(raw: string): string | null {
  const url = raw.trim()
  if (!url) return null
  if (/^(\/|https?:\/\/)/i.test(url)) return url
  if (/^[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(url)) return '/' + url
  throw new Error('Profile link must be a page on this site (like /portfolio) or a full https:// address.')
}

function paragraphs(raw: string): string[] {
  return raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

export async function addTeamMemberAction(groupKey: TeamGroupKey, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(
      await insforge.database.from('team_members').insert([
        {
          name: String(formData.get('name') ?? ''),
          role: String(formData.get('role') ?? ''),
          bio_paragraphs: paragraphs(String(formData.get('bio') ?? '')),
          group_key: groupKey,
          sort_order: Number(formData.get('sort_order') ?? 0),
        },
      ])
    )
    revalidate()
  })
}

export async function updateTeamMemberAction(id: string, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(
      await insforge.database
        .from('team_members')
        .update({
          name: String(formData.get('name') ?? ''),
          role: String(formData.get('role') ?? ''),
          bio_paragraphs: paragraphs(String(formData.get('bio') ?? '')),
          profile_url: profileUrl(String(formData.get('profile_url') ?? '')),
          sort_order: Number(formData.get('sort_order') ?? 0),
          active: formData.get('active') === 'on',
        })
        .eq('id', id)
    )
    revalidate()
  })
}

export async function updateTeamMemberImageAction(id: string, url: string, imageKey: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('team_members').update({ image_url: url, image_key: imageKey }).eq('id', id))
    revalidate()
  })
}

export async function deleteTeamMemberAction(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('team_members').delete().eq('id', id))
    revalidate()
  })
}
