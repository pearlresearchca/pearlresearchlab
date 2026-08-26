'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { setPageContentFields } from '@/lib/cms/mutations'

function revalidate() {
  revalidatePath('/admin/research')
  revalidatePath('/research')
  revalidatePath('/')
}

export async function updateResearchHeroAction(formData: FormData) {
  await setPageContentFields('research', formData, ['hero_kicker', 'hero_title', 'hero_intro'])
  revalidate()
}

export async function updateResearchAreaAction(id: string, formData: FormData) {
  const insforge = await createInsForgeServerClient()
  await insforge.database
    .from('research_areas')
    .update({
      title: String(formData.get('title') ?? ''),
      summary: String(formData.get('summary') ?? ''),
      home_summary: String(formData.get('home_summary') ?? '') || null,
      icon_name: String(formData.get('icon_name') ?? '') || null,
      show_on_home: formData.get('show_on_home') === 'on',
      sort_order: Number(formData.get('sort_order') ?? 0),
    })
    .eq('id', id)
  revalidate()
}

export async function updateResearchAreaImageAction(id: string, url: string, imageKey: string) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('research_areas').update({ image_url: url, image_key: imageKey }).eq('id', id)
  revalidate()
}
