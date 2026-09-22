'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { check, withErrorHandling, type ActionResult } from '@/lib/cms/action-result'

function text(formData: FormData, key: string, max: number): string | null {
  const raw = String(formData.get(key) ?? '').trim()
  // Single-line fields collapse stray whitespace; the bio keeps its line breaks.
  const value = key === 'bio' ? raw.replace(/\n{3,}/g, '\n\n') : raw.replace(/\s+/g, ' ')
  return value ? value.slice(0, max) : null
}

// Updates the signed-in person's own profile only. Role and section access
// are never read from the form, so nobody can raise their own permissions.
export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const me = await getCurrentAdmin()
    if (!me?.profile) throw new Error('Please sign in again.')

    const fullName = text(formData, 'full_name', 120)
    if (!fullName || fullName.length < 2) throw new Error('Please enter your full name.')
    const phone = text(formData, 'phone', 40)
    if (phone && !/^[+()\-.\s\d]{6,40}$/.test(phone)) throw new Error('Please enter a valid phone number (digits, spaces, + - ( ) only).')

    const admin = createInsForgeAdminClient()
    check(
      await admin.database
        .from('app_users')
        .update({
          full_name: fullName,
          phone,
          job_title: text(formData, 'job_title', 120),
          bio: text(formData, 'bio', 1000),
          profile_completed_at: me.profile.profile_completed_at ?? new Date().toISOString(),
        })
        .eq('id', me.id)
    )
    revalidatePath('/admin', 'layout')
  })
}
