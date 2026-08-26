import { createInsForgeAdminClient, createInsForgeServerClient } from '@/lib/insforge/server'
import type { AppUser } from './types'

export type CurrentAdmin = {
  id: string
  email: string
  profile: AppUser | null
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.auth.getCurrentUser()
  if (!data?.user) return null

  const { data: profile } = await insforge.database
    .from('app_users')
    .select('id, email, full_name, role, sections, created_at')
    .eq('id', data.user.id)
    .maybeSingle()

  return {
    id: data.user.id,
    email: data.user.email,
    profile: (profile as AppUser) ?? null,
  }
}

// Uses the admin (API key) client because RLS only lets `authenticated`
// callers see app_users rows — but this check must run before anyone is
// signed in, to decide whether /admin/setup should still be reachable.
export async function hasAnyAdminUser(): Promise<boolean> {
  const admin = createInsForgeAdminClient()
  const { count } = await admin.database
    .from('app_users')
    .select('id', { count: 'exact' })
    .limit(1)

  return (count ?? 0) > 0
}

// Best-effort, called right after a user actually verifies their email or
// signs in (never right after signUp — that's exactly when a fresh
// auth.users row can still be too new to satisfy app_users' foreign key).
// By the time someone has a working session, their account is unquestionably
// real, so this is the safe place to finish linking CMS access:
//   1. Already linked? Nothing to do.
//   2. An admin invited this email earlier (pending_invites)? Apply it.
//   3. Nobody holds admin yet? Bootstrap this person as admin.
export async function applyPendingAccess(userId: string, email: string, fullName: string | null): Promise<void> {
  try {
    const admin = createInsForgeAdminClient()

    const { data: existing } = await admin.database.from('app_users').select('id').eq('id', userId).maybeSingle()
    if (existing) return

    const { data: invite } = await admin.database
      .from('pending_invites')
      .select('role, sections, full_name')
      .eq('email', email)
      .maybeSingle()

    if (invite) {
      const { error } = await admin.database.from('app_users').insert([
        { id: userId, email, full_name: invite.full_name ?? fullName, role: invite.role, sections: invite.sections },
      ])
      if (!error) {
        await admin.database.from('pending_invites').delete().eq('email', email)
      }
      return
    }

    if (!(await hasAnyAdminUser())) {
      await admin.database.from('app_users').insert([{ id: userId, email, full_name: fullName, role: 'admin', sections: [] }])
    }
  } catch (err) {
    console.error('applyPendingAccess failed', err)
  }
}
