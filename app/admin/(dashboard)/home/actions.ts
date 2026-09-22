'use server'

import { revalidatePath } from 'next/cache'
import { setPageContent, setPageContentFields } from '@/lib/cms/mutations'
import { withErrorHandling, type ActionResult } from '@/lib/cms/action-result'

const TEXT_FIELDS = [
  'hero_eyebrow',
  'hero_title',
  'hero_intro',
  'hero_image_caption_1',
  'hero_image_caption_2',
  'statement_eyebrow',
  'statement_title',
  'streams_eyebrow',
  'streams_title',
  'streams_body',
  'feature_eyebrow',
  'feature_title',
  'feature_text',
  'partners_eyebrow',
  'cta_eyebrow',
  'cta_title',
  'cta_text',
]

export async function updateHomeTextAction(formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await setPageContentFields('home', formData, TEXT_FIELDS)
    revalidatePath('/admin/home')
    revalidatePath('/')
  })
}

export async function updateHomeHeroImageAction(url: string, imageKey: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await setPageContent('home', 'hero_image', url, imageKey)
    revalidatePath('/admin/home')
    revalidatePath('/')
  })
}

export async function updateHomeFeatureImageAction(url: string, imageKey: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await setPageContent('home', 'feature_image', url, imageKey)
    revalidatePath('/admin/home')
    revalidatePath('/')
  })
}
