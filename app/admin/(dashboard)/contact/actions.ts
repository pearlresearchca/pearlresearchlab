'use server'

import { revalidatePath } from 'next/cache'
import { setPageContent, setPageContentFields } from '@/lib/cms/mutations'
import { withErrorHandling, type ActionResult } from '@/lib/cms/action-result'

export async function updateContactAction(formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await setPageContentFields('contact', formData, [
      'hero_kicker',
      'hero_title',
      'hero_intro',
      'collab_eyebrow',
      'collab_title',
      'collab_body',
      'start_title',
      'start_body',
      'hours',
    ])
    await setPageContent('contact', 'address', String(formData.get('address') ?? ''))

    revalidatePath('/admin/contact')
    revalidatePath('/contact')
  })
}
