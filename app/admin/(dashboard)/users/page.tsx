import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { AdminCard, Field, Select, TextInput } from '@/components/admin/ui'
import type { AppUser } from '@/lib/cms/types'
import { InviteUserForm } from './invite-form'
import { updateUserRoleAction, removeUserAccessAction } from './actions'
import { SubmitButton } from '@/components/admin/submit-button'

export default async function UsersAdminPage() {
  const admin = await getCurrentAdmin()
  if (!admin || admin.profile?.role !== 'admin') redirect('/admin')

  const client = createInsForgeAdminClient()
  const { data } = await client.database
    .from('app_users')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: true })
    .limit(200)

  const users = (data ?? []) as AppUser[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users & access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone here can sign into the admin panel. Admins can also manage users; editors can edit content and images.
        </p>
      </div>

      <AdminCard title="Team">
        <div className="flex flex-col divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">{u.full_name || u.email}</p>
                <p className="text-xs text-muted-foreground">{u.email} · joined {new Date(u.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <form action={updateUserRoleAction.bind(null, u.id)} className="flex items-center gap-2">
                  <Select name="role" defaultValue={u.role} disabled={u.id === admin.id} className="!w-32">
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </Select>
                  {u.id !== admin.id && <SubmitButton className="!px-2 !py-1 text-xs">Update</SubmitButton>}
                </form>
                {u.id !== admin.id && (
                  <form action={removeUserAccessAction.bind(null, u.id)}>
                    <SubmitButton variant="danger" className="!px-2 !py-1 text-xs" pendingText="Removing…">Remove access</SubmitButton>
                  </form>
                )}
                {u.id === admin.id && <span className="text-xs text-muted-foreground">(you)</span>}
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Add someone new" description="They'll need to verify their email with a code before signing in.">
        <InviteUserForm />
      </AdminCard>
    </div>
  )
}
