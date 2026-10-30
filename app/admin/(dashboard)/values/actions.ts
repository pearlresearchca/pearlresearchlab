'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { check, withErrorHandling, type ActionResult } from '@/lib/cms/action-result'

// Values can be shown on any page (Values block), so refresh the whole site.
function revalidate() {
  revalidatePath('/admin/values')
  revalidatePath('/', 'layout')
}

export async function addAboutValueAction(formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(
      await insforge.database.from('about_values').insert([
        {
          letter: String(formData.get('letter') ?? '').slice(0, 4),
          title: String(formData.get('title') ?? ''),
          body: String(formData.get('body') ?? ''),
          sort_order: Number(formData.get('sort_order') ?? 0),
        },
      ])
    )
    revalidate()
  })
}

export async function updateAboutValueAction(id: string, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(
      await insforge.database
        .from('about_values')
        .update({
          letter: String(formData.get('letter') ?? '').slice(0, 4),
          title: String(formData.get('title') ?? ''),
          body: String(formData.get('body') ?? ''),
          sort_order: Number(formData.get('sort_order') ?? 0),
        })
        .eq('id', id)
    )
    revalidate()
  })
}

export async function deleteAboutValueAction(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('about_values').delete().eq('id', id))
    revalidate()
  })
}
