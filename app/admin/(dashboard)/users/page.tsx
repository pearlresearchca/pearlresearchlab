import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UserCog } from 'lucide-react'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { AdminCard, EmptyState, RoleBadge } from '@/components/admin/ui'
import { initials } from '@/lib/cms/format'
import type { AppUser } from '@/lib/cms/types'
import { InviteUserForm } from './invite-form'
import { UserDetail } from './user-row'

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin || admin.profile?.role !== 'admin') redirect('/admin')

  const { user: selectedId } = await searchParams

  const client = createInsForgeAdminClient()
  const { data } = await client.database
    .from('app_users')
    .select('id, email, full_name, role, sections, created_at')
    .order('created_at', { ascending: true })
    .limit(500)

  const users = (data ?? []) as AppUser[]
  const selected = selectedId ? users.find((u) => u.id === selectedId) : undefined

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users & access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a person to see or change what they can edit. Admins can do everything, including managing users; editors only see and edit the sections you grant them.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
        <AdminCard title="Team" icon={<UserCog className="size-5" aria-hidden="true" />} description={`${users.length} ${users.length === 1 ? 'person' : 'people'}`}>
          <div className="flex flex-col divide-y divide-border">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users?user=${u.id}`}
                className={`flex items-center gap-3 rounded-md px-2 py-2.5 transition ${
                  u.id === selectedId ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(u.full_name || u.email)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{u.full_name || u.email}</span>
                  <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                </span>
                <RoleBadge role={u.role} />
              </Link>
            ))}
          </div>
        </AdminCard>

        {selected ? (
          <UserDetail user={selected} isSelf={selected.id === admin.id} />
        ) : (
          <AdminCard>
            <EmptyState title="Select a person" body="Choose someone from the list to view or change their access." />
          </AdminCard>
        )}
      </div>

      <AdminCard title="Add someone new" description="They'll need to verify their email with a code before signing in.">
        <InviteUserForm />
      </AdminCard>
    </div>
  )
}
