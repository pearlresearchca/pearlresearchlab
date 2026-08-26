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
    .select('id, email, full_name, role, created_at')
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
