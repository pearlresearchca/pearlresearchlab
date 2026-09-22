'use server'

import { revalidatePath } from 'next/cache'
import { setPageContentFields } from '@/lib/cms/mutations'
import { withErrorHandling, type ActionResult } from '@/lib/cms/action-result'

export async function updateContactAction(formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await setPageContentFields('contact', formData, [
      'hero_kicker',
      'hero_title',
      'hero_intro',
      'partnerships_title',
      'partnerships_intro',
      'interests_title',
      'interests_note',
      'connect_title',
      'connect_lead',
      'connect_note',
      'approach_title',
      'approach_body',
      'approach_note',
      'start_title',
      'start_body',
      'cta_label',
      'hours',
      'email',
      'form_title',
      'form_intro',
      'sensitive_notice',
      'confirmation_title',
      'confirmation_body',
      'address',
      'interests_list',
      'connect_list',
    ])

    revalidatePath('/admin/contact')
    revalidatePath('/contact')
  })
}
