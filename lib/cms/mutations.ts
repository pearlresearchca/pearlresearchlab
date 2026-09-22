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

// Saves every field of a form in a single database transaction, so a failure
// can't leave some fields saved and others not.
export async function setPageContentFields(page: string, formData: FormData, keys: string[]) {
  const values = Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? '')]))
  const insforge = await createInsForgeServerClient()
  check(await insforge.database.rpc('set_page_content_fields', { p_page: page, p_values: values }))
}
