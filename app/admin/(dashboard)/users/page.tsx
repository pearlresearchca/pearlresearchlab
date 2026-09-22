import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UserCog, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { TeamList } from '@/components/admin/team-list'
import type { AppUser } from '@/lib/cms/types'
import { InviteUserForm } from './invite-form'
import { UserDetail } from './user-row'

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; invite?: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin || admin.profile?.role !== 'admin') redirect('/admin')

  const { user: selectedId, invite } = await searchParams

  const client = createInsForgeAdminClient()
  const { data } = await client.database
    .from('app_users')
    .select('id, email, full_name, role, sections, created_at, phone, job_title')
    .order('created_at', { ascending: true })
    .limit(500)

  const users = (data ?? []) as AppUser[]
  const inviting = invite === '1'
  // Always show someone: the chosen person, or yourself by default.
  const selected = inviting ? undefined : users.find((u) => u.id === selectedId) ?? users.find((u) => u.id === admin.id)

  return (
    <div className="flex flex-col">
      <PageHeader
        group="Settings"
        title="Users & access"
        description="Choose a person to change what they can edit. Admins can do everything; editors only what you switch on."
        icon={<UserCog />}
        actions={
          <Link href="/admin/users?invite=1" scroll={false} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary-dark">
            <UserPlus className="size-4" aria-hidden="true" /> Add person
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)] lg:sticky lg:top-24">
          <header className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <h2 className="text-[15px] font-semibold text-foreground">Team</h2>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-slate-600">{users.length} {users.length === 1 ? 'person' : 'people'}</span>
          </header>
          <TeamList users={users} selectedId={selected?.id} selfId={admin.id} />
        </section>

        {inviting ? (
          <section className="rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)]">
            <header className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Add someone new</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">They’ll verify their email with a code, then set up their profile on first sign-in.</p>
            </header>
            <div className="p-6">
              <InviteUserForm />
            </div>
          </section>
        ) : (
          selected && <UserDetail key={selected.id} user={selected} isSelf={selected.id === admin.id} />
        )}
      </div>
    </div>
  )
}
