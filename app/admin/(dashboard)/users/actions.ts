'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@insforge/sdk'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { SECTIONS } from '@/lib/cms/permissions'
import { check, withErrorHandling, type ActionResult } from '@/lib/cms/action-result'

async function requireAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin || admin.profile?.role !== 'admin') {
    throw new Error('Only admins can manage users.')
  }
  return admin
}

function sectionsFromForm(formData: FormData): string[] {
  const valid = new Set(SECTIONS.map((s) => s.key))
  return formData.getAll('sections').map(String).filter((s) => valid.has(s as never))
}

export async function inviteUserAction(formData: FormData): Promise<{ error: string } | { ok: true; tempPassword: string }> {
  const currentAdmin = await getCurrentAdmin().catch(() => null)
  if (!currentAdmin || currentAdmin.profile?.role !== 'admin') {
    return { error: 'Only admins can add new users.' }
  }

  const email = String(formData.get('email') ?? '').trim()
  const fullName = String(formData.get('full_name') ?? '').trim()
  const role = String(formData.get('role') ?? 'editor') === 'admin' ? 'admin' : 'editor'
  const sections = sectionsFromForm(formData)

  if (!email) return { error: 'Email is required.' }

  try {
    const tempPassword = `pearl-${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 10)}!`

    // A throwaway client with no cookie store, so this signUp() call cannot
    // touch the acting admin's own session cookies.
    const signupClient = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    })
    const { error } = await signupClient.auth.signUp({ email, password: tempPassword, name: fullName || undefined })

    // signUp() intentionally omits `user` while email verification is
    // pending, so success here is judged by the absence of an error only —
    // not by checking for a user object that isn't coming back.
    if (error) {
      return { error: error.message ?? 'Could not create the account.' }
    }

    // Don't write app_users yet — the brand-new auth.users row isn't reliably
    // foreign-key-referenceable for a while. Park the intended access here
    // (no FK, can't race) and it gets applied the moment this person actually
    // verifies or signs in — see applyPendingAccess() in lib/cms/auth.ts.
    const admin = createInsForgeAdminClient()
    const inviteRow = { role, sections: role === 'admin' ? [] : sections, full_name: fullName || null, invited_by: currentAdmin.id }
    const { data: existingInvite } = await admin.database.from('pending_invites').select('email').eq('email', email).maybeSingle()
    const { error: inviteError } = existingInvite
      ? await admin.database.from('pending_invites').update(inviteRow).eq('email', email)
      : await admin.database.from('pending_invites').insert([{ email, ...inviteRow }])
    if (inviteError) {
      console.error('pending_invites write failed', inviteError)
      return { error: `Account created, but could not record their access (${inviteError.message ?? 'unknown error'}). Contact support.` }
    }

    revalidatePath('/admin/users')
    return { ok: true, tempPassword }
  } catch (err) {
    console.error(err)
    return { error: err instanceof Error ? err.message : 'Could not create the account.' }
  }
}

export async function updateUserAccessAction(userId: string, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requireAdmin()
    const role = String(formData.get('role') ?? 'editor') === 'admin' ? 'admin' : 'editor'
    const sections = sectionsFromForm(formData)

    const admin = createInsForgeAdminClient()
    check(
      await admin.database
        .from('app_users')
        .update({ role, sections: role === 'admin' ? [] : sections })
        .eq('id', userId)
    )
    revalidatePath('/admin/users')
  })
}

export async function removeUserAccessAction(userId: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const currentAdmin = await requireAdmin()
    if (currentAdmin.id === userId) throw new Error('You cannot remove your own access.')

    const admin = createInsForgeAdminClient()
    check(await admin.database.from('app_users').delete().eq('id', userId))
    revalidatePath('/admin/users')
  })
}
