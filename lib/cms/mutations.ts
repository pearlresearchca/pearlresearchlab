import { createInsForgeServerClient } from '@/lib/insforge/server'
import { check } from './action-result'

// The InsForge SDK has no upsert(); page_content rows are pre-seeded by the
// schema migration for every key this app uses, so update() is normally
// enough — insert() only runs if a brand-new key is introduced later.
export async function setPageContent(page: string, key: string, value: string, imageKey?: string) {
  const insforge = await createInsForgeServerClient()
  const { data: existing } = await insforge.database
    .from('page_content')
    .select('id')
    .eq('page', page)
    .eq('key', key)
    .maybeSingle()

  if (existing) {
    const result = await insforge.database
      .from('page_content')
      .update({ value, ...(imageKey !== undefined ? { image_key: imageKey } : {}) })
      .eq('page', page)
      .eq('key', key)
    check(result)
  } else {
    const result = await insforge.database.from('page_content').insert([
      { page, key, value_type: imageKey !== undefined ? 'image' : 'text', value, image_key: imageKey ?? null },
    ])
    check(result)
  }
}

export async function setPageContentFields(page: string, formData: FormData, keys: string[]) {
  await Promise.all(keys.map((key) => setPageContent(page, key, String(formData.get(key) ?? ''))))
}
