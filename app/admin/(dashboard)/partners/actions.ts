'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'

function revalidate() {
  revalidatePath('/admin/partners')
  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/projects')
}

export async function addPartnerAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const file = formData.get('image') as File | null
  if (!name || !file || file.size === 0) return

  const insforge = await createInsForgeServerClient()
  const { data: uploaded, error } = await insforge.storage.from('site-images').uploadAuto(file)
  if (error || !uploaded) return

  await insforge.database.from('partners').insert([{ name, image_url: uploaded.url, image_key: uploaded.key }])
  revalidate()
}

export async function updatePartnerNameAction(id: string, formData: FormData) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('partners').update({ name: String(formData.get('name') ?? '') }).eq('id', id)
  revalidate()
}

export async function updatePartnerImageAction(id: string, url: string, imageKey: string) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('partners').update({ image_url: url, image_key: imageKey }).eq('id', id)
  revalidate()
}

export async function deletePartnerAction(id: string, imageKey: string) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('partners').delete().eq('id', id)
  if (imageKey) await insforge.storage.from('site-images').remove(imageKey)
  revalidate()
}

export async function addPlacementAction(formData: FormData) {
  const partnerId = String(formData.get('partner_id') ?? '')
  const context = String(formData.get('context') ?? '').trim()
  const sortOrder = Number(formData.get('sort_order') ?? 0)
  if (!partnerId || !context) return

  const insforge = await createInsForgeServerClient()
  const { data: existing } = await insforge.database
    .from('partner_placements')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('context', context)
    .maybeSingle()

  if (existing) {
    await insforge.database.from('partner_placements').update({ sort_order: sortOrder }).eq('id', existing.id)
  } else {
    await insforge.database.from('partner_placements').insert([{ partner_id: partnerId, context, sort_order: sortOrder }])
  }
  revalidate()
}

export async function removePlacementAction(id: string) {
  const insforge = await createInsForgeServerClient()
  await insforge.database.from('partner_placements').delete().eq('id', id)
  revalidate()
}
