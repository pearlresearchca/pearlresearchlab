'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { check, withErrorHandling, type ActionResult } from '@/lib/cms/action-result'

function revalidate() {
  revalidatePath('/admin/partners')
  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/projects')
}

export async function addPartnerAction(formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const name = String(formData.get('name') ?? '').trim()
    const file = formData.get('image') as File | null
    if (!name) throw new Error('Organization name is required.')
    if (!file || file.size === 0) throw new Error('Choose a logo image to upload.')

    const insforge = await createInsForgeServerClient()
    const { data: uploaded, error } = await insforge.storage.from('site-images').uploadAuto(file)
    if (error || !uploaded) throw new Error(error?.message ?? 'Upload failed.')

    const inserted = await insforge.database.from('partners').insert([{ name, image_url: uploaded.url, image_key: uploaded.key }])
    if (inserted.error) {
      // Don't leave an orphaned logo file behind when the record can't be saved.
      await insforge.storage.from('site-images').remove(uploaded.key).catch(() => undefined)
      check(inserted)
    }
    revalidate()
  })
}

export async function updatePartnerNameAction(id: string, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('partners').update({ name: String(formData.get('name') ?? '') }).eq('id', id))
    revalidate()
  })
}

export async function updatePartnerImageAction(id: string, url: string, imageKey: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('partners').update({ image_url: url, image_key: imageKey }).eq('id', id))
    revalidate()
  })
}

export async function deletePartnerAction(id: string, imageKey: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('partners').delete().eq('id', id))
    if (imageKey) {
      const removed = await insforge.storage.from('site-images').remove(imageKey)
      // The partner is gone either way; an orphaned file only wastes space.
      if (removed.error) console.error('[partners] logo file cleanup failed', imageKey, removed.error)
    }
    revalidate()
  })
}

export async function addPlacementAction(formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const partnerId = String(formData.get('partner_id') ?? '')
    const context = String(formData.get('context') ?? '').trim()
    const sortOrder = Number(formData.get('sort_order') ?? 0)
    if (!partnerId) throw new Error('Choose a logo.')
    if (!context) throw new Error('Choose a page.')

    const insforge = await createInsForgeServerClient()
    const { data: existing } = await insforge.database
      .from('partner_placements')
      .select('id')
      .eq('partner_id', partnerId)
      .eq('context', context)
      .maybeSingle()

    if (existing) {
      check(await insforge.database.from('partner_placements').update({ sort_order: sortOrder }).eq('id', existing.id))
    } else {
      check(await insforge.database.from('partner_placements').insert([{ partner_id: partnerId, context, sort_order: sortOrder }]))
    }
    revalidate()
  })
}

export async function removePlacementAction(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('partner_placements').delete().eq('id', id))
    revalidate()
  })
}
