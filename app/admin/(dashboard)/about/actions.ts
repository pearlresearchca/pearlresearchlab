'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { setPageContent, setPageContentFields } from '@/lib/cms/mutations'

const TEXT_FIELDS = [
  'hero_kicker',
  'hero_title',
  'hero_intro',
  'mission_eyebrow',
  'mission_title',
  'vision_eyebrow',
  'vision_title',
  'vision_body',
  'values_eyebrow',
  'values_title',
  'partners_eyebrow',
  'partners_title',
  'partners_body',
]

function revalidate() {
  revalidatePath('/admin/about')
  revalidatePath('/about')
  revalidatePath('/')
}

export async function updateAboutTextAction(formData: FormData) {
  await setPageContentFields('about', formData, TEXT_FIELDS)
  await setPageContent('about', 'mission_body', String(formData.get('mission_body') ?? ''))
  revalidate()
}

export async function addAboutValueAction(formData: FormData) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('about_values').insert([
    {
      letter: String(formData.get('letter') ?? '').slice(0, 4),
      title: String(formData.get('title') ?? ''),
      body: String(formData.get('body') ?? ''),
      sort_order: Number(formData.get('sort_order') ?? 0),
    },
  ])
  revalidate()
}

export async function updateAboutValueAction(id: string, formData: FormData) {
  const insforge = await createInsForgeServerClient()
  await insforge.database
    .from('about_values')
    .update({
      letter: String(formData.get('letter') ?? '').slice(0, 4),
      title: String(formData.get('title') ?? ''),
      body: String(formData.get('body') ?? ''),
      sort_order: Number(formData.get('sort_order') ?? 0),
    })
    .eq('id', id)
  revalidate()
}

export async function deleteAboutValueAction(id: string) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('about_values').delete().eq('id', id)
  revalidate()
}
