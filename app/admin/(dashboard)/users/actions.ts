'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@insforge/sdk'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { createInsForgeAdminClient } from '@/lib/insforge/server'

async function requireAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin || admin.profile?.role !== 'admin') {
    throw new Error('Only admins can manage users.')
  }
  return admin
}

export async function inviteUserAction(formData: FormData): Promise<{ error: string } | { ok: true; tempPassword: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Only admins can add new users.' }
  }

  const email = String(formData.get('email') ?? '').trim()
  const fullName = String(formData.get('full_name') ?? '').trim()
  const role = String(formData.get('role') ?? 'editor') === 'admin' ? 'admin' : 'editor'

  if (!email) return { error: 'Email is required.' }

  const tempPassword = `pearl-${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 10)}!`

  // A throwaway client with no cookie store, so this signUp() call cannot
  // touch the acting admin's own session cookies.
  const signupClient = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  })
  const { data, error } = await signupClient.auth.signUp({ email, password: tempPassword, name: fullName || undefined })

  if (error || !data?.user) {
    return { error: error?.message ?? 'Could not create the account.' }
  }

  const admin = createInsForgeAdminClient()
  const { error: insertError } = await admin.database.from('app_users').insert([
    { id: data.user.id, email, full_name: fullName || null, role },
  ])
  if (insertError) {
    return { error: 'Account created but could not grant CMS access. Contact support.' }
  }

  revalidatePath('/admin/users')
  return { ok: true, tempPassword }
}

export async function updateUserRoleAction(userId: string, formData: FormData) {
  await requireAdmin()
  const role = String(formData.get('role') ?? 'editor') === 'admin' ? 'admin' : 'editor'

  const admin = createInsForgeAdminClient()
  await admin.database.from('app_users').update({ role }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function removeUserAccessAction(userId: string) {
  const currentAdmin = await requireAdmin()
  if (currentAdmin.id === userId) return

  const admin = createInsForgeAdminClient()
  await admin.database.from('app_users').delete().eq('id', userId)
  revalidatePath('/admin/users')
}
